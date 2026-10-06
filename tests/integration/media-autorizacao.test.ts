import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { comCookie, prepararContas, SENHA } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let cliente: Headers;
let ana: Headers;
let bia: Headers;
let idAna: string;
let idBia: string;

beforeAll(async () => {
  ({ db, admin, cliente, ana, bia, idAna, idBia } = await prepararContas("kolo_pbi17_test"));
}, 120_000);

afterAll(async () => {
  await db?.end();
});

it("RF27 revalida no banco: conta inativa, excluída, rebaixada ou sessão expirada perdem o acesso", async () => {
  const { autorizarUpload } = await import("../../src/modules/media");
  const alvo = { destino: "portfolio", artistId: idBia } as const;
  expect(await autorizarUpload(bia, alvo)).toEqual({ ok: true });

  const cenarios = [
    { alterar: "situacao = 'INATIVO'", restaurar: "situacao = 'ATIVO'" },
    { alterar: "excluido_em = now()", restaurar: "excluido_em = NULL" },
    { alterar: "papel = 'CLIENTE'", restaurar: "papel = 'ARTISTA'" },
  ];
  for (const { alterar, restaurar } of cenarios) {
    await db.query(`UPDATE "user" SET ${alterar} WHERE email = $1`, ["bia@pbi17.test"]);
    expect(await autorizarUpload(bia, alvo)).toEqual({ ok: false, erro: "proibido" });
    await db.query(`UPDATE "user" SET ${restaurar} WHERE email = $1`, ["bia@pbi17.test"]);
  }
  expect(await autorizarUpload(bia, alvo)).toEqual({ ok: true });

  await db.query(
    "UPDATE session SET expira_em = now() - interval '1 minute' WHERE user_id = (SELECT id FROM \"user\" WHERE email = $1)",
    ["bia@pbi17.test"],
  );
  expect(await autorizarUpload(bia, alvo)).toEqual({ ok: false, erro: "nao_autenticado" });

  // O Better Auth apaga a sessão vencida ao lê-la: os testes seguintes precisam de uma nova.
  const { abrirSessao } = await import("../../src/lib/auth");
  bia = await comCookie((await abrirSessao({ email: "bia@pbi17.test", senha: SENHA })).token);
});

it("RF27 recusa destino de artista que não existe, mesmo para ADMIN", async () => {
  const { autorizarUpload } = await import("../../src/modules/media");
  expect(
    await autorizarUpload(admin, {
      destino: "obras",
      artistId: "00000000-0000-4000-8000-000000000000",
    }),
  ).toEqual({ ok: false, erro: "artista_inexistente" });
});

it("RF27 só ADMIN envia para qualquer artista; visitante e CLIENTE não enviam", async () => {
  const { autorizarUpload } = await import("../../src/modules/media");

  for (const destino of ["obras", "portfolio"] as const) {
    expect(await autorizarUpload(new Headers(), { destino, artistId: idAna })).toEqual({
      ok: false,
      erro: "nao_autenticado",
    });
    expect(await autorizarUpload(cliente, { destino, artistId: idAna })).toEqual({
      ok: false,
      erro: "proibido",
    });
    expect(await autorizarUpload(admin, { destino, artistId: idAna })).toEqual({ ok: true });
    expect(await autorizarUpload(admin, { destino, artistId: idBia })).toEqual({ ok: true });
  }
});

// ESCOPO §7 e RN10: obras são geridas só pelo ADMIN; o artista gerencia o próprio portfólio.
it("RN10 ARTISTA envia só para o próprio portfólio, nunca para obras", async () => {
  const { autorizarUpload } = await import("../../src/modules/media");

  expect(await autorizarUpload(ana, { destino: "portfolio", artistId: idAna })).toEqual({
    ok: true,
  });
  for (const [cabecalhos, alvo] of [
    [ana, { destino: "portfolio", artistId: idBia }],
    [bia, { destino: "portfolio", artistId: idAna }],
    [ana, { destino: "obras", artistId: idAna }],
    [bia, { destino: "obras", artistId: idBia }],
  ] as const) {
    expect(await autorizarUpload(cabecalhos, alvo)).toEqual({ ok: false, erro: "proibido" });
  }
});
