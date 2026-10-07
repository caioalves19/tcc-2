import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao, validar } from "../artists/index";
import type { ResultadoGestao } from "../artists/index";
import { armazenamentoR2, chaveMiniatura, processarImagem } from "../media/index";
import type { Armazenamento } from "../media/index";
import { schemaId } from "./validacao";

// RNF21: toda imagem tem texto alternativo, porque a vitrine o usa no next/image.
const textoAlternativo = z
  .string()
  .trim()
  .min(3, "Descreva a imagem em pelo menos 3 caracteres, para quem usa leitor de tela.")
  .max(200, "Use até 200 caracteres.");
const schemaNovaImagem = z.object({
  obraId: schemaId,
  chave: z.string().max(300),
  textoAlternativo,
});
const schemaMover = z.object({ imagemId: schemaId, direcao: z.enum(["antes", "depois"]) });
const schemaTexto = z.object({ imagemId: schemaId, textoAlternativo });

async function obraAtiva(tx: Prisma.TransactionClient, id: string) {
  const obra = await tx.artwork.findUnique({ where: { id } });
  if (!obra || obra.deletedAt !== null)
    throw new ErroGestao("nao_encontrado", "Obra não encontrada. Atualize a página.");
  return obra;
}

async function imagemDeObraAtiva(tx: Prisma.TransactionClient, id: string) {
  const imagem = await tx.artworkImage.findUnique({ where: { id }, include: { artwork: true } });
  if (!imagem || imagem.artwork.deletedAt !== null)
    throw new ErroGestao("nao_encontrado", "Imagem não encontrada. Atualize a página.");
  return imagem;
}

// Contrato do PBI-17: só entra em artwork_image a chave que o processarImagem aceitou aqui
// no servidor (formato, permissão e arquivo de imagem de verdade), nunca a palavra do navegador.
export async function adicionarImagem(
  entrada: unknown,
  cabecalhos: Headers,
  armazenamento?: Armazenamento,
): Promise<ResultadoGestao<{ id: string; chaveMiniatura: string }>> {
  // 1. A obra existe e a chave é da pasta do artista dela, antes de tocar no R2.
  const conferida = await comoAdmin(cabecalhos, async (tx) => {
    const dados = validar(schemaNovaImagem, entrada);
    const obra = await obraAtiva(tx, dados.obraId);
    if (!dados.chave.startsWith(`obras/${obra.artistId}/`))
      throw new ErroGestao("invalido", "A imagem não é do artista desta obra. Envie de novo.");
    return dados;
  });
  if (!conferida.ok) return conferida;
  // 2. Processa fora da transação: lê o original no R2 e grava a miniatura.
  const processada = await processarImagem(conferida.dados.chave, cabecalhos, armazenamento);
  if (!processada.ok) return processada;
  // 3. Grava no fim da fila; a primeira imagem da obra vira a principal.
  return comoAdmin(cabecalhos, async (tx) => {
    const { obraId, chave, textoAlternativo } = conferida.dados;
    await obraAtiva(tx, obraId);
    const atuais = await tx.artworkImage.aggregate({
      where: { artworkId: obraId },
      _max: { order: true },
      _count: true,
    });
    const imagem = await tx.artworkImage.create({
      data: {
        artworkId: obraId,
        url: chave,
        order: (atuais._max.order ?? 0) + 1,
        primary: atuais._count === 0,
        altText: textoAlternativo,
      },
    });
    return { id: imagem.id, chaveMiniatura: processada.dados.chaveMiniatura };
  });
}

export function definirImagemPrincipal(imagemId: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const imagem = await imagemDeObraAtiva(tx, validar(schemaId, imagemId));
    await tx.artworkImage.updateMany({
      where: { artworkId: imagem.artworkId },
      data: { primary: false },
    });
    await tx.artworkImage.update({ where: { id: imagem.id }, data: { primary: true } });
  });
}

// Troca de lugar com a vizinha. A ordem é única por obra, então passa por -1 no meio.
export function moverImagem(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const { imagemId, direcao } = validar(schemaMover, entrada);
    const imagem = await imagemDeObraAtiva(tx, imagemId);
    const vizinha = await tx.artworkImage.findFirst({
      where: {
        artworkId: imagem.artworkId,
        order: direcao === "antes" ? { lt: imagem.order } : { gt: imagem.order },
      },
      orderBy: { order: direcao === "antes" ? "desc" : "asc" },
    });
    if (!vizinha) return;
    await tx.artworkImage.update({ where: { id: imagem.id }, data: { order: -1 } });
    await tx.artworkImage.update({ where: { id: vizinha.id }, data: { order: imagem.order } });
    await tx.artworkImage.update({ where: { id: imagem.id }, data: { order: vizinha.order } });
  });
}

export function editarTextoAlternativo(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const dados = validar(schemaTexto, entrada);
    const imagem = await imagemDeObraAtiva(tx, dados.imagemId);
    await tx.artworkImage.update({
      where: { id: imagem.id },
      data: { altText: dados.textoAlternativo },
    });
  });
}

export async function removerImagem(
  imagemId: unknown,
  cabecalhos: Headers,
  armazenamento?: Armazenamento,
): Promise<ResultadoGestao> {
  const removida = await comoAdmin(cabecalhos, async (tx) => {
    const imagem = await imagemDeObraAtiva(tx, validar(schemaId, imagemId));
    const total = await tx.artworkImage.count({ where: { artworkId: imagem.artworkId } });
    if (imagem.artwork.status !== "RASCUNHO" && total === 1)
      throw new ErroGestao(
        "ultima_imagem",
        "Obra publicada precisa de imagem. Volte para rascunho antes de remover a última.",
      );
    await tx.artworkImage.delete({ where: { id: imagem.id } });
    if (imagem.primary) {
      const proxima = await tx.artworkImage.findFirst({
        where: { artworkId: imagem.artworkId },
        orderBy: { order: "asc" },
      });
      if (proxima)
        await tx.artworkImage.update({ where: { id: proxima.id }, data: { primary: true } });
    }
    return imagem.url;
  });
  if (!removida.ok) return removida;
  await apagarDoArmazenamento([removida.dados], armazenamento);
  return { ok: true, dados: undefined };
}

// Original e miniatura saem do bucket depois que o banco confirmou. Se o R2 falhar, sobra um
// objeto órfão, mas a obra fica consistente: o banco é a fonte da verdade.
export async function apagarDoArmazenamento(chaves: string[], armazenamento?: Armazenamento) {
  try {
    const destino = armazenamento ?? armazenamentoR2();
    for (const chave of chaves) {
      await destino.remover(chave);
      await destino.remover(chaveMiniatura(chave));
    }
  } catch (erro) {
    console.error(
      "Falha ao apagar imagem do armazenamento",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
  }
}
