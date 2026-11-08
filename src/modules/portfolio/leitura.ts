import { z } from "zod";
import { chaveMiniatura, urlPublica } from "../media/index";
import { comoEquipe } from "./acesso";
import { id } from "./validacao";

const TRABALHOS_POR_PAGINA = 12;
// Vem da URL (?pagina=...): qualquer valor fora do esperado volta à primeira página.
const schemaPagina = z.coerce.number().int().min(1).max(1_000_000).catch(1);

export type TrabalhoPortfolio = {
  id: string;
  titulo: string;
  descricao: string | null;
  regiaoCorpo: string | null;
  estilos: string[];
  destaque: boolean;
  ordem: number;
  imagemUrl: string;
  miniaturaUrl: string;
};
export type PortfolioGestao = {
  papel: "ADMIN" | "ARTISTA";
  artistaId: string | null;
  artistas: { id: string; nome: string }[];
  estilos: { id: string; nome: string }[];
  trabalhos: TrabalhoPortfolio[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

export function lerPortfolio(cabecalhos: Headers, artista?: unknown, paginaPedida?: unknown) {
  return comoEquipe(cabecalhos, async (tx, equipe): Promise<PortfolioGestao> => {
    const artistas =
      equipe.papel === "ADMIN"
        ? (
            await tx.artist.findMany({
              where: { user: { deletedAt: null } },
              include: { user: true },
              orderBy: { user: { name: "asc" } },
            })
          ).map((a) => ({ id: a.id, nome: a.user.name }))
        : [];
    const pedido = id.safeParse(artista);
    const artistaId =
      equipe.papel === "ARTISTA"
        ? equipe.artistaId
        : pedido.success && artistas.some((a) => a.id === pedido.data)
          ? pedido.data
          : null;
    const estilos = (await tx.tattooStyle.findMany({ orderBy: { name: "asc" } })).map((e) => ({
      id: e.id,
      nome: e.name,
    }));
    const pagina = schemaPagina.parse(paginaPedida);
    const total = artistaId ? await tx.portfolioItem.count({ where: { artistId: artistaId } }) : 0;
    const trabalhos = artistaId
      ? await tx.portfolioItem.findMany({
          where: { artistId: artistaId },
          include: { styles: true },
          orderBy: [{ order: "asc" }, { id: "asc" }],
          skip: (pagina - 1) * TRABALHOS_POR_PAGINA,
          take: TRABALHOS_POR_PAGINA,
        })
      : [];
    return {
      papel: equipe.papel,
      artistaId,
      artistas,
      estilos,
      total,
      pagina,
      totalPaginas: Math.ceil(total / TRABALHOS_POR_PAGINA),
      trabalhos: trabalhos.map((t) => ({
        id: t.id,
        titulo: t.title,
        descricao: t.description,
        regiaoCorpo: t.bodyRegion,
        estilos: t.styles.map((e) => e.tattooStyleId),
        destaque: t.featured,
        ordem: t.order,
        imagemUrl: urlPublica(t.imageUrl),
        miniaturaUrl: urlPublica(chaveMiniatura(t.imageUrl)),
      })),
    };
  });
}
