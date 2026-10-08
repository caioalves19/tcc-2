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
