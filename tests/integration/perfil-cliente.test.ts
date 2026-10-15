import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import {
  ENDERECO_TESTE,
  fabricaDePedidos,
  type ClienteTeste,
  type PedidoTeste,
} from "./pedidos-de-teste";

let db: Client;
let admin: Headers;
let cliente: Headers;
let artista: Headers;
let fabrica: ReturnType<typeof fabricaDePedidos>;
let obra: string;
let lucas: ClienteTeste;
let maria: ClienteTeste;
let excluido: ClienteTeste;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi38_perfil_cliente_test");
  ({ db, admin, cliente } = contas);
  artista = contas.ana;
  fabrica = fabricaDePedidos(db, admin, contas.idAna);
  obra = await fabrica.obraPublicada("metropole", "4.800,00", 500);
  lucas = await fabrica.novoCliente("lucas@pbi38.test", "Lucas Silveira");
  maria = await fabrica.novoCliente("maria.prado@pbi38.test", "Maria Prado");
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

it("RF30 busca o cliente por parte do nome ou do e-mail, sem diferenciar maiúsculas", async () => {
  const { listarClientesAdmin } = await import("../../src/modules/customers");
  const nomes = async (busca: string) => {
    const resultado = await listarClientesAdmin({ busca }, admin);
    if (!resultado.ok) throw new Error(resultado.mensagem);
    expect(resultado.dados.busca).toBe(busca.trim());
    return resultado.dados.clientes.map((c) => c.nome);
  };
  expect(await nomes("PRADO")).toEqual(["Maria Prado"]);
  expect(await nomes("  silv ")).toEqual(["Lucas Silveira"]);
  expect(await nomes("Maria.Prado@PBI38")).toEqual(["Maria Prado"]);
  expect(await nomes("pbi38.test")).toEqual(["Lucas Silveira", "Maria Prado", "Zé Antigo"]);
  // O admin tem conta, mas não é cliente.
  expect(await nomes("admin@pbi17")).toEqual([]);
  expect(await nomes("ninguém")).toEqual([]);
});

const idDoEmail = async (email: string): Promise<string> =>
  (await db.query('SELECT id FROM "user" WHERE email = $1', [email])).rows[0].id;

it("RF30 o perfil traz os dados e o endereço de entrega do cliente", async () => {
  const { lerClienteAdmin } = await import("../../src/modules/customers");
  const perfil = await lerClienteAdmin(lucas.userId, admin);
  if (!perfil.ok) throw new Error(perfil.mensagem);
  expect(perfil.dados).toMatchObject({
    id: lucas.userId,
    nome: "Lucas Silveira",
    email: "lucas@pbi38.test",
    telefone: "11987654321",
    situacao: "ATIVO",
    cadastradoEm: expect.any(Date),
    excluido: false,
    // Como é gravado: CEP no formato 00000-000.
    endereco: { ...ENDERECO_TESTE, cep: "01327-000" },
  });

  // O cliente das contas nunca cadastrou endereço.
  const semEndereco = await lerClienteAdmin(await idDoEmail("cliente@pbi17.test"), admin);
  expect(semEndereco).toMatchObject({ ok: true, dados: { nome: "Pessoa", endereco: null } });

  const antigo = await lerClienteAdmin(excluido.userId, admin);
  expect(antigo).toMatchObject({ ok: true, dados: { nome: "Zé Antigo", excluido: true } });
});

it("RF30 só o admin abre o perfil; id inválido, inexistente ou de quem não é cliente não é encontrado", async () => {
  const { lerClienteAdmin } = await import("../../src/modules/customers");
  expect(await lerClienteAdmin(lucas.userId, new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  expect(await lerClienteAdmin(lucas.userId, cliente)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await lerClienteAdmin(lucas.userId, artista)).toMatchObject({
    ok: false,
    erro: "proibido",
  });

  for (const id of [
    "nao-e-uuid",
    "",
    42,
    null,
    "6f1c2a8e-0000-4000-8000-000000000000",
    await idDoEmail("admin@pbi17.test"),
    await idDoEmail("ana@pbi17.test"),
  ])
    expect(await lerClienteAdmin(id, admin)).toMatchObject({ ok: false, erro: "nao_encontrado" });
});

const dia = (d: number) => `2026-10-${String(d).padStart(2, "0")}T15:00:00Z`;
const pedido = (dono: ClienteTeste, p: Omit<PedidoTeste, "obra">) =>
  fabrica.pedidoDeTeste(dono, { ...p, obra });

it("RF30 o histórico traz todos os pedidos do cliente, e só os dele, do mais recente ao mais antigo", async () => {
  const { lerClienteAdmin } = await import("../../src/modules/customers");
  await db.query('TRUNCATE "order" CASCADE');
  await pedido(lucas, {
    numero: "20261001-LUCAS1",
    situacao: "ENTREGUE",
    criadoEm: dia(1),
    pagamentos: ["APROVADO"],
  });
  // Tentativa sem pagamento: o cliente não a vê, o admin sim, como "Não concluído".
  await pedido(lucas, { numero: "20261003-LUCAS2", situacao: "PENDENTE", criadoEm: dia(3) });
  await pedido(lucas, {
    numero: "20261002-LUCAS3",
    situacao: "CANCELADO",
    criadoEm: dia(2),
    pagamentos: ["RECUSADO"],
  });
  await pedido(lucas, {
    numero: "20261004-LUCAS4",
    situacao: "PAGO",
    criadoEm: dia(4),
    pagamentos: ["APROVADO"],
    excluido: true,
  });
  await pedido(maria, {
    numero: "20261005-MARIA1",
    situacao: "PAGO",
    criadoEm: dia(5),
    pagamentos: ["APROVADO"],
  });

  const perfil = await lerClienteAdmin(lucas.userId, admin);
  if (!perfil.ok) throw new Error(perfil.mensagem);
  expect(perfil.dados.pedidos).toEqual([
    {
      numero: "20261003-LUCAS2",
      criadoEm: new Date(dia(3)),
      situacao: "NAO_CONCLUIDO",
      situacaoBanco: "PENDENTE",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
    expect.objectContaining({ numero: "20261002-LUCAS3", situacao: "CANCELADO" }),
    expect.objectContaining({ numero: "20261001-LUCAS1", situacao: "ENTREGUE" }),
  ]);

  const semCompras = await lerClienteAdmin(excluido.userId, admin);
  expect(semCompras).toMatchObject({ ok: true, dados: { pedidos: [] } });
});
