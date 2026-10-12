import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { ErroGestao, validar } from "../artists/index";
import { processarImagem, type Armazenamento } from "../media/index";
import { comoEquipe, conferirArtista, type Equipe } from "./acesso";
import { criacao, ficha, id } from "./validacao";

async function conferirEstilos(tx: Prisma.TransactionClient, estilos: string[]) {
  if ((await tx.tattooStyle.count({ where: { id: { in: estilos } } })) !== estilos.length)
    throw new ErroGestao("invalido", "Escolha estilos cadastrados.");
}

function conferirChave(chave: string, artistaId: string) {
  if (!chave.startsWith(`portfolio/${artistaId}/`))
    throw new ErroGestao("invalido", "Envie uma imagem para o portfólio deste artista.");
}

export async function criarTrabalho(
  entrada: unknown,
  cabecalhos: Headers,
  armazenamento?: Armazenamento,
) {
  const conferida = await comoEquipe(cabecalhos, async (tx, equipe) => {
    const dados = validar(criacao, entrada);
    await conferirArtista(tx, equipe, dados.artistaId);
    await conferirEstilos(tx, dados.estilos);
    conferirChave(dados.chave, dados.artistaId);
    return dados;
  });
  if (!conferida.ok) return conferida;
  // Nunca confiar no sucesso informado pelo navegador. Decodifica o objeto de novo no servidor.
  const processada = await processarImagem(conferida.dados.chave, cabecalhos, armazenamento);
  if (!processada.ok) return processada;
  return comoEquipe(cabecalhos, async (tx, equipe) => {
    const dados = conferida.dados;
    await conferirArtista(tx, equipe, dados.artistaId);
    await conferirEstilos(tx, dados.estilos);
    const ultimo = await tx.portfolioItem.aggregate({
      where: { artistId: dados.artistaId },
      _max: { order: true },
    });
    const trabalho = await tx.portfolioItem.create({
      data: {
        artistId: dados.artistaId,
        title: dados.titulo,
        description: dados.descricao,
        bodyRegion: dados.regiaoCorpo,
        imageUrl: dados.chave,
        featured: dados.destaque,
        order: (ultimo._max.order ?? 0) + 1,
        styles: { create: dados.estilos.map((tattooStyleId) => ({ tattooStyleId })) },
      },
    });
    return { id: trabalho.id };
  });
}

async function trabalhoPermitido(tx: Prisma.TransactionClient, equipe: Equipe, trabalhoId: string) {
  const trabalho = await tx.portfolioItem.findFirst({
    where: {
      id: trabalhoId,
      ...(equipe.papel === "ARTISTA" ? { artistId: equipe.artistaId! } : {}),
    },
  });
  if (!trabalho)
    throw new ErroGestao("nao_encontrado", "Trabalho não encontrado. Atualize a página.");
  await conferirArtista(tx, equipe, trabalho.artistId);
  return trabalho;
}

const edicao = ficha.extend({ id, chave: z.string().max(300).optional() });
export async function editarTrabalho(
  entrada: unknown,
  cabecalhos: Headers,
  armazenamento?: Armazenamento,
) {
  const conferida = await comoEquipe(cabecalhos, async (tx, equipe) => {
    const dados = validar(edicao, entrada);
    const trabalho = await trabalhoPermitido(tx, equipe, dados.id);
    if (trabalho.artistId !== dados.artistaId)
      throw new ErroGestao("invalido", "O artista do trabalho não pode ser alterado.");
    await conferirEstilos(tx, dados.estilos);
    if (dados.chave !== undefined) conferirChave(dados.chave, trabalho.artistId);
    return dados;
  });
  if (!conferida.ok) return conferida;
  const dados = conferida.dados;
  if (dados.chave !== undefined) {
    const processada = await processarImagem(dados.chave, cabecalhos, armazenamento);
    if (!processada.ok) return processada;
  }
  return comoEquipe(cabecalhos, async (tx, equipe) => {
    const trabalho = await trabalhoPermitido(tx, equipe, dados.id);
    await conferirEstilos(tx, dados.estilos);
    await tx.portfolioItem.update({
      where: { id: trabalho.id },
      data: {
        title: dados.titulo,
        description: dados.descricao,
        bodyRegion: dados.regiaoCorpo,
        featured: dados.destaque,
        ...(dados.chave !== undefined ? { imageUrl: dados.chave } : {}),
        styles: {
          deleteMany: {},
          create: dados.estilos.map((tattooStyleId) => ({ tattooStyleId })),
        },
      },
    });
  });
}

const movimento = z.object({ id, direcao: z.enum(["antes", "depois"]) });
export function moverTrabalho(entrada: unknown, cabecalhos: Headers) {
  return comoEquipe(cabecalhos, async (tx, equipe) => {
    const dados = validar(movimento, entrada);
    const trabalho = await trabalhoPermitido(tx, equipe, dados.id);
    const vizinho = await tx.portfolioItem.findFirst({
      where: {
        artistId: trabalho.artistId,
        order: dados.direcao === "antes" ? { lt: trabalho.order } : { gt: trabalho.order },
      },
      orderBy: { order: dados.direcao === "antes" ? "desc" : "asc" },
    });
    if (!vizinho) return;
    await tx.portfolioItem.update({ where: { id: trabalho.id }, data: { order: vizinho.order } });
    await tx.portfolioItem.update({ where: { id: vizinho.id }, data: { order: trabalho.order } });
  });
}

export function removerTrabalho(trabalhoId: unknown, cabecalhos: Headers) {
  return comoEquipe(cabecalhos, async (tx, equipe) => {
    const trabalho = await trabalhoPermitido(tx, equipe, validar(id, trabalhoId));
    // Os vínculos de estilos são apagados em cascata. Objetos no R2 são preservados:
    // excluir o trabalho não revoga URLs públicas nem remove uploads compartilhados.
    await tx.portfolioItem.delete({ where: { id: trabalho.id } });
  });
}
