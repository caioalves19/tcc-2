import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos, type ClienteTeste, type PedidoTeste } from "./pedidos-de-teste";

let db: Client;
let admin: Headers;
let cliente: Headers;
let artista: Headers;
let fabrica: ReturnType<typeof fabricaDePedidos>;
let obra: string;
let lucas: ClienteTeste;
let maria: ClienteTeste;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi30_admin_pedidos_test");
  ({ db, admin, cliente } = contas);
  artista = contas.ana;
  fabrica = fabricaDePedidos(db, admin, contas.idAna);
  obra = await fabrica.obraPublicada("metropole", "4.800,00", 500);
  lucas = await fabrica.novoCliente("lucas@pbi30.test", "Lucas Silveira");
  maria = await fabrica.novoCliente("maria@pbi30.test", "Maria Prado");
}, 120_000);
afterAll(async () => {
  await db?.end();
});
// Cada teste monta os próprios pedidos.
beforeEach(async () => {
  await db.query('TRUNCATE "order" CASCADE');
});

const dia = (d: number) => `2026-10-${String(d).padStart(2, "0")}T15:00:00Z`;
const pedido = (dono: ClienteTeste, p: Omit<PedidoTeste, "obra">) =>
  fabrica.pedidoDeTeste(dono, { ...p, obra });

it("RF29 só o admin consulta os pedidos", async () => {
  const { listarPedidosAdmin } = await import("../../src/modules/orders");
  expect(await listarPedidosAdmin({}, new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  expect(await listarPedidosAdmin({}, cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await listarPedidosAdmin({}, artista)).toMatchObject({ ok: false, erro: "proibido" });
});

it("RF29 abre em 'a fazer' (os mais antigos primeiro), filtra por situação e busca por número ou e-mail", async () => {
  const { listarPedidosAdmin } = await import("../../src/modules/orders");
  await pedido(lucas, {
    numero: "20261003-LUCAS1",
    situacao: "PAGO",
    criadoEm: dia(3),
    pagamentos: ["APROVADO"],
  });
  await pedido(lucas, {
    numero: "20261001-LUCAS2",
    situacao: "PROCESSANDO",
    criadoEm: dia(1),
    pagamentos: ["APROVADO"],
  });
  await pedido(lucas, {
    numero: "20261005-LUCAS3",
    situacao: "ENVIADO",
    criadoEm: dia(5),
    pagamentos: ["APROVADO"],
  });
  await pedido(lucas, { numero: "20261006-LUCAS4", situacao: "PENDENTE", criadoEm: dia(6) });
  await pedido(maria, {
    numero: "20261002-MARIA1",
    situacao: "PAGO",
    criadoEm: dia(2),
    pagamentos: ["APROVADO"],
  });
  await pedido(maria, {
    numero: "20261004-MARIA2",
    situacao: "CANCELADO",
    criadoEm: dia(4),
    pagamentos: ["RECUSADO"],
  });
  await pedido(maria, {
    numero: "20261007-MARIA3",
    situacao: "ENTREGUE",
    criadoEm: dia(7),
    pagamentos: ["APROVADO"],
  });

  const aFazer = await listarPedidosAdmin({}, admin);
  if (!aFazer.ok) throw new Error(aFazer.mensagem);
  expect(aFazer.dados).toMatchObject({
    filtro: "a-fazer",
    busca: "",
    pagina: 1,
    total: 3,
    totalPaginas: 1,
  });
  expect(aFazer.dados.pedidos).toEqual([
    {
      numero: "20261001-LUCAS2",
      criadoEm: new Date(dia(1)),
      cliente: { nome: "Lucas Silveira", email: "lucas@pbi30.test" },
      situacao: "EM_PREPARACAO",
      situacaoBanco: "PROCESSANDO",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
    expect.objectContaining({ numero: "20261002-MARIA1", situacao: "PAGO" }),
    expect.objectContaining({ numero: "20261003-LUCAS1", situacao: "PAGO" }),
  ]);

  const numeros = async (entrada: Record<string, unknown>) => {
    const resultado = await listarPedidosAdmin(entrada, admin);
    if (!resultado.ok) throw new Error(resultado.mensagem);
    return resultado.dados.pedidos.map((p) => `${p.numero}:${p.situacao}`);
  };
  // Os demais filtros mostram os mais recentes primeiro.
  expect(await numeros({ filtro: "pendentes" })).toEqual(["20261006-LUCAS4:NAO_CONCLUIDO"]);
  expect(await numeros({ filtro: "enviados" })).toEqual(["20261005-LUCAS3:ENVIADO"]);
  expect(await numeros({ filtro: "entregues" })).toEqual(["20261007-MARIA3:ENTREGUE"]);
  expect(await numeros({ filtro: "cancelados" })).toEqual(["20261004-MARIA2:CANCELADO"]);
  expect(await numeros({ filtro: "todos" })).toEqual([
    "20261007-MARIA3:ENTREGUE",
    "20261006-LUCAS4:NAO_CONCLUIDO",
    "20261005-LUCAS3:ENVIADO",
    "20261004-MARIA2:CANCELADO",
    "20261003-LUCAS1:PAGO",
    "20261002-MARIA1:PAGO",
    "20261001-LUCAS2:EM_PREPARACAO",
  ]);
  expect(await numeros({ filtro: "qualquer" })).toEqual(await numeros({}));

  // Busca por parte do número ou do e-mail, sem diferenciar maiúsculas; respeita o filtro.
  expect(await numeros({ filtro: "todos", busca: "  MARIA@pbi30 " })).toEqual([
    "20261007-MARIA3:ENTREGUE",
    "20261004-MARIA2:CANCELADO",
    "20261002-MARIA1:PAGO",
  ]);
  expect(await numeros({ filtro: "todos", busca: "lucas3" })).toEqual(["20261005-LUCAS3:ENVIADO"]);
  expect(await numeros({ busca: "maria" })).toEqual(["20261002-MARIA1:PAGO"]);
  expect(await numeros({ filtro: "todos", busca: "ninguem" })).toEqual([]);
});

it("RF29 pagina de 20 em 20", async () => {
  const { listarPedidosAdmin } = await import("../../src/modules/orders");
  for (let i = 1; i <= 21; i++)
    await pedido(lucas, {
      numero: `20261001-PAG${String(i).padStart(3, "0")}`,
      situacao: "PAGO",
      criadoEm: `2026-10-01T${String(i).padStart(2, "0")}:00:00Z`,
      pagamentos: ["APROVADO"],
    });
  const primeira = await listarPedidosAdmin({ pagina: "1" }, admin);
  const segunda = await listarPedidosAdmin({ pagina: 2 }, admin);
  if (!primeira.ok || !segunda.ok) throw new Error("falha ao listar");
  expect(primeira.dados).toMatchObject({ total: 21, totalPaginas: 2, pagina: 1 });
  expect(primeira.dados.pedidos).toHaveLength(20);
  expect(segunda.dados.pedidos.map((p) => p.numero)).toEqual(["20261001-PAG021"]);
  for (const pagina of ["abc", 0, -1, 1.5]) {
    const invalida = await listarPedidosAdmin({ pagina }, admin);
    expect(invalida.ok && invalida.dados.pagina, String(pagina)).toBe(1);
  }
});
