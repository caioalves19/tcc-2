import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prepararBancoDeTeste } from "./banco-de-teste";

const SENHA = "senha-segura-1";
const IP = "203.0.113.10";

// Monta o Cookie que o navegador devolveria depois do login (valor assinado com o segredo).
async function cabecalhosComSessao(token: string): Promise<Headers> {
  const { makeSignature } = await import("better-auth/crypto");
  const assinatura = await makeSignature(token, process.env.BETTER_AUTH_SECRET ?? "");
  const valor = encodeURIComponent(`${token}.${assinatura}`);
  return new Headers({ cookie: `better-auth.session_token=${valor}` });
}

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

  it("após 5 falhas no mesmo IP + e-mail, bloqueia até a senha certa e não abre sessão", async () => {
    const { entrar } = await import("../../src/lib/auth");
    const email = "login.bloqueio@kolo.test";
    await criarCliente(email);
    const antes = await sessoesDe(email);

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      expect((await entrar({ email, senha: "senha-errada-1", ip: IP })).ok).toBe(false);
    }
    const bloqueado = await entrar({ email, senha: SENHA, ip: IP });

    expect(bloqueado).toEqual({ ok: false, erro: "bloqueado", minutos: 15 });
    expect(await sessoesDe(email)).toEqual(antes);
    expect((await entrar({ email, senha: SENHA, ip: "198.51.100.7" })).ok).toBe(true);
  }, 60_000);

  it("login certo antes do bloqueio zera a contagem", async () => {
    const { entrar } = await import("../../src/lib/auth");
    const email = "login.zera@kolo.test";
    await criarCliente(email);

    for (let tentativa = 0; tentativa < 4; tentativa++) {
      await entrar({ email, senha: "senha-errada-1", ip: IP });
    }
    expect((await entrar({ email, senha: SENHA, ip: IP })).ok).toBe(true);
    for (let tentativa = 0; tentativa < 4; tentativa++) {
      await entrar({ email, senha: "senha-errada-1", ip: IP });
    }

    expect((await entrar({ email, senha: SENHA, ip: IP })).ok).toBe(true);
  }, 60_000);

  it("a chave do limite não guarda e-mail nem IP legíveis", async () => {
    const { entrar } = await import("../../src/lib/auth");
    await entrar({ email: "chave.hash@kolo.test", senha: "senha-errada-1", ip: IP });

    const chaves = await db.query<{ chave: string }>("SELECT chave FROM rate_limit");

    expect(chaves.rows.length).toBeGreaterThan(0);
    for (const { chave } of chaves.rows) {
      expect(chave).not.toContain("@");
      expect(chave).not.toContain(IP);
    }
  }, 60_000);

  it("variações de maiúsculas e espaços no e-mail contam na mesma chave", async () => {
    const { entrar } = await import("../../src/lib/auth");
    const email = "login.variacao@kolo.test";
    await criarCliente(email);
    const variacoes = [
      email,
      " Login.Variacao@kolo.test",
      "LOGIN.VARIACAO@KOLO.TEST ",
      email,
      email,
    ];

    for (const variacao of variacoes) {
      await entrar({ email: variacao, senha: "senha-errada-1", ip: IP });
    }

    expect(await entrar({ email, senha: SENHA, ip: IP })).toEqual({
      ok: false,
      erro: "bloqueado",
      minutos: 15,
    });
  }, 60_000);

  it("sair pelo cookie revoga a sessão: a requisição seguinte não autentica", async () => {
    const { entrar, sair, sessaoDaRequisicao } = await import("../../src/lib/auth");
    const email = "login.sair@kolo.test";
    await criarCliente(email);
    const login = await entrar({ email, senha: SENHA, ip: IP });
    const token = login.ok ? login.token : "";
    const cabecalhos = await cabecalhosComSessao(token);
    expect(await sessaoDaRequisicao(cabecalhos)).toEqual({ token, papel: "CLIENTE" });

    await sair(cabecalhos);

    expect(await sessoesDe(email)).not.toContain(token);
    expect(await sessaoDaRequisicao(cabecalhos)).toBeNull();
  }, 60_000);

  it("sem cookie, não há sessão e sair não quebra", async () => {
    const { sair, sessaoDaRequisicao } = await import("../../src/lib/auth");

    expect(await sessaoDaRequisicao(new Headers())).toBeNull();
    await expect(sair(new Headers())).resolves.toBeUndefined();
  }, 60_000);

  it("revalida no servidor: e-mail malformado não chega ao Better Auth nem conta falha", async () => {
    const { entrar } = await import("../../src/lib/auth");
    const antes = await db.query("SELECT chave, tentativas FROM rate_limit ORDER BY chave");

    const resultado = await entrar({ email: "sem-arroba", senha: SENHA, ip: "192.0.2.99" });

    expect(resultado).toEqual({ ok: false, erro: "credenciais_invalidas" });
    const depois = await db.query("SELECT chave, tentativas FROM rate_limit ORDER BY chave");
    expect(depois.rows).toEqual(antes.rows);
  }, 60_000);

  it("rajada simultânea de 20 senhas erradas: só 5 chegam a verificar, 15 são bloqueadas", async () => {
    const { entrar } = await import("../../src/lib/auth");
    const email = "login.rajada@kolo.test";
    await criarCliente(email);

    const resultados = await Promise.all(
      Array.from({ length: 20 }, () =>
        entrar({ email, senha: "senha-errada-1", ip: "198.51.100.20" }),
      ),
    );

    const erros = resultados.map((resultado) => (resultado.ok ? "ok" : resultado.erro));
    expect(erros.filter((erro) => erro === "credenciais_invalidas")).toHaveLength(5);
    expect(erros.filter((erro) => erro === "bloqueado")).toHaveLength(15);
  }, 60_000);
});
