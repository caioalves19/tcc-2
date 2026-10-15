import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let cliente: Headers;
let artista: Headers;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi39_configuracao_test");
  ({ db, admin, cliente } = contas);
  artista = contas.ana;
}, 120_000);
afterAll(async () => {
  await db?.end();
});
beforeEach(async () => {
  await db.query("DELETE FROM site_setting");
});

const ENTRADA = {
  contato: {
    email: "Contato@Kolo.Test",
    whatsapp: "+55 (11) 91234-5678",
    instagramAtelie: "@kolo.atelie",
    instagramTattoo: "kolo.tattoo",
  },
  horarios: "Ter a sex, 10h às 19h\nSáb, 10h às 16h",
  textos: {
    apresentacao: "Ateliê de arte urbana e estúdio de tatuagem em São Paulo.",
    tatuagem: "Um espaço para criar com calma.",
    murais: "Murais sob encomenda para casas e empresas.",
    rodape: "Arte urbana feita por pessoas reais.",
  },
};
const SALVO = {
  contato: {
    email: "contato@kolo.test",
    whatsapp: "5511912345678",
    instagramAtelie: "kolo.atelie",
    instagramTattoo: "kolo.tattoo",
  },
  horarios: ["Ter a sex, 10h às 19h", "Sáb, 10h às 16h"],
  textos: ENTRADA.textos,
};

it("RF31 sem nada salvo, o site usa os valores de hoje", async () => {
  const { lerConfiguracao, PADRAO } = await import("../../src/modules/settings");
  expect(await lerConfiguracao()).toEqual(PADRAO);
});

it("RF31 o ADMIN salva, o valor normalizado fica no banco e o site passa a usá-lo", async () => {
  const { lerConfiguracao, salvarConfiguracao } = await import("../../src/modules/settings");
  expect(await salvarConfiguracao(ENTRADA, admin)).toEqual({ ok: true, dados: SALVO });
  expect(await lerConfiguracao()).toEqual(SALVO);
  const { rows } = await db.query("SELECT chave, valor FROM site_setting ORDER BY chave");
  expect(rows).toEqual([
    { chave: "contato", valor: SALVO.contato },
    { chave: "horarios", valor: SALVO.horarios },
    { chave: "textos", valor: SALVO.textos },
  ]);

  // Salvar de novo substitui, sem duplicar linhas.
  const outro = { ...ENTRADA, horarios: "" };
  expect((await salvarConfiguracao(outro, admin)).ok).toBe(true);
  expect((await lerConfiguracao()).horarios).toEqual([]);
  expect((await db.query("SELECT COUNT(*)::int AS total FROM site_setting")).rows).toEqual([
    { total: 3 },
  ]);
});

it("RF31 só o ADMIN salva; entrada inválida não grava nada", async () => {
  const { lerConfiguracao, PADRAO, salvarConfiguracao } =
    await import("../../src/modules/settings");
  expect(await salvarConfiguracao(ENTRADA, new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  for (const quem of [cliente, artista])
    expect(await salvarConfiguracao(ENTRADA, quem)).toMatchObject({ ok: false, erro: "proibido" });
  expect(
    await salvarConfiguracao(
      { ...ENTRADA, contato: { ...ENTRADA.contato, whatsapp: "11 91234-5678" } },
      admin,
    ),
  ).toMatchObject({ ok: false, erro: "invalido", mensagem: expect.stringContaining("WhatsApp") });
  expect(await salvarConfiguracao({ ...ENTRADA, horarios: "a\nb\nc\nd\ne" }, admin)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect((await db.query("SELECT COUNT(*)::int AS total FROM site_setting")).rows).toEqual([
    { total: 0 },
  ]);
  expect(await lerConfiguracao()).toEqual(PADRAO);
});

it("RF31 valor corrompido no banco volta ao padrão só naquela chave", async () => {
  const { lerConfiguracao, PADRAO, salvarConfiguracao } =
    await import("../../src/modules/settings");
  expect((await salvarConfiguracao(ENTRADA, admin)).ok).toBe(true);
  await db.query(`UPDATE site_setting SET valor = '{"apresentacao": 42}' WHERE chave = 'textos'`);
  expect(await lerConfiguracao()).toEqual({ ...SALVO, textos: PADRAO.textos });
});
