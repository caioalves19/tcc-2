import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { comCookie, prepararContas, SENHA } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;

beforeAll(async () => {
  ({ db, admin, idAna } = await prepararContas("kolo_pbi26_checkout_test"));
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const ENDERECO = {
  destinatario: "Lucas Silveira",
  cep: "01327000",
  logradouro: "Rua Treze de Maio",
  numero: "450",
  complemento: "Apto 82",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "sp",
};

// Cada teste usa um cliente novo, para um carrinho não vazar no outro.
async function novoCliente(email: string, comEndereco = true) {
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const { salvarEndereco } = await import("../../src/lib/endereco");
  const cadastro = await cadastrarCliente({
    nome: "Cliente",
    email,
    telefone: "11987654321",
    senha: SENHA,
  });
  if (!cadastro.ok) throw new Error("Falha ao cadastrar cliente");
  const cabecalhos = await comCookie(cadastro.token);
  if (comEndereco) {
    const salvo = await salvarEndereco(ENDERECO, cabecalhos);
    if (!salvo.ok) throw new Error("Falha ao salvar endereço");
  }
  return { cabecalhos, tokenVisitante: null };
}

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

async function noCarrinho(
  contexto: { cabecalhos: Headers; tokenVisitante: null },
  itens: [string, number][],
) {
  const { adicionarAoCarrinho } = await import("../../src/modules/orders");
  for (const [obraId, quantidade] of itens) {
    const adicionado = await adicionarAoCarrinho({ obraId, quantidade }, contexto);
    if (!adicionado.ok) throw new Error(adicionado.mensagem);
  }
}

it("RF12 o resumo traz itens, endereço, retirada sem custo e total calculados no servidor", async () => {
  const { resumoCheckout } = await import("../../src/modules/orders");
  const unica = await obraPublicada("resumo-unica", "4.800,00", 1);
  const tiragem = await obraPublicada("resumo-tiragem", "99,90", 3);
  const lucas = await novoCliente("lucas@pbi26.test");
  await noCarrinho(lucas, [
    [unica, 1],
    [tiragem, 2],
  ]);

  expect(await resumoCheckout(lucas)).toMatchObject({
    ok: true,
    dados: {
      itens: [
        { obraId: unica, titulo: "Obra resumo-unica", quantidade: 1, precoCentavos: 480000 },
        { obraId: tiragem, titulo: "Obra resumo-tiragem", quantidade: 2, precoCentavos: 9990 },
      ],
      endereco: {
        destinatario: "Lucas Silveira",
        cep: "01327-000",
        logradouro: "Rua Treze de Maio",
        numero: "450",
        complemento: "Apto 82",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
      },
      modalidade: "RETIRADA",
      subtotalCentavos: 499980,
      freteCentavos: 0,
      totalCentavos: 499980,
    },
  });
});

async function sessaoDe(email: string): Promise<string> {
  const { rows } = await db.query(
    'SELECT s.id FROM session s JOIN "user" u ON u.id = s.user_id WHERE u.email = $1',
    [email],
  );
  return rows[0].id;
}

it("RF12/RN01/RN02 recusa visitante, carrinho vazio, obra indisponível ou presa e endereço ausente ou inválido", async () => {
  const { resumoCheckout, reservarItens } = await import("../../src/modules/orders");
  const visitante = { cabecalhos: new Headers(), tokenVisitante: null };
  expect(await resumoCheckout(visitante)).toMatchObject({ ok: false, erro: "nao_autenticado" });

  const vazio = await novoCliente("vazio@pbi26.test");
  expect(await resumoCheckout(vazio)).toMatchObject({ ok: false, erro: "carrinho_vazio" });

  // Obras que estavam à venda quando entraram no carrinho e deixaram de estar.
  const despublicada = await obraPublicada("bloqueio-rascunho", "100,00", 1);
  const arquivada = await obraPublicada("bloqueio-arquivada", "100,00", 1);
  const disputada = await obraPublicada("bloqueio-disputada", "100,00", 1);
  const livre = await obraPublicada("bloqueio-livre", "100,00", 2);
  const bruno = await novoCliente("bruno@pbi26.test");
  await noCarrinho(bruno, [
    [despublicada, 1],
    [arquivada, 1],
    [disputada, 1],
    [livre, 2],
  ]);
  await db.query("UPDATE artwork SET situacao = 'RASCUNHO' WHERE id = $1", [despublicada]);
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);
  await novoCliente("carla@pbi26.test");
  expect(
    await reservarItens(await sessaoDe("carla@pbi26.test"), [{ obraId: disputada, quantidade: 1 }]),
  ).toMatchObject({ ok: true });

  const resumo = await resumoCheckout(bruno);
  expect(resumo).toMatchObject({ ok: false, erro: "indisponivel" });
  if (resumo.ok || resumo.erro !== "indisponivel") throw new Error("esperado indisponivel");
  expect([...resumo.obras].sort()).toEqual([despublicada, arquivada, disputada].sort());

  const semEndereco = await novoCliente("sem-endereco@pbi26.test", false);
  await noCarrinho(semEndereco, [[livre, 1]]);
  expect(await resumoCheckout(semEndereco)).toMatchObject({ ok: false, erro: "sem_endereco" });

  const enderecoRuim = await novoCliente("endereco-ruim@pbi26.test");
  await noCarrinho(enderecoRuim, [[livre, 1]]);
  await db.query(
    "UPDATE address SET cep = '123' WHERE user_id = (SELECT id FROM \"user\" WHERE email = $1)",
    ["endereco-ruim@pbi26.test"],
  );
  expect(await resumoCheckout(enderecoRuim)).toMatchObject({ ok: false, erro: "sem_endereco" });
});
