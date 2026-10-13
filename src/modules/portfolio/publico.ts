import { z } from "zod";
import { obterPrisma } from "../../lib/prisma";

const filtrosSchema = z.object({
  artista: z.uuid().optional().catch(undefined),
  estilo: z.uuid().optional().catch(undefined),
  regiao: z.string().trim().min(1).max(100).optional().catch(undefined),
});

// RF17/RN01: leitura pública, sem sessão e sem dados pessoais de contato.
export async function listarGaleria(
  entrada: {
    artista?: unknown;
    estilo?: unknown;
    regiao?: unknown;
  } = {},
) {
  const filtros = filtrosSchema.parse(entrada);
  const db = obterPrisma();
  const visivel = { artist: { user: { deletedAt: null } } };
  const [trabalhos, artistas, estilos, regioes] = await Promise.all([
    db.portfolioItem.findMany({
      where: {
        ...visivel,
        artistId: filtros.artista,
        bodyRegion: filtros.regiao,
        ...(filtros.estilo ? { styles: { some: { tattooStyleId: filtros.estilo } } } : {}),
      },
      include: {
        artist: { select: { user: { select: { name: true } } } },
        styles: { include: { tattooStyle: true }, orderBy: { tattooStyle: { name: "asc" } } },
      },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { id: "asc" }],
    }),
    db.artist.findMany({
      where: { user: { deletedAt: null }, portfolioItems: { some: {} } },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    db.tattooStyle.findMany({
      where: { portfolioItems: { some: { portfolioItem: visivel } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.portfolioItem.findMany({
      where: { ...visivel, bodyRegion: { not: null } },
      select: { bodyRegion: true },
      distinct: ["bodyRegion"],
      orderBy: { bodyRegion: "asc" },
    }),
  ]);
  return {
    filtros,
    trabalhos: trabalhos.map((t) => ({
      id: t.id,
      titulo: t.title,
      imagem: t.imageUrl,
      textoAlternativo: `${t.title} — ${t.artist.user.name}${t.bodyRegion ? ` · ${t.bodyRegion}` : ""}`,
      artistaNome: t.artist.user.name,
      regiaoCorpo: t.bodyRegion,
      estilos: t.styles.map((e) => e.tattooStyle.name),
    })),
    artistas: artistas.map((a) => ({ id: a.id, nome: a.user.name })),
    estilos: estilos.map((e) => ({ id: e.id, nome: e.name })),
    regioes: regioes.flatMap((r) => (r.bodyRegion ? [r.bodyRegion] : [])),
  };
}
export type GaleriaPublica = Awaited<ReturnType<typeof listarGaleria>>;
