import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos, type ClienteTeste } from "./pedidos-de-teste";

let db: Client;
let admin: Headers;
let cliente: Headers;
let artista: Headers;
let fabrica: ReturnType<typeof fabricaDePedidos>;
let lucas: ClienteTeste;
let excluido: ClienteTeste;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi38_perfil_cliente_test");
  ({ db, admin, cliente } = contas);
  artista = contas.ana;
  fabrica = fabricaDePedidos(db, admin, contas.idAna);
  lucas = await fabrica.novoCliente("lucas@pbi38.test", "Lucas Silveira");
  await fabrica.novoCliente("maria.prado@pbi38.test", "Maria Prado");
  excluido = await fabrica.novoCliente("ze@pbi38.test", "Zé Antigo");
  await db.query(`UPDATE "user" SET excluido_em = '2026-10-10T12:00:00Z' WHERE id = $1`, [
    excluido.userId,
  ]);
}, 120_000);
afterAll(async () => {
  await db?.end();
});

it("RF30 só o admin consulta os clientes", async () => {
  const { listarClientesAdmin } = await import("../../src/modules/customers");
  expect(await listarClientesAdmin({}, new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  expect(await listarClientesAdmin({}, cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await listarClientesAdmin({}, artista)).toMatchObject({ ok: false, erro: "proibido" });
});

it("RF30 lista só os clientes, por nome, e marca a conta excluída", async () => {
  const { listarClientesAdmin } = await import("../../src/modules/customers");
  const resultado = await listarClientesAdmin({}, admin);
  if (!resultado.ok) throw new Error(resultado.mensagem);
  // ADMIN e as artistas Ana e Bia ficam de fora; "Pessoa" é o cliente@pbi17.test das contas.
  expect(resultado.dados).toMatchObject({ total: 4, pagina: 1, totalPaginas: 1, busca: "" });
  expect(resultado.dados.clientes.map((c) => [c.nome, c.email, c.excluido])).toEqual([
    ["Lucas Silveira", "lucas@pbi38.test", false],
    ["Maria Prado", "maria.prado@pbi38.test", false],
    ["Pessoa", "cliente@pbi17.test", false],
    ["Zé Antigo", "ze@pbi38.test", true],
  ]);
  expect(resultado.dados.clientes[0]).toEqual({
    id: lucas.userId,
    nome: "Lucas Silveira",
    email: "lucas@pbi38.test",
    cadastradoEm: expect.any(Date),
    excluido: false,
  });
});
