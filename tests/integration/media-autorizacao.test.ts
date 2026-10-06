import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararBancoDeTeste } from "./banco-de-teste";

const SENHA = "senha-inicial-123";
let db: Client;
let admin: Headers;
let cliente: Headers;
let ana: Headers;
let bia: Headers;
let idAna: string;
let idBia: string;

async function comCookie(token: string) {
  const { makeSignature } = await import("better-auth/crypto");
  const assinatura = await makeSignature(token, process.env.BETTER_AUTH_SECRET ?? "");
  return new Headers({
    cookie: `better-auth.session_token=${encodeURIComponent(`${token}.${assinatura}`)}`,
  });
}

beforeAll(async () => {
  db = await prepararBancoDeTeste("kolo_pbi17_test");
  const { cadastrarCliente, abrirSessao } = await import("../../src/lib/auth");
  const { criarArtista } = await import("../../src/modules/artists");

  async function cadastrar(email: string) {
    const resultado = await cadastrarCliente({
      nome: "Pessoa",
      email,
      telefone: "11987654321",
      senha: SENHA,
    });
    if (!resultado.ok) throw new Error("Falha ao preparar usuário");
    return comCookie(resultado.token);
  }
  admin = await cadastrar("admin@pbi17.test");
  cliente = await cadastrar("cliente@pbi17.test");
  await db.query("UPDATE \"user\" SET papel = 'ADMIN' WHERE email = $1", ["admin@pbi17.test"]);

  for (const [slug, nome] of [
    ["ana", "Ana"],
    ["bia", "Bia"],
  ]) {
    const criado = await criarArtista(
      {
        modo: "novo",
        nome,
        email: `${slug}@pbi17.test`,
        telefone: "11987654321",
        senha: SENHA,
        slug,
        estilos: [],
      },
      admin,
    );
    if (!criado.ok) throw new Error(criado.mensagem);
  }
  const ids = await db.query("SELECT id, slug FROM artist");
  idAna = ids.rows.find((r) => r.slug === "ana").id;
  idBia = ids.rows.find((r) => r.slug === "bia").id;
  ana = await comCookie((await abrirSessao({ email: "ana@pbi17.test", senha: SENHA })).token);
  bia = await comCookie((await abrirSessao({ email: "bia@pbi17.test", senha: SENHA })).token);
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

it("RF27 só ADMIN envia para qualquer artista; ARTISTA só para si; visitante e CLIENTE não enviam", async () => {
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
    expect(await autorizarUpload(ana, { destino, artistId: idAna })).toEqual({ ok: true });
    expect(await autorizarUpload(ana, { destino, artistId: idBia })).toEqual({
      ok: false,
      erro: "proibido",
    });
    expect(await autorizarUpload(bia, { destino, artistId: idAna })).toEqual({
      ok: false,
      erro: "proibido",
    });
  }
});
