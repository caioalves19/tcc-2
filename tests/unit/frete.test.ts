import { describe, expect, it } from "vitest";
import { calcularFrete } from "../../src/modules/orders/frete";

describe("PBI-42: frete calculado no servidor (complemento do RF12)", () => {
  it("retirada no ateliê não tem custo, em qualquer endereço", () => {
    expect(calcularFrete("RETIRADA", { cidade: "Manaus", uf: "AM" })).toBe(0);
  });

  // Valores de exemplo do PBI-42, a confirmar com a equipe: R$ 30,00 na capital paulista.
  it("entrega na cidade de São Paulo tem valor fixo, sem depender de acento ou maiúsculas", () => {
    for (const cidade of ["São Paulo", "SAO PAULO", "  sao paulo "])
      expect(calcularFrete("ENTREGA", { cidade, uf: "SP" })).toBe(3000);
  });

  // Tabela por UF (exemplo): SP fora da capital R$ 45,00; RJ, MG e PR R$ 65,00; ES, SC, RS, DF,
  // GO e MS R$ 85,00.
  it("entrega fora da capital paulista usa a tabela da UF do endereço", () => {
    expect(calcularFrete("ENTREGA", { cidade: "Campinas", uf: "SP" })).toBe(4500);
    expect(calcularFrete("ENTREGA", { cidade: "Rio de Janeiro", uf: "RJ" })).toBe(6500);
    expect(calcularFrete("ENTREGA", { cidade: "Porto Alegre", uf: "RS" })).toBe(8500);
  });

  it("UF fora da tabela não tem entrega: a modalidade fica indisponível", () => {
    expect(calcularFrete("ENTREGA", { cidade: "Manaus", uf: "AM" })).toBeNull();
    expect(calcularFrete("ENTREGA", { cidade: "Recife", uf: "PE" })).toBeNull();
  });
});
