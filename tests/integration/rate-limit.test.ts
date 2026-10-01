import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prepararBancoDeTeste } from "./banco-de-teste";

const REGRA = { maximo: 5, janelaMs: 15 * 60 * 1000 };
const AGORA = new Date("2026-10-01T12:00:00.000Z");

describe("limite de tentativas no Postgres (RNF08)", () => {
  let db: Client;

  beforeAll(async () => {
    db = await prepararBancoDeTeste("kolo_pbi13_rl_test");
  }, 120_000);

  afterAll(async () => {
    await db.end();
  });

  it("bloqueia na 5ª falha dentro da janela, não antes", async () => {
    const { estaBloqueado, registrarFalha } = await import("../../src/lib/rate-limit");
    const chave = "teste:cinco";

    for (let falha = 0; falha < 4; falha++) {
      await registrarFalha(chave, REGRA, AGORA);
    }
    expect((await estaBloqueado(chave, REGRA, AGORA)).bloqueado).toBe(false);

    await registrarFalha(chave, REGRA, AGORA);

    expect(await estaBloqueado(chave, REGRA, AGORA)).toEqual({
      bloqueado: true,
      liberaEm: new Date("2026-10-01T12:15:00.000Z"),
    });
  }, 60_000);

  it("passada a janela, a próxima falha reinicia a contagem", async () => {
    const { estaBloqueado, registrarFalha } = await import("../../src/lib/rate-limit");
    const chave = "teste:janela";
    for (let falha = 0; falha < 5; falha++) {
      await registrarFalha(chave, REGRA, AGORA);
    }
    const depois = new Date("2026-10-01T12:15:00.000Z");

    expect((await estaBloqueado(chave, REGRA, depois)).bloqueado).toBe(false);
    await registrarFalha(chave, REGRA, depois);

    const linha = await db.query("SELECT falhas, janela_inicio FROM rate_limit WHERE chave = $1", [
      chave,
    ]);
    expect(linha.rows).toEqual([{ falhas: 1, janela_inicio: depois }]);
  }, 60_000);

  it("falhas simultâneas na mesma chave somam todas", async () => {
    const { registrarFalha } = await import("../../src/lib/rate-limit");
    const chave = "teste:concorrencia";

    await Promise.all(Array.from({ length: 5 }, () => registrarFalha(chave, REGRA, AGORA)));

    const linha = await db.query("SELECT falhas FROM rate_limit WHERE chave = $1", [chave]);
    expect(linha.rows).toEqual([{ falhas: 5 }]);
  }, 60_000);

  it("limparFalhas zera a contagem da chave", async () => {
    const { estaBloqueado, limparFalhas, registrarFalha } =
      await import("../../src/lib/rate-limit");
    const chave = "teste:limpar";
    for (let falha = 0; falha < 5; falha++) {
      await registrarFalha(chave, REGRA, AGORA);
    }

    await limparFalhas(chave);

    expect((await estaBloqueado(chave, REGRA, AGORA)).bloqueado).toBe(false);
    const linha = await db.query("SELECT falhas FROM rate_limit WHERE chave = $1", [chave]);
    expect(linha.rows).toEqual([]);
  }, 60_000);
});
