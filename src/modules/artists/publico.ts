import { obterPrisma } from "../../lib/prisma";

// RF20: projeção pública deliberadamente sem e-mail, telefone ou dados da conta.
export async function listarArtistasParaWizard() {
  const artistas = await obterPrisma().artist.findMany({
    where: { user: { role: "ARTISTA", status: "ATIVO", deletedAt: null } },
    select: {
      id: true,
      user: { select: { name: true } },
      styles: {
        select: { tattooStyle: { select: { id: true, name: true } } },
        orderBy: { tattooStyle: { name: "asc" } },
      },
    },
    orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
  });
  return artistas.map((artista) => ({
    id: artista.id,
    nome: artista.user.name,
    estilos: artista.styles.map(({ tattooStyle }) => ({
      id: tattooStyle.id,
      nome: tattooStyle.name,
    })),
  }));
}
