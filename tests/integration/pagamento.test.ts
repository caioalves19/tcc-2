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
      expiration_date_to: RESERVA_ATE,
      notification_url: "https://kolo.com.br/api/webhooks/mercadopago",
    }),
  ]);
  expect(await estadoDoPedido("20261010-FELIZ2", obra)).toEqual({
    situacao: "PENDENTE",
    pagamentos: 0,
    estoque: 2,
  });
});
