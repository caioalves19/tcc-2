import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import {
  ENDERECO_TESTE as ENDERECO,
  fabricaDePedidos,
  type ClienteTeste,
  type PedidoTeste,
} from "./pedidos-de-teste";

let db: Client;
let fabrica: ReturnType<typeof fabricaDePedidos>;
let obraId: string;
let outraObra: string;
let terceiraObra: string;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi29_pedidos_test");
  db = contas.db;
  fabrica = fabricaDePedidos(db, contas.admin, contas.idAna);
  obraId = await fabrica.obraPublicada("metropole", "4.800,00", 50);
  outraObra = await fabrica.obraPublicada("retalho", "4.800,00", 50);
  terceiraObra = await fabrica.obraPublicada("muro", "4.800,00", 50);
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const AGORA = new Date("2026-09-30T12:00:00Z");

const novoCliente = (email: string) => fabrica.novoCliente(email);
// Sem obra informada, o pedido usa a "metropole".
const pedidoDeTeste = (cliente: ClienteTeste, p: Omit<PedidoTeste, "obra"> & { obra?: string }) =>
  fabrica.pedidoDeTeste(cliente, { ...p, obra: p.obra ?? obraId });

it("RF16 lista só os pedidos visíveis do próprio cliente, do mais recente ao mais antigo", async () => {
  const { listarMeusPedidos } = await import("../../src/modules/orders");
  const lucas = await novoCliente("lucas@pbi29.test");
  const outro = await novoCliente("outro@pbi29.test");
  const dia = (d: number) => `2026-09-${String(d).padStart(2, "0")}T15:00:00Z`;

  await pedidoDeTeste(lucas, {
    numero: "20260901-ENVIAD",
    situacao: "ENVIADO",
    criadoEm: dia(1),
    pagamentos: ["APROVADO"],
    rastreio: "BR123456789SP",
  });
  await pedidoDeTeste(lucas, {
    numero: "20260905-CANREC",
    situacao: "CANCELADO",
    criadoEm: dia(5),
    pagamentos: ["RECUSADO"],
  });
  await pedidoDeTeste(lucas, {
    numero: "20260910-PAGO22",
    situacao: "PAGO",
    criadoEm: dia(10),
    pagamentos: ["APROVADO"],
  });
  await pedidoDeTeste(lucas, {
    numero: "20260920-PIXABE",
    situacao: "PENDENTE",
    criadoEm: dia(20),
    pagamentos: ["PENDENTE"],
  });
  await pedidoDeTeste(lucas, {
    numero: "20260925-RESERV",
    situacao: "PENDENTE",
    criadoEm: dia(25),
    reservaAte: "2026-09-30T12:05:00Z",
  });
  // Ocultos: abandonado, cancelado por novo checkout, reserva vencida e pedido excluído.
  await pedidoDeTeste(lucas, {
    numero: "20260926-ABANDO",
    situacao: "PENDENTE",
    criadoEm: dia(26),
    obra: outraObra,
  });
  await pedidoDeTeste(lucas, {
    numero: "20260927-CANNOV",
    situacao: "CANCELADO",
    criadoEm: dia(27),
  });
  await pedidoDeTeste(lucas, {
    numero: "20260928-VENCID",
    situacao: "PENDENTE",
    criadoEm: dia(28),
    reservaAte: "2026-09-30T11:55:00Z",
    obra: terceiraObra,
  });
  await pedidoDeTeste(lucas, {
    numero: "20260929-EXCLUI",
    situacao: "PAGO",
    criadoEm: dia(29),
    pagamentos: ["APROVADO"],
    excluido: true,
  });
  await pedidoDeTeste(outro, {
    numero: "20260915-OUTRO2",
    situacao: "PAGO",
    criadoEm: dia(15),
    pagamentos: ["APROVADO"],
  });

  expect(await listarMeusPedidos(lucas, AGORA)).toEqual([
    {
      numero: "20260925-RESERV",
      criadoEm: new Date(dia(25)),
      situacao: "AGUARDANDO_PAGAMENTO",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260920-PIXABE",
      criadoEm: new Date(dia(20)),
      situacao: "AGUARDANDO_PAGAMENTO",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260910-PAGO22",
      criadoEm: new Date(dia(10)),
      situacao: "PAGO",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260905-CANREC",
      criadoEm: new Date(dia(5)),
      situacao: "CANCELADO",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260901-ENVIAD",
      criadoEm: new Date(dia(1)),
      situacao: "ENVIADO",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
  ]);
  expect((await listarMeusPedidos(outro, AGORA))?.map((p) => p.numero)).toEqual([
    "20260915-OUTRO2",
  ]);
  expect(await listarMeusPedidos({ cabecalhos: new Headers() }, AGORA)).toBeNull();
});

it("RF16/RN03 o pedido recém-finalizado aguarda pagamento e some quando a reserva vence sem pagamento", async () => {
  const { adicionarAoCarrinho, finalizarCompra, listarMeusPedidos } =
    await import("../../src/modules/orders");
  const bia = await novoCliente("bia@pbi29.test");
  const adicionado = await adicionarAoCarrinho({ obraId, quantidade: 1 }, bia);
  if (!adicionado.ok) throw new Error(adicionado.mensagem);
  const finalizado = await finalizarCompra({ modalidade: "RETIRADA" }, bia, { agora: AGORA });
  if (!finalizado.ok) throw new Error(finalizado.mensagem);

  const umMinutoDepois = new Date(AGORA.getTime() + 60_000);
  expect(await listarMeusPedidos(bia, umMinutoDepois)).toEqual([
    {
      numero: finalizado.dados.numero,
      criadoEm: expect.any(Date),
      situacao: "AGUARDANDO_PAGAMENTO",
      modalidade: "RETIRADA",
      totalCentavos: 480000,
      unidades: 1,
    },
  ]);
  const onzeMinutosDepois = new Date(AGORA.getTime() + 11 * 60_000);
  expect(await listarMeusPedidos(bia, onzeMinutosDepois)).toEqual([]);
});

it("RF16 o detalhe traz itens, valores, situação, datas e rastreio, e só para o dono", async () => {
  const { lerMeuPedido } = await import("../../src/modules/orders");
  const carla = await novoCliente("carla@pbi29.test");
  const davi = await novoCliente("davi@pbi29.test");
  await pedidoDeTeste(carla, {
    numero: "20260902-CARLA2",
    situacao: "ENVIADO",
    criadoEm: "2026-09-02T15:00:00Z",
    pagamentos: ["APROVADO"],
    rastreio: "BR987654321SP",
    pagoEm: "2026-09-02T15:05:00Z",
    enviadoEm: "2026-09-04T10:00:00Z",
  });
  await pedidoDeTeste(carla, {
    numero: "20260929-RESERV",
    situacao: "PENDENTE",
    criadoEm: "2026-09-29T15:00:00Z",
    reservaAte: "2026-09-30T12:05:00Z",
  });
  await pedidoDeTeste(carla, {
    numero: "20260926-CABAND",
    situacao: "PENDENTE",
    criadoEm: "2026-09-26T15:00:00Z",
    obra: outraObra,
  });
  await pedidoDeTeste(davi, {
    numero: "20260903-DAVI22",
    situacao: "PAGO",
    criadoEm: "2026-09-03T15:00:00Z",
    pagamentos: ["APROVADO"],
  });

  expect(await lerMeuPedido("20260902-CARLA2", carla, AGORA)).toEqual({
    numero: "20260902-CARLA2",
    criadoEm: new Date("2026-09-02T15:00:00Z"),
    situacao: "ENVIADO",
    modalidade: "RETIRADA",
    itens: [{ titulo: "Metrópole em chamas", precoCentavos: 480000, quantidade: 2 }],
    subtotalCentavos: 960000,
    freteCentavos: 0,
    totalCentavos: 960000,
    endereco: ENDERECO,
    rastreio: "BR987654321SP",
    pagoEm: new Date("2026-09-02T15:05:00Z"),
    enviadoEm: new Date("2026-09-04T10:00:00Z"),
  });
  expect(await lerMeuPedido("20260929-RESERV", carla, AGORA)).toMatchObject({
    situacao: "AGUARDANDO_PAGAMENTO",
    rastreio: null,
    pagoEm: null,
    enviadoEm: null,
  });

  // RN01: pedido alheio, oculto, inexistente, visitante e número fora do formato dão a mesma
  // resposta, sem revelar que o pedido existe.
  expect(await lerMeuPedido("20260903-DAVI22", carla, AGORA)).toBeNull();
  expect(await lerMeuPedido("20260902-CARLA2", davi, AGORA)).toBeNull();
  expect(await lerMeuPedido("20260926-CABAND", carla, AGORA)).toBeNull();
  expect(await lerMeuPedido("20260101-NADA22", carla, AGORA)).toBeNull();
  expect(await lerMeuPedido("20260902-CARLA2", { cabecalhos: new Headers() }, AGORA)).toBeNull();
  for (const numero of [undefined, 42, "", "x".repeat(33)])
    expect(await lerMeuPedido(numero, carla, AGORA), String(numero)).toBeNull();
});
