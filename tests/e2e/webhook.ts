import { createHmac, randomUUID } from "node:crypto";

// RNF11: aviso como o Mercado Pago manda. A assinatura é o HMAC-SHA256 de
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" com o segredo do webhook, no cabeçalho
// x-signature ("ts=...,v1=..."), conforme a documentação de notificações do Mercado Pago.
export function avisoDePagamento(idPagamento: string, segredo: string) {
  const idRequisicao = randomUUID();
  const ts = String(Math.floor(Date.now() / 1000));
  const v1 = createHmac("sha256", segredo)
    .update(`id:${idPagamento};request-id:${idRequisicao};ts:${ts};`)
    .digest("hex");
  return {
    caminho: `/api/webhooks/mercadopago?data.id=${idPagamento}&type=payment`,
    cabecalhos: { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": idRequisicao },
    corpo: {
      id: randomUUID(),
      type: "payment",
      action: "payment.updated",
      data: { id: idPagamento },
      live_mode: false,
    },
  };
}
