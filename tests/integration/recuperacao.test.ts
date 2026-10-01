import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { MensagemEmail } from "../../src/lib/email";
import { prepararBancoDeTeste } from "./banco-de-teste";

const SENHA = "senha-segura-1";
const IP = "203.0.113.30";

// Provedor de e-mail falso: o Resend de verdade nunca é chamado nos testes.
const caixa: MensagemEmail[] = [];
let provedorFora = false;

async function criarCliente(email: string): Promise<void> {
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const resultado = await cadastrarCliente({
    nome: "Cliente Recupera",
    email,
    telefone: "11987654321",
    senha: SENHA,
  });
  if (!resultado.ok) {
    throw new Error(`fixture falhou: ${resultado.erro}`);
  }
}

function tokenDoLink(texto: string): string {
  const achado = /\/redefinir-senha\?token=([A-Za-z0-9_-]+)/.exec(texto);
  if (achado?.[1] === undefined) {
    throw new Error("e-mail sem link de redefinição");
  }
  return achado[1];
}

describe("recuperação de senha (RF03)", () => {
  let db: Client;

  beforeAll(async () => {
    db = await prepararBancoDeTeste("kolo_pbi14_test");
    const { usarEnviador } = await import("../../src/lib/email");
    usarEnviador({
      provedor: "teste",
      async enviar(mensagem) {
        if (provedorFora) {
          throw new Error("provedor fora do ar");
        }
        caixa.push(mensagem);
        return {};
      },
    });
  }, 120_000);

  beforeEach(() => {
    caixa.length = 0;
    provedorFora = false;
  });

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

  it("e-mail cadastrado recebe o link; o banco guarda só o hash do token", async () => {
    const { solicitarRecuperacao } = await import("../../src/lib/auth");
    const email = "recupera@kolo.test";
    await criarCliente(email);

    const resposta = await solicitarRecuperacao({ email: " Recupera@Kolo.test ", ip: IP });

    expect(resposta).toEqual({ ok: true });
    expect(caixa).toHaveLength(1);
    expect(caixa[0]?.para).toBe(email);
    const token = tokenDoLink(caixa[0]?.texto ?? "");
    expect(caixa[0]?.texto).toContain(`http://localhost:3000/redefinir-senha?token=${token}`);

    const verificacoes = await db.query<{ identificador: string; valor: string }>(
      "SELECT identificador, valor FROM verification",
    );
    expect(verificacoes.rows).toHaveLength(1);
    expect(verificacoes.rows[0]?.identificador).not.toContain(token);

    const logs = await db.query(
      `SELECT email_log.destinatario, email_log.template, email_log.situacao::text AS situacao,
              email_log.metadados, email_log.enviado_em IS NOT NULL AS enviado
       FROM email_log JOIN "user" ON "user".id = email_log.user_id
       WHERE "user".email = $1`,
      [email],
    );
    expect(logs.rows).toEqual([
      {
        destinatario: email,
        template: "recuperacao-senha",
        situacao: "ENVIADO",
        metadados: { provedor: "teste" },
        enviado: true,
      },
    ]);
    expect(JSON.stringify(logs.rows)).not.toContain(token);
  }, 60_000);

  it("e-mail sem conta recebe a mesma resposta e nada é enviado nem registrado", async () => {
    const { solicitarRecuperacao } = await import("../../src/lib/auth");
    const antes = await db.query("SELECT count(*)::int AS total FROM email_log");
    const verificacoesAntes = await db.query("SELECT count(*)::int AS total FROM verification");

    const resposta = await solicitarRecuperacao({ email: "ninguem@kolo.test", ip: IP });

    expect(resposta).toEqual({ ok: true });
    expect(caixa).toEqual([]);
    expect((await db.query("SELECT count(*)::int AS total FROM email_log")).rows).toEqual(
      antes.rows,
    );
    expect((await db.query("SELECT count(*)::int AS total FROM verification")).rows).toEqual(
      verificacoesAntes.rows,
    );
  }, 60_000);

  it("o 4º pedido na mesma hora (IP + e-mail) recebe a mesma resposta e não envia", async () => {
    const { solicitarRecuperacao } = await import("../../src/lib/auth");
    const email = "recupera.limite@kolo.test";
    await criarCliente(email);

    const respostas = [];
    for (let pedido = 0; pedido < 4; pedido++) {
      respostas.push(await solicitarRecuperacao({ email, ip: "198.51.100.40" }));
    }

    expect(respostas).toEqual([{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
    expect(caixa).toHaveLength(3);
    expect((await solicitarRecuperacao({ email, ip: "198.51.100.41" })).ok).toBe(true);
    expect(caixa).toHaveLength(4);
  }, 60_000);

  it("provedor fora do ar: email_log fica FALHO e a resposta continua neutra", async () => {
    const { solicitarRecuperacao } = await import("../../src/lib/auth");
    const email = "recupera.falha@kolo.test";
    await criarCliente(email);
    provedorFora = true;

    const resposta = await solicitarRecuperacao({ email, ip: IP });

    expect(resposta).toEqual({ ok: true });
    const logs = await db.query(
      `SELECT email_log.situacao::text AS situacao, email_log.metadados,
              email_log.enviado_em IS NULL AS sem_envio
       FROM email_log JOIN "user" ON "user".id = email_log.user_id
       WHERE "user".email = $1`,
      [email],
    );
    expect(logs.rows).toEqual([
      {
        situacao: "FALHO",
        metadados: { provedor: "teste", erro: "provedor fora do ar" },
        sem_envio: true,
      },
    ]);
  }, 60_000);

  it("token válido troca a senha, derruba todas as sessões e não pode ser reusado", async () => {
    const { entrar, papelDaSessao, redefinirSenha, solicitarRecuperacao } =
      await import("../../src/lib/auth");
    const email = "recupera.troca@kolo.test";
    await criarCliente(email);
    const login = await entrar({ email, senha: SENHA, ip: "198.51.100.50" });
    const sessaoAntiga = login.ok ? login.token : "";
    expect(await sessoesDe(email)).toHaveLength(2);
    await solicitarRecuperacao({ email, ip: "198.51.100.50" });
    const token = tokenDoLink(caixa[0]?.texto ?? "");

    const resultado = await redefinirSenha({
      token,
      senha: "senha-nova-123",
      confirmacao: "senha-nova-123",
    });

    expect(resultado).toEqual({ ok: true });
    expect(await sessoesDe(email)).toEqual([]);
    expect(await papelDaSessao(sessaoAntiga)).toBeNull();
    expect(await entrar({ email, senha: SENHA, ip: "198.51.100.51" })).toEqual({
      ok: false,
      erro: "credenciais_invalidas",
    });
    expect((await entrar({ email, senha: "senha-nova-123", ip: "198.51.100.51" })).ok).toBe(true);
    expect(
      await redefinirSenha({ token, senha: "outra-senha-456", confirmacao: "outra-senha-456" }),
    ).toEqual({ ok: false, erro: "token_invalido" });
  }, 60_000);
});
