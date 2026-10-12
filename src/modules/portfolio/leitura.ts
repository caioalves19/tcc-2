import { chaveMiniatura, urlPublica } from "../media/index";
import { comoEquipe } from "./acesso";
import { id } from "./validacao";

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
};

export function lerPortfolio(cabecalhos: Headers, artista?: unknown) {
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
    const trabalhos = artistaId
      ? await tx.portfolioItem.findMany({
          where: { artistId: artistaId },
          include: { styles: true },
          orderBy: [{ order: "asc" }, { id: "asc" }],
        })
      : [];
    return {
      papel: equipe.papel,
      artistaId,
      artistas,
      estilos,
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
