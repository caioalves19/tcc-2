import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas, type Contas } from "./contas-pbi17";

let contas: Contas;
let floral: string;
beforeAll(async () => {
  contas = await prepararContas("kolo_pbi36_test");
  floral = (
    await contas.db.query(
      "INSERT INTO tattoo_style (id, nome, slug) VALUES (gen_random_uuid(), 'Floral', 'floral') RETURNING id",
    )
  ).rows[0].id;
  for (const [artista, titulo, regiao, estilo] of [
    [contas.idAna, "Rosa", "Braço", true],
    [contas.idAna, "Lírio", "Perna", true],
    [contas.idAna, "Lua", "Braço", false],
    [contas.idBia, "Flor", "Braço", true],
  ] as const) {
    const id = (
      await contas.db.query(
        "INSERT INTO portfolio_item (id, artist_id, titulo, imagem_url, regiao_corpo, ordem) VALUES (gen_random_uuid(), $1, $2, 'portfolio/foto.png', $3, 1) RETURNING id",
        [artista, titulo, regiao],
      )
    ).rows[0].id;
    if (estilo)
      await contas.db.query("INSERT INTO portfolio_item_style VALUES ($1, $2)", [id, floral]);
  }
}, 120_000);
afterAll(async () => {
  await contas?.db.end();
});

it("RF17/RN01: consulta sem sessão combina artista, estilo e região por interseção", async () => {
  const { listarGaleria } = await import("../../src/modules/portfolio");
  const resultado = await listarGaleria({ artista: contas.idAna, estilo: floral, regiao: "Braço" });
  expect(resultado.trabalhos.map((t) => t.titulo)).toEqual(["Rosa"]);
  expect(resultado.trabalhos[0]).toMatchObject({
    artistaNome: "Ana",
    estilos: ["Floral"],
    imagem: "portfolio/foto.png",
    textoAlternativo: "Rosa — Ana · Braço",
  });
  expect(resultado.artistas.map((a) => a.nome)).toEqual(["Ana", "Bia"]);
  expect(resultado.regioes).toEqual(["Braço", "Perna"]);
});
it("RF17: filtros isolados e pares, ausência de resultados e parâmetros inválidos", async () => {
  const { listarGaleria } = await import("../../src/modules/portfolio");
  for (const [filtros, titulos] of [
    [{}, ["Flor", "Lua", "Lírio", "Rosa"]],
    [{ artista: contas.idBia }, ["Flor"]],
    [{ estilo: floral }, ["Flor", "Lírio", "Rosa"]],
    [{ regiao: "Perna" }, ["Lírio"]],
    [{ artista: contas.idAna, estilo: floral }, ["Lírio", "Rosa"]],
    [{ estilo: floral, regiao: "Braço" }, ["Flor", "Rosa"]],
    [{ artista: contas.idBia, regiao: "Perna" }, []],
    [
      { artista: "inválido", estilo: [floral], regiao: "x".repeat(101) },
      ["Flor", "Lua", "Lírio", "Rosa"],
    ],
    [{ artista: "00000000-0000-4000-8000-000000000036" }, []],
  ] as const) {
    expect((await listarGaleria(filtros)).trabalhos.map((t) => t.titulo).sort()).toEqual(titulos);
  }
});
it("RF17: respeita destaque e ordem; não expõe portfólio de conta excluída", async () => {
  const { listarGaleria } = await import("../../src/modules/portfolio");
  await contas.db.query("UPDATE portfolio_item SET destaque = true WHERE titulo = 'Rosa'");
  await contas.db.query("UPDATE portfolio_item SET ordem = 2 WHERE titulo = 'Lua'");
  expect((await listarGaleria({ artista: contas.idAna })).trabalhos.map((t) => t.titulo)).toEqual([
    "Rosa",
    "Lírio",
    "Lua",
  ]);
  await contas.db.query(
    'UPDATE "user" SET excluido_em = now() WHERE id = (SELECT user_id FROM artist WHERE id = $1)',
    [contas.idBia],
  );
  const galeria = await listarGaleria({ artista: contas.idBia });
  expect(galeria.trabalhos).toEqual([]);
  expect(galeria.artistas.map((a) => a.nome)).toEqual(["Ana"]);
});
