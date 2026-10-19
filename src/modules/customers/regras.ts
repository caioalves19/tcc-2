import { pedidoPago, type PedidoDoClienteAdmin } from "../orders/index";

// RF30: o que o cliente efetivamente pagou, com a regra de pedido pago do módulo de pedidos (a
// mesma do relatório de vendas, PBI-48).
export function totalGasto(
  pedidos: Pick<PedidoDoClienteAdmin, "situacaoBanco" | "totalCentavos">[],
): number {
  return pedidos.reduce(
    (soma, pedido) => (pedidoPago(pedido.situacaoBanco) ? soma + pedido.totalCentavos : soma),
    0,
  );
}
