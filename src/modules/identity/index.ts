export {
  MENSAGEM_EMAIL_DUPLICADO,
  SENHA_MAXIMA,
  SENHA_MINIMA,
  schemaCadastro,
  schemaSenhaNova,
  validarCadastro,
  type CampoCadastro,
  type DadosCadastro,
  type EntradaCadastro,
  type ErrosCadastro,
  type FalhaCadastro,
  type ResultadoValidacao,
} from "./cadastro";

export {
  mensagemFalhaLogin,
  schemaLogin,
  validarLogin,
  type CampoLogin,
  type DadosLogin,
  type EntradaLogin,
  type ErrosLogin,
  type FalhaLogin,
  type ResultadoValidacaoLogin,
} from "./login";

export {
  MENSAGEM_PEDIDO_RECUPERACAO,
  MENSAGEM_TOKEN_INVALIDO,
  schemaPedidoRecuperacao,
  schemaRedefinicao,
  validarPedidoRecuperacao,
  validarRedefinicao,
  type DadosPedidoRecuperacao,
  type DadosRedefinicao,
  type EntradaPedidoRecuperacao,
  type EntradaRedefinicao,
  type ErrosPedidoRecuperacao,
  type ErrosRedefinicao,
  type FalhaRedefinicao,
  type ResultadoPedidoRecuperacao,
} from "./recuperacao";

export { type ErrosDe, type ResultadoValidacaoDe } from "./validacao";

export function papelDoCadastroPublico(): "CLIENTE" {
  return "CLIENTE";
}

export type PapelFundacao = "ADMIN" | "CLIENTE" | "ARTISTA";

export type RotaProtegida = "/conta" | "/admin";

export type DecisaoAcesso = "permitido" | "nao_autenticado" | "proibido";

export function decidirAcesso(papel: PapelFundacao | null, rota: RotaProtegida): DecisaoAcesso {
  if (papel === null) {
    return "nao_autenticado";
  }

  if (rota === "/admin" && papel !== "ADMIN") {
    return "proibido";
  }

  return "permitido";
}

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
