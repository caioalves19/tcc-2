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

  it("libera 5 tentativas na janela e bloqueia a 6ª até a janela acabar", async () => {
    const { consumirTentativa } = await import("../../src/lib/rate-limit");
    const chave = "teste:cinco";

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      expect(await consumirTentativa(chave, REGRA, AGORA)).toEqual({ bloqueado: false });
    }

    expect(await consumirTentativa(chave, REGRA, AGORA)).toEqual({
      bloqueado: true,
      liberaEm: new Date("2026-10-01T12:15:00.000Z"),
    });
  }, 60_000);

  it("passada a janela, a contagem reinicia", async () => {
    const { consumirTentativa } = await import("../../src/lib/rate-limit");
    const chave = "teste:janela";
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      await consumirTentativa(chave, REGRA, AGORA);
    }
    const depois = new Date("2026-10-01T12:15:00.000Z");

    expect(await consumirTentativa(chave, REGRA, depois)).toEqual({ bloqueado: false });

    const linha = await db.query(
      "SELECT tentativas, janela_inicio FROM rate_limit WHERE chave = $1",
      [chave],
    );
    expect(linha.rows).toEqual([{ tentativas: 1, janela_inicio: depois }]);
  }, 60_000);

  it("20 tentativas simultâneas: exatamente 5 liberadas", async () => {
    const { consumirTentativa } = await import("../../src/lib/rate-limit");
    const chave = "teste:concorrencia";

    const situacoes = await Promise.all(
      Array.from({ length: 20 }, () => consumirTentativa(chave, REGRA, AGORA)),
    );

    expect(situacoes.filter((situacao) => !situacao.bloqueado)).toHaveLength(5);
  }, 60_000);

  it("limparFalhas zera a contagem da chave", async () => {
    const { consumirTentativa, limparFalhas } = await import("../../src/lib/rate-limit");
    const chave = "teste:limpar";
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      await consumirTentativa(chave, REGRA, AGORA);
    }

    await limparFalhas(chave);

    expect(await consumirTentativa(chave, REGRA, AGORA)).toEqual({ bloqueado: false });
  }, 60_000);
});
