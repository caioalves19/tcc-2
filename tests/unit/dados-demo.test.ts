import { expect, it } from "vitest";

import {
  artistasDemo,
  estilosDemo,
  obras,
  obrasDemo,
  tatuagens,
} from "../../prisma/imagens-demo/catalogo";

// A vitrine mostra o pessoal do Kolô: quatro artistas, dos quais três tatuam (têm estilo).
it("a demonstração traz os quatro artistas do Kolô, três deles tatuadores, cada um com o Instagram", () => {
  expect(artistasDemo.map(({ nome, instagram }) => ({ nome, instagram }))).toEqual([
    { nome: "Melanie Schwark", instagram: "melanfetamina" },
    { nome: "Rafael Lotufo", instagram: "rafa.lotufo" },
    { nome: 'Gustavo Henrique "Cogu"', instagram: "co.guh" },
    { nome: 'Laura Manoel "Pucca"', instagram: "pucca.ink" },
  ]);
  expect(artistasDemo.filter((a) => a.estilos.length > 0).map((a) => a.nome)).toEqual([
    "Melanie Schwark",
    'Gustavo Henrique "Cogu"',
    'Laura Manoel "Pucca"',
  ]);

  const slugs = artistasDemo.map((artista) => artista.slug);
  for (const item of [...obrasDemo, ...tatuagens]) {
    expect(slugs, item.titulo).toContain(item.artistaSlug);
  }
});

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
  expect(obrasDemo.filter((obra) => obra.estoque === 0)).toHaveLength(1);
});

// popular.ts pula a tatuagem cujo artista ou estilo não existe; o artista também precisa
// trabalhar com o estilo que aparece no portfólio dele.
it("PBI-49 cada tatuagem aponta para um artista e um estilo que o seed cria e que andam juntos", () => {
  const estilosPorArtista = new Map(artistasDemo.map((a) => [a.slug, a.estilos]));
  const estilos = estilosDemo.map((estilo) => estilo.slug);

  for (const tatuagem of tatuagens) {
    expect(estilos, tatuagem.titulo).toContain(tatuagem.estiloSlug);
    expect(estilosPorArtista.get(tatuagem.artistaSlug), tatuagem.titulo).toContain(
      tatuagem.estiloSlug,
    );
  }
});
