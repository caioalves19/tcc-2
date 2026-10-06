import type { Prisma } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao, validar } from "../artists/index";
import { schemaObra } from "./validacao";

async function validarVinculos(tx: Prisma.TransactionClient, artistaId: string, tags: string[]) {
  const artista = await tx.artist.findUnique({ where: { id: artistaId }, include: { user: true } });
  if (!artista || artista.user.deletedAt !== null)
    throw new ErroGestao("invalido", "Selecione um artista cadastrado.");
  const total = await tx.tag.count({ where: { id: { in: tags } } });
  if (total !== tags.length)
    throw new ErroGestao("invalido", "Uma das tags não existe. Atualize a página.");
}

async function garantirSlugLivre(tx: Prisma.TransactionClient, slug: string, id?: string) {
  const existente = await tx.artwork.findUnique({ where: { slug }, select: { id: true } });
  if (existente && existente.id !== id)
    throw new ErroGestao("duplicado", "Já existe uma obra com este slug. Escolha outro.");
}

// RF26: a obra nasce como rascunho (RN11); imagens entram depois, na edição.
export function criarObra(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const dados = validar(schemaObra, entrada);
    await validarVinculos(tx, dados.artistaId, dados.tags);
    await garantirSlugLivre(tx, dados.slug);
    const obra = await tx.artwork.create({
      data: {
        artistId: dados.artistaId,
        title: dados.titulo,
        slug: dados.slug,
        description: dados.descricao,
        technique: dados.tecnica,
        dimensions: dados.dimensoes,
        year: dados.ano,
        priceCents: dados.precoCentavos,
        stockQuantity: dados.estoque,
        status: "RASCUNHO",
        featured: dados.destaque,
        tags: { create: dados.tags.map((tagId) => ({ tagId })) },
      },
    });
    return { id: obra.id };
  });
}

export function listarObras(cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const obras = await tx.artwork.findMany({
      where: { deletedAt: null },
      include: { artist: { include: { user: true } }, tags: true },
      orderBy: { title: "asc" },
    });
    return obras.map((obra) => ({
      id: obra.id,
      titulo: obra.title,
      slug: obra.slug,
      descricao: obra.description,
      artistaId: obra.artistId,
      artistaNome: obra.artist.user.name,
      tecnica: obra.technique,
      dimensoes: obra.dimensions,
      ano: obra.year,
      precoCentavos: obra.priceCents,
      estoque: obra.stockQuantity,
      situacao: obra.status,
      destaque: obra.featured,
      tags: obra.tags.map((vinculo) => vinculo.tagId),
    }));
  });
}
