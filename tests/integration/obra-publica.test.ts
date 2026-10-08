import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;

beforeAll(async () => {
  ({ db, admin, idAna } = await prepararContas("kolo_pbi20_obra_publica_test"));
}, 120_000);
afterAll(async () => {
  await db?.end();
});

type Ficha = {
  titulo: string;
  slug: string;
  preco: string;
  estoque?: string;
  descricao?: string;
  tecnica?: string;
  dimensoes?: string;
  ano?: string;
  destaque?: boolean;
  artistaId?: string;
};

// Obra cadastrada pelo catálogo do PBI-18, com as imagens dadas (chave, alt), a principal
// marcada e, se pedido, publicada.
async function cadastrar(
  ficha: Ficha,
  imagens: { chave: string; alt: string; principal?: boolean }[],
  publicar = true,
) {
  const { criarObra, editarObra } = await import("../../src/modules/catalog");
  const completa = { artistaId: idAna, ...ficha };
  const criada = await criarObra(completa, admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  for (const [i, imagem] of imagens.entries())
    await db.query(
      "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)",
      [criada.dados.id, imagem.chave, i + 1, imagem.principal ?? false, imagem.alt],
    );
  if (publicar) {
    const publicada = await editarObra(
      { ...completa, id: criada.dados.id, publicada: true },
      admin,
    );
    if (!publicada.ok) throw new Error(publicada.mensagem);
  }
  return criada.dados.id;
}

it("RF10 a obra publicada aparece com ficha, artista e galeria na ordem cadastrada", async () => {
  const { lerObraPublica } = await import("../../src/modules/catalog");
  const id = await cadastrar(
    {
      titulo: "Metrópole em chamas",
      slug: "metropole-em-chamas",
      preco: "2.850,00",
      descricao: "Camadas de acrílica e spray sobre a Avenida Paulista.",
      tecnica: "Acrílica e spray sobre tela",
      dimensoes: "90 × 70 cm",
      ano: "2024",
    },
    [
      { chave: "obras/ana/frontal.png", alt: "Vista frontal" },
      { chave: "obras/ana/textura.png", alt: "Detalhe da textura", principal: true },
      { chave: "obras/ana/assinatura.png", alt: "Assinatura no verso" },
    ],
  );

  expect(await lerObraPublica("metropole-em-chamas")).toEqual({
    id,
    slug: "metropole-em-chamas",
    titulo: "Metrópole em chamas",
    descricao: "Camadas de acrílica e spray sobre a Avenida Paulista.",
    tecnica: "Acrílica e spray sobre tela",
    dimensoes: "90 × 70 cm",
    ano: 2024,
    precoCentavos: 285000,
    disponivel: true,
    artista: { id: idAna, nome: "Ana", slug: "ana" },
    imagens: [
      { chave: "obras/ana/frontal.png", textoAlternativo: "Vista frontal", principal: false },
      { chave: "obras/ana/textura.png", textoAlternativo: "Detalhe da textura", principal: true },
      {
        chave: "obras/ana/assinatura.png",
        textoAlternativo: "Assinatura no verso",
        principal: false,
      },
    ],
  });
});
