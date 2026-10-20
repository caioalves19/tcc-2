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
let obra: string;
let idAna: string;
let idBia: string;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi48_painel_admin_test");
  ({ db, admin, cliente } = contas);
  artista = contas.ana;
  ({ idAna, idBia } = contas);
  fabrica = fabricaDePedidos(db, admin, contas.idAna);
  obra = await fabrica.obraPublicada("noite-azul", "1.000,00", 10);
  lucas = await fabrica.novoCliente("lucas@pbi48.test", "Lucas Silveira");
}, 120_000);
afterAll(async () => {
  await db?.end();
});
// Cada teste monta os próprios pedidos.
beforeEach(async () => {
  await db.query('TRUNCATE "order" CASCADE');
});

// Segunda-feira, 19/10/2026, ao meio-dia em São Paulo.
const AGORA = new Date("2026-10-19T15:00:00Z");
const pedido = (p: Omit<PedidoTeste, "obra">) => fabrica.pedidoDeTeste(lucas, { ...p, obra });

async function painel(agora = AGORA) {
  const { lerPainel } = await import("../../src/modules/reports");
  const resultado = await lerPainel(admin, agora);
  if (!resultado.ok) throw new Error(resultado.mensagem);
  return resultado.dados;
}

it("RF32 só o admin lê o painel", async () => {
  const { lerPainel } = await import("../../src/modules/reports");
  expect(await lerPainel(new Headers())).toMatchObject({ ok: false, erro: "nao_autenticado" });
  expect(await lerPainel(cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await lerPainel(artista)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await lerPainel(admin)).toMatchObject({ ok: true });
});

it("RF32 as vendas do painel são as do mês corrente, pela data do pagamento", async () => {
  await pedido({
    numero: "20261005-OUTUB1",
    situacao: "PAGO",
    criadoEm: "2026-10-05T14:00:00Z",
    pagoEm: "2026-10-05T15:00:00Z",
  });
  await pedido({
    numero: "20261012-OUTUB2",
    situacao: "ENTREGUE",
    criadoEm: "2026-10-12T14:00:00Z",
    pagoEm: "2026-10-12T15:00:00Z",
    itens: [{ obra, precoCentavos: 100000, quantidade: 1 }],
    freteCentavos: 2000,
  });
  // Criado em setembro e pago às 23h de 30/09 em São Paulo: fica fora de outubro.
  await pedido({
    numero: "20260930-SETEM1",
    situacao: "PAGO",
    criadoEm: "2026-09-30T20:00:00Z",
    pagoEm: "2026-10-01T02:00:00Z",
  });

  expect(await painel()).toMatchObject({
    periodo: { tipo: "este-mes", de: "2026-10-01", ate: "2026-10-19" },
    // 9.600 + 1.020 reais.
    vendas: { faturamentoCentavos: 1062000, pedidosPagos: 2, ticketMedioCentavos: 531000 },
  });
});

it("RF32 cada contagem de pedidos é o total da lista do admin com o mesmo filtro", async () => {
  const { listarPedidosAdmin } = await import("../../src/modules/orders");
  const dia = "2026-10-15T15:00:00Z";
  const pago = { criadoEm: dia, pagoEm: dia, pagamentos: ["APROVADO" as const] };
  await pedido({ numero: "20261015-PAGO01", situacao: "PAGO", ...pago });
  await pedido({ numero: "20261015-PREP01", situacao: "PROCESSANDO", ...pago });
  await pedido({ numero: "20261015-ENVI01", situacao: "ENVIADO", ...pago });
  await pedido({ numero: "20261015-ENVI02", situacao: "ENVIADO", ...pago });
  await pedido({ numero: "20261015-ENTR01", situacao: "ENTREGUE", ...pago });
  await pedido({
    numero: "20261015-AGUA01",
    situacao: "PENDENTE",
    criadoEm: dia,
    pagamentos: ["PENDENTE"],
  });
  // Tentativa abandonada: o filtro "Pendentes" também a mostra.
  await pedido({ numero: "20261015-ABAN01", situacao: "PENDENTE", criadoEm: dia });
  await pedido({
    numero: "20261015-CANC01",
    situacao: "CANCELADO",
    criadoEm: dia,
    pagamentos: ["RECUSADO"],
  });
  // Aprovação de pedido já cancelado: o webhook pede estorno (PBI-43).
  const aprovadoTarde = await pedido({
    numero: "20261015-CANC02",
    situacao: "CANCELADO",
    criadoEm: dia,
    pagamentos: ["APROVADO"],
  });
  await db.query("UPDATE payment SET estornar_motivo = 'PEDIDO_NAO_PENDENTE' WHERE order_id = $1", [
    aprovadoTarde,
  ]);
  // Pedido excluído não aparece em lugar nenhum.
  await pedido({ numero: "20261015-EXCL01", situacao: "PAGO", ...pago, excluido: true });

  const { pedidos } = await painel();
  expect(pedidos).toEqual({
    "a-fazer": 2,
    pendentes: 2,
    enviados: 2,
    entregues: 1,
    cancelados: 2,
    "estorno-pendente": 1,
  });
  for (const [filtro, quantidade] of Object.entries(pedidos)) {
    const lista = await listarPedidosAdmin({ filtro }, admin);
    if (!lista.ok) throw new Error(lista.mensagem);
    expect(lista.dados.total, filtro).toBe(quantidade);
  }
});

it("RF32 conta as obras do acervo por situação, sem as arquivadas", async () => {
  const { criarObra } = await import("../../src/modules/catalog");
  const arquivar = (id: string) =>
    db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [id]);
  // Além da noite-azul (disponível): um rascunho, uma esgotada e duas arquivadas.
  const rascunho = await criarObra(
    { titulo: "Esboço", slug: "esboco", artistaId: idAna, preco: "300,00", estoque: "1" },
    admin,
  );
  if (!rascunho.ok) throw new Error(rascunho.mensagem);
  await fabrica.obraPublicada("ultima-copia", "800,00", 0);
  await arquivar(await fabrica.obraPublicada("fora-de-linha", "900,00", 3));
  const rascunhoArquivado = await criarObra(
    { titulo: "Descarte", slug: "descarte", artistaId: idAna, preco: "100,00", estoque: "1" },
    admin,
  );
  if (!rascunhoArquivado.ok) throw new Error(rascunhoArquivado.mensagem);
  await arquivar(rascunhoArquivado.dados.id);

  expect((await painel()).obras).toEqual({ RASCUNHO: 1, DISPONIVEL: 1, ESGOTADA: 1 });
});

it("RF32 lista os horários agendados que começam nos próximos 7 dias, de todos os artistas", async () => {
  const horario = (
    codigo: string,
    artistaId: string,
    inicio: string,
    fim: string,
    extra: { situacao?: string; excluido?: boolean } = {},
  ) =>
    db.query(
      `INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, inicia_em,
         termina_em, situacao, excluido_em)
       VALUES (gen_random_uuid(), $1, 'Lucas Silveira', '11987654321', $2, $3, $4, $5, $6)`,
      [
        codigo,
        artistaId,
        inicio,
        fim,
        extra.situacao ?? "AGENDADO",
        extra.excluido ? inicio : null,
      ],
    );
  // AGORA é 19/10 às 15:00Z; a janela vai até 26/10 às 15:00Z, sem incluir.
  await horario("AG-INICIO", idAna, "2026-10-19T15:00:00Z", "2026-10-19T16:00:00Z");
  await horario("AG-PASSOU", idAna, "2026-10-19T13:59:59.999Z", "2026-10-19T14:59:59.999Z");
  await horario("AG-BIA", idBia, "2026-10-20T12:00:00Z", "2026-10-20T14:00:00Z");
  await horario("AG-ULTIMO", idBia, "2026-10-26T14:59:59.999Z", "2026-10-26T16:00:00Z");
  await horario("AG-DEPOIS", idAna, "2026-10-26T15:00:00Z", "2026-10-26T16:00:00Z");
  await horario("AG-CANCELADO", idAna, "2026-10-20T15:00:00Z", "2026-10-20T16:00:00Z", {
    situacao: "CANCELADO",
  });
  await horario("AG-CONCLUIDO", idAna, "2026-10-21T15:00:00Z", "2026-10-21T16:00:00Z", {
    situacao: "CONCLUIDO",
  });
  await horario("AG-EXCLUIDO", idAna, "2026-10-22T15:00:00Z", "2026-10-22T16:00:00Z", {
    excluido: true,
  });

  // Início e fim no horário de São Paulo (RN09), em ordem de início.
  expect((await painel()).horarios).toEqual([
    {
      codigo: "AG-INICIO",
      inicio: "2026-10-19T12:00",
      fim: "2026-10-19T13:00",
      artista: "Ana",
      contato: "Lucas Silveira",
    },
    {
      codigo: "AG-BIA",
      inicio: "2026-10-20T09:00",
      fim: "2026-10-20T11:00",
      artista: "Bia",
      contato: "Lucas Silveira",
    },
    {
      codigo: "AG-ULTIMO",
      inicio: "2026-10-26T11:59",
      fim: "2026-10-26T13:00",
      artista: "Bia",
      contato: "Lucas Silveira",
    },
  ]);
});
