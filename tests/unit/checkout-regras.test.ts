import { describe, expect, it } from "vitest";
import { numeroDoPedido } from "../../src/modules/orders/regras";

describe("PBI-26: número do pedido", () => {
  it("é AAAAMMDD-XXXXXX com a data de São Paulo (RN09)", () => {
    // 02:30 UTC de 08/10 ainda é 07/10 em São Paulo (UTC-03).
    const agora = new Date("2026-10-08T02:30:00Z");
    expect(numeroDoPedido(agora, Uint8Array.from([0, 1, 2, 3, 4, 5]))).toBe("20261007-234567");
    expect(numeroDoPedido(agora, Uint8Array.from([30, 31, 255, 8, 9, 10]))).toBe("20261007-Z29ABC");
  });

  it("não usa caracteres que se confundem ao ditar o número (0, O, 1, I, L)", () => {
    const agora = new Date("2026-10-08T15:00:00Z");
    const sufixos = Array.from({ length: 256 }, (_, byte) =>
      numeroDoPedido(agora, Uint8Array.from([byte, byte, byte, byte, byte, byte])).slice(9),
    );
    for (const sufixo of sufixos) expect(sufixo).toMatch(/^[2-9A-HJKMNP-Z]{6}$/);
  });
});
