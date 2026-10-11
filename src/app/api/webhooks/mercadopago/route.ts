import { gatewayMercadoPago, processarNotificacao } from "@/modules/payments";

// RF14/RNF11: notificação de pagamento do Mercado Pago (notification_url da preferência). O
// módulo valida a assinatura, consulta a API e confirma o pedido; aqui só entra e sai HTTP.
export async function POST(request: Request): Promise<Response> {
  const segredo = process.env.MP_WEBHOOK_SECRET;
  // Sem o segredo nenhuma assinatura confere: 500 faz o Mercado Pago reenviar depois do ajuste.
  if (!segredo) {
    console.error("MP_WEBHOOK_SECRET não configurado");
    return new Response(null, { status: 500 });
  }
  const corpo: unknown = await request.json().catch(() => null);
  const { status } = await processarNotificacao(
    { url: request.url, cabecalhos: request.headers, corpo },
    { gateway: gatewayMercadoPago(), segredo },
  );
  return new Response(null, { status });
}
