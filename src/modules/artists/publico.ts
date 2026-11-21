import { obterPrisma } from "../../lib/prisma";

// RF20: projeção pública deliberadamente sem e-mail, telefone ou dados da conta. Só entra quem
// tatua, ou seja, quem tem ao menos um estilo; artista plástico sem estilo fica de fora.
export async function listarArtistasParaWizard() {
  const artistas = await obterPrisma().artist.findMany({
    where: {
      user: { role: "ARTISTA", status: "ATIVO", deletedAt: null },
      styles: { some: {} },
    },
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
