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

// Card de obra da vitrine: o PBI-20 usa em "Outras obras do artista", e o catálogo (PBI-19)
// pode reaproveitar. A imagem é a principal (ou a primeira, se nenhuma estiver marcada).
export type CardObra = {
  slug: string;
  titulo: string;
  tecnica: string | null;
  dimensoes: string | null;
  precoCentavos: number;
  disponivel: boolean;
  imagem: { chave: string; textoAlternativo: string } | null;
};

// Destaques primeiro; depois as disponíveis antes das esgotadas (o enum no Postgres segue a
// ordem RASCUNHO, DISPONIVEL, ESGOTADA) e, por fim, o título.
export async function outrasObrasDoArtista(
  obra: Pick<ObraPublica, "id" | "artista">,
  limite = 4,
): Promise<CardObra[]> {
  const obras = await obterPrisma().artwork.findMany({
    where: {
      artistId: obra.artista.id,
      id: { not: obra.id },
      deletedAt: null,
      status: { not: "RASCUNHO" },
    },
    include: { images: { orderBy: [{ primary: "desc" }, { order: "asc" }], take: 1 } },
    orderBy: [{ featured: "desc" }, { status: "asc" }, { title: "asc" }],
    take: limite,
  });
  return obras.map((o) => {
    const imagem = o.images[0];
    return {
      slug: o.slug,
      titulo: o.title,
      tecnica: o.technique,
      dimensoes: o.dimensions,
      precoCentavos: o.priceCents,
      disponivel: o.status === "DISPONIVEL" && o.stockQuantity > 0,
      imagem: imagem ? { chave: imagem.url, textoAlternativo: imagem.altText ?? o.title } : null,
    };
  });
}
