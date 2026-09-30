import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client, Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "../../generated/prisma/client";

const ADMIN_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_db";
const TEST_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_pbi11_test";
const EMAIL = "cliente.sessao@kolo.test";
const SENHA = "senha-segura-1";

async function recreateTestDatabase(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kolo_pbi11_test' AND pid <> pg_backend_pid()",
  );
  await admin.query("DROP DATABASE IF EXISTS kolo_pbi11_test");
  await admin.query("CREATE DATABASE kolo_pbi11_test");
  await admin.end();
}

function runPrisma(command: string): void {
  execSync(command, {
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: "pipe",
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
  });
}

async function criarClienteComSenha(email: string): Promise<void> {
  const { hashPassword } = await import("better-auth/crypto");
  const pool = new Pool({ connectionString: TEST_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const passwordHash = await hashPassword(SENHA);
  const user = await prisma.user.create({
    data: {
      role: "CLIENTE",
      name: "Cliente Sessao",
      email,
    },
  });
  await prisma.account.create({
    data: {
      userId: user.id,
      provider: "credential",
      externalId: user.id,
      passwordHash,
    },
  });
  await prisma.$disconnect();
  await pool.end();
}

describe("sessão Better Auth no Postgres (RF06)", () => {
  let db: Client;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_URL;
    process.env.BETTER_AUTH_SECRET = "pbi-11-test-secret-32-characters-min";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    await recreateTestDatabase();
    runPrisma("npx prisma migrate deploy");
    db = new Client({ connectionString: TEST_URL });
    await db.connect();
  }, 120_000);

  afterAll(async () => {
    await db.end();
  });

  it("grava a sessão no Postgres e devolve o papel CLIENTE", async () => {
    const { abrirSessao, papelDaSessao } = await import("../../src/lib/auth");
    await criarClienteComSenha(EMAIL);

    const { token } = await abrirSessao({ email: EMAIL, senha: SENHA });
    const sessoes = await db.query<{ token: string }>(
      `SELECT session.token
       FROM session
       JOIN "user" ON "user".id = session.user_id
       WHERE "user".email = $1`,
      [EMAIL],
    );

    expect(sessoes.rows).toEqual([{ token }]);
    expect(await papelDaSessao(token)).toBe("CLIENTE");
  }, 60_000);

  it("revoga a sessão e a leitura seguinte não autentica", async () => {
    const email = "cliente.revoga@kolo.test";
    const { abrirSessao, papelDaSessao, revogarSessao } = await import("../../src/lib/auth");
    await criarClienteComSenha(email);
    const { token } = await abrirSessao({ email, senha: SENHA });

    await revogarSessao(token);

    expect(await papelDaSessao(token)).toBeNull();
    const sessoes = await db.query<{ token: string }>(
      `SELECT session.token
       FROM session
       JOIN "user" ON "user".id = session.user_id
       WHERE "user".email = $1`,
      [email],
    );
    expect(sessoes.rows).toEqual([]);
  }, 60_000);
});
