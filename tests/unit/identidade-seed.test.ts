import { describe, expect, it } from "vitest";

import { papelDoCadastroPublico, planoDoSeed, seedFundacao } from "../../src/modules/identity";

describe("papéis da fundação", () => {
  it("cadastro público nasce CLIENTE", () => {
    expect(papelDoCadastroPublico()).toBe("CLIENTE");
  });

  it("o seed traz um ADMIN, um CLIENTE e um ARTISTA com perfil vinculado", () => {
    const plano = planoDoSeed();
    const papeis = plano.usuarios.map((usuario) => usuario.papel);

    expect(papeis).toEqual(["ADMIN", "CLIENTE", "ARTISTA"]);
    expect(plano.artista.email).toBe("artista@kolo.test");
    expect(plano.usuarios.find((usuario) => usuario.papel === "ARTISTA")?.email).toBe(
      plano.artista.email,
    );
    expect(plano.usuarios.filter((usuario) => usuario.papel === "ADMIN")).toHaveLength(1);
  });

  it("grava um único ADMIN no seed e vincula o perfil ao artista", async () => {
    const plano = planoDoSeed();
    const gravados: string[] = [];
    let artista: { userId: string; slug: string } | undefined;

    await seedFundacao({
      async upsertUsuario(usuario) {
        gravados.push(usuario.papel);
        return { id: usuario.email };
      },
      async upsertArtista(input) {
        artista = input;
      },
    });

    expect(gravados).toEqual(["ADMIN", "CLIENTE", "ARTISTA"]);
    expect(gravados.filter((papel) => papel === "ADMIN")).toHaveLength(1);
    expect(artista).toEqual({ userId: plano.artista.email, slug: plano.artista.slug });
  });
});
