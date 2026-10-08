import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
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
  artistaNome: string;
  tecnica: string | null;
  dimensoes: string | null;
  precoCentavos: number;
  disponivel: boolean;
  imagem: { chave: string; textoAlternativo: string } | null;
};

// O que o card precisa: o artista e só a imagem principal (ou a primeira).
const INCLUI_CARD = {
  artist: { include: { user: true } },
  images: { orderBy: [{ primary: "desc" }, { order: "asc" }], take: 1 },
} satisfies Prisma.ArtworkInclude;

function paraCard(o: Prisma.ArtworkGetPayload<{ include: typeof INCLUI_CARD }>): CardObra {
  const imagem = o.images[0];
  return {
    slug: o.slug,
    titulo: o.title,
    artistaNome: o.artist.user.name,
    tecnica: o.technique,
    dimensoes: o.dimensions,
    precoCentavos: o.priceCents,
    disponivel: o.status === "DISPONIVEL" && o.stockQuantity > 0,
    imagem: imagem ? { chave: imagem.url, textoAlternativo: imagem.altText ?? o.title } : null,
  };
}

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
    include: INCLUI_CARD,
    orderBy: [{ featured: "desc" }, { status: "asc" }, { title: "asc" }],
    take: limite,
  });
  return obras.map(paraCard);
}

export const ORDENS_CATALOGO = ["recentes", "menor-preco", "maior-preco", "destaque"] as const;
export type OrdemCatalogo = (typeof ORDENS_CATALOGO)[number];

// Critério escolhido, aplicado depois de "disponíveis antes das esgotadas" e antes do id.
const CRITERIO: Record<OrdemCatalogo, Prisma.ArtworkOrderByWithRelationInput[]> = {
  recentes: [{ createdAt: "desc" }],
  "menor-preco": [{ priceCents: "asc" }],
  "maior-preco": [{ priceCents: "desc" }],
  destaque: [{ featured: "desc" }, { createdAt: "desc" }],
};

export type PaginaCatalogo = {
  obras: CardObra[];
  total: number;
  pagina: number;
  totalPaginas: number;
  ordem: OrdemCatalogo;
};

export const OBRAS_POR_PAGINA = 12;

// Vem da URL (?pagina=2&ordem=...): qualquer valor fora do esperado volta ao padrão.
const schemaCatalogo = z.object({
  pagina: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  ordem: z.enum(ORDENS_CATALOGO).catch("recentes"),
});

// RF09/RN11: só obras publicadas e não arquivadas. Em qualquer ordenação, as disponíveis vêm
// antes das esgotadas (o enum no Postgres segue RASCUNHO, DISPONIVEL, ESGOTADA); depois, o
// critério escolhido. O id desempata, para uma obra não repetir nem sumir entre as páginas.
export async function listarCatalogo(entrada: unknown): Promise<PaginaCatalogo> {
  const { pagina, ordem } = schemaCatalogo.parse(
    typeof entrada === "object" && entrada !== null ? entrada : {},
  );
  const onde = { deletedAt: null, status: { not: "RASCUNHO" as const } };
  const prisma = obterPrisma();
  const [total, obras] = await Promise.all([
    prisma.artwork.count({ where: onde }),
    prisma.artwork.findMany({
      where: onde,
      include: INCLUI_CARD,
      orderBy: [{ status: "asc" }, ...CRITERIO[ordem], { id: "asc" }],
      skip: (pagina - 1) * OBRAS_POR_PAGINA,
      take: OBRAS_POR_PAGINA,
    }),
  ]);
  return {
    obras: obras.map(paraCard),
    total,
    pagina,
    totalPaginas: Math.ceil(total / OBRAS_POR_PAGINA),
    ordem,
  };
}
