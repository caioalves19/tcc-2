import { describe, expect, it } from "vitest";
import {
  obraDisponivel,
  quantidadeAoJuntar,
  quantidadeValida,
  resumirCarrinho,
} from "../../src/modules/orders/regras";

describe("RF11/RN02: quantidade no carrinho", () => {
  it("aceita de 1 até o estoque, em unidades inteiras", () => {
    expect(quantidadeValida(1, 1)).toBe(true);
    expect(quantidadeValida(3, 3)).toBe(true);
    for (const [quantidade, estoque] of [
      [2, 1],
      [0, 3],
      [-1, 3],
      [1.5, 3],
      [1, 0],
    ] as const)
      expect(quantidadeValida(quantidade, estoque), `${quantidade} de ${estoque}`).toBe(false);
  });

  it("ao juntar os carrinhos vale a maior quantidade, limitada ao estoque", () => {
    expect(quantidadeAoJuntar(1, 2, 3)).toBe(2);
    expect(quantidadeAoJuntar(3, 1, 3)).toBe(3);
    expect(quantidadeAoJuntar(2, 2, 1)).toBe(1);
  });
});

describe("RN11: só obra publicada, com estoque e não arquivada pode ser comprada", () => {
  it("disponível depende da situação, do estoque e do arquivamento", () => {
    const base = { situacao: "DISPONIVEL", arquivada: false, estoque: 1 } as const;
    expect(obraDisponivel(base)).toBe(true);
    expect(obraDisponivel({ ...base, situacao: "ESGOTADA" })).toBe(false);
    expect(obraDisponivel({ ...base, situacao: "RASCUNHO" })).toBe(false);
    expect(obraDisponivel({ ...base, arquivada: true })).toBe(false);
    expect(obraDisponivel({ ...base, estoque: 0 })).toBe(false);
  });
});

describe("RF11: totais calculados no servidor", () => {
  it("soma só os itens disponíveis e conta os indisponíveis à parte", () => {
    expect(
      resumirCarrinho([
        { precoCentavos: 480000, quantidade: 1, disponivel: true },
        { precoCentavos: 9990, quantidade: 2, disponivel: true },
        { precoCentavos: 100000, quantidade: 1, disponivel: false },
      ]),
    ).toEqual({ totalCentavos: 499980, unidades: 3, indisponiveis: 1 });
    expect(resumirCarrinho([])).toEqual({ totalCentavos: 0, unidades: 0, indisponiveis: 0 });
  });
});
