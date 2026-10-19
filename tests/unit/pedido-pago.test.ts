import { expect, it } from "vitest";
import { pedidoPago } from "../../src/modules/orders";

// RF30 (PBI-38) e RF32 (PBI-48): a mesma regra no total gasto do cliente e no relatório de vendas.
it("RF32 pedido pago é o que está de Pago a Entregue", () => {
  for (const situacao of ["PAGO", "PROCESSANDO", "ENVIADO", "ENTREGUE"] as const)
    expect(pedidoPago(situacao), situacao).toBe(true);
  // Tentativa sem pagamento ou aguardando, e cancelado (inclusive o estornado, PBI-43).
  for (const situacao of ["PENDENTE", "CANCELADO"] as const)
    expect(pedidoPago(situacao), situacao).toBe(false);
});
