import { createHash } from "node:crypto";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../../generated/prisma/client";
import {
  validarCadastro,
  validarLogin,
  type EntradaCadastro,
  type FalhaCadastro,
  type FalhaLogin,
  type PapelFundacao,
} from "../../modules/identity";
import { databaseUrl } from "../database-url";
import { estaBloqueado, limparFalhas, registrarFalha, type RegraLimite } from "../rate-limit";

const PAPEIS = ["CLIENTE", "ARTISTA", "ADMIN"] as const;

function segredo(): string {
  const valor = process.env.BETTER_AUTH_SECRET;
  if (valor === undefined || valor.length < 32) {
    throw new Error("BETTER_AUTH_SECRET ausente");
  }
  return valor;
}

function criarInstancia() {
  const pool = new Pool({ connectionString: databaseUrl() });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return betterAuth({
    secret: segredo(),
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
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

// RNF08: 5 falhas em 15 min por IP + e-mail bloqueiam o login até a janela passar.
const LIMITE_LOGIN: RegraLimite = { maximo: 5, janelaMs: 15 * 60 * 1000 };

function chaveLogin(ip: string, email: string): string {
  const hash = createHash("sha256").update(`${ip}|${email.trim().toLowerCase()}`).digest("hex");
  return `login:${hash}`;
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
  const chave = chaveLogin(input.ip, email);
  const agora = new Date();
  const situacao = await estaBloqueado(chave, LIMITE_LOGIN, agora);
  if (situacao.bloqueado) {
    const minutos = Math.ceil((situacao.liberaEm.getTime() - agora.getTime()) / 60_000);
    return { ok: false, erro: "bloqueado", minutos };
  }
  try {
    const { token } = await abrirSessao({ email, senha });
    await limparFalhas(chave);
    return { ok: true, token };
  } catch (erro) {
    if (isAPIError(erro) && erro.body?.code === "INVALID_EMAIL_OR_PASSWORD") {
      await registrarFalha(chave, LIMITE_LOGIN, agora);
      return { ok: false, erro: "credenciais_invalidas" };
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

// Lê a sessão pelo cookie assinado da requisição (sem cache de cookie: sempre o banco).
export async function sessaoDaRequisicao(
  cabecalhos: Headers,
): Promise<{ token: string; papel: PapelFundacao } | null> {
  const encontrada = await obterAuth().api.getSession({
    headers: cabecalhos,
    query: { disableCookieCache: true },
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
