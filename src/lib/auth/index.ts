import { createHash } from "node:crypto";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../../generated/prisma/client";
import {
  validarCadastro,
  validarLogin,
  validarPedidoRecuperacao,
  validarRedefinicao,
  type EntradaCadastro,
  type EntradaRedefinicao,
  type FalhaRedefinicao,
  type ResultadoPedidoRecuperacao,
  type FalhaCadastro,
  type FalhaLogin,
  type PapelFundacao,
} from "../../modules/identity";
import { obterPool } from "../db";
import { despacharForaDaResposta, enviarEmailDeRecuperacao } from "../email";
import { consumirTentativa, limparTentativas, type RegraLimite } from "../rate-limit";

const PAPEIS = ["CLIENTE", "ARTISTA", "ADMIN"] as const;

function segredo(): string {
  const valor = process.env.BETTER_AUTH_SECRET;
  if (valor === undefined || valor.length < 32) {
    throw new Error("BETTER_AUTH_SECRET ausente");
  }
  return valor;
}

function urlBase(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

// Link para a nossa página; a rota HTTP do Better Auth não é montada.
function linkDeRedefinicao(token: string): string {
  const link = new URL("/redefinir-senha", urlBase());
  link.searchParams.set("token", token);
  return link.toString();
}

function criarInstancia() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(obterPool()) });
  return betterAuth({
    secret: segredo(),
    baseURL: urlBase(),
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      // RF03: link de uso único, válido por 1 hora; trocar a senha derruba todas as sessões.
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      // O Better Auth só consome o token usado: os outros links pedidos antes seguiriam
      // valendo. Hoje só a recuperação usa verification, e valor guarda o id do usuário.
      onPasswordReset: async ({ user }) => {
        try {
          await obterPool().query("DELETE FROM verification WHERE valor = $1", [user.id]);
        } catch (erro) {
          // Não pode subir: a revogação das sessões roda logo depois deste hook.
          console.error("Falha ao invalidar links antigos de recuperação", {
            userId: user.id,
            erro,
          });
        }
      },
      // Já roda fora da resposta (ver solicitarRecuperacao): envia direto.
      sendResetPassword: async ({ user, token }) => {
        await enviarEmailDeRecuperacao({
          userId: user.id,
          nome: user.name,
          para: user.email,
          link: linkDeRedefinicao(token),
        });
      },
    },
    // O token de recuperação fica no banco só como hash.
    verification: { storeIdentifier: "hashed" },
    user: {
      additionalFields: {
        role: {
          type: [...PAPEIS],
          required: true,
          defaultValue: "CLIENTE",
          input: false,
        },
        phone: {
          type: "string",
          required: true,
          input: true,
        },
      },
    },
    session: {
      fields: {
        ipAddress: "ip",
      },
    },
    account: {
      fields: {
        accountId: "externalId",
        providerId: "provider",
        password: "passwordHash",
      },
    },
    advanced: {
      // RNF06: cookie só por HTTPS em produção; HttpOnly e SameSite=Lax já são o padrão.
      useSecureCookies: process.env.NODE_ENV === "production",
      database: {
        generateId: "uuid",
      },
    },
    // Precisa ser o último plugin: grava o Set-Cookie nas Server Actions.
    plugins: [nextCookies()],
  });
}

let instancia: ReturnType<typeof criarInstancia> | undefined;

function obterAuth(): ReturnType<typeof criarInstancia> {
  if (instancia === undefined) {
    instancia = criarInstancia();
  }
  return instancia;
}

export async function abrirSessao(input: {
  email: string;
  senha: string;
}): Promise<{ token: string }> {
  const resultado = await obterAuth().api.signInEmail({
    body: {
      email: input.email,
      password: input.senha,
    },
  });
  return { token: resultado.token };
}

export type ResultadoLogin = { ok: true; token: string } | FalhaLogin;

// RNF08: 5 tentativas sem sucesso em 15 min por IP + e-mail bloqueiam o login até a janela passar.
const LIMITE_LOGIN: RegraLimite = { maximo: 5, janelaMs: 15 * 60 * 1000 };

// RNF08: 3 pedidos de recuperação por hora por IP + e-mail.
const LIMITE_RECUPERACAO: RegraLimite = { maximo: 3, janelaMs: 60 * 60 * 1000 };

// Hash na chave: o rate_limit não guarda e-mail nem IP legíveis.
function chaveLimite(prefixo: "login" | "recuperacao", ip: string, email: string): string {
  const hash = createHash("sha256").update(`${ip}|${email.trim().toLowerCase()}`).digest("hex");
  return `${prefixo}:${hash}`;
}

export async function entrar(input: {
  email: string;
  senha: string;
  ip: string;
}): Promise<ResultadoLogin> {
  const validacao = validarLogin(input);
  if (!validacao.ok) {
    return { ok: false, erro: "credenciais_invalidas" };
  }
  const { email, senha } = validacao.dados;
  const chave = chaveLimite("login", input.ip, email);
  const agora = new Date();
  // A tentativa é reservada antes de verificar a senha (ver consumirTentativa).
  const situacao = await consumirTentativa(chave, LIMITE_LOGIN, agora);
  if (situacao.bloqueado) {
    const minutos = Math.ceil((situacao.liberaEm.getTime() - agora.getTime()) / 60_000);
    return { ok: false, erro: "bloqueado", minutos };
  }
  try {
    const { token } = await abrirSessao({ email, senha });
    await limparTentativas(chave);
    return { ok: true, token };
  } catch (erro) {
    if (isAPIError(erro) && erro.body?.code === "INVALID_EMAIL_OR_PASSWORD") {
      return { ok: false, erro: "credenciais_invalidas" };
    }
    throw erro;
  }
}

export async function solicitarRecuperacao(input: {
  email: string;
  ip: string;
}): Promise<ResultadoPedidoRecuperacao> {
  const validacao = validarPedidoRecuperacao(input);
  if (!validacao.ok) {
    return { ok: false, erro: "invalido", campos: validacao.campos };
  }
  const { email } = validacao.dados;
  // Estourou o limite: mesma resposta neutra, mas nenhum e-mail sai.
  const situacao = await consumirTentativa(
    chaveLimite("recuperacao", input.ip, email),
    LIMITE_RECUPERACAO,
  );
  if (!situacao.bloqueado) {
    // Consulta, token e e-mail rodam depois da resposta: o tempo de resposta depende só
    // da validação e do limite, nunca de o e-mail ter conta.
    await despacharForaDaResposta(async () => {
      await obterAuth().api.requestPasswordReset({ body: { email } });
    });
  }
  return { ok: true };
}

export type ResultadoRedefinicao = { ok: true } | FalhaRedefinicao;

export async function redefinirSenha(
  input: EntradaRedefinicao & { token: string },
): Promise<ResultadoRedefinicao> {
  const validacao = validarRedefinicao({ senha: input.senha, confirmacao: input.confirmacao });
  if (!validacao.ok) {
    return { ok: false, erro: "invalido", campos: validacao.campos };
  }
  // O token vem do navegador: pode chegar com qualquer tipo.
  if (typeof input.token !== "string" || input.token.trim() === "") {
    return { ok: false, erro: "token_invalido" };
  }
  try {
    // O Better Auth consome o token numa transação: uso único mesmo com cliques simultâneos.
    await obterAuth().api.resetPassword({
      body: { token: input.token, newPassword: validacao.dados.senha },
    });
    return { ok: true };
  } catch (erro) {
    const codigo = isAPIError(erro) ? erro.body?.code : undefined;
    if (codigo === "INVALID_TOKEN" || codigo === "USER_NOT_FOUND") {
      return { ok: false, erro: "token_invalido" };
    }
    throw erro;
  }
}

export type ResultadoCadastro = { ok: true; token: string } | FalhaCadastro;

async function emailJaCadastrado(erro: unknown, email: string): Promise<boolean> {
  if (!isAPIError(erro)) {
    return false;
  }
  if (erro.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return true;
  }
  // Cadastro simultâneo: os dois passam pela checagem e o segundo bate no
  // UNIQUE do banco, que o Better Auth devolve como FAILED_TO_CREATE_USER.
  if (erro.body?.code === "FAILED_TO_CREATE_USER") {
    const contexto = await obterAuth().$context;
    return (await contexto.internalAdapter.findUserByEmail(email)) !== null;
  }
  return false;
}

export async function cadastrarCliente(entrada: EntradaCadastro): Promise<ResultadoCadastro> {
  const validacao = validarCadastro(entrada);
  if (!validacao.ok) {
    return { ok: false, erro: "invalido", campos: validacao.campos };
  }
  const { nome, email, telefone, senha } = validacao.dados;
  let resultado;
  try {
    resultado = await obterAuth().api.signUpEmail({
      body: { name: nome, email, password: senha, phone: telefone },
    });
  } catch (erro) {
    if (await emailJaCadastrado(erro, email)) {
      return { ok: false, erro: "email_duplicado" };
    }
    throw erro;
  }
  if (resultado.token === null) {
    throw new Error("Cadastro sem sessão aberta");
  }
  return { ok: true, token: resultado.token };
}

function papelConhecido(valor: unknown): PapelFundacao | null {
  if (valor === "CLIENTE" || valor === "ARTISTA" || valor === "ADMIN") {
    return valor;
  }
  return null;
}

export async function papelDaSessao(token: string): Promise<PapelFundacao | null> {
  const contexto = await obterAuth().$context;
  const encontrada = await contexto.internalAdapter.findSession(token);
  if (encontrada === null) {
    return null;
  }
  if (encontrada.session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return papelConhecido(encontrada.user.role);
}

// Lê a sessão pelo cookie assinado da requisição: sempre no banco (sem cache de cookie)
// e sem prorrogar a validade, porque numa renderização o cookie não pode ser renovado.
export async function sessaoDaRequisicao(
  cabecalhos: Headers,
): Promise<{ token: string; papel: PapelFundacao } | null> {
  const encontrada = await obterAuth().api.getSession({
    headers: cabecalhos,
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (encontrada === null) {
    return null;
  }
  const papel = papelConhecido(encontrada.user.role);
  return papel === null ? null : { token: encontrada.session.token, papel };
}

// Revoga a sessão do cookie no banco; nas Server Actions o nextCookies apaga o cookie.
export async function sair(cabecalhos: Headers): Promise<void> {
  await obterAuth().api.signOut({ headers: cabecalhos });
}

export async function revogarSessao(token: string): Promise<void> {
  const contexto = await obterAuth().$context;
  await contexto.internalAdapter.deleteSession(token);
}
