import { describe, expect, it } from "vitest";
import { acaoDeEstorno, pagouOPedido } from "../../src/modules/orders/regras";

describe("PBI-42: quem pagou o pedido decide se o estorno visto no painel é concluído", () => {
  it("pagou o pedido o pagamento aprovado sem motivo ou aprovado sem unidade livre", () => {
    expect(pagouOPedido({ situacao: "APROVADO", motivo: null })).toBe(true);
    expect(pagouOPedido({ situacao: "APROVADO", motivo: "SEM_ESTOQUE" })).toBe(true);
    expect(pagouOPedido({ situacao: "APROVADO", motivo: "PEDIDO_NAO_PENDENTE" })).toBe(false);
    expect(pagouOPedido({ situacao: "APROVADO", motivo: "VALOR_DIVERGENTE" })).toBe(false);
    expect(pagouOPedido({ situacao: "ESTORNADO", motivo: null })).toBe(false);
    expect(pagouOPedido({ situacao: "PENDENTE", motivo: null })).toBe(false);
  });

  it("estornado sem motivo em pedido pago só é concluído se nenhum outro pagamento pagou", () => {
    const estornado = { situacao: "ESTORNADO" as const, motivo: null };
    expect(acaoDeEstorno(estornado, "PAGO", false)).toBe("concluir");
    expect(acaoDeEstorno(estornado, "PROCESSANDO", false)).toBe("concluir");
    expect(acaoDeEstorno(estornado, "PAGO", true)).toBeNull();
    expect(acaoDeEstorno(estornado, "PROCESSANDO", true)).toBeNull();
  });

  it("o pagamento aprovado continua estornável, com ou sem outro pagador", () => {
    expect(acaoDeEstorno({ situacao: "APROVADO", motivo: null }, "PAGO", true)).toBe("estornar");
  });
});
