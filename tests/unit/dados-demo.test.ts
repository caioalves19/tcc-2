import { expect, it } from "vitest";

import {
  artistaDemo,
  estilosDemo,
  estilosDoArtistaExemplo,
  obras,
  obrasDemo,
  situacaoDemo,
  tatuagens,
} from "../../prisma/imagens-demo/catalogo";

const situacoesDemo = () => obrasDemo.map(situacaoDemo);

// PBI-49: popular.ts só liga a imagem a uma obra já cadastrada; o seed de demonstração precisa
// cadastrar exatamente as obras que têm imagem.
it("PBI-49 o seed de demonstração cadastra cada obra que tem imagem, sem repetir slug", () => {
  const cadastradas = obrasDemo.map((obra) => obra.slug);

  expect(new Set(cadastradas).size).toBe(cadastradas.length);
  expect([...cadastradas].sort()).toEqual(obras.map((imagem) => imagem.slug).sort());
});

// RN07: centavos inteiros de R$ 1,00 a R$ 1.000.000,00. RN02: estoque de 0 a 999. RN11: a
// demonstração mostra pelo menos uma obra esgotada no acervo.
it("PBI-49 as obras de demonstração respeitam preço, estoque e mostram uma esgotada", () => {
  for (const obra of obrasDemo) {
    expect(Number.isInteger(obra.precoCentavos), obra.slug).toBe(true);
    expect(obra.precoCentavos, obra.slug).toBeGreaterThanOrEqual(100);
    expect(obra.precoCentavos, obra.slug).toBeLessThanOrEqual(100_000_000);
    expect(Number.isInteger(obra.estoque) && obra.estoque >= 0 && obra.estoque <= 999).toBe(true);
  }
  expect(situacoesDemo().filter((s) => s === "ESGOTADA")).toHaveLength(1);
  expect(situacoesDemo().filter((s) => s === "DISPONIVEL")).toHaveLength(7);
});

// popular.ts pula a tatuagem cujo artista ou estilo não existe; o artista também precisa
// trabalhar com o estilo que aparece no portfólio dele.
it("PBI-49 cada tatuagem aponta para um artista e um estilo que o seed cria e que andam juntos", () => {
  const estilosPorArtista = new Map([
    [artistaDemo.slug, artistaDemo.estilos],
    ["artista-exemplo", estilosDoArtistaExemplo],
  ]);
  const estilos = estilosDemo.map((estilo) => estilo.slug);

  for (const tatuagem of tatuagens) {
    expect(estilos, tatuagem.titulo).toContain(tatuagem.estiloSlug);
    expect(estilosPorArtista.get(tatuagem.artistaSlug), tatuagem.titulo).toContain(
      tatuagem.estiloSlug,
    );
  }
});
