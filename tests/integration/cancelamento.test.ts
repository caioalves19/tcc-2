import { expect, it, vi } from "vitest";
import { cenarioWebhook, AGORA, RESERVA_ATE } from "./webhook-de-teste";

// PBI-43: cancelamento pelo admin do pedido que não foi pago. Gateway dublê; banco real.
const cenario = cenarioWebhook("kolo_pbi43_cancelamento_test");
const { estado } = cenario;

type SituacaoPagamento = "PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO";

// Pedido PENDENTE de 2 × R$ 4.800,00 com a reserva das duas unidades; pagamentos `mp-<numero>-N`.
async function pedidoPendente(
  slug: string,
  numero: string,
  pagamentos: SituacaoPagamento[] = [],
  situacao: "PENDENTE" | "PAGO" | "CANCELADO" = "PENDENTE",
) {
  const obra = await cenario.fabrica.obraPublicada(slug, "4.800,00", 2);
  const cliente = await cenario.fabrica.novoCliente(`${slug}@pbi43.test`);
  await cenario.fabrica.pedidoDeTeste(cliente, {
    numero,
    situacao,
    criadoEm: AGORA.toISOString(),
    obra,
    pagamentos,
    reservaAte: RESERVA_ATE,
  });
  return { obra, cliente };
}

// Dublê do Mercado Pago: registra os cancelamentos e responde à consulta do pagamento.
function gatewayDeCancelamento(opcoes: { falha?: Error; situacaoNaConsulta?: string } = {}) {
  const cancelados: string[] = [];
  return {
    cancelados,
    async cancelarPagamento(id: string) {
      cancelados.push(id);
      if (opcoes.falha) throw opcoes.falha;
    },
    async consultarPagamento(id: string) {
      return {
        id,
        status: opcoes.situacaoNaConsulta ?? "pending",
        payment_type_id: "bank_transfer",
        transaction_amount: 9600,
        currency_id: "BRL",
      };
    },
  };
}

it("PBI-43 o admin cancela o pedido não pago e as unidades voltam à vitrine", async () => {
  const { cancelarPedido } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("c1-simples", "20261012-C1SIM1");
  const gateway = gatewayDeCancelamento();

  expect(
    await cancelarPedido({ numero: "20261012-C1SIM1" }, cenario.contas.admin, { gateway }),
  ).toMatchObject({ ok: true });

  expect(gateway.cancelados).toEqual([]);
  expect(await estado("20261012-C1SIM1", obra)).toMatchObject({
    situacao: "CANCELADO",
    estoque: 2,
    reservas: 0,
  });
});

it("PBI-43 pedido pago ou já cancelado não é cancelado por aqui (pago se resolve pelo estorno)", async () => {
  const { cancelarPedido } = await import("../../src/modules/payments");
  for (const [slug, numero, situacao] of [
    ["c2-pago", "20261012-C2PAG1", "PAGO"],
    ["c2-cancelado", "20261012-C2CAN1", "CANCELADO"],
  ] as const) {
    const { obra } = await pedidoPendente(slug, numero, [], situacao);

    expect(
      await cancelarPedido({ numero }, cenario.contas.admin, { gateway: gatewayDeCancelamento() }),
    ).toMatchObject({ ok: false, erro: "invalido" });

    expect(await estado(numero, obra)).toMatchObject({ situacao, reservas: 1 });
  }
});

it("PBI-43 com Pix em aberto, o admin cancela o Pix no Mercado Pago e depois o pedido", async () => {
  const { cancelarPedido } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("c3-pix", "20261012-C3PIX1", ["PENDENTE"]);
  const gateway = gatewayDeCancelamento();

  expect(
    await cancelarPedido({ numero: "20261012-C3PIX1" }, cenario.contas.admin, { gateway }),
  ).toMatchObject({ ok: true });

  expect(gateway.cancelados).toEqual(["mp-20261012-C3PIX1-1"]);
  const final = await estado("20261012-C3PIX1", obra);
  expect(final).toMatchObject({ situacao: "CANCELADO", reservas: 0 });
  expect(final.pagamentos).toMatchObject([{ situacao: "RECUSADO" }]);
});

it("PBI-43 cartão em análise não é cancelado pelo admin: espera a resposta do Mercado Pago", async () => {
  const { cancelarPedido } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("c4-cartao", "20261012-C4CAR1", ["PENDENTE"]);
  await cenario.db.query("UPDATE payment SET metodo = 'CARTAO' WHERE id_externo = $1", [
    "mp-20261012-C4CAR1-1",
  ]);
  const gateway = gatewayDeCancelamento();

  expect(
    await cancelarPedido({ numero: "20261012-C4CAR1" }, cenario.contas.admin, { gateway }),
  ).toMatchObject({ ok: false, erro: "invalido" });

  expect(gateway.cancelados).toEqual([]);
  const final = await estado("20261012-C4CAR1", obra);
  expect(final).toMatchObject({ situacao: "PENDENTE", reservas: 1 });
  expect(final.pagamentos).toMatchObject([{ situacao: "PENDENTE" }]);
});

it("PBI-43 Mercado Pago fora do ar: o cancelamento falha sem mudar pedido, pagamento nem reserva", async () => {
  const { cancelarPedido } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("c5-fora", "20261012-C5FOR1", ["PENDENTE"]);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeCancelamento({
    falha: Object.assign(new Error("server"), { name: "MPServerError", status: 503 }),
  });

  expect(
    await cancelarPedido({ numero: "20261012-C5FOR1" }, cenario.contas.admin, { gateway }),
  ).toMatchObject({ ok: false, erro: "falha" });

  const final = await estado("20261012-C5FOR1", obra);
  expect(final).toMatchObject({ situacao: "PENDENTE", reservas: 1 });
  expect(final.pagamentos).toMatchObject([{ situacao: "PENDENTE" }]);
  expect(log).toHaveBeenCalledWith("Falha ao cancelar no Mercado Pago", "MPServerError", 503);
});

it("PBI-43 Pix já cancelado no Mercado Pago (nova tentativa): a consulta confirma e o pedido cancela", async () => {
  const { cancelarPedido } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("c5-ja", "20261012-C5JA01", ["PENDENTE"]);
  vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeCancelamento({
    falha: Object.assign(new Error("bad_request"), { name: "MPBadRequestError", status: 400 }),
    situacaoNaConsulta: "cancelled",
  });

  expect(
    await cancelarPedido({ numero: "20261012-C5JA01" }, cenario.contas.admin, { gateway }),
  ).toMatchObject({ ok: true });

  const final = await estado("20261012-C5JA01", obra);
  expect(final).toMatchObject({ situacao: "CANCELADO", reservas: 0 });
  expect(final.pagamentos).toMatchObject([{ situacao: "RECUSADO" }]);
});

it("PBI-43 só o admin cancela: cliente, artista e visitante não chamam o gateway nem mudam nada", async () => {
  const { cancelarPedido } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("c6-papeis", "20261012-C6PAP1", ["PENDENTE"]);
  const gateway = gatewayDeCancelamento();

  for (const [cabecalhos, erro] of [
    [cenario.contas.cliente, "proibido"],
    [cenario.contas.ana, "proibido"],
    [new Headers(), "nao_autenticado"],
  ] as const)
    expect(
      await cancelarPedido({ numero: "20261012-C6PAP1" }, cabecalhos, { gateway }),
    ).toMatchObject({ ok: false, erro });

  expect(gateway.cancelados).toEqual([]);
  expect(await estado("20261012-C6PAP1", obra)).toMatchObject({
    situacao: "PENDENTE",
    reservas: 1,
  });
});
