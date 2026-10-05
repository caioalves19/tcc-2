import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararBancoDeTeste } from "./banco-de-teste";

let db: Client;
beforeAll(async () => {
  db = await prepararBancoDeTeste("kolo_pbi15_test");
}, 120_000);
afterAll(async () => {
  await db?.end();
});

async function cliente(email: string) {
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const { makeSignature } = await import("better-auth/crypto");
  const resultado = await cadastrarCliente({
    nome: "Maria",
    email,
    telefone: "11987654321",
    senha: "senha-atual-123",
  });
  if (!resultado.ok) throw new Error("fixture falhou");
  const assinatura = await makeSignature(resultado.token, process.env.BETTER_AUTH_SECRET ?? "");
  return new Headers({
    cookie: `better-auth.session_token=${encodeURIComponent(`${resultado.token}.${assinatura}`)}`,
  });
}

it("RF04 edita somente o dono da sessão e revalida antes de persistir", async () => {
  const { atualizarPerfil, perfilDaRequisicao } = await import("../../src/lib/auth");
  const headers = await cliente("perfil@kolo.test");
  await cliente("outro@kolo.test");
  const entrada = {
    nome: " Maria Silva ",
    telefone: "(21) 98765-4321",
    email: "outro@kolo.test",
    role: "ADMIN",
  };
  expect(await atualizarPerfil(entrada, headers)).toEqual({ ok: true });
  expect(await perfilDaRequisicao(headers)).toEqual({
    nome: "Maria Silva",
    telefone: "21987654321",
  });
  expect(await atualizarPerfil({ nome: "", telefone: "123" }, headers)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(await atualizarPerfil(entrada, new Headers())).toEqual({
    ok: false,
    erro: "nao_autenticado",
  });
  expect(
    (await db.query('SELECT nome, papel FROM "user" WHERE email = $1', ["outro@kolo.test"])).rows,
  ).toEqual([{ nome: "Maria", papel: "CLIENTE" }]);
  expect(
    (await db.query('SELECT nome, papel FROM "user" WHERE email = $1', ["perfil@kolo.test"])).rows,
  ).toEqual([{ nome: "Maria Silva", papel: "CLIENTE" }]);
});

it("RF04 senha atual incorreta não altera credenciais; senha correta permite login com a nova", async () => {
  const { trocarSenha, abrirSessao, revogarSessao, sessaoDaRequisicao } =
    await import("../../src/lib/auth");
  const headers = await cliente("senha@kolo.test");
  const entrada = {
    senhaAtual: "errada-123",
    senha: "nova-senha-123",
    confirmacao: "nova-senha-123",
  };
  expect(await trocarSenha(entrada, headers)).toEqual({ ok: false, erro: "senha_atual_incorreta" });
  await expect(
    abrirSessao({ email: "senha@kolo.test", senha: "senha-atual-123" }),
  ).resolves.toHaveProperty("token");
  expect(await trocarSenha({ ...entrada, senhaAtual: "senha-atual-123" }, headers)).toEqual({
    ok: true,
  });
  await expect(
    abrirSessao({ email: "senha@kolo.test", senha: "senha-atual-123" }),
  ).rejects.toThrow();
  await expect(
    abrirSessao({ email: "senha@kolo.test", senha: "nova-senha-123" }),
  ).resolves.toHaveProperty("token");
  const sessao = await sessaoDaRequisicao(headers);
  if (!sessao) throw new Error("sessão ausente");
  await revogarSessao(sessao.token);
  expect(await trocarSenha(entrada, headers)).toEqual({ ok: false, erro: "nao_autenticado" });
});
