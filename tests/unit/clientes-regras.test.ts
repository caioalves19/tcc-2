import { expect, it } from "vitest";
import { totalGasto } from "../../src/modules/customers/regras";

const pedido = (situacaoBanco: string, totalCentavos: number) =>
  ({ situacaoBanco, totalCentavos }) as Parameters<typeof totalGasto>[0][number];

it("RF30 o total gasto soma só os pedidos pagos (de Pago a Entregue)", () => {
  expect(
    totalGasto([
      pedido("PAGO", 480000),
      pedido("PROCESSANDO", 120000),
      pedido("ENVIADO", 35000),
      pedido("ENTREGUE", 15050),
      // Tentativa sem pagamento e pedido cancelado (ou estornado) não contam.
      pedido("PENDENTE", 960000),
      pedido("CANCELADO", 960000),
    ]),
  ).toBe(650050);
});

it("RF30 cliente sem compras gastou R$ 0", () => {
  expect(totalGasto([])).toBe(0);
  expect(totalGasto([pedido("PENDENTE", 960000)])).toBe(0);
});
