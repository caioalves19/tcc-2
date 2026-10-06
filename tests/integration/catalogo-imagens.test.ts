import sharp from "sharp";
import type { Client } from "pg";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import type { Armazenamento } from "../../src/modules/media";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let cliente: Headers;
let idAna: string;
let idBia: string;

beforeAll(async () => {
  ({ db, admin, cliente, idAna, idBia } = await prepararContas("kolo_pbi18_imagens_test"));
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const chave = (artista: string, n: number) =>
  `obras/${artista}/00000000-0000-4000-8000-${String(n).padStart(12, "0")}.png`;
const miniatura = (original: string) => original.replace(/\.png$/, "_thumb.webp");

// R2 simulado com imagens PNG de verdade, para o processamento decodificar.
async function armazenamentoCom(chaves: string[]) {
  const png = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#0b2d6f" },
  })
    .png()
    .toBuffer();
  const objetos = new Map<string, Buffer>(chaves.map((c) => [c, png]));
  const armazenamento: Armazenamento = {
    obter: vi.fn(async (c: string) => objetos.get(c) ?? null),
    gravar: vi.fn(async (c: string, corpo: Buffer) => void objetos.set(c, corpo)),
    remover: vi.fn(async (c: string) => void objetos.delete(c)),
  };
  return { armazenamento, objetos };
}

async function obraDaAna(slug: string) {
  const { criarObra } = await import("../../src/modules/catalog");
  const criada = await criarObra({ titulo: "Obra", slug, artistaId: idAna, preco: "100" }, admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  return criada.dados.id;
}

async function imagensDa(obraId: string) {
  const { listarObras } = await import("../../src/modules/catalog");
  const lista = await listarObras(admin);
  if (!lista.ok) throw new Error(lista.mensagem);
  return lista.dados.find((obra) => obra.id === obraId)?.imagens ?? [];
}

async function obraComImagens(slug: string, quantidade: number, base: number) {
  const { adicionarImagem } = await import("../../src/modules/catalog");
  const obraId = await obraDaAna(slug);
  const chaves = Array.from({ length: quantidade }, (_, i) => chave(idAna, base + i));
  const r2 = await armazenamentoCom(chaves);
  for (const [i, c] of chaves.entries()) {
    const adicionada = await adicionarImagem(
      { obraId, chave: c, textoAlternativo: `Foto ${i + 1}` },
      admin,
      r2.armazenamento,
    );
    if (!adicionada.ok) throw new Error(adicionada.mensagem);
  }
  return { obraId, chaves, ...r2 };
}

it("RF26/RF27 adiciona imagem processada no servidor; a primeira vira principal", async () => {
  const { adicionarImagem } = await import("../../src/modules/catalog");
  const obraId = await obraDaAna("com-imagens");
  const [primeira, segunda] = [chave(idAna, 1), chave(idAna, 2)];
  const { armazenamento, objetos } = await armazenamentoCom([primeira, segunda]);

  expect(
    await adicionarImagem(
      { obraId, chave: primeira, textoAlternativo: "Tela grafitada vista de frente" },
      admin,
      armazenamento,
    ),
  ).toMatchObject({ ok: true, dados: { chaveMiniatura: miniatura(primeira) } });
  expect(objetos.has(miniatura(primeira))).toBe(true);
  expect(
    await adicionarImagem(
      { obraId, chave: segunda, textoAlternativo: "Detalhe da assinatura" },
      admin,
      armazenamento,
    ),
  ).toMatchObject({ ok: true });

  expect(await imagensDa(obraId)).toMatchObject([
    {
      chave: primeira,
      chaveMiniatura: miniatura(primeira),
      ordem: 1,
      principal: true,
      textoAlternativo: "Tela grafitada vista de frente",
    },
    { chave: segunda, ordem: 2, principal: false, textoAlternativo: "Detalhe da assinatura" },
  ]);
});

it("RF27 só grava chave processada do artista da obra, com texto alternativo, e só para ADMIN", async () => {
  const { adicionarImagem } = await import("../../src/modules/catalog");
  const obraId = await obraDaAna("recusas");
  const daAna = chave(idAna, 10);
  const daBia = chave(idBia, 11);
  const { armazenamento } = await armazenamentoCom([daAna, daBia]);
  const adicionar = (dados: Record<string, unknown>, cabecalhos = admin) =>
    adicionarImagem(
      { obraId, chave: daAna, textoAlternativo: "Foto", ...dados },
      cabecalhos,
      armazenamento,
    );

  expect(await adicionar({ chave: daBia })).toMatchObject({ ok: false, erro: "invalido" });
  expect(await adicionar({ chave: "obras/qualquer.png" })).toMatchObject({ ok: false });
  expect(await adicionar({ chave: chave(idAna, 12) })).toMatchObject({
    ok: false,
    erro: "objeto_inexistente",
  });
  expect(await adicionar({ textoAlternativo: " " })).toMatchObject({ ok: false, erro: "invalido" });
  expect(await adicionar({}, cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await imagensDa(obraId)).toEqual([]);
  expect(armazenamento.gravar).not.toHaveBeenCalled();
});

it("RF26 troca a principal, reordena e edita o texto alternativo sem quebrar a ordem única", async () => {
  const { definirImagemPrincipal, moverImagem, editarTextoAlternativo } =
    await import("../../src/modules/catalog");
  const { obraId, chaves } = await obraComImagens("ordem", 3, 20);
  const [a, b, c] = (await imagensDa(obraId)).map((imagem) => imagem.id);
  if (!a || !b || !c) throw new Error("Imagens não criadas");

  expect(await definirImagemPrincipal(c, admin)).toMatchObject({ ok: true });
  expect(await moverImagem({ imagemId: c, direcao: "antes" }, admin)).toMatchObject({ ok: true });
  expect(await moverImagem({ imagemId: a, direcao: "antes" }, admin)).toMatchObject({ ok: true });
  expect(
    await editarTextoAlternativo({ imagemId: b, textoAlternativo: "Vista lateral" }, admin),
  ).toMatchObject({ ok: true });
  expect(await editarTextoAlternativo({ imagemId: b, textoAlternativo: "" }, admin)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(await definirImagemPrincipal(a, cliente)).toMatchObject({ ok: false, erro: "proibido" });

  expect(await imagensDa(obraId)).toMatchObject([
    { id: a, chave: chaves[0], principal: false },
    { id: c, chave: chaves[2], principal: true },
    { id: b, chave: chaves[1], principal: false, textoAlternativo: "Vista lateral" },
  ]);
});

it("RF26 remove do banco e do R2, passa a principal adiante e protege a última de obra publicada", async () => {
  const { removerImagem, editarObra } = await import("../../src/modules/catalog");
  const { obraId, chaves, armazenamento, objetos } = await obraComImagens("remocao", 2, 30);
  const [primeira, segunda] = await imagensDa(obraId);
  if (!primeira || !segunda) throw new Error("Imagens não criadas");

  expect(await removerImagem(primeira.id, cliente, armazenamento)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await removerImagem(primeira.id, admin, armazenamento)).toMatchObject({ ok: true });
  expect(objetos.has(chaves[0]!)).toBe(false);
  expect(objetos.has(miniatura(chaves[0]!))).toBe(false);
  expect(await imagensDa(obraId)).toMatchObject([{ id: segunda.id, principal: true }]);

  const publicada = await editarObra(
    {
      titulo: "Obra",
      slug: "remocao",
      artistaId: idAna,
      preco: "100",
      id: obraId,
      publicada: true,
    },
    admin,
  );
  expect(publicada).toMatchObject({ ok: true });
  expect(await removerImagem(segunda.id, admin, armazenamento)).toMatchObject({
    ok: false,
    erro: "ultima_imagem",
  });
  expect(await imagensDa(obraId)).toHaveLength(1);
  expect(objetos.has(chaves[1]!)).toBe(true);
});
