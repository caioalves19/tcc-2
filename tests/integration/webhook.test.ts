import { createHmac, randomUUID } from "node:crypto";
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos } from "./pedidos-de-teste";

let db: Client;
let fabrica: ReturnType<typeof fabricaDePedidos>;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi28_webhook_test");
  db = contas.db;
  fabrica = fabricaDePedidos(db, contas.admin, contas.idAna);
}, 120_000);
afterAll(async () => {
  await db?.end();
});
afterEach(() => {
  vi.restoreAllMocks();
});

const AGORA = new Date("2026-10-11T15:00:00.000Z");
const RESERVA_ATE = "2026-10-11T15:10:00.000Z";

const SEGREDO = "segredo-do-webhook-de-teste";

// Notificação como o Mercado Pago manda: data.id na URL e no corpo, assinada com o segredo
// (HMAC-SHA256 de "id:...;request-id:...;ts:...;").
function notificacao(idPagamento: string, idNotificacao: string = randomUUID()) {
  const idRequisicao = randomUUID();
  const ts = "1760194800";
  const v1 = createHmac("sha256", SEGREDO)
    .update(`id:${idPagamento};request-id:${idRequisicao};ts:${ts};`)
    .digest("hex");
  return {
    url: `https://kolo.test/api/webhooks/mercadopago?data.id=${idPagamento}&type=payment`,
    cabecalhos: new Headers({ "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": idRequisicao }),
    corpo: {
      id: idNotificacao,
      type: "payment",
      action: "payment.updated",
      data: { id: idPagamento },
      live_mode: false,
    },
  };
}

// Resposta do GET /v1/payments/{id}: cartão aprovado de R$ 9.600,00 para o pedido.
function pagamentoMp(id: string, numero: string, troca: Record<string, unknown> = {}) {
  return {
    id: Number(id),
    status: "approved",
    status_detail: "accredited",
    payment_type_id: "credit_card",
    payment_method_id: "visa",
    transaction_amount: 9600,
    currency_id: "BRL",
    external_reference: numero,
    date_created: "2026-10-11T11:58:12.000-04:00",
    date_approved: "2026-10-11T11:58:14.000-04:00",
    date_of_expiration: null,
    payer: { email: "comprador@teste.com", identification: { type: "CPF", number: "12345678909" } },
    ...troca,
  };
}

// Dublê da API de pagamentos do Mercado Pago: devolve a situação atual de cada pagamento.
function gatewayDeTeste(pagamentos: Record<string, unknown>) {
  const consultados: string[] = [];
  return {
    consultados,
    async consultarPagamento(id: string) {
      consultados.push(id);
      if (!(id in pagamentos)) throw new Error("pagamento inexistente no dublê");
      return pagamentos[id];
    },
  };
}

async function itensNoCarrinho(cliente: { userId: string }, ...obras: string[]) {
  const { rows } = await db.query(
    "INSERT INTO cart (id, user_id, atualizado_em) VALUES (gen_random_uuid(), $1, now()) RETURNING id",
    [cliente.userId],
  );
  for (const obra of obras)
    await db.query(
      "INSERT INTO cart_item (id, cart_id, artwork_id, quantidade) VALUES (gen_random_uuid(), $1, $2, 1)",
      [rows[0].id, obra],
    );
}

async function estado(numero: string, obra: string) {
  const pedido = await db.query('SELECT situacao, pago_em FROM "order" WHERE numero = $1', [
    numero,
  ]);
  const pagamentos = await db.query(
    `SELECT p.id_externo, p.metodo, p.situacao, p.valor_centavos, p.payload
       FROM payment p JOIN "order" o ON o.id = p.order_id WHERE o.numero = $1 ORDER BY p.id_externo`,
    [numero],
  );
  const obraRow = await db.query("SELECT quantidade_estoque, situacao FROM artwork WHERE id = $1", [
    obra,
  ]);
  const reservas = await db.query(
    "SELECT count(*)::int AS n FROM artwork_reservation WHERE artwork_id = $1",
    [obra],
  );
  return {
    situacao: pedido.rows[0].situacao,
    pagoEm: pedido.rows[0].pago_em,
    pagamentos: pagamentos.rows,
    estoque: obraRow.rows[0].quantidade_estoque,
    situacaoObra: obraRow.rows[0].situacao,
    reservas: reservas.rows[0].n,
  };
}

async function pedidoPendente(slug: string, numero: string, email: string) {
  const obra = await fabrica.obraPublicada(slug, "4.800,00", 2);
  const cliente = await fabrica.novoCliente(email);
  const pedidoId = await fabrica.pedidoDeTeste(cliente, {
    numero,
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: RESERVA_ATE,
  });
  return { obra, cliente, pedidoId };
}

it("RNF11 o mesmo pagamento do Mercado Pago não vira duas linhas em payment", async () => {
  const { pedidoId } = await pedidoPendente("t3-unico", "20261011-UNICO1", "unico@pbi28.test");
  const inserir = () =>
    db.query(
      `INSERT INTO payment (id, order_id, provedor, id_externo, metodo, situacao, valor_centavos)
       VALUES (gen_random_uuid(), $1, 'mercado_pago', '999001', 'CARTAO', 'PENDENTE', 960000)`,
      [pedidoId],
    );
  await inserir();
  await expect(inserir()).rejects.toThrow(/duplicate key|unique/i);
});

it("RF13 o saldo da conta Mercado Pago é um meio de pagamento próprio", async () => {
  const { pedidoId } = await pedidoPendente("t3-saldo", "20261011-SALDO1", "saldo@pbi28.test");
  await db.query(
    `INSERT INTO payment (id, order_id, provedor, id_externo, metodo, situacao, valor_centavos)
     VALUES (gen_random_uuid(), $1, 'mercado_pago', '999002', 'SALDO_MERCADO_PAGO', 'APROVADO', 960000)`,
    [pedidoId],
  );
  const { rows } = await db.query("SELECT metodo FROM payment WHERE id_externo = '999002'");
  expect(rows).toEqual([{ metodo: "SALDO_MERCADO_PAGO" }]);
});

it("RF14/RN05 pagamento aprovado confirma o pedido, baixa o estoque e tira as obras do carrinho", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra, cliente } = await pedidoPendente(
    "t4-aprova",
    "20261011-APROV1",
    "aprova@pbi28.test",
  );
  const outra = await fabrica.obraPublicada("t4-outra", "100,00", 1);
  await itensNoCarrinho(cliente, obra, outra);
  const gateway = gatewayDeTeste({ "700001": pagamentoMp("700001", "20261011-APROV1") });

  expect(
    await processarNotificacao(notificacao("700001", "aviso-700001"), {
      gateway,
      segredo: SEGREDO,
      agora: AGORA,
    }),
  ).toEqual({ status: 200 });

  expect(gateway.consultados).toEqual(["700001"]);
  expect(await estado("20261011-APROV1", obra)).toEqual({
    situacao: "PAGO",
    pagoEm: AGORA,
    pagamentos: [
      {
        id_externo: "700001",
        metodo: "CARTAO",
        situacao: "APROVADO",
        valor_centavos: 960000,
        payload: {
          id: 700001,
          status: "approved",
          status_detail: "accredited",
          payment_type_id: "credit_card",
          payment_method_id: "visa",
          transaction_amount: 9600,
          currency_id: "BRL",
          external_reference: "20261011-APROV1",
          date_created: "2026-10-11T11:58:12.000-04:00",
          date_approved: "2026-10-11T11:58:14.000-04:00",
          date_of_expiration: null,
        },
      },
    ],
    estoque: 0,
    situacaoObra: "ESGOTADA",
    reservas: 0,
  });
  const carrinho = await db.query(
    "SELECT ci.artwork_id FROM cart_item ci JOIN cart c ON c.id = ci.cart_id WHERE c.user_id = $1",
    [cliente.userId],
  );
  expect(carrinho.rows).toEqual([{ artwork_id: outra }]);
  const eventos = await db.query(
    "SELECT origem, processado_em FROM webhook_event WHERE id_evento = 'mercado_pago:aviso-700001'",
  );
  expect(eventos.rows).toEqual([{ origem: "mercado_pago", processado_em: AGORA }]);
});

it("RN06 aprovação sem unidade livre: o pedido fica pago, o estoque não muda e o log pede estorno", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const obra = await fabrica.obraPublicada("t4-sem-estoque", "4.800,00", 2);
  const atrasado = await fabrica.novoCliente("atrasado@pbi28.test");
  const outro = await fabrica.novoCliente("outro@pbi28.test");
  await fabrica.pedidoDeTeste(atrasado, {
    numero: "20261011-ATRAS1",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
  });
  await fabrica.pedidoDeTeste(outro, {
    numero: "20261011-OUTRO1",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: RESERVA_ATE,
  });
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeTeste({ "700002": pagamentoMp("700002", "20261011-ATRAS1") });

  expect(
    await processarNotificacao(notificacao("700002"), { gateway, segredo: SEGREDO, agora: AGORA }),
  ).toEqual({ status: 200 });

  expect(await estado("20261011-ATRAS1", obra)).toMatchObject({
    situacao: "PAGO",
    pagoEm: AGORA,
    estoque: 2,
    situacaoObra: "DISPONIVEL",
    reservas: 1,
  });
  expect(log).toHaveBeenCalledWith(
    "Pagamento aprovado sem unidade livre: estornar (PBI-43)",
    "20261011-ATRAS1",
    "700002",
  );
});

it("RF13 aprovação com saldo da conta Mercado Pago grava o meio certo e paga o pedido", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("t4-saldo", "20261011-SALDO2", "saldo2@pbi28.test");
  const gateway = gatewayDeTeste({
    "700003": pagamentoMp("700003", "20261011-SALDO2", {
      payment_type_id: "account_money",
      payment_method_id: "account_money",
    }),
  });

  await processarNotificacao(notificacao("700003"), { gateway, segredo: SEGREDO, agora: AGORA });

  const final = await estado("20261011-SALDO2", obra);
  expect(final.situacao).toBe("PAGO");
  expect(final.pagamentos).toMatchObject([
    {
      metodo: "SALDO_MERCADO_PAGO",
      situacao: "APROVADO",
      payload: { payment_type_id: "account_money", payment_method_id: "account_money" },
    },
  ]);
});
