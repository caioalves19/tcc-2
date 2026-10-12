import { expect, it } from "vitest";
import { cenarioWebhook, AGORA } from "./webhook-de-teste";

// PBI-43: estorno pelo admin. O gateway é um dublê; pedido, pagamento e estoque no PostgreSQL real.
const cenario = cenarioWebhook("kolo_pbi43_estorno_test");
const { estado } = cenario;

type Situacao = "PAGO" | "PROCESSANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO" | "PENDENTE";

// Pedido de 2 × R$ 4.800,00 pago por um pagamento aprovado (`mp-<numero>-1`); as duas unidades já
// saíram do estoque quando o pedido foi pago.
async function pedidoPago(
  slug: string,
  numero: string,
  situacao: Situacao = "PAGO",
  pagamentos: "APROVADO"[] = ["APROVADO"],
) {
  const obra = await cenario.fabrica.obraPublicada(slug, "4.800,00", 2);
  const cliente = await cenario.fabrica.novoCliente(`${slug}@pbi43.test`);
  await cenario.fabrica.pedidoDeTeste(cliente, {
    numero,
    situacao,
    criadoEm: AGORA.toISOString(),
    pagoEm: AGORA.toISOString(),
    obra,
    pagamentos,
  });
  await cenario.db.query(
    "UPDATE artwork SET quantidade_estoque = 0, situacao = 'ESGOTADA' WHERE id = $1",
    [obra],
  );
  return { obra, cliente, idExterno: `mp-${numero}-1` };
}

// O webhook marcou o pagamento para estorno (PBI-43, migração 0008).
async function marcar(idExterno: string, motivo: string) {
  await cenario.db.query("UPDATE payment SET estornar_motivo = $2 WHERE id_externo = $1", [
    idExterno,
    motivo,
  ]);
}

// Dublê do Mercado Pago: registra os estornos pedidos e responde à consulta do pagamento.
function gatewayDeEstorno(opcoes: { falha?: Error; situacaoNaConsulta?: string } = {}) {
  const estornos: { id: string; chave: string }[] = [];
  return {
    estornos,
    async estornarPagamento(id: string, chave: string) {
      estornos.push({ id, chave });
      if (opcoes.falha) throw opcoes.falha;
    },
    async consultarPagamento(id: string) {
      return {
        id,
        status: opcoes.situacaoNaConsulta ?? "approved",
        payment_type_id: "credit_card",
        transaction_amount: 9600,
        currency_id: "BRL",
      };
    },
  };
}

it("PBI-43 o admin estorna o pagamento do pedido pago: pedido cancelado e unidades de volta", async () => {
  const { estornarPagamento } = await import("../../src/modules/payments");
  const { obra, idExterno } = await pedidoPago("e7-pago", "20261012-E7PAG1");
  const gateway = gatewayDeEstorno();

  expect(
    await estornarPagamento({ numero: "20261012-E7PAG1", idExterno }, cenario.contas.admin, {
      gateway,
    }),
  ).toMatchObject({ ok: true });

  expect(gateway.estornos).toEqual([{ id: idExterno, chave: expect.any(String) }]);
  const final = await estado("20261012-E7PAG1", obra);
  expect(final).toMatchObject({ situacao: "CANCELADO", estoque: 2, situacaoObra: "DISPONIVEL" });
  expect(final.pagamentos).toMatchObject([{ id_externo: idExterno, situacao: "ESTORNADO" }]);
});

it("PBI-43 só o admin estorna: cliente, artista e visitante não chamam o gateway nem mudam nada", async () => {
  const { estornarPagamento } = await import("../../src/modules/payments");
  const { obra, idExterno } = await pedidoPago("e7-papeis", "20261012-E7PAP1");
  const gateway = gatewayDeEstorno();
  const entrada = { numero: "20261012-E7PAP1", idExterno };

  for (const [cabecalhos, erro] of [
    [cenario.contas.cliente, "proibido"],
    [cenario.contas.ana, "proibido"],
    [new Headers(), "nao_autenticado"],
  ] as const)
    expect(await estornarPagamento(entrada, cabecalhos, { gateway })).toMatchObject({
      ok: false,
      erro,
    });

  expect(gateway.estornos).toEqual([]);
  expect(await estado("20261012-E7PAP1", obra)).toMatchObject({ situacao: "PAGO", estoque: 0 });
});

it("PBI-43 pedido enviado ou entregue não é estornado pelo sistema", async () => {
  const { estornarPagamento } = await import("../../src/modules/payments");
  const gateway = gatewayDeEstorno();
  for (const [slug, numero, situacao] of [
    ["e7-enviado", "20261012-E7ENV1", "ENVIADO"],
    ["e7-entregue", "20261012-E7ENT1", "ENTREGUE"],
  ] as const) {
    const { obra, idExterno } = await pedidoPago(slug, numero, situacao);

    expect(
      await estornarPagamento({ numero, idExterno }, cenario.contas.admin, { gateway }),
    ).toMatchObject({ ok: false, erro: "invalido" });

    const final = await estado(numero, obra);
    expect(final).toMatchObject({ situacao, estoque: 0 });
    expect(final.pagamentos).toMatchObject([{ situacao: "APROVADO" }]);
  }
  expect(gateway.estornos).toEqual([]);
});

it("PBI-43 a segunda aprovação do pedido pago é estornada sem cancelar o pedido", async () => {
  const { estornarPagamento } = await import("../../src/modules/payments");
  const { obra } = await pedidoPago("e8-dobro", "20261012-E8DOB1", "PAGO", [
    "APROVADO",
    "APROVADO",
  ]);
  await marcar("mp-20261012-E8DOB1-2", "PEDIDO_NAO_PENDENTE");
  const gateway = gatewayDeEstorno();

  expect(
    await estornarPagamento(
      { numero: "20261012-E8DOB1", idExterno: "mp-20261012-E8DOB1-2" },
      cenario.contas.admin,
      { gateway },
    ),
  ).toMatchObject({ ok: true });

  expect(gateway.estornos).toMatchObject([{ id: "mp-20261012-E8DOB1-2" }]);
  const final = await estado("20261012-E8DOB1", obra);
  expect(final).toMatchObject({ situacao: "PAGO", estoque: 0 });
  expect(final.pagamentos).toMatchObject([
    { id_externo: "mp-20261012-E8DOB1-1", situacao: "APROVADO" },
    { id_externo: "mp-20261012-E8DOB1-2", situacao: "ESTORNADO" },
  ]);
});

it("PBI-43 aprovação sem unidade livre: o estorno cancela o pedido sem inventar estoque", async () => {
  const { estornarPagamento } = await import("../../src/modules/payments");
  const { obra, idExterno } = await pedidoPago("e8-sem-estoque", "20261012-E8SEM1");
  await marcar(idExterno, "SEM_ESTOQUE");

  expect(
    await estornarPagamento({ numero: "20261012-E8SEM1", idExterno }, cenario.contas.admin, {
      gateway: gatewayDeEstorno(),
    }),
  ).toMatchObject({ ok: true });

  const final = await estado("20261012-E8SEM1", obra);
  expect(final).toMatchObject({ situacao: "CANCELADO", estoque: 0, situacaoObra: "ESGOTADA" });
  expect(final.pagamentos).toMatchObject([{ situacao: "ESTORNADO" }]);
});

it("PBI-43 aprovação com valor diferente: o estorno devolve o dinheiro e o pedido segue aguardando", async () => {
  const { estornarPagamento } = await import("../../src/modules/payments");
  const { obra, idExterno } = await pedidoPago("e8-valor", "20261012-E8VAL1", "PENDENTE");
  await marcar(idExterno, "VALOR_DIVERGENTE");

  expect(
    await estornarPagamento({ numero: "20261012-E8VAL1", idExterno }, cenario.contas.admin, {
      gateway: gatewayDeEstorno(),
    }),
  ).toMatchObject({ ok: true });

  const final = await estado("20261012-E8VAL1", obra);
  expect(final).toMatchObject({ situacao: "PENDENTE", estoque: 0 });
  expect(final.pagamentos).toMatchObject([{ situacao: "ESTORNADO" }]);
});

it("PBI-43 pagamento pendente ou recusado não tem o que estornar", async () => {
  const { estornarPagamento } = await import("../../src/modules/payments");
  const { obra, idExterno } = await pedidoPago("e8-recusado", "20261012-E8REC1");
  const gateway = gatewayDeEstorno();
  for (const situacao of ["PENDENTE", "RECUSADO"]) {
    await cenario.db.query("UPDATE payment SET situacao = $2 WHERE id_externo = $1", [
      idExterno,
      situacao,
    ]);
    expect(
      await estornarPagamento({ numero: "20261012-E8REC1", idExterno }, cenario.contas.admin, {
        gateway,
      }),
    ).toMatchObject({ ok: false, erro: "invalido" });
  }
  expect(gateway.estornos).toEqual([]);
  expect(await estado("20261012-E8REC1", obra)).toMatchObject({ situacao: "PAGO", estoque: 0 });
});
