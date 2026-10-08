import { obterPrisma } from "../../lib/prisma";

// Vitrine pública (PBI-20): o que qualquer visitante pode ver de uma obra, sem login (RN01).

export type ImagemPublica = { chave: string; textoAlternativo: string; principal: boolean };

export type ObraPublica = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  tecnica: string | null;
  dimensoes: string | null;
  ano: number | null;
  precoCentavos: number;
  disponivel: boolean;
  artista: { id: string; nome: string; slug: string };
  // Na ordem cadastrada; a principal vem marcada para a galeria abrir nela.
  imagens: ImagemPublica[];
};

// RN01/RN11: rascunho e obra arquivada não existem para o público, nem pela URL direta; a
// esgotada continua visível, identificada como indisponível. Slug fora do formato nem consulta.
export async function lerObraPublica(slug: string): Promise<ObraPublica | null> {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  const obra = await obterPrisma().artwork.findFirst({
    where: { slug, deletedAt: null, status: { not: "RASCUNHO" } },
    include: {
      artist: { include: { user: true } },
      images: { orderBy: { order: "asc" } },
    },
  });
  if (!obra) return null;
  return {
    id: obra.id,
    slug: obra.slug,
    titulo: obra.title,
    descricao: obra.description,
    tecnica: obra.technique,
    dimensoes: obra.dimensions,
    ano: obra.year,
    precoCentavos: obra.priceCents,
    disponivel: obra.status === "DISPONIVEL" && obra.stockQuantity > 0,
    artista: { id: obra.artist.id, nome: obra.artist.user.name, slug: obra.artist.slug },
    imagens: obra.images.map((imagem) => ({
      chave: imagem.url,
      textoAlternativo: imagem.altText ?? obra.title,
      principal: imagem.primary,
    })),
  };
}
