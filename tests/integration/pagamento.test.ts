import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos } from "./pedidos-de-teste";

let db: Client;
let fabrica: ReturnType<typeof fabricaDePedidos>;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi27_pagamento_test");
  db = contas.db;
  fabrica = fabricaDePedidos(db, contas.admin, contas.idAna);
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const AGORA = new Date("2026-10-10T15:00:00.000Z");
const RESERVA_ATE = "2026-10-10T15:10:00.000Z";
const APP_URL = "https://kolo.com.br";

// Dublê do Mercado Pago: guarda o que recebeu e devolve a URL do checkout hospedado.
function gatewayDeTeste() {
  const recebidos: unknown[] = [];
  return {
    recebidos,
    async criarPreferencia(corpo: unknown) {
      recebidos.push(corpo);
      return { url: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-teste" };
    },
  };
}

async function estadoDoPedido(numero: string, obraId: string) {
  const pedido = await db.query('SELECT situacao FROM "order" WHERE numero = $1', [numero]);
  const pagamentos = await db.query(
    'SELECT count(*)::int AS n FROM payment p JOIN "order" o ON o.id = p.order_id WHERE o.numero = $1',
    [numero],
  );
  const obra = await db.query("SELECT quantidade_estoque FROM artwork WHERE id = $1", [obraId]);
  return {
    situacao: pedido.rows[0].situacao,
    pagamentos: pagamentos.rows[0].n,
    estoque: obra.rows[0].quantidade_estoque,
  };
}

it("RF13 o dono do pedido pendente com reserva ativa recebe o checkout do Mercado Pago, sem pagar nem baixar estoque (RN05)", async () => {
  const { iniciarPagamento } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("feliz", "4.800,00", 2);
  const lucas = await fabrica.novoCliente("lucas@pbi27.test");
  await fabrica.pedidoDeTeste(lucas, {
    numero: "20261010-FELIZ2",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: RESERVA_ATE,
  });
  const gateway = gatewayDeTeste();

  expect(
    await iniciarPagamento("20261010-FELIZ2", lucas, { gateway, agora: AGORA, appUrl: APP_URL }),
  ).toEqual({
    ok: true,
    dados: { url: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-teste" },
  });
  expect(gateway.recebidos).toEqual([
    expect.objectContaining({
      external_reference: "20261010-FELIZ2",
      items: [
        {
          id: obra,
          title: "Metrópole em chamas",
          quantity: 2,
          unit_price: 4800,
          currency_id: "BRL",
        },
      ],
      expires: true,
      expiration_date_to: "2026-10-10T15:08:00.000Z",
      notification_url: "https://kolo.com.br/api/webhooks/mercadopago",
    }),
  ]);
  expect(await estadoDoPedido("20261010-FELIZ2", obra)).toEqual({
    situacao: "PENDENTE",
    pagamentos: 0,
    estoque: 2,
  });
});

it("RN01 visitante, número inexistente e pedido de outro cliente recebem a mesma resposta, sem chamar o Mercado Pago", async () => {
  const { iniciarPagamento } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("alheio", "4.800,00", 2);
  const dono = await fabrica.novoCliente("dono@pbi27.test");
  const outro = await fabrica.novoCliente("outro@pbi27.test");
  await fabrica.pedidoDeTeste(dono, {
    numero: "20261010-ALHEI2",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: RESERVA_ATE,
  });
  const gateway = gatewayDeTeste();
  const opcoes = { gateway, agora: AGORA, appUrl: APP_URL };
  const visitante = { cabecalhos: new Headers(), tokenVisitante: null };
  const recusa = { ok: false, erro: "nao_encontrado", mensagem: "Pedido não encontrado." };

  expect(await iniciarPagamento("20261010-ALHEI2", visitante, opcoes)).toEqual(recusa);
  expect(await iniciarPagamento("20261010-NAOEXI", dono, opcoes)).toEqual(recusa);
  expect(await iniciarPagamento("20261010-ALHEI2", outro, opcoes)).toEqual(recusa);
  expect(gateway.recebidos).toEqual([]);
});

it("RF13/RN05 pedido que não está pendente não abre novo pagamento", async () => {
  const { iniciarPagamento } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("pago", "4.800,00", 2);
  const lucas = await fabrica.novoCliente("pago@pbi27.test");
  for (const [numero, situacao] of [
    ["20261010-PAGOO2", "PAGO"],
    ["20261010-CANCE2", "CANCELADO"],
  ] as const)
    await fabrica.pedidoDeTeste(lucas, {
      numero,
      situacao,
      criadoEm: AGORA.toISOString(),
      obra,
      reservaAte: RESERVA_ATE,
    });
  const gateway = gatewayDeTeste();
  const opcoes = { gateway, agora: AGORA, appUrl: APP_URL };

  for (const numero of ["20261010-PAGOO2", "20261010-CANCE2"])
    expect(await iniciarPagamento(numero, lucas, opcoes)).toMatchObject({
      ok: false,
      erro: "nao_pendente",
    });
  expect(gateway.recebidos).toEqual([]);
});

it("RN06 com Pix ou boleto já em aberto, não abre outra preferência para o mesmo pedido", async () => {
  const { iniciarPagamento } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("pix-aberto", "4.800,00", 2);
  const lucas = await fabrica.novoCliente("pix@pbi27.test");
  await fabrica.pedidoDeTeste(lucas, {
    numero: "20261010-PIXAB2",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    pagamentos: ["RECUSADO", "PENDENTE"],
    reservaAte: "2026-10-11T15:00:00.000Z",
  });
  const gateway = gatewayDeTeste();

  expect(
    await iniciarPagamento("20261010-PIXAB2", lucas, { gateway, agora: AGORA, appUrl: APP_URL }),
  ).toMatchObject({ ok: false, erro: "pagamento_em_aberto" });
  expect(gateway.recebidos).toEqual([]);
});

it("RN03 com a reserva vencida (ou já liberada), o pedido não vai ao Mercado Pago", async () => {
  const { iniciarPagamento } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("vencida", "4.800,00", 2);
  const lucas = await fabrica.novoCliente("vencida@pbi27.test");
  await fabrica.pedidoDeTeste(lucas, {
    numero: "20261010-VENCI2",
    situacao: "PENDENTE",
    criadoEm: "2026-10-10T14:40:00.000Z",
    obra,
    reservaAte: "2026-10-10T14:50:00.000Z",
  });
  await fabrica.pedidoDeTeste(lucas, {
    numero: "20261010-SEMRE2",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
  });
  const gateway = gatewayDeTeste();
  const opcoes = { gateway, agora: AGORA, appUrl: APP_URL };

  for (const numero of ["20261010-VENCI2", "20261010-SEMRE2"])
    expect(await iniciarPagamento(numero, lucas, opcoes)).toEqual({
      ok: false,
      erro: "reserva_expirada",
      mensagem: "A reserva das obras expirou. Finalize de novo pelo carrinho.",
    });
  expect(gateway.recebidos).toEqual([]);
});

it("RN03/RN06 nos 2 minutos finais da reserva o checkout já fechou: o webhook precisa de folga para prorrogar", async () => {
  const { iniciarPagamento } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("folga", "4.800,00", 2);
  const lucas = await fabrica.novoCliente("folga@pbi27.test");
  await fabrica.pedidoDeTeste(lucas, {
    numero: "20261010-FOLGA2",
    situacao: "PENDENTE",
    criadoEm: "2026-10-10T14:52:00.000Z",
    obra,
    reservaAte: "2026-10-10T15:02:00.000Z",
  });
  const gateway = gatewayDeTeste();

  expect(
    await iniciarPagamento("20261010-FOLGA2", lucas, {
      gateway,
      agora: new Date("2026-10-10T15:00:00.000Z"),
      appUrl: APP_URL,
    }),
  ).toEqual({
    ok: false,
    erro: "reserva_expirada",
    mensagem: "O prazo para pagar este pedido acabou. Finalize de novo pelo carrinho.",
  });
  expect(gateway.recebidos).toEqual([]);
  expect(
    await iniciarPagamento("20261010-FOLGA2", lucas, {
      gateway,
      agora: new Date("2026-10-10T14:59:59.000Z"),
      appUrl: APP_URL,
    }),
  ).toMatchObject({ ok: true });
});

it("RF13 falha do Mercado Pago volta como erro tratado, sem mexer no pedido, e a nova tentativa funciona", async () => {
  const { iniciarPagamento } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("falha", "4.800,00", 2);
  const lucas = await fabrica.novoCliente("falha@pbi27.test");
  await fabrica.pedidoDeTeste(lucas, {
    numero: "20261010-FALHA2",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: RESERVA_ATE,
  });
  const foraDoAr = {
    async criarPreferencia(): Promise<{ url: string }> {
      throw new Error("MP_ACCESS_TOKEN ausente");
    },
  };

  expect(
    await iniciarPagamento("20261010-FALHA2", lucas, {
      gateway: foraDoAr,
      agora: AGORA,
      appUrl: APP_URL,
    }),
  ).toEqual({
    ok: false,
    erro: "falha",
    mensagem: "Não foi possível abrir o pagamento agora. Tente de novo em instantes.",
  });
  expect(await estadoDoPedido("20261010-FALHA2", obra)).toEqual({
    situacao: "PENDENTE",
    pagamentos: 0,
    estoque: 2,
  });
  expect(
    await iniciarPagamento("20261010-FALHA2", lucas, {
      gateway: gatewayDeTeste(),
      agora: AGORA,
      appUrl: APP_URL,
    }),
  ).toMatchObject({ ok: true });
});
