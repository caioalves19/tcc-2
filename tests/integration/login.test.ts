import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prepararBancoDeTeste } from "./banco-de-teste";

const SENHA = "senha-segura-1";
const IP = "203.0.113.10";

async function criarCliente(email: string): Promise<void> {
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const resultado = await cadastrarCliente({
    nome: "Cliente Login",
    email,
    telefone: "11987654321",
    senha: SENHA,
  });
  if (!resultado.ok) {
    throw new Error(`fixture falhou: ${resultado.erro}`);
  }
}

describe("login e logout (RF02)", () => {
  let db: Client;

  beforeAll(async () => {
    db = await prepararBancoDeTeste("kolo_pbi13_login_test");
  }, 120_000);

  afterAll(async () => {
    await db.end();
  });

  async function sessoesDe(email: string): Promise<string[]> {
    const resultado = await db.query<{ token: string }>(
      `SELECT session.token FROM session JOIN "user" ON "user".id = session.user_id
       WHERE "user".email = $1`,
      [email],
    );
    return resultado.rows.map((linha) => linha.token);
  }

  it("senha certa abre sessão no banco; senha errada dá erro genérico", async () => {
    const { entrar } = await import("../../src/lib/auth");
    const email = "login.certo@kolo.test";
    await criarCliente(email);
    const antes = await sessoesDe(email);

    const errado = await entrar({ email, senha: "senha-errada-1", ip: IP });
    expect(errado).toEqual({ ok: false, erro: "credenciais_invalidas" });

    const certo = await entrar({ email: "Login.Certo@kolo.test", senha: SENHA, ip: IP });
    expect(certo.ok).toBe(true);
    const token = certo.ok ? certo.token : "";
    expect(await sessoesDe(email)).toEqual([...antes, token]);
  }, 60_000);

  it("e-mail inexistente dá o mesmo erro genérico", async () => {
    const { entrar } = await import("../../src/lib/auth");

    const resultado = await entrar({ email: "ninguem@kolo.test", senha: SENHA, ip: IP });

    expect(resultado).toEqual({ ok: false, erro: "credenciais_invalidas" });
  }, 60_000);
});
