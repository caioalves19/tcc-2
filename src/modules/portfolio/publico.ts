import { z } from "zod";
import { consultaDaBusca, palavrasDaBusca } from "../../lib/busca";
import { obterPrisma } from "../../lib/prisma";

const filtrosSchema = z.object({
  artista: z.uuid().optional().catch(undefined),
  estilo: z.uuid().optional().catch(undefined),
  regiao: z.string().trim().min(1).max(100).optional().catch(undefined),
  busca: z.string().catch(""),
});

// RF18 (PBI-37): ids dos trabalhos com todas as palavras no título, na descrição, na região, nos
// estilos ou no nome do artista; sem acento e por começo de palavra, com a configuração kolo_busca
// do catálogo (migração 0006). As palavras chegam limpas e vão como parâmetro. Sem índice: o
// portfólio é pequeno, e a visibilidade (conta excluída) é aplicada na consulta principal.
async function idsDaBusca(palavras: string[]): Promise<string[]> {
  const linhas = await obterPrisma().$queryRaw<{ id: string }[]>`
    SELECT p.id
      FROM portfolio_item p
      JOIN artist a ON a.id = p.artist_id
      JOIN "user" u ON u.id = a.user_id
      LEFT JOIN portfolio_item_style ps ON ps.portfolio_item_id = p.id
      LEFT JOIN tattoo_style s ON s.id = ps.tattoo_style_id
     GROUP BY p.id, u.nome
    HAVING to_tsvector('kolo_busca', concat_ws(' ', p.titulo, p.descricao, p.regiao_corpo, u.nome, string_agg(s.nome, ' ')))
           @@ to_tsquery('kolo_busca', ${consultaDaBusca(palavras)})`;
  return linhas.map((linha) => linha.id);
}

// RF17/RN01: leitura pública, sem sessão e sem dados pessoais de contato.
export async function listarGaleria(
  entrada: {
    artista?: unknown;
    estilo?: unknown;
    regiao?: unknown;
    busca?: unknown;
  } = {},
) {
  const { busca, ...demais } = filtrosSchema.parse(entrada);
  const palavras = palavrasDaBusca(busca);
  // A busca volta limpa (só as palavras que valem), para o formulário mostrar o que foi usado.
  const filtros = { ...demais, busca: palavras.join(" ") };
  const db = obterPrisma();
  const visivel = { artist: { user: { deletedAt: null } } };
  const [trabalhos, artistas, estilos, regioes] = await Promise.all([
    db.portfolioItem.findMany({
      where: {
        ...visivel,
        artistId: filtros.artista,
        ...(palavras.length > 0 ? { id: { in: await idsDaBusca(palavras) } } : {}),
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
