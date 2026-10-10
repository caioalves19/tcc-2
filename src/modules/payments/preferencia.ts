import type { PedidoResumo } from "../orders/index";

export type CorpoPreferencia = {
  items: { id: string; title: string; quantity: number; unit_price: number; currency_id: "BRL" }[];
  external_reference: string;
  back_urls: { success: string; pending: string; failure: string };
  auto_return?: "approved";
  notification_url?: string;
  expires: true;
  expiration_date_to: string;
};

export type ResultadoPreferencia =
  { ok: true; dados: CorpoPreferencia } | { ok: false; erro: "invalido"; mensagem: string };

// RF13: o Checkout Pro cobra exatamente o que o pedido gravou (cópia de título e preço), e a
// preferência deixa de aceitar pagamento quando a reserva de 10 minutos acaba (RN03).
export function montarPreferencia(pedido: PedidoResumo, appUrl: string): ResultadoPreferencia {
  if (!pedido.reservaExpiraEm)
    return { ok: false, erro: "invalido", mensagem: "A reserva do pedido expirou." };
  // RN07: o gateway recebe só os itens; se eles não somam o total, não há o que cobrar com
  // segurança (frete pago entra com o PBI-42).
  const somaItens = pedido.itens.reduce((soma, i) => soma + i.precoCentavos * i.quantidade, 0);
  if (somaItens !== pedido.totalCentavos)
    return { ok: false, erro: "invalido", mensagem: "O total do pedido não confere com os itens." };
  const base = appUrl.replace(/\/+$/, "");
  const retorno = `${base}/checkout/${encodeURIComponent(pedido.numero)}?retorno=mercadopago`;
  // O Mercado Pago não alcança localhost: sem https, nada de webhook nem de retorno automático.
  const publico = base.startsWith("https://")
    ? { auto_return: "approved" as const, notification_url: `${base}/api/webhooks/mercadopago` }
    : {};
  return {
    ok: true,
    dados: {
      items: pedido.itens.map((i) => ({
        id: i.obraId,
        title: i.titulo,
        quantity: i.quantidade,
        unit_price: i.precoCentavos / 100,
        currency_id: "BRL",
      })),
      external_reference: pedido.numero,
      back_urls: { success: retorno, pending: retorno, failure: retorno },
      ...publico,
      expires: true,
      expiration_date_to: pedido.reservaExpiraEm.toISOString(),
    },
  };
}
