import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

import {
  artistasDemo,
  estilosDemo,
  obrasDemo,
  tatuagens,
} from "../../prisma/imagens-demo/catalogo";

const PASTA = join(process.cwd(), "prisma", "imagens-demo", "imagens");

// A vitrine mostra o pessoal do Kolô: quatro artistas, dos quais três tatuam (têm estilo).
it("a demonstração traz os quatro artistas do Kolô, três deles tatuadores, cada um com o Instagram", () => {
  expect(artistasDemo.map(({ nome, instagram }) => ({ nome, instagram }))).toEqual([
    { nome: "Melanie Schwark", instagram: "melanfetamina" },
    { nome: "Rafael Lotufo", instagram: "rafa.lotufo" },
    { nome: 'Gustavo Henrique "Cogu"', instagram: "co.guh" },
    { nome: 'Laura Manoel "Pucca"', instagram: "pucca.ink" },
  ]);

  const slugs = artistasDemo.map((artista) => artista.slug);
  for (const item of [...obrasDemo, ...tatuagens]) {
    expect(slugs, item.titulo).toContain(item.artistaSlug);
  }
});

// Estilos que cada tatuador trabalha, definidos com o estúdio.
it("cada tatuador tem os estilos que trabalha e o Rafael nenhum", () => {
  const nomes = new Map(estilosDemo.map((estilo) => [estilo.slug, estilo.nome]));
  expect(
    artistasDemo.map((a) => ({ nome: a.nome, estilos: a.estilos.map((s) => nomes.get(s)) })),
  ).toEqual([
    { nome: "Melanie Schwark", estilos: ["Blackwork", "Surrealismo"] },
    { nome: "Rafael Lotufo", estilos: [] },
    { nome: 'Gustavo Henrique "Cogu"', estilos: ["Blackwork", "Old school"] },
    { nome: 'Laura Manoel "Pucca"', estilos: ["Lettering"] },
  ]);
});

// Imagens reais: cada obra e tatuagem tem o arquivo (e a miniatura) e aponta para o post do
// Instagram do próprio artista, de onde a foto veio com autorização.
it("cada obra e tatuagem tem a imagem real e o post de origem no Instagram do artista", () => {
  const instagram = new Map(artistasDemo.map((a) => [a.slug, a.instagram]));
  const itens = [
    ...obrasDemo.map((o) => ({ ...o, arquivo: `obras/${o.slug}` })),
    ...tatuagens.map((t) => ({ ...t, arquivo: `tatuagens/${t.id}` })),
  ];
  for (const item of itens) {
    expect(existsSync(join(PASTA, `${item.arquivo}.webp`)), item.titulo).toBe(true);
    expect(existsSync(join(PASTA, `${item.arquivo}_thumb.webp`)), item.titulo).toBe(true);
    expect(item.origem, item.titulo).toMatch(
      new RegExp(`^https://www\\.instagram\\.com/${instagram.get(item.artistaSlug)}/p/[\\w-]+/$`),
    );
  }
  expect(new Set(obrasDemo.map((o) => o.slug)).size).toBe(obrasDemo.length);
  expect(new Set(tatuagens.map((t) => t.id)).size).toBe(tatuagens.length);
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
