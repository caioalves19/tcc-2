import { execSync } from "node:child_process";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ADMIN_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_db";
const TEST_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_pbi12_test";
const SENHA = "senha-segura-1";

async function recreateTestDatabase(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kolo_pbi12_test' AND pid <> pg_backend_pid()",
  );
  await admin.query("DROP DATABASE IF EXISTS kolo_pbi12_test");
  await admin.query("CREATE DATABASE kolo_pbi12_test");
  await admin.end();
}

function runPrisma(command: string): void {
  execSync(command, {
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: "pipe",
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
  });
}

describe("cadastro público de cliente (RF01)", () => {
  let db: Client;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_URL;
    process.env.BETTER_AUTH_SECRET = "pbi-12-test-secret-32-characters-min";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    await recreateTestDatabase();
    runPrisma("npx prisma migrate deploy");
    db = new Client({ connectionString: TEST_URL });
    await db.connect();
  }, 120_000);

  afterAll(async () => {
    await db.end();
  });

  it("cria usuário CLIENTE com telefone, senha só como hash e sessão aberta", async () => {
    const { cadastrarCliente, papelDaSessao } = await import("../../src/lib/auth");
    const { verifyPassword } = await import("better-auth/crypto");

    const resultado = await cadastrarCliente({
      nome: "Maria Silva",
      email: "maria@kolo.test",
      telefone: "(11) 98765-4321",
      senha: SENHA,
    });

    expect(resultado.ok).toBe(true);
    const usuarios = await db.query<{ papel: string; nome: string; telefone: string }>(
      `SELECT papel, nome, telefone FROM "user" WHERE email = $1`,
      ["maria@kolo.test"],
    );
    expect(usuarios.rows).toEqual([
      { papel: "CLIENTE", nome: "Maria Silva", telefone: "11987654321" },
    ]);

    const contas = await db.query<{ senha_hash: string }>(
      `SELECT account.senha_hash
       FROM account
       JOIN "user" ON "user".id = account.user_id
       WHERE "user".email = $1`,
      ["maria@kolo.test"],
    );
    expect(contas.rows).toHaveLength(1);
    const hash = contas.rows[0]?.senha_hash ?? "";
    expect(hash).not.toContain(SENHA);
    expect(await verifyPassword({ hash, password: SENHA })).toBe(true);

    const sessoes = await db.query<{ token: string }>(
      `SELECT session.token
       FROM session
       JOIN "user" ON "user".id = session.user_id
       WHERE "user".email = $1`,
      ["maria@kolo.test"],
    );
    expect(sessoes.rows).toHaveLength(1);
    const token = resultado.ok ? resultado.token : "";
    expect(sessoes.rows[0]?.token).toBe(token);
    expect(await papelDaSessao(token)).toBe("CLIENTE");
  }, 60_000);

  it("e-mail já cadastrado (mesmo com maiúsculas) devolve erro amigável e não duplica", async () => {
    const { cadastrarCliente } = await import("../../src/lib/auth");
    const entrada = {
      nome: "Joana Souza",
      email: "joana@kolo.test",
      telefone: "11987654321",
      senha: SENHA,
    };
    expect((await cadastrarCliente(entrada)).ok).toBe(true);

    const repetido = await cadastrarCliente({ ...entrada, email: "Joana@KOLO.test" });

    expect(repetido).toEqual({ ok: false, erro: "email_duplicado" });
    const contagem = await db.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM "user" WHERE email = $1`,
      ["joana@kolo.test"],
    );
    expect(contagem.rows).toEqual([{ total: "1" }]);
  }, 60_000);

  it("ignora papel enviado pelo cliente: cadastro público é sempre CLIENTE", async () => {
    const { cadastrarCliente } = await import("../../src/lib/auth");
    const entrada = {
      nome: "Intrusa",
      email: "intrusa@kolo.test",
      telefone: "11987654321",
      senha: SENHA,
      role: "ADMIN",
    };

    expect((await cadastrarCliente(entrada)).ok).toBe(true);

    const usuarios = await db.query<{ papel: string }>(
      `SELECT papel FROM "user" WHERE email = $1`,
      ["intrusa@kolo.test"],
    );
    expect(usuarios.rows).toEqual([{ papel: "CLIENTE" }]);
  }, 60_000);

  it("revalida no servidor: telefone curto não grava nada", async () => {
    const { cadastrarCliente } = await import("../../src/lib/auth");

    const resultado = await cadastrarCliente({
      nome: "Telefone Curto",
      email: "curto@kolo.test",
      telefone: "119",
      senha: SENHA,
    });

    expect(resultado).toEqual({
      ok: false,
      erro: "invalido",
      campos: { telefone: "Informe o telefone com DDD." },
    });
    const contagem = await db.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM "user" WHERE email = $1`,
      ["curto@kolo.test"],
    );
    expect(contagem.rows).toEqual([{ total: "0" }]);
  }, 60_000);

  it("dois cadastros simultâneos com o mesmo e-mail: um entra, o outro recebe email_duplicado", async () => {
    const { cadastrarCliente } = await import("../../src/lib/auth");

    // A corrida depende do agendamento; várias rodadas deixam o teste determinístico na prática.
    for (let rodada = 0; rodada < 8; rodada++) {
      const email = `corrida${rodada}@kolo.test`;
      const entrada = { nome: "Corrida", email, telefone: "11987654321", senha: SENHA };

      const resultados = await Promise.all([cadastrarCliente(entrada), cadastrarCliente(entrada)]);

      expect(resultados.filter((resultado) => resultado.ok)).toHaveLength(1);
      expect(resultados.filter((resultado) => !resultado.ok)).toEqual([
        { ok: false, erro: "email_duplicado" },
      ]);
      const contagem = await db.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM "user" WHERE email = $1`,
        [email],
      );
      expect(contagem.rows).toEqual([{ total: "1" }]);
    }
  }, 60_000);
});
