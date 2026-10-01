import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../../generated/prisma/client";
import {
  validarCadastro,
  type EntradaCadastro,
  type FalhaCadastro,
  type PapelFundacao,
} from "../../modules/identity";
import { databaseUrl } from "../database-url";

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

export type ResultadoLogin =
  | { ok: true; token: string }
  | { ok: false; erro: "credenciais_invalidas" }
  | { ok: false; erro: "bloqueado"; minutos: number };

export async function entrar(input: {
  email: string;
  senha: string;
  ip: string;
}): Promise<ResultadoLogin> {
  try {
    const { token } = await abrirSessao(input);
    return { ok: true, token };
  } catch (erro) {
    if (isAPIError(erro) && erro.body?.code === "INVALID_EMAIL_OR_PASSWORD") {
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

export async function revogarSessao(token: string): Promise<void> {
  const contexto = await obterAuth().$context;
  await contexto.internalAdapter.deleteSession(token);
}
