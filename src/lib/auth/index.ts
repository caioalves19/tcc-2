import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../../generated/prisma/client";
import type { PapelFundacao } from "../../modules/identity";
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
