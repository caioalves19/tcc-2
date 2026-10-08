import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;
let idBia: string;

beforeAll(async () => {
  ({ db, admin, idAna, idBia } = await prepararContas("kolo_pbi20_obra_publica_test"));
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

it("RN11/RN01 esgotada continua visível como indisponível; rascunho, arquivada e inexistente não existem para o público", async () => {
  const { lerObraPublica } = await import("../../src/modules/catalog");
  const imagem = [{ chave: "obras/ana/x.png", alt: "Foto", principal: true }];
  await cadastrar(
    { titulo: "Muralha líquida", slug: "muralha-liquida", preco: "3.500,00", estoque: "0" },
    imagem,
  );
  await cadastrar({ titulo: "Esboço", slug: "esboco-rascunho", preco: "100,00" }, imagem, false);
  const arquivada = await cadastrar(
    { titulo: "Arquivada", slug: "obra-arquivada", preco: "100,00" },
    imagem,
  );
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);

  expect(await lerObraPublica("muralha-liquida")).toMatchObject({
    titulo: "Muralha líquida",
    precoCentavos: 350000,
    disponivel: false,
  });
  for (const slug of [
    "esboco-rascunho",
    "obra-arquivada",
    "nao-existe",
    "",
    "../admin",
    "x".repeat(500),
  ])
    expect(await lerObraPublica(slug), slug).toBeNull();
});

it("RF10 outras obras: até 4 do mesmo artista, sem a atual, rascunho ou arquivada; destaque e disponíveis primeiro", async () => {
  const { lerObraPublica, outrasObrasDoArtista } = await import("../../src/modules/catalog");
  const daBia = (titulo: string, slug: string, extra: Partial<Ficha> = {}) =>
    cadastrar({ titulo, slug, preco: "500,00", artistaId: idBia, ...extra }, [
      { chave: `obras/bia/${slug}.png`, alt: `Foto de ${titulo}`, principal: true },
    ]);
  await daBia("Atual", "bia-atual");
  await daBia("Zeta", "bia-zeta", { destaque: true, tecnica: "Spray", dimensoes: "65 × 65 cm" });
  await daBia("Ômega", "bia-omega", { destaque: true, estoque: "0" });
  await daBia("Alfa", "bia-alfa");
  await daBia("Beta", "bia-beta");
  await daBia("Gama", "bia-gama", { estoque: "0" });
  await daBia("Delta", "bia-delta");
  await cadastrar(
    { titulo: "Rascunho da Bia", slug: "bia-rascunho", preco: "500,00", artistaId: idBia },
    [{ chave: "obras/bia/r.png", alt: "Foto", principal: true }],
    false,
  );
  const arquivada = await daBia("Arquivada da Bia", "bia-arquivada");
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);

  const atual = await lerObraPublica("bia-atual");
  if (!atual) throw new Error("Obra atual não encontrada");
  const outras = await outrasObrasDoArtista(atual);
  expect(outras.map((o) => o.slug)).toEqual(["bia-zeta", "bia-omega", "bia-alfa", "bia-beta"]);
  expect(outras[0]).toEqual({
    slug: "bia-zeta",
    titulo: "Zeta",
    tecnica: "Spray",
    dimensoes: "65 × 65 cm",
    precoCentavos: 50000,
    disponivel: true,
    imagem: { chave: "obras/bia/bia-zeta.png", textoAlternativo: "Foto de Zeta" },
  });
  expect(outras[1]).toMatchObject({ slug: "bia-omega", disponivel: false });
  expect((await outrasObrasDoArtista(atual, 10)).map((o) => o.slug)).toEqual([
    "bia-zeta",
    "bia-omega",
    "bia-alfa",
    "bia-beta",
    "bia-delta",
    "bia-gama",
  ]);
});
