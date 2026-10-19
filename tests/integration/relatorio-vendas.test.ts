import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos, type ClienteTeste, type PedidoTeste } from "./pedidos-de-teste";

let db: Client;
let admin: Headers;
let cliente: Headers;
let artista: Headers;
let fabrica: ReturnType<typeof fabricaDePedidos>;
let lucas: ClienteTeste;
let idAna: string;
let idBia: string;
// Obras da Ana (noite, rua) e da Bia (mar); o preço de cada item vem do pedido.
let noite: string;
let rua: string;
let mar: string;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi48_relatorio_vendas_test");
  ({ db, admin, cliente } = contas);
  artista = contas.ana;
  ({ idAna, idBia } = contas);
  fabrica = fabricaDePedidos(db, admin, contas.idAna);
  noite = await fabrica.obraPublicada("noite-azul", "1.000,00", 10);
  rua = await fabrica.obraPublicada("rua-velha", "2.000,00", 10);
  mar = await fabricaDePedidos(db, admin, contas.idBia).obraPublicada(
    "mar-de-dentro",
    "500,00",
    10,
  );
  lucas = await fabrica.novoCliente("lucas@pbi48.test", "Lucas Silveira");
}, 120_000);
afterAll(async () => {
  await db?.end();
});
// Cada teste monta os próprios pedidos.
beforeEach(async () => {
  await db.query('TRUNCATE "order" CASCADE');
});

const OUTUBRO = { periodo: "intervalo", de: "2026-10-01", ate: "2026-10-31" };
const pedido = (p: Omit<PedidoTeste, "obra" | "criadoEm"> & { criadoEm?: string }) =>
  fabrica.pedidoDeTeste(lucas, { criadoEm: "2026-10-10T14:00:00Z", ...p, obra: noite });

async function relatorio(entrada: unknown) {
  const { lerRelatorioVendas } = await import("../../src/modules/reports");
  const resultado = await lerRelatorioVendas(entrada, admin);
  if (!resultado.ok) throw new Error(resultado.mensagem);
  return resultado.dados;
}

it("RF32 só o admin lê o relatório de vendas", async () => {
  const { lerRelatorioVendas } = await import("../../src/modules/reports");
  expect(await lerRelatorioVendas({}, new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });
  expect(await lerRelatorioVendas({}, cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await lerRelatorioVendas({}, artista)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await lerRelatorioVendas({}, admin)).toMatchObject({ ok: true });
});

it("RF32 soma só os pedidos de Pago a Entregue, com o frete, pela data do pagamento", async () => {
  const pago = "2026-10-10T15:00:00Z";
  await pedido({
    numero: "20261010-PAGO01",
    situacao: "PAGO",
    pagoEm: pago,
    pagamentos: ["APROVADO"],
    itens: [{ obra: noite, precoCentavos: 100000, quantidade: 1 }],
    freteCentavos: 3000,
  });
  await pedido({
    numero: "20261010-PREP01",
    situacao: "PROCESSANDO",
    pagoEm: pago,
    pagamentos: ["APROVADO"],
    itens: [{ obra: mar, precoCentavos: 50000, quantidade: 2 }],
  });
  await pedido({
    numero: "20261010-ENVI01",
    situacao: "ENVIADO",
    pagoEm: pago,
    pagamentos: ["APROVADO"],
    itens: [{ obra: rua, precoCentavos: 200000, quantidade: 1 }],
    freteCentavos: 4500,
  });
  await pedido({
    numero: "20261010-ENTR01",
    situacao: "ENTREGUE",
    pagoEm: pago,
    pagamentos: ["APROVADO"],
    itens: [
      { obra: noite, precoCentavos: 100000, quantidade: 1 },
      { obra: mar, precoCentavos: 50000, quantidade: 1 },
    ],
  });
  // Pago duas vezes; o segundo pagamento foi estornado (PBI-43) e o pedido segue pago.
  await pedido({
    numero: "20261010-DUPL01",
    situacao: "PAGO",
    pagoEm: pago,
    pagamentos: ["APROVADO", "ESTORNADO"],
    itens: [{ obra: mar, precoCentavos: 50000, quantidade: 1 }],
  });
  // Fora: aguardando pagamento, tentativa abandonada e pago depois cancelado pelo estorno.
  await pedido({
    numero: "20261010-PEND01",
    situacao: "PENDENTE",
    pagamentos: ["PENDENTE"],
    itens: [{ obra: noite, precoCentavos: 100000, quantidade: 1 }],
  });
  await pedido({ numero: "20261010-ABAN01", situacao: "PENDENTE" });
  await pedido({
    numero: "20261010-CANC01",
    situacao: "CANCELADO",
    pagoEm: pago,
    pagamentos: ["ESTORNADO"],
    itens: [{ obra: rua, precoCentavos: 200000, quantidade: 1 }],
  });

  expect(await relatorio(OUTUBRO)).toMatchObject({
    periodo: { tipo: "intervalo", de: "2026-10-01", ate: "2026-10-31" },
    // 1.030 + 1.000 + 2.045 + 1.500 + 500 reais.
    faturamentoCentavos: 607500,
    pedidosPagos: 5,
    ticketMedioCentavos: 121500,
  });
});

it("RF32 o período vai da meia-noite do primeiro dia à do dia seguinte ao último, em São Paulo", async () => {
  // 30/09 às 23:59:59.999 em São Paulo: fora de outubro.
  await pedido({ numero: "20260930-ANTES1", situacao: "PAGO", pagoEm: "2026-10-01T02:59:59.999Z" });
  // Criado em setembro e pago à meia-noite de 01/10: vale a data do pagamento.
  await pedido({
    numero: "20260930-INICIO",
    situacao: "PAGO",
    criadoEm: "2026-09-30T23:00:00Z",
    pagoEm: "2026-10-01T03:00:00.000Z",
  });
  // 31/10 às 23:59:59.999 em São Paulo: ainda é outubro.
  await pedido({ numero: "20261031-FINAL1", situacao: "PAGO", pagoEm: "2026-11-01T02:59:59.999Z" });
  // Criado em outubro e pago à meia-noite de 01/11: fora.
  await pedido({
    numero: "20261031-DEPOIS",
    situacao: "PAGO",
    criadoEm: "2026-10-31T20:00:00Z",
    pagoEm: "2026-11-01T03:00:00.000Z",
  });

  // Os dois de dentro, com os 2 × R$ 4.800,00 do pedido de teste.
  expect(await relatorio(OUTUBRO)).toMatchObject({
    faturamentoCentavos: 1920000,
    pedidosPagos: 2,
  });
});

it("RF32 obras mais vendidas e faturamento por artista somam os itens, sem o frete", async () => {
  const pago = "2026-10-12T15:00:00Z";
  await pedido({
    numero: "20261012-OBRAS1",
    situacao: "PAGO",
    pagoEm: pago,
    itens: [{ obra: noite, precoCentavos: 100000, quantidade: 1 }],
    freteCentavos: 3000,
  });
  await pedido({
    numero: "20261012-OBRAS2",
    situacao: "ENTREGUE",
    pagoEm: pago,
    itens: [
      { obra: mar, precoCentavos: 50000, quantidade: 2 },
      { obra: noite, precoCentavos: 100000, quantidade: 1 },
    ],
  });
  await pedido({
    numero: "20261012-OBRAS3",
    situacao: "PROCESSANDO",
    pagoEm: pago,
    itens: [{ obra: rua, precoCentavos: 200000, quantidade: 2 }],
    freteCentavos: 4500,
  });
  await pedido({
    numero: "20261012-OBRAS4",
    situacao: "PAGO",
    pagoEm: pago,
    itens: [{ obra: mar, precoCentavos: 50000, quantidade: 1 }],
  });
  // Cancelado pelo estorno: não entra em nenhuma das somas.
  await pedido({
    numero: "20261012-OBRAS5",
    situacao: "CANCELADO",
    pagoEm: pago,
    itens: [{ obra: rua, precoCentavos: 200000, quantidade: 3 }],
  });
  // A obra arquivada depois da venda (PBI-18) continua no relatório.
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [rua]);

  const dados = await relatorio(OUTUBRO);
  // Com o frete: 1.030 + 2.000 + 4.045 + 500 reais.
  expect(dados.faturamentoCentavos).toBe(757500);
  // Mais unidades primeiro; empate em unidades, maior valor primeiro.
  expect(dados.obras).toEqual([
    {
      obraId: mar,
      titulo: "Obra mar-de-dentro",
      artista: "Bia",
      unidades: 3,
      valorCentavos: 150000,
    },
    { obraId: rua, titulo: "Obra rua-velha", artista: "Ana", unidades: 2, valorCentavos: 400000 },
    {
      obraId: noite,
      titulo: "Obra noite-azul",
      artista: "Ana",
      unidades: 2,
      valorCentavos: 200000,
    },
  ]);
  // Maior valor primeiro. Sem o frete, a soma (7.500 reais) não bate com o faturamento.
  expect(dados.artistas).toEqual([
    { artistaId: idAna, nome: "Ana", unidades: 4, valorCentavos: 600000 },
    { artistaId: idBia, nome: "Bia", unidades: 3, valorCentavos: 150000 },
  ]);
  await db.query("UPDATE artwork SET excluido_em = NULL WHERE id = $1", [rua]);
});

it("RF32 período sem venda tem tudo zerado e ticket médio vazio; o ticket arredonda ao centavo", async () => {
  // Pago em setembro: fora de outubro.
  await pedido({ numero: "20260915-SETEM1", situacao: "PAGO", pagoEm: "2026-09-15T15:00:00Z" });
  expect(await relatorio(OUTUBRO)).toMatchObject({
    faturamentoCentavos: 0,
    pedidosPagos: 0,
    ticketMedioCentavos: null,
    obras: [],
    artistas: [],
  });

  await pedido({
    numero: "20261020-TICKE1",
    situacao: "PAGO",
    pagoEm: "2026-10-20T15:00:00Z",
    itens: [{ obra: mar, precoCentavos: 50000, quantidade: 1 }],
  });
  await pedido({
    numero: "20261020-TICKE2",
    situacao: "PAGO",
    pagoEm: "2026-10-20T15:00:00Z",
    itens: [{ obra: mar, precoCentavos: 50001, quantidade: 1 }],
  });
  // R$ 1.000,01 em 2 pedidos: R$ 500,005 vira R$ 500,01.
  expect(await relatorio(OUTUBRO)).toMatchObject({
    faturamentoCentavos: 100001,
    pedidosPagos: 2,
    ticketMedioCentavos: 50001,
  });
});
