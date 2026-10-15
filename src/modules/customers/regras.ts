import type { PedidoDoClienteAdmin } from "../orders/index";

// RF30: o que o cliente efetivamente pagou. Pendente (tentativa sem pagamento ou aguardando) e
// cancelado (inclusive o estornado, PBI-43) não contam.
const PAGOS: ReadonlySet<PedidoDoClienteAdmin["situacaoBanco"]> = new Set([
  "PAGO",
  "PROCESSANDO",
  "ENVIADO",
  "ENTREGUE",
]);

export function totalGasto(
  pedidos: Pick<PedidoDoClienteAdmin, "situacaoBanco" | "totalCentavos">[],
): number {
  return pedidos.reduce(
    (soma, pedido) => (PAGOS.has(pedido.situacaoBanco) ? soma + pedido.totalCentavos : soma),
    0,
  );
}
