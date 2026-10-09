import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;

beforeAll(async () => {
  ({ db, admin, idAna } = await prepararContas("kolo_pbi41_busca_test"));
}, 120_000);
afterAll(async () => {
  await db?.end();
});
// Cada teste monta o próprio acervo no banco descartável.
beforeEach(async () => {
  await db.query("TRUNCATE artwork CASCADE");
});

type Ficha = {
  titulo: string;
  slug: string;
  preco?: string;
  estoque?: string;
  descricao?: string;
  tecnica?: string;
};

// Obra cadastrada pelo catálogo do PBI-18, com uma imagem e, se pedido, publicada.
async function cadastrar(ficha: Ficha, criadoEm = "2026-01-01T12:00:00Z", publicar = true) {
  const { criarObra, editarObra } = await import("../../src/modules/catalog");
  const completa = { artistaId: idAna, preco: "100,00", ...ficha };
  const criada = await criarObra(completa, admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  await db.query(
    "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, 1, true, 'Foto')",
    [criada.dados.id, `obras/x/${ficha.slug}.png`],
  );
  if (publicar) {
    const publicada = await editarObra(
      { ...completa, id: criada.dados.id, publicada: true },
      admin,
    );
    if (!publicada.ok) throw new Error(publicada.mensagem);
  }
  await db.query("UPDATE artwork SET criado_em = $2 WHERE id = $1", [criada.dados.id, criadoEm]);
  return criada.dados.id;
}

async function buscar(busca: unknown, extra: Record<string, unknown> = {}) {
  const { listarCatalogo } = await import("../../src/modules/catalog");
  return listarCatalogo({ busca, ...extra });
}

it("Fase 1/13 a busca ignora acentos e maiúsculas, nos dois sentidos", async () => {
  await cadastrar({ titulo: "Metrópole em chamas", slug: "metropole-em-chamas" });
  await cadastrar({ titulo: "Retalho paulistano", slug: "retalho-paulistano" });
  await cadastrar({ titulo: "Sao Paulo cinza", slug: "sao-paulo-cinza" });

  for (const termo of ["metropole", "METRÓPOLE", "Metrópole", "mEtRoPoLe"]) {
    const resultado = await buscar(termo);
    expect(
      resultado.obras.map((o) => o.slug),
      termo,
    ).toEqual(["metropole-em-chamas"]);
    expect(resultado.total, termo).toBe(1);
  }
  // O acento na busca também não atrapalha quando a obra foi cadastrada sem ele.
  expect((await buscar("São")).obras.map((o) => o.slug)).toEqual(["sao-paulo-cinza"]);
  expect((await buscar("metropole")).busca).toBe("metropole");
});

it("Fase 1/13 acha por começo de palavra em título, descrição e técnica; várias palavras exigem todas", async () => {
  await cadastrar({
    titulo: "Metrópole em chamas",
    slug: "metropole-em-chamas",
    tecnica: "Acrílica e spray sobre tela",
  });
  await cadastrar({
    titulo: "Retalho paulistano",
    slug: "retalho-paulistano",
    descricao: "Colagem de jornais e lambe-lambe da Avenida Paulista.",
    tecnica: "Colagem",
  });
  await cadastrar({ titulo: "Grafite noturno", slug: "grafite-noturno", tecnica: "Spray" });

  const slugs = async (termo: string) => (await buscar(termo)).obras.map((o) => o.slug).sort();
  expect(await slugs("metro")).toEqual(["metropole-em-chamas"]);
  expect(await slugs("acrilica")).toEqual(["metropole-em-chamas"]);
  expect(await slugs("jornais")).toEqual(["retalho-paulistano"]);
  expect(await slugs("grafit")).toEqual(["grafite-noturno"]);
  expect(await slugs("spray")).toEqual(["grafite-noturno", "metropole-em-chamas"]);
  expect(await slugs("spray noturno")).toEqual(["grafite-noturno"]);
  expect(await slugs("Paulista colagem")).toEqual(["retalho-paulistano"]);

  const nada = await buscar("aquarela");
  expect(nada).toMatchObject({ obras: [], total: 0, totalPaginas: 0, busca: "aquarela" });
});

it("Fase 1/13 com busca, rascunho e arquivada seguem fora, esgotada no fim, e paginação e ordenação valem", async () => {
  await cadastrar({ titulo: "Spray rascunho", slug: "spray-rascunho" }, undefined, false);
  const arquivada = await cadastrar({ titulo: "Spray arquivada", slug: "spray-arquivada" });
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);
  await cadastrar(
    { titulo: "Spray esgotada", slug: "spray-esgotada", preco: "10,00", estoque: "0" },
    "2026-12-01T12:00:00Z",
  );
  for (let i = 1; i <= 13; i++) {
    const n = String(i).padStart(2, "0");
    await cadastrar(
      { titulo: `Spray ${n}`, slug: `spray-${n}`, preco: `${100 + i},00` },
      `2026-01-${n}T12:00:00Z`,
    );
  }
  await cadastrar({ titulo: "Aquarela", slug: "aquarela" });

  const primeira = await buscar("spray", { ordem: "menor-preco" });
  const segunda = await buscar("spray", { ordem: "menor-preco", pagina: 2 });
  expect(primeira).toMatchObject({
    total: 14,
    totalPaginas: 2,
    ordem: "menor-preco",
    busca: "spray",
  });
  expect(primeira.obras.map((o) => o.slug)).toEqual(
    Array.from({ length: 12 }, (_, i) => `spray-${String(i + 1).padStart(2, "0")}`),
  );
  expect(segunda.obras.map((o) => o.slug)).toEqual(["spray-13", "spray-esgotada"]);
  expect((await buscar("spray", { ordem: "recentes" })).obras[0]?.slug).toBe("spray-13");
});
