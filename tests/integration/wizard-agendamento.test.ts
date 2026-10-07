import { randomUUID } from "node:crypto";
import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararBancoDeTeste } from "./banco-de-teste";

let db: Client;
const artistaId = randomUUID();
const estiloId = randomUUID();
const tamanhoId = randomUUID();
beforeAll(async () => {
  db = await prepararBancoDeTeste("kolo_pbi31_test");
  for (const [nome, situacao, excluido] of [
    ["Ana", "ATIVO", null],
    ["Inativa", "INATIVO", null],
    ["Excluída", "ATIVO", new Date()],
  ] as const) {
    const userId = randomUUID();
    await db.query(
      `INSERT INTO "user" (id, papel, nome, email, situacao, excluido_em, atualizado_em)
       VALUES ($1, 'ARTISTA', $2, $3, $4, $5, NOW())`,
      [userId, nome, `${userId}@kolo.test`, situacao, excluido],
    );
    await db.query("INSERT INTO artist (id, user_id, slug) VALUES ($1, $2, $3)", [
      nome === "Ana" ? artistaId : randomUUID(),
      userId,
      userId,
    ]);
  }
  await db.query("INSERT INTO tattoo_style (id, nome, slug) VALUES ($1, 'Aquarela', 'aquarela')", [
    estiloId,
  ]);
  await db.query("INSERT INTO artist_style (artist_id, tattoo_style_id) VALUES ($1, $2)", [
    artistaId,
    estiloId,
  ]);
  await db.query(
    "INSERT INTO size_tier (id, nome, ordem) VALUES ($1, 'Grande', 3), ($2, 'Pequena', 1)",
    [randomUUID(), tamanhoId],
  );
}, 30_000);
afterAll(async () => {
  await db?.end();
});

it("RF20/RN01 fornece opções sem login, com vínculos reais e sem dados privados", async () => {
  const { carregarOpcoesWizard } = await import("../../src/modules/scheduling/index");
  const resultado = await carregarOpcoesWizard(new Headers({ "x-real-ip": "pbi31-opcoes" }));
  expect(resultado).toEqual({
    ok: true,
    dados: {
      artistas: [{ id: artistaId, nome: "Ana", estilos: [{ id: estiloId, nome: "Aquarela" }] }],
      tamanhos: [
        { id: tamanhoId, nome: "Pequena" },
        { id: expect.any(String), nome: "Grande" },
      ],
    },
  });
});

it("RF20 valida a preferência sem sessão e sem gravar pedido ou reservar agenda", async () => {
  const { revisarPreferenciaWizard } = await import("../../src/modules/scheduling/index");
  const entrada = {
    nome: "Maria",
    artistaId,
    estiloId,
    tamanhoId,
    regiao: "Antebraço",
    data: "2099-10-18",
    horario: "14:30",
  };
  expect(
    await revisarPreferenciaWizard(entrada, new Headers({ "x-real-ip": "pbi31-revisao" })),
  ).toEqual({
    ok: true,
    dados: { ...entrada, preferenciaEm: "2099-10-18T17:30:00.000Z" },
  });
  const total = await db.query("SELECT COUNT(*)::int AS total FROM appointment");
  expect(total.rows).toEqual([{ total: 0 }]);
  await db.query("DELETE FROM artist_style WHERE artist_id = $1", [artistaId]);
  const removido = await revisarPreferenciaWizard(
    entrada,
    new Headers({ "x-real-ip": "pbi31-revisao" }),
  );
  expect(removido).toEqual({
    ok: false,
    mensagem: "O estilo não está disponível para este artista. Atualize a página.",
  });
  await db.query("INSERT INTO artist_style (artist_id, tattoo_style_id) VALUES ($1, $2)", [
    artistaId,
    estiloId,
  ]);
});

it("RNF08 compartilha o limite entre consulta de opções e revisão da preferência", async () => {
  const { createHash } = await import("node:crypto");
  const { carregarOpcoesWizard, revisarPreferenciaWizard } =
    await import("../../src/modules/scheduling/index");
  const chave = `wizard:${createHash("sha256").update("pbi31-limite").digest("hex")}`;
  await db.query(
    "INSERT INTO rate_limit (chave, tentativas, janela_inicio) VALUES ($1, 59, NOW())",
    [chave],
  );
  const cabecalhos = new Headers({ "x-real-ip": "pbi31-limite" });
  expect((await revisarPreferenciaWizard({ nome: "inválido" }, cabecalhos)).ok).toBe(false);
  expect(await carregarOpcoesWizard(cabecalhos)).toEqual({
    ok: false,
    mensagem: "Muitas tentativas. Tente novamente em 10 minutos.",
  });
  await db.query(
    "UPDATE rate_limit SET janela_inicio = NOW() - INTERVAL '11 minutes' WHERE chave = $1",
    [chave],
  );
  expect((await carregarOpcoesWizard(cabecalhos)).ok).toBe(true);
});

it("o seed disponibiliza tamanhos iniciais sem duplicar ao repetir", async () => {
  // execSync passa pelo shell, como nos outros testes: no Windows o npx é npx.cmd e o
  // execFileSync("npx") falha com ENOENT.
  const { execSync } = await import("node:child_process");
  await db.query("DELETE FROM size_tier");
  const env = { ...process.env, SEED_ADMIN_PASSWORD: "" };
  execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
  const tamanhos = await db.query("SELECT nome FROM size_tier ORDER BY ordem");
  expect(tamanhos.rows).toEqual([{ nome: "Pequena" }, { nome: "Média" }, { nome: "Grande" }]);
}, 30_000);
