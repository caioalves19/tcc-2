import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao, validar } from "../artists/index";
import type { ResultadoGestao } from "../artists/index";
import { chaveMiniatura } from "../media/index";
import type { Armazenamento } from "../media/index";
import { apagarDoArmazenamento } from "./imagens";
import { situacaoPorEstoque } from "./regras";
import { schemaEditarObra, schemaId, schemaObra } from "./validacao";

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

// RF26/RN11: o admin escolhe rascunho ou publicada; disponível ou esgotada sai do estoque.
// Publicar exige ao menos uma imagem, para não aparecer card vazio no catálogo.
export function editarObra(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const dados = validar(schemaEditarObra, entrada);
    const atual = await tx.artwork.findUnique({
      where: { id: dados.id },
      include: { _count: { select: { images: true } } },
    });
    if (!atual || atual.deletedAt !== null)
      throw new ErroGestao("nao_encontrado", "Obra não encontrada. Atualize a página.");
    if (dados.publicada && atual._count.images === 0)
      throw new ErroGestao("sem_imagem", "Adicione pelo menos uma imagem antes de publicar.");
    await validarVinculos(tx, dados.artistaId, dados.tags);
    await garantirSlugLivre(tx, dados.slug, dados.id);
    await tx.artwork.update({
      where: { id: dados.id },
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
        status: situacaoPorEstoque(dados.publicada, dados.estoque),
        featured: dados.destaque,
        tags: { deleteMany: {}, create: dados.tags.map((tagId) => ({ tagId })) },
      },
    });
  });
}

// Sem vínculo, a obra sai de vez, com as imagens no R2. Em carrinho ou pedido, a exclusão é
// lógica (convenção do ESCOPO para dado com relevância contábil): some do admin e da vitrine,
// volta a rascunho e o histórico dos pedidos fica intacto.
export async function excluirObra(
  id: unknown,
  cabecalhos: Headers,
  armazenamento?: Armazenamento,
): Promise<ResultadoGestao<{ modo: "apagada" | "arquivada" }>> {
  const excluida = await comoAdmin(cabecalhos, async (tx) => {
    const where = { id: validar(schemaId, id) };
    const obra = await tx.artwork.findUnique({
      where,
      include: { images: true, _count: { select: { cartItems: true, orderItems: true } } },
    });
    if (!obra || obra.deletedAt !== null)
      throw new ErroGestao("nao_encontrado", "Obra não encontrada. Atualize a página.");
    if (obra._count.cartItems > 0 || obra._count.orderItems > 0) {
      await tx.artwork.update({
        where,
        data: { deletedAt: new Date(), status: "RASCUNHO", featured: false },
      });
      return { modo: "arquivada" as const, chaves: [] };
    }
    await tx.artwork.delete({ where });
    return { modo: "apagada" as const, chaves: obra.images.map((imagem) => imagem.url) };
  });
  if (!excluida.ok) return excluida;
  await apagarDoArmazenamento(excluida.dados.chaves, armazenamento);
  return { ok: true, dados: { modo: excluida.dados.modo } };
}

const OBRAS_ADMIN_POR_PAGINA = 12;
// Vêm da URL (?pagina=...&editar=...): qualquer valor fora do esperado volta ao padrão.
const schemaListaObras = z.object({
  pagina: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  editar: z.uuid().nullable().catch(null).default(null),
});
const INCLUI_OBRA_ADMIN = {
  artist: { include: { user: true } },
  tags: true,
  images: { orderBy: { order: "asc" } },
} satisfies Prisma.ArtworkInclude;
type ObraComVinculos = Prisma.ArtworkGetPayload<{ include: typeof INCLUI_OBRA_ADMIN }>;

function obraDoAdmin(obra: ObraComVinculos) {
  return {
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
    imagens: obra.images.map((imagem) => ({
      id: imagem.id,
      chave: imagem.url,
      chaveMiniatura: chaveMiniatura(imagem.url),
      ordem: imagem.order,
      principal: imagem.primary,
      textoAlternativo: imagem.altText ?? "",
    })),
  };
}

export function listarObras(cabecalhos: Headers, entrada: unknown = {}) {
  return comoAdmin(cabecalhos, async (tx) => {
    const { pagina, editar } = schemaListaObras.parse(
      typeof entrada === "object" && entrada !== null ? entrada : {},
    );
    const where = { deletedAt: null };
    const total = await tx.artwork.count({ where });
    const obras = await tx.artwork.findMany({
      where,
      include: INCLUI_OBRA_ADMIN,
      // O id desempata, para uma obra não repetir nem sumir entre as páginas.
      orderBy: [{ title: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * OBRAS_ADMIN_POR_PAGINA,
      take: OBRAS_ADMIN_POR_PAGINA,
    });
    // A obra recém-criada pode cair em outra página, e o editor precisa dela para as imagens.
    const emEdicao = editar
      ? await tx.artwork.findFirst({ where: { ...where, id: editar }, include: INCLUI_OBRA_ADMIN })
      : null;
    return {
      obras: obras.map(obraDoAdmin),
      emEdicao: emEdicao ? obraDoAdmin(emEdicao) : null,
      total,
      pagina,
      totalPaginas: Math.ceil(total / OBRAS_ADMIN_POR_PAGINA),
    };
  });
}

export type ObrasPorSituacao = Record<"RASCUNHO" | "DISPONIVEL" | "ESGOTADA", number>;

// RF32 (PBI-48): obras do acervo por situação, sem as arquivadas (as mesmas de /admin/obras). Roda
// na transação de quem chama, que já passou pelo comoAdmin: esta função não confere permissão.
export async function contarObrasPorSituacao(
  tx: Prisma.TransactionClient,
): Promise<ObrasPorSituacao> {
  const grupos = await tx.artwork.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const contagem: ObrasPorSituacao = { RASCUNHO: 0, DISPONIVEL: 0, ESGOTADA: 0 };
  for (const grupo of grupos) contagem[grupo.status] = grupo._count._all;
  return contagem;
}
