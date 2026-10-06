import { describe, expect, it } from "vitest";
import {
  centavosParaTexto,
  precoEmCentavos,
  situacaoPorEstoque,
} from "../../src/modules/catalog/regras";
import { schemaEditarObra, schemaObra } from "../../src/modules/catalog/validacao";

const ARTISTA = "6f1c2b9e-1d2a-4c3b-8e4f-5a6b7c8d9e0f";
const TAG = "0b3e8f1a-2c4d-4e6f-8a1b-3c5d7e9f1a2b";

describe("RN07: preço em centavos inteiros", () => {
  it("converte reais no formato brasileiro", () => {
    expect(precoEmCentavos("1.234,56")).toBe(123456);
    expect(precoEmCentavos("1234,56")).toBe(123456);
    expect(precoEmCentavos("2.500")).toBe(250000);
    expect(precoEmCentavos("R$ 99,9")).toBe(9990);
    expect(precoEmCentavos(" 0,05 ")).toBe(5);
  });

  it("recusa o que não é um valor em reais", () => {
    for (const texto of ["", "abc", "-10", "1,234.56", "12,345", "1.23", "1.2345,00"])
      expect(precoEmCentavos(texto)).toBeNull();
  });

  it("volta para o texto do formulário", () => {
    expect(centavosParaTexto(123456)).toBe("1.234,56");
    expect(centavosParaTexto(50)).toBe("0,50");
    expect(centavosParaTexto(100000000)).toBe("1.000.000,00");
  });
});

describe("RN11: situação derivada do estoque", () => {
  it("rascunho não depende do estoque; publicada fica disponível ou esgotada", () => {
    expect(situacaoPorEstoque(false, 3)).toBe("RASCUNHO");
    expect(situacaoPorEstoque(false, 0)).toBe("RASCUNHO");
    expect(situacaoPorEstoque(true, 1)).toBe("DISPONIVEL");
    expect(situacaoPorEstoque(true, 0)).toBe("ESGOTADA");
  });
});

describe("RF26: ficha da obra", () => {
  const valida = {
    titulo: " Metrópole em chamas ",
    slug: "metropole-em-chamas",
    artistaId: ARTISTA,
    preco: "4.800,00",
  };

  it("normaliza a ficha e usa estoque padrão 1 (RN02)", () => {
    expect(schemaObra.parse(valida)).toEqual({
      titulo: "Metrópole em chamas",
      slug: "metropole-em-chamas",
      descricao: null,
      artistaId: ARTISTA,
      tecnica: null,
      dimensoes: null,
      ano: null,
      precoCentavos: 480000,
      estoque: 1,
      destaque: false,
      tags: [],
    });
    expect(
      schemaObra.parse({
        ...valida,
        tecnica: "Spray sobre tela",
        dimensoes: "60 x 80 cm",
        ano: "2024",
        estoque: "3",
        tags: [TAG],
      }),
    ).toMatchObject({ tecnica: "Spray sobre tela", ano: 2024, estoque: 3, tags: [TAG] });
  });

  it("recusa preço, estoque, ano, slug e tags inválidos", () => {
    const anoQueVem = String(new Date().getFullYear() + 1);
    for (const errado of [
      { preco: "0,99" },
      { preco: "1.000.000,01" },
      { preco: "dez reais" },
      { estoque: "-1" },
      { estoque: "1,5" },
      { estoque: "1000" },
      { ano: "1899" },
      { ano: anoQueVem },
      { slug: "Slug Inválido" },
      { titulo: "A" },
      { artistaId: "nao-e-uuid" },
      { tags: [TAG, TAG] },
    ])
      expect(schemaObra.safeParse({ ...valida, ...errado }).success, JSON.stringify(errado)).toBe(
        false,
      );
  });

  it("na edição exige o id e a escolha entre rascunho e publicada", () => {
    const id = "3d7f9b1c-5e2a-4b8c-9d0e-1f2a3b4c5d6e";
    expect(schemaEditarObra.parse({ ...valida, id, publicada: true })).toMatchObject({
      id,
      publicada: true,
    });
    expect(schemaEditarObra.safeParse({ ...valida, publicada: true }).success).toBe(false);
    expect(schemaEditarObra.safeParse({ ...valida, id }).success).toBe(false);
  });
});
