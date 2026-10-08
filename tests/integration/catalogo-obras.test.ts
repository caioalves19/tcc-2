import type { Client } from "pg";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { prepararBancoDeTeste } from "./banco-de-teste";

let db: Client;
let admin: Headers;
let cliente: Headers;
let artistaId: string;
let tagId: string;

beforeAll(async () => {
  db = await prepararBancoDeTeste("kolo_pbi18_obras_test");
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
  admin = await sessao("admin@pbi18.test");
  cliente = await sessao("cliente@pbi18.test");
  await db.query("UPDATE \"user\" SET papel = 'ADMIN' WHERE email = $1", ["admin@pbi18.test"]);

  const { criarArtista, criarTaxonomia } = await import("../../src/modules/artists");
  const artista = await criarArtista(
    {
      modo: "novo",
      nome: "Caio Alves",
      email: "artista@pbi18.test",
      telefone: "11987654321",
      senha: "senha-inicial-123",
      slug: "caio-alves",
      estilos: [],
    },
    admin,
  );
  if (!artista.ok) throw new Error(artista.mensagem);
  artistaId = artista.dados.id;
  const tag = await criarTaxonomia("tags", { nome: "Grafite", slug: "grafite" }, admin);
  if (!tag.ok) throw new Error(tag.mensagem);
  tagId = tag.dados.id;
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const AUSENTE = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const ficha = (extra: Record<string, unknown> = {}) => ({
  titulo: "Metrópole em chamas",
  slug: "metropole-em-chamas",
  artistaId,
  preco: "4.800,00",
  ...extra,
});

it("RF26 só ADMIN cadastra e lista obras, inclusive no servidor", async () => {
  const { criarObra, listarObras } = await import("../../src/modules/catalog");
  expect(await criarObra(ficha(), new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  expect(await criarObra(ficha(), cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await listarObras(cliente)).toMatchObject({ ok: false, erro: "proibido" });
  const { rows } = await db.query("SELECT count(*)::int AS total FROM artwork");
  expect(rows[0].total).toBe(0);
});

it("RF26/RN02/RN07 a obra nasce como rascunho, com estoque 1 e preço em centavos", async () => {
  const { criarObra, listarObras } = await import("../../src/modules/catalog");
  const criada = await criarObra(
    ficha({ tecnica: "Spray sobre tela", ano: "2024", tags: [tagId] }),
    admin,
  );
  if (!criada.ok) throw new Error(criada.mensagem);
  const { rows } = await db.query(
    "SELECT situacao, quantidade_estoque, preco_centavos, destaque FROM artwork WHERE id = $1",
    [criada.dados.id],
  );
  expect(rows[0]).toEqual({
    situacao: "RASCUNHO",
    quantidade_estoque: 1,
    preco_centavos: 480000,
    destaque: false,
  });
  expect(await listarObras(admin)).toMatchObject({
    ok: true,
    dados: [
      {
        id: criada.dados.id,
        titulo: "Metrópole em chamas",
        slug: "metropole-em-chamas",
        artistaId,
        artistaNome: "Caio Alves",
        tecnica: "Spray sobre tela",
        ano: 2024,
        precoCentavos: 480000,
        estoque: 1,
        situacao: "RASCUNHO",
        destaque: false,
        tags: [tagId],
      },
    ],
  });
});

it("RF26 recusa artista ou tag inexistente, slug repetido e ficha inválida", async () => {
  const { criarObra } = await import("../../src/modules/catalog");
  expect(await criarObra(ficha({ slug: "outra", artistaId: AUSENTE }), admin)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(await criarObra(ficha({ slug: "outra", tags: [AUSENTE] }), admin)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(await criarObra(ficha(), admin)).toMatchObject({ ok: false, erro: "duplicado" });
  expect(await criarObra(ficha({ slug: "outra", preco: "abc" }), admin)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  const { rows } = await db.query("SELECT count(*)::int AS total FROM artwork");
  expect(rows[0].total).toBe(1);
});

async function obraNova(slug: string) {
  const { criarObra } = await import("../../src/modules/catalog");
  const criada = await criarObra(ficha({ slug }), admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  return criada.dados.id;
}
async function situacao(id: string) {
  const { rows } = await db.query(
    "SELECT situacao, titulo, quantidade_estoque, destaque FROM artwork WHERE id = $1",
    [id],
  );
  return rows[0];
}
async function comImagem(id: string) {
  await db.query(
    "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, 1, true, 'Foto')",
    [id, `obras/${artistaId}/${id}.png`],
  );
}

it("RF26/RN11 publicar exige imagem, e a situação sai do estoque", async () => {
  const { editarObra } = await import("../../src/modules/catalog");
  const id = await obraNova("edicao");
  const publicar = (extra: Record<string, unknown> = {}) =>
    editarObra({ ...ficha({ slug: "edicao", ...extra }), id, publicada: true }, admin);

  expect(await publicar()).toMatchObject({ ok: false, erro: "sem_imagem" });
  expect(await situacao(id)).toMatchObject({ situacao: "RASCUNHO" });

  await comImagem(id);
  expect(
    await publicar({ titulo: "Novo título", estoque: "2", destaque: true, tags: [tagId] }),
  ).toMatchObject({ ok: true });
  expect(await situacao(id)).toEqual({
    situacao: "DISPONIVEL",
    titulo: "Novo título",
    quantidade_estoque: 2,
    destaque: true,
  });
  const { rows } = await db.query("SELECT tag_id FROM artwork_tag WHERE artwork_id = $1", [id]);
  expect(rows).toEqual([{ tag_id: tagId }]);

  expect(await publicar({ estoque: "0" })).toMatchObject({ ok: true });
  expect(await situacao(id)).toMatchObject({ situacao: "ESGOTADA", quantidade_estoque: 0 });

  expect(
    await editarObra({ ...ficha({ slug: "edicao", estoque: "5" }), id, publicada: false }, admin),
  ).toMatchObject({ ok: true });
  expect(await situacao(id)).toMatchObject({ situacao: "RASCUNHO", quantidade_estoque: 5 });
});

it("RF26 não edita obra inexistente, slug de outra obra nem sem ser ADMIN", async () => {
  const { editarObra } = await import("../../src/modules/catalog");
  const id = await obraNova("intocada");
  const editar = (extra: Record<string, unknown>, cabecalhos = admin) =>
    editarObra({ ...ficha({ slug: "intocada" }), id, publicada: false, ...extra }, cabecalhos);

  expect(await editar({ id: AUSENTE })).toMatchObject({ ok: false, erro: "nao_encontrado" });
  expect(await editar({ slug: "metropole-em-chamas" })).toMatchObject({
    ok: false,
    erro: "duplicado",
  });
  expect(await editar({ titulo: "Mudou" }, cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await editar({ titulo: "Mesmo slug, título novo" })).toMatchObject({ ok: true });
  expect(await situacao(id)).toMatchObject({ titulo: "Mesmo slug, título novo" });
});

it("RF26 exclui de vez obra sem vínculo e apaga as imagens do R2", async () => {
  const { excluirObra, listarObras } = await import("../../src/modules/catalog");
  const id = await obraNova("sem-vinculo");
  await comImagem(id);
  const armazenamento = { obter: vi.fn(), gravar: vi.fn(), remover: vi.fn(async () => {}) };

  expect(await excluirObra(id, cliente, armazenamento)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await excluirObra(id, admin, armazenamento)).toEqual({
    ok: true,
    dados: { modo: "apagada" },
  });
  const { rows } = await db.query("SELECT count(*)::int AS total FROM artwork WHERE id = $1", [id]);
  expect(rows[0].total).toBe(0);
  expect(armazenamento.remover).toHaveBeenCalledWith(`obras/${artistaId}/${id}.png`);
  expect(armazenamento.remover).toHaveBeenCalledWith(`obras/${artistaId}/${id}_thumb.webp`);
  const lista = await listarObras(admin);
  expect(lista.ok && lista.dados.some((obra) => obra.id === id)).toBe(false);
  expect(await excluirObra(id, admin, armazenamento)).toMatchObject({
    ok: false,
    erro: "nao_encontrado",
  });
});

it("RF26 com carrinho ou pedido, faz exclusão lógica e preserva o histórico", async () => {
  const { excluirObra, listarObras } = await import("../../src/modules/catalog");
  const noCarrinho = await obraNova("no-carrinho");
  const vendida = await obraNova("vendida");
  const { rows: usuarios } = await db.query('SELECT id FROM "user" WHERE email = $1', [
    "cliente@pbi18.test",
  ]);
  const clienteId = usuarios[0].id;
  await db.query(
    "INSERT INTO cart (id, user_id, atualizado_em) VALUES (gen_random_uuid(), $1, now())",
    [clienteId],
  );
  await db.query(
    "INSERT INTO cart_item (id, cart_id, artwork_id, quantidade) SELECT gen_random_uuid(), id, $1, 1 FROM cart WHERE user_id = $2",
    [noCarrinho, clienteId],
  );
  await db.query(
    `INSERT INTO "order" (id, numero, user_id, modalidade_entrega, subtotal_centavos, total_centavos, endereco_copia)
     VALUES (gen_random_uuid(), 'KOLO-0001', $1, 'RETIRADA', 480000, 480000, '{}')`,
    [clienteId],
  );
  await db.query(
    `INSERT INTO order_item (id, order_id, artwork_id, titulo_copia, preco_centavos_copia, quantidade)
     SELECT gen_random_uuid(), id, $1, 'Metrópole em chamas', 480000, 1 FROM "order" WHERE numero = 'KOLO-0001'`,
    [vendida],
  );
  const armazenamento = { obter: vi.fn(), gravar: vi.fn(), remover: vi.fn(async () => {}) };

  for (const id of [noCarrinho, vendida]) {
    expect(await excluirObra(id, admin, armazenamento)).toEqual({
      ok: true,
      dados: { modo: "arquivada" },
    });
    const { rows } = await db.query(
      "SELECT excluido_em IS NOT NULL AS excluida, situacao, destaque FROM artwork WHERE id = $1",
      [id],
    );
    expect(rows[0]).toEqual({ excluida: true, situacao: "RASCUNHO", destaque: false });
  }
  expect(armazenamento.remover).not.toHaveBeenCalled();
  const { rows: itens } = await db.query("SELECT count(*)::int AS total FROM order_item");
  expect(itens[0].total).toBe(1);
  const lista = await listarObras(admin);
  expect(lista.ok && lista.dados.filter((obra) => [noCarrinho, vendida].includes(obra.id))).toEqual(
    [],
  );
});
