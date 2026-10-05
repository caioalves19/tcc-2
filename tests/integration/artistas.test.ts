import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararBancoDeTeste } from "./banco-de-teste";

let db: Client;
let admin: Headers;
let cliente: Headers;
beforeAll(async () => {
  db = await prepararBancoDeTeste("kolo_pbi16_test");
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const { makeSignature } = await import("better-auth/crypto");
  async function sessao(email: string) {
    const result = await cadastrarCliente({
      nome: "Pessoa",
      email,
      telefone: "11987654321",
      senha: "senha-inicial-123",
    });
    if (!result.ok) throw new Error("Falha ao preparar usuário");
    const assinatura = await makeSignature(result.token, process.env.BETTER_AUTH_SECRET ?? "");
    return new Headers({
      cookie: `better-auth.session_token=${encodeURIComponent(`${result.token}.${assinatura}`)}`,
    });
  }
  admin = await sessao("admin@pbi16.test");
  cliente = await sessao("cliente@pbi16.test");
  await db.query("UPDATE \"user\" SET papel = 'ADMIN' WHERE email = $1", ["admin@pbi16.test"]);
}, 120_000);
afterAll(async () => {
  await db?.end();
});

it("RF28 permite ADMIN criar estilo, rejeita visitante/CLIENTE e trata duplicidade", async () => {
  const { criarTaxonomia, listarTaxonomias } = await import("../../src/modules/artists");
  const dados = { nome: "Aquarela", slug: "aquarela", descricao: "Pintura fluida" };
  expect(await criarTaxonomia("estilos", dados, new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  expect(await criarTaxonomia("estilos", dados, cliente)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await listarTaxonomias("estilos", cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await criarTaxonomia("estilos", dados, admin)).toMatchObject({
    ok: true,
    dados: { nome: "Aquarela", slug: "aquarela", descricao: "Pintura fluida" },
  });
  expect(await criarTaxonomia("estilos", dados, admin)).toMatchObject({
    ok: false,
    erro: "duplicado",
  });
  expect(await criarTaxonomia("tags", { nome: "", slug: "invalido" }, admin)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(await listarTaxonomias("estilos", admin)).toMatchObject({
    ok: true,
    dados: [{ nome: "Aquarela" }],
  });
});

it("RF28 edita e exclui estilos e tags livres, validando id e duplicidade", async () => {
  const { criarTaxonomia, listarTaxonomias, editarTaxonomia, excluirTaxonomia } =
    await import("../../src/modules/artists");
  for (const tipo of ["estilos", "tags"] as const) {
    const criado = await criarTaxonomia(tipo, { nome: "Abstrato", slug: "abstrato" }, admin);
    if (!criado.ok) throw new Error(criado.mensagem);
    expect(
      await editarTaxonomia(
        tipo,
        criado.dados.id,
        { nome: "Abstrato novo", slug: "abstrato-novo", descricao: "Atualizado" },
        admin,
      ),
    ).toMatchObject({ ok: true });
    expect(await listarTaxonomias(tipo, admin)).toMatchObject({
      ok: true,
      dados: expect.arrayContaining([
        {
          id: criado.dados.id,
          nome: "Abstrato novo",
          slug: "abstrato-novo",
          descricao: tipo === "estilos" ? "Atualizado" : null,
        },
      ]),
    });
    expect(await excluirTaxonomia(tipo, criado.dados.id, cliente)).toMatchObject({
      ok: false,
      erro: "proibido",
    });
    expect(await excluirTaxonomia(tipo, "id-invalido", admin)).toMatchObject({
      ok: false,
      erro: "invalido",
    });
    expect(await excluirTaxonomia(tipo, criado.dados.id, admin)).toMatchObject({ ok: true });
    expect(await excluirTaxonomia(tipo, criado.dados.id, admin)).toMatchObject({
      ok: false,
      erro: "nao_encontrado",
    });
  }
});

it("RF28 cria conta ARTISTA, credencial compatível e perfil atomicamente sem trocar sessão ADMIN", async () => {
  const { criarArtista, listarArtistas, listarTaxonomias } =
    await import("../../src/modules/artists");
  const { abrirSessao, sessaoDaRequisicao } = await import("../../src/lib/auth");
  const estilos = await listarTaxonomias("estilos", admin);
  if (!estilos.ok || !estilos.dados[0]) throw new Error("estilo ausente");
  const entrada = {
    modo: "novo",
    nome: "Ana",
    email: "ana@pbi16.test",
    telefone: "11987654321",
    senha: "senha-inicial-123",
    slug: "ana",
    estilos: [estilos.dados[0].id],
  };
  expect(await criarArtista(entrada, cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await criarArtista(entrada, admin)).toMatchObject({ ok: true });
  expect(await listarArtistas(admin)).toMatchObject({
    ok: true,
    dados: [
      expect.objectContaining({
        nome: "Ana",
        email: "ana@pbi16.test",
        slug: "ana",
        estilos: [estilos.dados[0].id],
      }),
    ],
  });
  const conta = await db.query(
    'SELECT u.papel, a.senha_hash FROM "user" u JOIN account a ON a.user_id = u.id WHERE u.email = $1',
    [entrada.email],
  );
  expect(conta.rows[0].papel).toBe("ARTISTA");
  expect(conta.rows[0].senha_hash).not.toBe(entrada.senha);
  const sessao = await abrirSessao({ email: entrada.email, senha: entrada.senha });
  expect(sessao.token).toBeTruthy();
  expect(await sessaoDaRequisicao(admin)).toMatchObject({ papel: "ADMIN" });
  expect(await criarArtista({ ...entrada, email: "rollback@pbi16.test" }, admin)).toMatchObject({
    ok: false,
    erro: "duplicado",
  });
  expect(
    (await db.query('SELECT id FROM "user" WHERE email = $1', ["rollback@pbi16.test"])).rows,
  ).toEqual([]);
  expect(await criarArtista({ ...entrada, slug: "outro-slug" }, admin)).toMatchObject({
    ok: false,
    erro: "duplicado",
  });
});

it("RF28 vincula conta existente, promove CLIENTE e rejeita ADMIN, vínculo repetido e estilos inexistentes", async () => {
  const { criarArtista, listarContasDisponiveis } = await import("../../src/modules/artists");
  const userId = (await db.query('SELECT id FROM "user" WHERE email = $1', ["cliente@pbi16.test"]))
    .rows[0].id as string;
  expect(await listarContasDisponiveis(cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await listarContasDisponiveis(admin)).toMatchObject({
    ok: true,
    dados: [expect.objectContaining({ id: userId, email: "cliente@pbi16.test" })],
  });
  expect(
    await criarArtista(
      {
        modo: "existente",
        userId,
        slug: "conta-vinculada",
        estilos: ["00000000-0000-4000-8000-000000000001"],
      },
      admin,
    ),
  ).toMatchObject({ ok: false, erro: "invalido" });
  expect((await db.query('SELECT papel FROM "user" WHERE id = $1', [userId])).rows[0].papel).toBe(
    "CLIENTE",
  );
  expect(
    await criarArtista({ modo: "existente", userId, slug: "conta-vinculada", estilos: [] }, admin),
  ).toMatchObject({ ok: true });
  expect((await db.query('SELECT papel FROM "user" WHERE id = $1', [userId])).rows[0].papel).toBe(
    "ARTISTA",
  );
  expect(
    await criarArtista({ modo: "existente", userId, slug: "duplicado", estilos: [] }, admin),
  ).toMatchObject({ ok: false, erro: "duplicado" });
  const adminId = (await db.query('SELECT id FROM "user" WHERE email = $1', ["admin@pbi16.test"]))
    .rows[0].id as string;
  expect(
    await criarArtista({ modo: "existente", userId: adminId, slug: "admin", estilos: [] }, admin),
  ).toMatchObject({ ok: false, erro: "invalido" });
  expect((await db.query('SELECT papel FROM "user" WHERE id = $1', [adminId])).rows[0].papel).toBe(
    "ADMIN",
  );
  expect(await listarContasDisponiveis(admin)).toMatchObject({ ok: true, dados: [] });
});

it("RF28 edita artista e estilos; impede exclusões vinculadas e preserva conta ao excluir perfil livre", async () => {
  const { listarArtistas, editarArtista, excluirArtista, excluirTaxonomia, criarTaxonomia } =
    await import("../../src/modules/artists");
  const artistas = await listarArtistas(admin);
  if (!artistas.ok) throw new Error("listagem falhou");
  const ana = artistas.dados.find((a) => a.slug === "ana");
  if (!ana) throw new Error("artista ausente");
  const estiloId = ana.estilos[0];
  expect(await excluirTaxonomia("estilos", estiloId, admin)).toMatchObject({
    ok: false,
    erro: "vinculado",
  });
  expect(
    await editarArtista(
      {
        id: ana.id,
        nome: "Ana Silva",
        telefone: "21987654321",
        slug: "ana-silva",
        bio: "Artista visual",
        avatarUrl: "",
        instagram: "@ana.silva",
        estilos: [],
      },
      admin,
    ),
  ).toMatchObject({ ok: true });
  expect(await listarArtistas(admin)).toMatchObject({
    ok: true,
    dados: expect.arrayContaining([
      expect.objectContaining({
        nome: "Ana Silva",
        slug: "ana-silva",
        instagram: "ana.silva",
        estilos: [],
      }),
    ]),
  });
  expect(await excluirTaxonomia("estilos", estiloId, admin)).toMatchObject({ ok: true });
  const obra = await db.query(
    "INSERT INTO artwork (id, artist_id, titulo, slug, preco_centavos, quantidade_estoque, situacao, destaque) VALUES (gen_random_uuid(), $1, 'Obra teste', 'obra-teste', 1000, 1, 'RASCUNHO', false) RETURNING id",
    [ana.id],
  );
  expect(await excluirArtista(ana.id, admin)).toMatchObject({ ok: false, erro: "vinculado" });
  const tag = await criarTaxonomia("tags", { nome: "Urbana", slug: "urbana" }, admin);
  if (!tag.ok) throw new Error("tag ausente");
  await db.query("INSERT INTO artwork_tag (artwork_id, tag_id) VALUES ($1, $2)", [
    obra.rows[0].id,
    tag.dados.id,
  ]);
  expect(await excluirTaxonomia("tags", tag.dados.id, admin)).toMatchObject({
    ok: false,
    erro: "vinculado",
  });
  await db.query("DELETE FROM artwork WHERE id = $1", [obra.rows[0].id]);
  expect(await excluirTaxonomia("tags", tag.dados.id, admin)).toMatchObject({ ok: true });
  await db.query(
    "INSERT INTO portfolio_item (id, artist_id, titulo, imagem_url, destaque, ordem) VALUES (gen_random_uuid(), $1, 'Trabalho', 'https://example.com/foto.webp', false, 0)",
    [ana.id],
  );
  expect(await excluirArtista(ana.id, admin)).toMatchObject({ ok: false, erro: "vinculado" });
  expect(
    (await db.query("SELECT id FROM portfolio_item WHERE artist_id = $1", [ana.id])).rowCount,
  ).toBe(1);
  await db.query("DELETE FROM portfolio_item WHERE artist_id = $1", [ana.id]);
  await db.query(
    "INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, situacao, inicia_em, termina_em) VALUES (gen_random_uuid(), 'PBI16', 'Contato', '11987654321', $1, 'AGENDADO', '2026-10-10T12:00:00Z', '2026-10-10T13:00:00Z')",
    [ana.id],
  );
  expect(await excluirArtista(ana.id, admin)).toMatchObject({ ok: false, erro: "vinculado" });
  await db.query("DELETE FROM appointment WHERE artist_id = $1", [ana.id]);
  expect(await excluirArtista(ana.id, cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await excluirArtista(ana.id, admin)).toMatchObject({ ok: true });
  expect(
    (await db.query('SELECT nome, papel FROM "user" WHERE id = $1', [ana.userId])).rows,
  ).toEqual([{ nome: "Ana Silva", papel: "CLIENTE" }]);
  expect((await db.query("SELECT id FROM account WHERE user_id = $1", [ana.userId])).rowCount).toBe(
    1,
  );
  expect(await excluirArtista(ana.id, admin)).toMatchObject({ ok: false, erro: "nao_encontrado" });
});

it("RF28 todas as operações negam visitante, ARTISTA, sessão revogada e ADMIN inativo", async () => {
  const api = await import("../../src/modules/artists");
  const id = "00000000-0000-4000-8000-000000000003";
  const operacoes = [
    (h: Headers) => api.verificarAcessoAdmin(h),
    (h: Headers) => api.listarArtistas(h),
    (h: Headers) => api.listarContasDisponiveis(h),
    (h: Headers) => api.listarTaxonomias("tags", h),
    (h: Headers) => api.criarArtista(null, h),
    (h: Headers) => api.editarArtista(null, h),
    (h: Headers) => api.excluirArtista(id, h),
    (h: Headers) => api.criarTaxonomia("tags", null, h),
    (h: Headers) => api.editarTaxonomia("tags", id, null, h),
    (h: Headers) => api.excluirTaxonomia("tags", id, h),
  ];
  for (const executar of operacoes) {
    expect(await executar(new Headers())).toMatchObject({ ok: false, erro: "nao_autenticado" });
    expect(await executar(cliente)).toMatchObject({ ok: false, erro: "proibido" });
  }
  await db.query("UPDATE \"user\" SET situacao = 'INATIVO' WHERE email = $1", ["admin@pbi16.test"]);
  for (const executar of operacoes)
    expect(await executar(admin)).toMatchObject({ ok: false, erro: "proibido" });
  await db.query("UPDATE \"user\" SET situacao = 'ATIVO' WHERE email = $1", ["admin@pbi16.test"]);
  await db.query('DELETE FROM session WHERE user_id = (SELECT id FROM "user" WHERE email = $1)', [
    "admin@pbi16.test",
  ]);
  for (const executar of operacoes)
    expect(await executar(admin)).toMatchObject({ ok: false, erro: "nao_autenticado" });
});
