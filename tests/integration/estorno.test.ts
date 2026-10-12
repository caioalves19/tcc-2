import { expect, it } from "vitest";
import { cenarioWebhook, AGORA } from "./webhook-de-teste";

// PBI-43: estorno pelo admin. O gateway é um dublê; pedido, pagamento e estoque no PostgreSQL real.
const cenario = cenarioWebhook("kolo_pbi43_estorno_test");
const { estado } = cenario;

type Situacao = "PAGO" | "PROCESSANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO" | "PENDENTE";

// Pedido de 2 × R$ 4.800,00 pago por um pagamento aprovado (`mp-<numero>-1`); as duas unidades já
// saíram do estoque quando o pedido foi pago.
async function pedidoPago(slug: string, numero: string, situacao: Situacao = "PAGO") {
  const obra = await cenario.fabrica.obraPublicada(slug, "4.800,00", 2);
  const cliente = await cenario.fabrica.novoCliente(`${slug}@pbi43.test`);
  await cenario.fabrica.pedidoDeTeste(cliente, {
    numero,
    situacao,
    criadoEm: AGORA.toISOString(),
    pagoEm: AGORA.toISOString(),
    obra,
    pagamentos: ["APROVADO"],
  });
  await cenario.db.query(
    "UPDATE artwork SET quantidade_estoque = 0, situacao = 'ESGOTADA' WHERE id = $1",
    [obra],
  );
  return { obra, cliente, idExterno: `mp-${numero}-1` };
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
