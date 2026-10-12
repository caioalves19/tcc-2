import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos, type ClienteTeste, type PedidoTeste } from "./pedidos-de-teste";

// PBI-43: o admin acha os pagamentos que esperam estorno e vê, no pedido, o que pode fazer.
let db: Client;
let admin: Headers;
let fabrica: ReturnType<typeof fabricaDePedidos>;
let obra: string;
let lucas: ClienteTeste;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi43_admin_estorno_test");
  ({ db, admin } = contas);
  fabrica = fabricaDePedidos(db, admin, contas.idAna);
  obra = await fabrica.obraPublicada("metropole", "4.800,00", 500);
  lucas = await fabrica.novoCliente("lucas@pbi43.test", "Lucas Silveira");
}, 120_000);
afterAll(async () => {
  await db?.end();
});
beforeEach(async () => {
  await db.query('TRUNCATE "order" CASCADE');
});

const dia = (d: number) => `2026-10-${String(d).padStart(2, "0")}T15:00:00Z`;
const pedido = (p: Omit<PedidoTeste, "obra">) => fabrica.pedidoDeTeste(lucas, { ...p, obra });
const marcar = (idExterno: string, motivo: string) =>
  db.query("UPDATE payment SET estornar_motivo = $2 WHERE id_externo = $1", [idExterno, motivo]);

it("PBI-43 filtro 'estorno pendente': pagamentos marcados pelo webhook e estornos que faltam concluir", async () => {
  const { listarPedidosAdmin } = await import("../../src/modules/orders");
  // Entram: aprovação de pedido cancelado e pedido pago cujo pagamento foi estornado no painel.
  await pedido({
    numero: "20261001-CANCE1",
    situacao: "CANCELADO",
    criadoEm: dia(1),
    pagamentos: ["APROVADO"],
  });
  await marcar("mp-20261001-CANCE1-1", "PEDIDO_NAO_PENDENTE");
  await pedido({
    numero: "20261002-PAINE1",
    situacao: "PAGO",
    criadoEm: dia(2),
    pagamentos: ["ESTORNADO"],
  });
  // Ficam de fora: pedido pago normal, estorno já resolvido e pedido já enviado.
  await pedido({
    numero: "20261003-NORMA1",
    situacao: "PAGO",
    criadoEm: dia(3),
    pagamentos: ["APROVADO"],
  });
  await pedido({
    numero: "20261004-RESOL1",
    situacao: "CANCELADO",
    criadoEm: dia(4),
    pagamentos: ["ESTORNADO"],
  });
  await marcar("mp-20261004-RESOL1-1", "PEDIDO_NAO_PENDENTE");
  await pedido({
    numero: "20261005-ENVIA1",
    situacao: "ENVIADO",
    criadoEm: dia(5),
    pagamentos: ["ESTORNADO"],
  });

  const lista = await listarPedidosAdmin({ filtro: "estorno-pendente" }, admin);

  expect(lista.ok && lista.dados.filtro).toBe("estorno-pendente");
  expect(lista.ok && lista.dados.pedidos.map((p) => p.numero)).toEqual([
    "20261002-PAINE1",
    "20261001-CANCE1",
  ]);
});

it("PBI-43 o detalhe diz se o pedido pode ser cancelado e o que fazer com cada pagamento", async () => {
  const { lerPedidoAdmin } = await import("../../src/modules/orders");
  await pedido({
    numero: "20261006-DOBRO1",
    situacao: "PAGO",
    criadoEm: dia(6),
    pagamentos: ["APROVADO", "APROVADO", "RECUSADO"],
  });
  await marcar("mp-20261006-DOBRO1-2", "PEDIDO_NAO_PENDENTE");
  await pedido({
    numero: "20261007-PIX001",
    situacao: "PENDENTE",
    criadoEm: dia(7),
    pagamentos: ["PENDENTE"],
  });
  await pedido({
    numero: "20261008-ENVIA1",
    situacao: "ENVIADO",
    criadoEm: dia(8),
    pagamentos: ["APROVADO"],
  });

  const pago = await lerPedidoAdmin("20261006-DOBRO1", admin);
  if (!pago.ok) throw new Error(pago.mensagem);
  expect(pago.dados.cancelavel).toBe(false);
  expect(
    pago.dados.pagamentos
      .map((p) => [p.idExterno, p.motivoEstorno, p.acaoEstorno])
      .sort(([a], [b]) => String(a).localeCompare(String(b))),
  ).toEqual([
    ["mp-20261006-DOBRO1-1", null, "estornar"],
    ["mp-20261006-DOBRO1-2", "PEDIDO_NAO_PENDENTE", "estornar"],
    ["mp-20261006-DOBRO1-3", null, null],
  ]);

  const pix = await lerPedidoAdmin("20261007-PIX001", admin);
  expect(pix.ok && pix.dados.cancelavel).toBe(true);
  expect(pix.ok && pix.dados.pagamentos.map((p) => p.acaoEstorno)).toEqual([null]);

  const enviado = await lerPedidoAdmin("20261008-ENVIA1", admin);
  expect(enviado.ok && enviado.dados.cancelavel).toBe(false);
  expect(enviado.ok && enviado.dados.pagamentos.map((p) => p.acaoEstorno)).toEqual([null]);
});

it("PBI-43 aprovação sem unidade livre de pedido já enviado sai do filtro (não há ação para ela)", async () => {
  const { listarPedidosAdmin } = await import("../../src/modules/orders");
  await pedido({
    numero: "20261009-ENVSE1",
    situacao: "ENVIADO",
    criadoEm: dia(9),
    pagamentos: ["APROVADO"],
  });
  await marcar("mp-20261009-ENVSE1-1", "SEM_ESTOQUE");

  const lista = await listarPedidosAdmin({ filtro: "estorno-pendente" }, admin);

  expect(lista.ok && lista.dados.pedidos.map((p) => p.numero)).toEqual([]);
});
