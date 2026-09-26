export function papelDoCadastroPublico(): "CLIENTE" {
  return "CLIENTE";
}

export type PapelFundacao = "ADMIN" | "CLIENTE" | "ARTISTA";

export type UsuarioSeed = {
  papel: PapelFundacao;
  nome: string;
  email: string;
};

export type PlanoSeed = {
  usuarios: readonly UsuarioSeed[];
  artista: {
    email: string;
    slug: string;
  };
};

const ADMIN_EMAIL = "admin@kolo.test";
const CLIENTE_EMAIL = "cliente@kolo.test";
const ARTISTA_EMAIL = "artista@kolo.test";

export function planoDoSeed(): PlanoSeed {
  return {
    usuarios: [
      { papel: "ADMIN", nome: "Admin", email: ADMIN_EMAIL },
      { papel: "CLIENTE", nome: "Cliente", email: CLIENTE_EMAIL },
      { papel: "ARTISTA", nome: "Artista", email: ARTISTA_EMAIL },
    ],
    artista: { email: ARTISTA_EMAIL, slug: "artista-exemplo" },
  };
}

export type SeedWriter = {
  upsertUsuario(usuario: UsuarioSeed): Promise<{ id: string }>;
  upsertArtista(input: { userId: string; slug: string }): Promise<void>;
};

export async function seedFundacao(writer: SeedWriter): Promise<void> {
  const plano = planoDoSeed();
  let artistaUserId: string | undefined;

  for (const usuario of plano.usuarios) {
    const salvo = await writer.upsertUsuario(usuario);
    if (usuario.email === plano.artista.email) {
      artistaUserId = salvo.id;
    }
  }

  if (artistaUserId === undefined) {
    throw new Error("Seed sem usuário artista");
  }

  await writer.upsertArtista({ userId: artistaUserId, slug: plano.artista.slug });
}
