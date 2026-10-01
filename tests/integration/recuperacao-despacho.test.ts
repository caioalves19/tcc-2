import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { MensagemEmail } from "../../src/lib/email";
import { prepararBancoDeTeste } from "./banco-de-teste";

// Simula uma requisição do Next: o after() só guarda a tarefa, como faria até a resposta sair.
const { tarefas } = vi.hoisted(() => ({ tarefas: [] as Array<() => Promise<void>> }));
vi.mock("next/server", () => ({
  after: (tarefa: () => Promise<void>) => {
    tarefas.push(tarefa);
  },
}));

const caixa: MensagemEmail[] = [];

describe("pedido de recuperação dentro de uma requisição (RF03)", () => {
  let db: Client;

  beforeAll(async () => {
    db = await prepararBancoDeTeste("kolo_pbi14_despacho_test");
    const { usarEnviador } = await import("../../src/lib/email");
    usarEnviador({
      provedor: "teste",
      async enviar(mensagem) {
        caixa.push(mensagem);
        return {};
      },
    });
  }, 120_000);

  afterAll(async () => {
    await db.end();
  });

  async function verificacoes(): Promise<number> {
    const resultado = await db.query<{ total: number }>(
      "SELECT count(*)::int AS total FROM verification",
    );
    return resultado.rows[0]?.total ?? -1;
  }

  it("a resposta sai antes de consultar a conta, criar o token ou enviar o e-mail", async () => {
    const { cadastrarCliente, solicitarRecuperacao } = await import("../../src/lib/auth");
    const email = "despacho@kolo.test";
    const cadastro = await cadastrarCliente({
      nome: "Cliente Despacho",
      email,
      telefone: "11987654321",
      senha: "senha-segura-1",
    });
    expect(cadastro.ok).toBe(true);

    const resposta = await solicitarRecuperacao({ email, ip: "203.0.113.120" });

    expect(resposta).toEqual({ ok: true });
    expect(tarefas).toHaveLength(1);
    expect(caixa).toEqual([]);
    expect(await verificacoes()).toBe(0);

    await tarefas[0]?.();

    expect(caixa).toHaveLength(1);
    expect(await verificacoes()).toBe(1);
  }, 60_000);
});
