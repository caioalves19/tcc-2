import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { prepararContas, type Contas } from "./contas-pbi17";
import type { Armazenamento } from "../../src/modules/media";

let contas: Contas;
let estilo: string;
beforeAll(async () => {
  contas = await prepararContas("kolo_pbi35_test");
  estilo = (
    await contas.db.query(
      "INSERT INTO tattoo_style (id, nome, slug) VALUES (gen_random_uuid(), 'Floral', 'floral') RETURNING id",
    )
  ).rows[0].id;
  process.env.R2_PUBLIC_URL = "https://imagens.example.test";
}, 120_000);
beforeEach(async () => {
  await contas.db.query("DELETE FROM portfolio_item");
});
afterAll(async () => {
  await contas?.db.end();
});

let numero = 0;
async function foto(artistaId: string) {
  const chave = `portfolio/${artistaId}/00000000-0000-4000-8000-${String(++numero).padStart(12, "0")}.png`;
  const png = await sharp({
    create: { width: 600, height: 400, channels: 3, background: "#123456" },
  })
    .png()
    .toBuffer();
  const objetos = new Map([[chave, png]]);
  const armazenamento: Armazenamento = {
    obter: vi.fn(async (c) => objetos.get(c) ?? null),
    gravar: vi.fn(async (c, b) => {
      objetos.set(c, b);
    }),
    remover: vi.fn(async (c) => {
      objetos.delete(c);
    }),
  };
  return { chave, armazenamento, objetos };
}

async function trabalhoDaAna(titulo = "Rosa no braço") {
  const { criarTrabalho } = await import("../../src/modules/portfolio");
  const imagem = await foto(contas.idAna);
  const criado = await criarTrabalho(
    { artistaId: contas.idAna, titulo, chave: imagem.chave, estilos: [estilo] },
    contas.ana,
    imagem.armazenamento,
  );
  if (!criado.ok) throw new Error(criado.mensagem);
  return criado.dados.id;
}

it("RF19: artista cadastra trabalho com imagem processada, estilo e região persistidos", async () => {
  const { criarTrabalho } = await import("../../src/modules/portfolio");
  const { chave, armazenamento, objetos } = await foto(contas.idAna);
  const criado = await criarTrabalho(
    {
      artistaId: contas.idAna,
      titulo: "Rosa no braço",
      descricao: "Rosa em traço fino",
      regiaoCorpo: "Braço",
      estilos: [estilo],
      chave,
    },
    contas.ana,
    armazenamento,
  );
  expect(criado).toMatchObject({ ok: true });
  if (!criado.ok) throw new Error(criado.mensagem);
  expect(
    (await contas.db.query("SELECT * FROM portfolio_item WHERE id = $1", [criado.dados.id])).rows,
  ).toMatchObject([
    {
      artist_id: contas.idAna,
      titulo: "Rosa no braço",
      imagem_url: chave,
      regiao_corpo: "Braço",
      ordem: 1,
      destaque: false,
    },
  ]);
  expect(
    (
      await contas.db.query(
        "SELECT tattoo_style_id FROM portfolio_item_style WHERE portfolio_item_id = $1",
        [criado.dados.id],
      )
    ).rows,
  ).toEqual([{ tattoo_style_id: estilo }]);
  expect(objetos.has(chave.replace(".png", "_thumb.webp"))).toBe(true);
});

it("RN10: leitura limita o artista ao próprio portfólio e admin seleciona qualquer artista", async () => {
  await trabalhoDaAna();
  const { criarTrabalho, lerPortfolio } = await import("../../src/modules/portfolio");
  const imagem = await foto(contas.idBia);
  expect(
    await criarTrabalho(
      { artistaId: contas.idBia, titulo: "Trabalho da Bia", chave: imagem.chave },
      contas.admin,
      imagem.armazenamento,
    ),
  ).toMatchObject({ ok: true });
  const daAna = await lerPortfolio(contas.ana, contas.idBia);
  expect(daAna).toMatchObject({
    ok: true,
    dados: {
      papel: "ARTISTA",
      artistaId: contas.idAna,
      artistas: [],
      trabalhos: [{ titulo: "Rosa no braço", estilos: [estilo] }],
    },
  });
  if (!daAna.ok) throw new Error(daAna.mensagem);
  expect(daAna.dados.trabalhos).toHaveLength(1);
  expect(daAna.dados.trabalhos[0]?.imagemUrl).toMatch(
    /^https:\/\/imagens.example.test\/portfolio\//,
  );
  const daBia = await lerPortfolio(contas.admin, contas.idBia);
  expect(daBia).toMatchObject({
    ok: true,
    dados: { artistaId: contas.idBia, trabalhos: [{ titulo: "Trabalho da Bia" }] },
  });
  expect(await lerPortfolio(contas.cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await lerPortfolio(new Headers())).toMatchObject({ ok: false, erro: "nao_autenticado" });
});

it("RF19/RN10: edita dados, estilos e destaque; só o dono ou admin alteram o trabalho", async () => {
  await trabalhoDaAna();
  const { editarTrabalho } = await import("../../src/modules/portfolio");
  const trabalho = (
    await contas.db.query("SELECT id FROM portfolio_item WHERE artist_id = $1", [contas.idAna])
  ).rows[0].id;
  const entrada = {
    id: trabalho,
    artistaId: contas.idAna,
    titulo: "Rosa revisada",
    descricao: "",
    regiaoCorpo: "Antebraço",
    estilos: [],
    destaque: true,
  };
  expect(await editarTrabalho(entrada, contas.bia)).toMatchObject({
    ok: false,
    erro: "nao_encontrado",
  });
  expect(await editarTrabalho(entrada, contas.cliente)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await editarTrabalho(entrada, contas.ana)).toMatchObject({ ok: true });
  expect(
    (
      await contas.db.query(
        "SELECT titulo, descricao, regiao_corpo, destaque FROM portfolio_item WHERE id = $1",
        [trabalho],
      )
    ).rows,
  ).toEqual([
    { titulo: "Rosa revisada", descricao: null, regiao_corpo: "Antebraço", destaque: true },
  ]);
  expect(
    (
      await contas.db.query("SELECT * FROM portfolio_item_style WHERE portfolio_item_id = $1", [
        trabalho,
      ])
    ).rows,
  ).toEqual([]);
  expect(
    await editarTrabalho({ ...entrada, titulo: "Ajuste admin", destaque: false }, contas.admin),
  ).toMatchObject({ ok: true });
  expect(await editarTrabalho({ ...entrada, artistaId: contas.idBia }, contas.ana)).toMatchObject({
    ok: false,
  });
});

it("RF19/PBI-17: troca imagem só após processamento e mantém a anterior se o arquivo for inválido", async () => {
  await trabalhoDaAna();
  const { editarTrabalho } = await import("../../src/modules/portfolio");
  const trabalho = (
    await contas.db.query("SELECT id, imagem_url FROM portfolio_item WHERE artist_id = $1", [
      contas.idAna,
    ])
  ).rows[0];
  const nova = await foto(contas.idAna);
  const entrada = {
    id: trabalho.id,
    artistaId: contas.idAna,
    titulo: "Rosa com nova foto",
    estilos: [estilo],
    chave: nova.chave,
  };
  nova.objetos.set(nova.chave, Buffer.from("Isto não é uma imagem"));
  expect(await editarTrabalho(entrada, contas.ana, nova.armazenamento)).toMatchObject({
    ok: false,
  });
  expect(
    (await contas.db.query("SELECT imagem_url FROM portfolio_item WHERE id = $1", [trabalho.id]))
      .rows[0].imagem_url,
  ).toBe(trabalho.imagem_url);
  const valida = await foto(contas.idAna);
  expect(
    await editarTrabalho({ ...entrada, chave: valida.chave }, contas.admin, valida.armazenamento),
  ).toMatchObject({ ok: true });
  expect(
    (await contas.db.query("SELECT imagem_url FROM portfolio_item WHERE id = $1", [trabalho.id]))
      .rows[0].imagem_url,
  ).toBe(valida.chave);
  expect(valida.objetos.has(valida.chave.replace(".png", "_thumb.webp"))).toBe(true);
});

it("RF19: ordena entre vizinhos do mesmo artista, preservando bordas e recusando outro artista", async () => {
  await trabalhoDaAna("Rosa com nova foto");
  const { criarTrabalho, moverTrabalho, lerPortfolio } =
    await import("../../src/modules/portfolio");
  const imagemBia = await foto(contas.idBia);
  expect(
    await criarTrabalho(
      { artistaId: contas.idBia, titulo: "Trabalho Bia", chave: imagemBia.chave },
      contas.admin,
      imagemBia.armazenamento,
    ),
  ).toMatchObject({ ok: true });
  const criados: string[] = [];
  for (const titulo of ["Segundo trabalho", "Terceiro trabalho"]) {
    const imagem = await foto(contas.idAna);
    const criado = await criarTrabalho(
      { artistaId: contas.idAna, titulo, chave: imagem.chave },
      contas.ana,
      imagem.armazenamento,
    );
    if (!criado.ok) throw new Error(criado.mensagem);
    criados.push(criado.dados.id);
  }
  expect(await moverTrabalho({ id: criados[1], direcao: "antes" }, contas.bia)).toMatchObject({
    ok: false,
    erro: "nao_encontrado",
  });
  expect(await moverTrabalho({ id: criados[1], direcao: "antes" }, contas.ana)).toMatchObject({
    ok: true,
  });
  expect(await moverTrabalho({ id: criados[0], direcao: "depois" }, contas.admin)).toMatchObject({
    ok: true,
  });
  const lista = await lerPortfolio(contas.ana);
  if (!lista.ok) throw new Error(lista.mensagem);
  expect(lista.dados.trabalhos.map((t) => t.titulo)).toEqual([
    "Rosa com nova foto",
    "Terceiro trabalho",
    "Segundo trabalho",
  ]);
  expect(lista.dados.trabalhos.map((t) => t.ordem)).toEqual([1, 2, 3]);
  expect(
    (await contas.db.query("SELECT ordem FROM portfolio_item WHERE artist_id = $1", [contas.idBia]))
      .rows,
  ).toEqual([{ ordem: 1 }]);
});

it("RF19/RN10: remove trabalho e vínculos de estilos sem permitir exclusão por outro artista", async () => {
  await trabalhoDaAna();
  const { removerTrabalho } = await import("../../src/modules/portfolio");
  const trabalho = (
    await contas.db.query("SELECT id FROM portfolio_item WHERE artist_id = $1 ORDER BY ordem", [
      contas.idAna,
    ])
  ).rows[0].id;
  expect(await removerTrabalho(trabalho, contas.bia)).toMatchObject({
    ok: false,
    erro: "nao_encontrado",
  });
  expect(await removerTrabalho(trabalho, contas.ana)).toMatchObject({ ok: true });
  expect(
    (await contas.db.query("SELECT * FROM portfolio_item WHERE id = $1", [trabalho])).rows,
  ).toEqual([]);
  expect(
    (
      await contas.db.query("SELECT * FROM portfolio_item_style WHERE portfolio_item_id = $1", [
        trabalho,
      ])
    ).rows,
  ).toEqual([]);
  expect(await removerTrabalho(trabalho, contas.admin)).toMatchObject({
    ok: false,
    erro: "nao_encontrado",
  });
});

it("RN10/PBI-17: recusa cadastro alheio, imagem de outra pasta, arquivo falso e referências inválidas", async () => {
  const { criarTrabalho } = await import("../../src/modules/portfolio");
  const imagem = await foto(contas.idAna);
  const base = { artistaId: contas.idAna, titulo: "Teste de recusas", chave: imagem.chave };
  const total = (await contas.db.query("SELECT count(*) FROM portfolio_item")).rows[0].count;
  expect(await criarTrabalho(base, contas.bia, imagem.armazenamento)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await criarTrabalho(base, contas.cliente, imagem.armazenamento)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await criarTrabalho(base, new Headers(), imagem.armazenamento)).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  for (const alteracao of [
    { artistaId: contas.idBia },
    { chave: imagem.chave.replace("portfolio/", "obras/") },
    { titulo: " " },
    { estilos: ["00000000-0000-4000-8000-999999999999"] },
    { artistaId: "00000000-0000-4000-8000-999999999999" },
  ])
    expect(
      await criarTrabalho({ ...base, ...alteracao }, contas.admin, imagem.armazenamento),
    ).toMatchObject({ ok: false });
  imagem.objetos.set(imagem.chave, Buffer.from("<svg>não aceito</svg>"));
  expect(await criarTrabalho(base, contas.ana, imagem.armazenamento)).toMatchObject({ ok: false });
  expect((await contas.db.query("SELECT count(*) FROM portfolio_item")).rows[0].count).toBe(total);
});

it("RN10: revalida o papel após processamento e recusa conta excluída", async () => {
  const { criarTrabalho, lerPortfolio } = await import("../../src/modules/portfolio");
  const imagem = await foto(contas.idBia);
  imagem.armazenamento.gravar = async () => {
    await contas.db.query("UPDATE \"user\" SET papel = 'CLIENTE' WHERE email = 'bia@pbi17.test'");
  };
  try {
    expect(
      await criarTrabalho(
        { artistaId: contas.idBia, titulo: "Papel revogado", chave: imagem.chave },
        contas.bia,
        imagem.armazenamento,
      ),
    ).toMatchObject({ ok: false, erro: "proibido" });
    expect(
      (await contas.db.query("SELECT id FROM portfolio_item WHERE titulo = 'Papel revogado'")).rows,
    ).toEqual([]);
  } finally {
    await contas.db.query("UPDATE \"user\" SET papel = 'ARTISTA' WHERE email = 'bia@pbi17.test'");
  }
  await contas.db.query("UPDATE \"user\" SET excluido_em = now() WHERE email = 'bia@pbi17.test'");
  try {
    expect(await lerPortfolio(contas.bia)).toMatchObject({ ok: false });
  } finally {
    await contas.db.query("UPDATE \"user\" SET excluido_em = null WHERE email = 'bia@pbi17.test'");
  }
});

it("RF19: operações concorrentes não deixam ordens duplicadas", async () => {
  await trabalhoDaAna();
  const { moverTrabalho, criarTrabalho, lerPortfolio } =
    await import("../../src/modules/portfolio");
  const a = await foto(contas.idAna);
  const b = await foto(contas.idAna);
  const resultados = await Promise.all(
    [a, b].map((f, i) =>
      criarTrabalho(
        { artistaId: contas.idAna, titulo: `Concorrente ${i}`, chave: f.chave },
        contas.ana,
        f.armazenamento,
      ),
    ),
  );
  expect(resultados.some((r) => r.ok)).toBe(true);
  for (const r of resultados) if (!r.ok) expect(r.erro).toBe("concorrencia");
  const lista = await lerPortfolio(contas.ana);
  if (!lista.ok) throw new Error(lista.mensagem);
  const ultimo = lista.dados.trabalhos.at(-1)!;
  const movimentos = await Promise.all(
    [1, 2].map(() => moverTrabalho({ id: ultimo.id, direcao: "antes" }, contas.ana)),
  );
  for (const r of movimentos) if (!r.ok) expect(r.erro).toBe("concorrencia");
  const ordens = (
    await contas.db.query("SELECT ordem FROM portfolio_item WHERE artist_id = $1", [contas.idAna])
  ).rows.map((r) => r.ordem);
  expect(new Set(ordens).size).toBe(ordens.length);
});
