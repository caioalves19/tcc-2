import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;

beforeAll(async () => {
  ({ db, admin, idAna } = await prepararContas("kolo_pbi19_catalogo_test"));
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
  preco: string;
  estoque?: string;
  destaque?: boolean;
  artistaId?: string;
};

// Obra cadastrada pelo catálogo do PBI-18, com uma imagem e, se pedido, publicada. `criadoEm`
// fixa a data de cadastro para a ordem "recentes" não depender do relógio do teste.
async function cadastrar(ficha: Ficha, criadoEm: string, publicar = true) {
  const { criarObra, editarObra } = await import("../../src/modules/catalog");
  const completa = { artistaId: idAna, ...ficha };
  const criada = await criarObra(completa, admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  await db.query(
    "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, 1, true, $3)",
    [criada.dados.id, `obras/x/${ficha.slug}.png`, `Foto de ${ficha.titulo}`],
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

it("RF09/RN11 lista só as obras publicadas, mais recentes primeiro e esgotadas no fim", async () => {
  const { listarCatalogo } = await import("../../src/modules/catalog");
  // Sem data informada, o banco preenche criado_em no cadastro.
  const { criarObra } = await import("../../src/modules/catalog");
  const semData = await criarObra(
    { titulo: "Sem data", slug: "sem-data", artistaId: idAna, preco: "10,00" },
    admin,
  );
  if (!semData.ok) throw new Error(semData.mensagem);
  const { rows } = await db.query("SELECT criado_em FROM artwork WHERE id = $1", [
    semData.dados.id,
  ]);
  expect(rows[0].criado_em).toBeInstanceOf(Date);

  await cadastrar({ titulo: "Antiga", slug: "antiga", preco: "100,00" }, "2026-01-01T12:00:00Z");
  await cadastrar({ titulo: "Nova", slug: "nova", preco: "200,00" }, "2026-03-01T12:00:00Z");
  await cadastrar(
    { titulo: "Esgotada nova", slug: "esgotada-nova", preco: "300,00", estoque: "0" },
    "2026-04-01T12:00:00Z",
  );
  await cadastrar(
    { titulo: "Rascunho", slug: "rascunho", preco: "400,00" },
    "2026-05-01T12:00:00Z",
    false,
  );
  const arquivada = await cadastrar(
    { titulo: "Arquivada", slug: "arquivada", preco: "500,00" },
    "2026-06-01T12:00:00Z",
  );
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);

  const catalogo = await listarCatalogo({});
  expect(catalogo).toMatchObject({ total: 3, pagina: 1, totalPaginas: 1, ordem: "recentes" });
  expect(catalogo.obras.map((o) => [o.slug, o.disponivel])).toEqual([
    ["nova", true],
    ["antiga", true],
    ["esgotada-nova", false],
  ]);
});

it("RF09 pagina de 12 em 12 sem repetir nem pular obra, mesmo com datas iguais", async () => {
  const { listarCatalogo } = await import("../../src/modules/catalog");
  const mesmaData = "2025-06-01T12:00:00Z";
  for (let i = 1; i <= 14; i++) {
    const n = String(i).padStart(2, "0");
    await cadastrar({ titulo: `Obra ${n}`, slug: `obra-${n}`, preco: "100,00" }, mesmaData);
  }
  await cadastrar(
    { titulo: "Esgotada", slug: "esgotada", preco: "100,00", estoque: "0" },
    "2026-09-01T12:00:00Z",
  );

  const primeira = await listarCatalogo({ pagina: 1 });
  const segunda = await listarCatalogo({ pagina: "2" });
  expect(primeira).toMatchObject({ total: 15, pagina: 1, totalPaginas: 2, ordem: "recentes" });
  expect(segunda).toMatchObject({ total: 15, pagina: 2, totalPaginas: 2 });
  expect(primeira.obras).toHaveLength(12);
  expect(segunda.obras).toHaveLength(3);
  const slugs = [...primeira.obras, ...segunda.obras].map((o) => o.slug);
  expect(new Set(slugs).size).toBe(15);
  expect(slugs.at(-1)).toBe("esgotada");
  // A mesma consulta devolve a mesma ordem (o id desempata as datas iguais).
  expect((await listarCatalogo({ pagina: 1 })).obras.map((o) => o.slug)).toEqual(
    primeira.obras.map((o) => o.slug),
  );

  expect(await listarCatalogo({ pagina: 3 })).toEqual({
    obras: [],
    total: 15,
    pagina: 3,
    totalPaginas: 2,
    ordem: "recentes",
  });
  for (const pagina of ["abc", 0, -1, 1.5, "", undefined, null, "1e999"])
    expect((await listarCatalogo({ pagina, ordem: "qualquer" })).pagina, String(pagina)).toBe(1);
  expect((await listarCatalogo({ ordem: "qualquer" })).ordem).toBe("recentes");
});

it("RF09/RN11 ordena por recentes, menor e maior preço e destaque, sempre com as esgotadas no fim", async () => {
  const { listarCatalogo } = await import("../../src/modules/catalog");
  await cadastrar({ titulo: "Obra A", slug: "obra-a", preco: "300,00" }, "2026-01-01T12:00:00Z");
  await cadastrar(
    { titulo: "Obra B", slug: "obra-b", preco: "100,00", destaque: true },
    "2026-02-01T12:00:00Z",
  );
  await cadastrar({ titulo: "Obra C", slug: "obra-c", preco: "200,00" }, "2026-03-01T12:00:00Z");
  await cadastrar(
    { titulo: "Obra D", slug: "obra-d", preco: "50,00", estoque: "0" },
    "2026-04-01T12:00:00Z",
  );
  await cadastrar(
    { titulo: "Obra E", slug: "obra-e", preco: "500,00", estoque: "0", destaque: true },
    "2026-05-01T12:00:00Z",
  );

  const ordem = async (criterio: string) => {
    const pagina = await listarCatalogo({ ordem: criterio });
    expect(pagina.ordem).toBe(criterio);
    return pagina.obras.map((o) => o.slug);
  };
  expect(await ordem("recentes")).toEqual(["obra-c", "obra-b", "obra-a", "obra-e", "obra-d"]);
  expect(await ordem("menor-preco")).toEqual(["obra-b", "obra-c", "obra-a", "obra-d", "obra-e"]);
  expect(await ordem("maior-preco")).toEqual(["obra-a", "obra-c", "obra-b", "obra-e", "obra-d"]);
  expect(await ordem("destaque")).toEqual(["obra-b", "obra-c", "obra-a", "obra-e", "obra-d"]);
});

it("RF09 o card do catálogo traz foto, título, artista, ficha resumida, preço e disponibilidade", async () => {
  const { listarCatalogo } = await import("../../src/modules/catalog");
  const { editarObra } = await import("../../src/modules/catalog");
  const id = await cadastrar(
    { titulo: "Tinta fresca", slug: "tinta-fresca", preco: "1.650,00" },
    "2026-02-01T12:00:00Z",
  );
  const ficha = {
    id,
    titulo: "Tinta fresca",
    slug: "tinta-fresca",
    artistaId: idAna,
    preco: "1.650,00",
    tecnica: "Spray e pigmento",
    dimensoes: "65 × 65 cm",
    publicada: true,
  };
  const editada = await editarObra(ficha, admin);
  if (!editada.ok) throw new Error(editada.mensagem);

  expect((await listarCatalogo({})).obras).toEqual([
    {
      slug: "tinta-fresca",
      titulo: "Tinta fresca",
      artistaNome: "Ana",
      tecnica: "Spray e pigmento",
      dimensoes: "65 × 65 cm",
      precoCentavos: 165000,
      disponivel: true,
      imagem: { chave: "obras/x/tinta-fresca.png", textoAlternativo: "Foto de Tinta fresca" },
    },
  ]);
});

it("RF07 os destaques da home são só as obras marcadas e publicadas, até 4, com as esgotadas no fim", async () => {
  const { listarDestaques } = await import("../../src/modules/catalog");
  await cadastrar({ titulo: "Comum", slug: "comum", preco: "100,00" }, "2026-06-01T12:00:00Z");
  expect(await listarDestaques()).toEqual([]);

  const marcada = (titulo: string, slug: string, estoque = "1") => ({
    titulo,
    slug,
    preco: "100,00",
    estoque,
    destaque: true,
  });
  await cadastrar(marcada("Destaque antigo", "d-antigo"), "2026-01-01T12:00:00Z");
  await cadastrar(marcada("Destaque novo", "d-novo"), "2026-03-01T12:00:00Z");
  await cadastrar(marcada("Destaque esgotado", "d-esgotado", "0"), "2026-05-01T12:00:00Z");
  await cadastrar(marcada("Destaque rascunho", "d-rascunho"), "2026-07-01T12:00:00Z", false);
  const arquivada = await cadastrar(
    marcada("Destaque arquivado", "d-arquivado"),
    "2026-08-01T12:00:00Z",
  );
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);

  expect((await listarDestaques()).map((o) => [o.slug, o.disponivel])).toEqual([
    ["d-novo", true],
    ["d-antigo", true],
    ["d-esgotado", false],
  ]);

  await cadastrar(marcada("Destaque 2", "d-2"), "2026-02-01T12:00:00Z");
  await cadastrar(marcada("Destaque 4", "d-4"), "2026-04-01T12:00:00Z");
  expect((await listarDestaques()).map((o) => o.slug)).toEqual([
    "d-4",
    "d-novo",
    "d-2",
    "d-antigo",
  ]);
});
