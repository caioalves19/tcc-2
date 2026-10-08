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
