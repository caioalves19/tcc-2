import { createHmac, randomUUID } from "node:crypto";
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos } from "./pedidos-de-teste";

// Cenário compartilhado dos testes do webhook (PBI-28): banco descartável, fábrica de pedidos,
// avisos assinados e dublê da API de pagamentos do Mercado Pago.

export const AGORA = new Date("2026-10-11T15:00:00.000Z");
export const RESERVA_ATE = "2026-10-11T15:10:00.000Z";

export const SEGREDO = "segredo-do-webhook-de-teste";

// Notificação como o Mercado Pago manda: data.id na URL e no corpo, assinada com o segredo
// (HMAC-SHA256 de "id:...;request-id:...;ts:...;"). O corpo é lido sob demanda, como no Route
// Handler, e `corpoLido` conta quantas vezes ele foi lido.
export function notificacao(idPagamento: string, idNotificacao: string = randomUUID()) {
  const idRequisicao = randomUUID();
  const ts = "1760194800";
  const v1 = createHmac("sha256", SEGREDO)
    .update(`id:${idPagamento};request-id:${idRequisicao};ts:${ts};`)
    .digest("hex");
  const aviso = {
    url: `https://kolo.test/api/webhooks/mercadopago?data.id=${idPagamento}&type=payment`,
    cabecalhos: new Headers({ "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": idRequisicao }),
    corpo: {
      id: idNotificacao,
      type: "payment",
      action: "payment.updated",
      data: { id: idPagamento },
      live_mode: false,
    } as Record<string, unknown>,
    corpoLido: 0,
    async lerCorpo(): Promise<unknown> {
      aviso.corpoLido++;
      return aviso.corpo;
    },
  };
  return aviso;
}

// Resposta do GET /v1/payments/{id}: cartão aprovado de R$ 9.600,00 para o pedido.
export function pagamentoMp(id: string, numero: string, troca: Record<string, unknown> = {}) {
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
export function gatewayDeTeste(pagamentos: Record<string, unknown>) {
  const consultados: string[] = [];
  return {
    consultados,
    // O pagamento mudou no Mercado Pago (aprovou, expirou) antes do próximo aviso.
    trocar(id: string, resposta: unknown) {
      pagamentos[id] = resposta;
    },
    async consultarPagamento(id: string) {
      consultados.push(id);
      if (!(id in pagamentos)) throw new Error("pagamento inexistente no dublê");
      return pagamentos[id];
    },
  };
}

export const PIX_PENDENTE = {
  status: "pending",
  status_detail: "pending_waiting_transfer",
  payment_type_id: "bank_transfer",
  payment_method_id: "pix",
  date_approved: null,
  date_of_expiration: "2026-10-12T11:00:00.000-04:00",
};

export function cenarioWebhook(nomeBanco: string) {
  let db: Client;
  let fabrica: ReturnType<typeof fabricaDePedidos>;

  beforeAll(async () => {
    const contas = await prepararContas(nomeBanco);
    db = contas.db;
    fabrica = fabricaDePedidos(db, contas.admin, contas.idAna);
  }, 120_000);
  afterAll(async () => {
    await db?.end();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    const obraRow = await db.query(
      "SELECT quantidade_estoque, situacao FROM artwork WHERE id = $1",
      [obra],
    );
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

  async function pedidoPendente(slug: string, numero: string, email: string, estoque = 2) {
    const obra = await fabrica.obraPublicada(slug, "4.800,00", estoque);
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

  async function vencimentoDaReserva(sessaoId: string) {
    const { rows } = await db.query(
      "SELECT expira_em FROM artwork_reservation WHERE session_id = $1",
      [sessaoId],
    );
    return rows.map((r) => r.expira_em);
  }

  return {
    get db() {
      return db;
    },
    get fabrica() {
      return fabrica;
    },
    itensNoCarrinho,
    estado,
    pedidoPendente,
    vencimentoDaReserva,
  };
}
