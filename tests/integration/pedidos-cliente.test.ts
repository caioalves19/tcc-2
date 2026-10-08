import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { comCookie, prepararContas, SENHA } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;
let obraId: string;
let outraObra: string;
let terceiraObra: string;

beforeAll(async () => {
  ({ db, admin, idAna } = await prepararContas("kolo_pbi29_pedidos_test"));
  obraId = await obraPublicada("metropole", "4.800,00", 50);
  outraObra = await obraPublicada("retalho", "4.800,00", 50);
  terceiraObra = await obraPublicada("muro", "4.800,00", 50);
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const AGORA = new Date("2026-09-30T12:00:00Z");
const ENDERECO = {
  destinatario: "Lucas Silveira",
  cep: "01327000",
  logradouro: "Rua Treze de Maio",
  numero: "450",
  complemento: "Apto 82",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

type Cliente = { cabecalhos: Headers; tokenVisitante: null; userId: string; sessaoId: string };

async function obraPublicada(slug: string, preco: string, estoque: number) {
  const { criarObra, editarObra } = await import("../../src/modules/catalog");
  const ficha = { titulo: `Obra ${slug}`, slug, artistaId: idAna, preco, estoque: String(estoque) };
  const criada = await criarObra(ficha, admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  await db.query(
    "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, 1, true, 'Foto')",
    [criada.dados.id, `obras/${idAna}/${criada.dados.id}.png`],
  );
  const publicada = await editarObra({ ...ficha, id: criada.dados.id, publicada: true }, admin);
  if (!publicada.ok) throw new Error(publicada.mensagem);
  return criada.dados.id;
}

async function novoCliente(email: string): Promise<Cliente> {
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const { salvarEndereco } = await import("../../src/lib/endereco");
  const cadastro = await cadastrarCliente({
    nome: "Cliente",
    email,
    telefone: "11987654321",
    senha: SENHA,
  });
  if (!cadastro.ok) throw new Error("Falha ao cadastrar cliente");
  const cabecalhos = await comCookie(cadastro.token);
  const salvo = await salvarEndereco(ENDERECO, cabecalhos);
  if (!salvo.ok) throw new Error("Falha ao salvar endereço");
  const { rows } = await db.query(
    'SELECT s.id, s.user_id FROM session s JOIN "user" u ON u.id = s.user_id WHERE u.email = $1',
    [email],
  );
  return { cabecalhos, tokenVisitante: null, userId: rows[0].user_id, sessaoId: rows[0].id };
}

type Teste = {
  numero: string;
  situacao: "PENDENTE" | "PAGO" | "PROCESSANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO";
  criadoEm: string;
  pagamentos?: ("PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO")[];
  reservaAte?: string;
  rastreio?: string;
  pagoEm?: string;
  enviadoEm?: string;
  excluido?: boolean;
  // A reserva é da sessão na obra; pedidos de compras diferentes usam obras diferentes.
  obra?: string;
};

// Pedido de teste gravado direto no banco: pagamento (27/28) e situação operacional (30) ainda
// não têm fluxo próprio. Dois itens da mesma obra: 2 × R$ 4.800,00.
async function pedidoDeTeste(cliente: Cliente, p: Teste) {
  const obra = p.obra ?? obraId;
  const { rows } = await db.query(
    `INSERT INTO "order" (id, numero, user_id, session_id, modalidade_entrega, situacao,
       subtotal_centavos, frete_centavos, total_centavos, endereco_copia, codigo_rastreio,
       criado_em, pago_em, enviado_em, excluido_em)
     VALUES (gen_random_uuid(), $1, $2, $3, 'RETIRADA', $4, 960000, 0, 960000, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      p.numero,
      cliente.userId,
      cliente.sessaoId,
      p.situacao,
      JSON.stringify(ENDERECO),
      p.rastreio ?? null,
      p.criadoEm,
      p.pagoEm ?? null,
      p.enviadoEm ?? null,
      p.excluido ? p.criadoEm : null,
    ],
  );
  const pedidoId = rows[0].id;
  await db.query(
    `INSERT INTO order_item (id, order_id, artwork_id, titulo_copia, preco_centavos_copia, quantidade)
     VALUES (gen_random_uuid(), $1, $2, 'Metrópole em chamas', 480000, 2)`,
    [pedidoId, obra],
  );
  for (const situacao of p.pagamentos ?? [])
    await db.query(
      `INSERT INTO payment (id, order_id, provedor, metodo, situacao, valor_centavos)
       VALUES (gen_random_uuid(), $1, 'mercado_pago', 'PIX', $2, 960000)`,
      [pedidoId, situacao],
    );
  if (p.reservaAte)
    await db.query(
      `INSERT INTO artwork_reservation (id, artwork_id, session_id, quantidade, expira_em)
       VALUES (gen_random_uuid(), $1, $2, 2, $3)`,
      [obra, cliente.sessaoId, p.reservaAte],
    );
}

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
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260920-PIXABE",
      criadoEm: new Date(dia(20)),
      situacao: "AGUARDANDO_PAGAMENTO",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260910-PAGO22",
      criadoEm: new Date(dia(10)),
      situacao: "PAGO",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260905-CANREC",
      criadoEm: new Date(dia(5)),
      situacao: "CANCELADO",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20260901-ENVIAD",
      criadoEm: new Date(dia(1)),
      situacao: "ENVIADO",
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
      totalCentavos: 480000,
      unidades: 1,
    },
  ]);
  const onzeMinutosDepois = new Date(AGORA.getTime() + 11 * 60_000);
  expect(await listarMeusPedidos(bia, onzeMinutosDepois)).toEqual([]);
});
