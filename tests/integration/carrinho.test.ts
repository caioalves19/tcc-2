import { createHash } from "node:crypto";
import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { comCookie, prepararContas, SENHA } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let cliente: Headers;
let idAna: string;
let ana: Headers;

beforeAll(async () => {
  ({ db, admin, cliente, idAna, ana } = await prepararContas("kolo_pbi24_carrinho_test"));
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const visitante = (tokenVisitante: string | null = null) => ({
  cabecalhos: new Headers(),
  tokenVisitante,
});
const AUSENTE = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

// Obra pronta para venda: cadastrada, com imagem e publicada pelo catálogo do PBI-18.
async function obraPublicada(slug: string, preco: string, estoque: number) {
  const { criarObra, editarObra } = await import("../../src/modules/catalog");
  const ficha = { titulo: `Obra ${slug}`, slug, artistaId: idAna, preco, estoque: String(estoque) };
  const criada = await criarObra(ficha, admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  await db.query(
    "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, 1, true, 'Foto')",
    [criada.dados.id, `obras/${idAna}/${criada.dados.id}.png`],
  );
  const publicada = await editarObra({ ...ficha, id: criada.dados.id, publicada: true }, admin);
  if (!publicada.ok) throw new Error(publicada.mensagem);
  return criada.dados.id;
}

it("RF11 o visitante adiciona, altera e remove, e o servidor calcula o total", async () => {
  const { adicionarAoCarrinho, alterarQuantidade, lerCarrinho, removerDoCarrinho } =
    await import("../../src/modules/orders");
  const unica = await obraPublicada("peca-unica", "4.800,00", 1);
  const tiragem = await obraPublicada("tiragem", "99,90", 3);

  const primeira = await adicionarAoCarrinho({ obraId: unica }, visitante());
  if (!primeira.ok || !primeira.dados.tokenNovo)
    throw new Error("Carrinho do visitante não criado");
  const token = primeira.dados.tokenNovo;
  const { rows } = await db.query("SELECT cookie_token, user_id FROM cart");
  expect(rows).toEqual([
    { cookie_token: createHash("sha256").update(token).digest("hex"), user_id: null },
  ]);

  expect(await adicionarAoCarrinho({ obraId: tiragem, quantidade: 2 }, visitante(token))).toEqual({
    ok: true,
    dados: { tokenNovo: null },
  });
  expect(await lerCarrinho(visitante(token))).toMatchObject({
    ok: true,
    dados: {
      itens: [
        { obraId: unica, quantidade: 1, precoCentavos: 480000, disponivel: true, estoque: 1 },
        { obraId: tiragem, quantidade: 2, precoCentavos: 9990, disponivel: true, estoque: 3 },
      ],
      totalCentavos: 499980,
      unidades: 3,
      indisponiveis: 0,
    },
  });

  expect(
    await alterarQuantidade({ obraId: tiragem, quantidade: 3 }, visitante(token)),
  ).toMatchObject({ ok: true });
  expect(
    await alterarQuantidade({ obraId: tiragem, quantidade: 4 }, visitante(token)),
  ).toMatchObject({ ok: false, erro: "quantidade_invalida" });
  expect(await removerDoCarrinho(unica, visitante(token))).toMatchObject({ ok: true });
  expect(await lerCarrinho(visitante(token))).toMatchObject({
    ok: true,
    dados: { itens: [{ obraId: tiragem, quantidade: 3 }], totalCentavos: 29970, unidades: 3 },
  });
});

it("RF11/RN02 recusa obra indisponível ou inexistente e quantidade inválida, sem reservar estoque", async () => {
  const { adicionarAoCarrinho, lerCarrinho } = await import("../../src/modules/orders");
  const { criarObra } = await import("../../src/modules/catalog");
  const rascunho = await criarObra(
    { titulo: "Rascunho", slug: "rascunho", artistaId: idAna, preco: "10" },
    admin,
  );
  if (!rascunho.ok) throw new Error(rascunho.mensagem);
  const unica = await obraPublicada("so-uma", "150,00", 1);
  const inicio = await adicionarAoCarrinho({ obraId: unica }, visitante());
  if (!inicio.ok || !inicio.dados.tokenNovo) throw new Error("Carrinho não criado");
  const contexto = visitante(inicio.dados.tokenNovo);

  expect(await adicionarAoCarrinho({ obraId: rascunho.dados.id }, contexto)).toMatchObject({
    ok: false,
    erro: "indisponivel",
  });
  expect(await adicionarAoCarrinho({ obraId: AUSENTE }, contexto)).toMatchObject({
    ok: false,
    erro: "indisponivel",
  });
  expect(await adicionarAoCarrinho({ obraId: unica }, contexto)).toMatchObject({
    ok: false,
    erro: "quantidade_invalida",
  });
  expect(await adicionarAoCarrinho({ obraId: unica, quantidade: 0 }, contexto)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(await adicionarAoCarrinho({ obraId: "nao-e-uuid" }, contexto)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(await lerCarrinho(contexto)).toMatchObject({ ok: true, dados: { unidades: 1 } });
  expect(await lerCarrinho(visitante())).toMatchObject({
    ok: true,
    dados: { itens: [], totalCentavos: 0 },
  });

  const { rows } = await db.query(
    "SELECT quantidade_estoque, (SELECT count(*)::int FROM artwork_reservation) AS reservas FROM artwork WHERE id = $1",
    [unica],
  );
  expect(rows[0]).toEqual({ quantidade_estoque: 1, reservas: 0 });
  expect(cliente).toBeDefined();
});

async function novaSessaoDoCliente() {
  const { abrirSessao } = await import("../../src/lib/auth");
  return (await abrirSessao({ email: "cliente@pbi17.test", senha: SENHA })).token;
}

it("RF11 o carrinho da conta vale entre sessões e não aparece para outra pessoa", async () => {
  const { adicionarAoCarrinho, lerCarrinho } = await import("../../src/modules/orders");
  const obra = await obraPublicada("da-conta", "300,00", 2);

  expect(
    await adicionarAoCarrinho({ obraId: obra }, { cabecalhos: cliente, tokenVisitante: null }),
  ).toEqual({ ok: true, dados: { tokenNovo: null } });
  const outraSessao = await comCookie(await novaSessaoDoCliente());
  expect(await lerCarrinho({ cabecalhos: outraSessao, tokenVisitante: null })).toMatchObject({
    ok: true,
    dados: { itens: [{ obraId: obra, quantidade: 1 }], totalCentavos: 30000 },
  });
  expect(await lerCarrinho({ cabecalhos: ana, tokenVisitante: null })).toMatchObject({
    ok: true,
    dados: { itens: [] },
  });
  const { rows } = await db.query(
    "SELECT count(*)::int AS total FROM cart WHERE user_id IS NOT NULL AND cookie_token IS NULL",
  );
  expect(rows[0].total).toBe(1);
});

it("RF11 ao entrar na conta, o carrinho do visitante se junta ao da conta sem perder itens", async () => {
  const { adicionarAoCarrinho, juntarCarrinhos, lerCarrinho } =
    await import("../../src/modules/orders");
  const tiragem = await obraPublicada("juntar-tiragem", "50,00", 3);
  const outra = await obraPublicada("juntar-outra", "80,00", 1);
  const conta = { cabecalhos: cliente, tokenVisitante: null };
  await adicionarAoCarrinho({ obraId: tiragem }, conta);

  const inicio = await adicionarAoCarrinho({ obraId: tiragem, quantidade: 2 }, visitante());
  if (!inicio.ok || !inicio.dados.tokenNovo) throw new Error("Carrinho do visitante não criado");
  const token = inicio.dados.tokenNovo;
  await adicionarAoCarrinho({ obraId: outra }, visitante(token));

  expect(await juntarCarrinhos(await novaSessaoDoCliente(), token)).toMatchObject({ ok: true });
  const lido = await lerCarrinho(conta);
  if (!lido.ok) throw new Error(lido.mensagem);
  const quantidade = (obraId: string) =>
    lido.dados.itens.find((item) => item.obraId === obraId)?.quantidade;
  expect(quantidade(tiragem)).toBe(2);
  expect(quantidade(outra)).toBe(1);

  const { createHash } = await import("node:crypto");
  const { rows } = await db.query(
    "SELECT count(*)::int AS total FROM cart WHERE cookie_token = $1",
    [createHash("sha256").update(token).digest("hex")],
  );
  expect(rows[0].total).toBe(0);
  expect(await juntarCarrinhos(await novaSessaoDoCliente(), token)).toMatchObject({ ok: true });
  expect(await juntarCarrinhos("sessao-que-nao-existe", token)).toMatchObject({ ok: false });
});
