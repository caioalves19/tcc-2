import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma, RefundReason } from "../../../generated/prisma/client";
import { obterPrisma } from "../../lib/prisma";
import {
  cancelarPedidoPendente,
  confirmarPedidoPago,
  PRAZO_RESERVA_MS,
  prorrogarReserva,
  voltarReservaAoPrazo,
} from "../orders/index";
import { assinaturaValida } from "./assinatura";
import { prazoParaPagar } from "./cliente";
import { lerPagamento, type PagamentoLido, type SituacaoPagamento } from "./leitura";

// Porta da consulta: o webhook só confia na situação que a API de pagamentos devolve (RN05).
export type ConsultaPagamento = { consultarPagamento(id: string): Promise<unknown | null> };

// O corpo é lido sob demanda: só depois de a assinatura (que depende só da URL e dos cabeçalhos)
// conferir, para um POST anônimo não custar o parse do corpo.
export type RequisicaoNotificacao = {
  url: string;
  cabecalhos: Headers;
  lerCorpo(): Promise<unknown>;
};
export type OpcoesNotificacao = { gateway: ConsultaPagamento; segredo: string; agora?: Date };
export type RespostaNotificacao = { status: 200 | 401 | 500 };

const PROVEDOR = "mercado_pago";

const schemaCorpo = z.object({
  id: z.union([z.string(), z.number()]).nullish(),
  type: z.string().nullish(),
});

type Tx = Prisma.TransactionClient;

// Pendente vira aprovado ou recusado, que só viram estornado.
const ORDEM: Record<SituacaoPagamento, number> = {
  PENDENTE: 0,
  APROVADO: 1,
  RECUSADO: 1,
  ESTORNADO: 2,
};

type Dono = { id: string; userId: string };
type Pedido = Prisma.OrderGetPayload<{ include: { items: true } }>;
type Item = { obraId: string; quantidade: number };

// PBI-43: o pagamento aprovado que não pagou o pedido (ou pagou sem unidade livre) fica marcado
// para o admin estornar. O log continua para quem acompanha a operação.
async function marcarEstorno(
  tx: Tx,
  pagamento: PagamentoLido,
  motivo: RefundReason,
  mensagem: string,
  numero: string,
) {
  await tx.payment.update({
    where: { provider_externalId: { provider: PROVEDOR, externalId: pagamento.idExterno } },
    data: { refundReason: motivo },
  });
  console.error(mensagem, numero, pagamento.idExterno);
}

// RF14/RN05: com o pagamento aprovado, o pedido vai a PAGO, o estoque baixa e as obras saem do
// carrinho, na mesma transação do evento (RNF11).
async function aprovar(tx: Tx, pedido: Pedido, pagamento: PagamentoLido, agora: Date) {
  // Pedido cancelado (um novo checkout o substituiu) ou já pago por outro pagamento: não reabre
  // nem paga de novo; o dinheiro volta pelo estorno (PBI-43).
  if (pedido.status !== "PENDENTE")
    return marcarEstorno(
      tx,
      pagamento,
      "PEDIDO_NAO_PENDENTE",
      "Pagamento aprovado de pedido que não aguardava pagamento: estornar (PBI-43)",
      pedido.number,
    );
  // RN07: só paga o pedido o pagamento que cobriu exatamente o total gravado, em reais.
  if (pagamento.valorCentavos !== pedido.totalCents || pagamento.moeda !== "BRL")
    return marcarEstorno(
      tx,
      pagamento,
      "VALOR_DIVERGENTE",
      "Pagamento aprovado com valor diferente do pedido: estornar (PBI-43)",
      pedido.number,
    );
  // RN06: o cliente pagou, então o pedido fica pago; sem unidade livre, quem resolve é o
  // estorno (PBI-43).
  const confirmado = await confirmarPedidoPago(tx, pedido.id, agora);
  if (confirmado.ok && !confirmado.estoqueBaixado)
    await marcarEstorno(
      tx,
      pagamento,
      "SEM_ESTOQUE",
      "Pagamento aprovado sem unidade livre: estornar (PBI-43)",
      pedido.number,
    );
}

// RN06: Pix ou boleto emitido segura as unidades até o vencimento do meio de pagamento.
async function prorrogar(
  tx: Tx,
  pedido: Pedido,
  itens: Item[],
  pagamento: PagamentoLido,
  agora: Date,
) {
  if (pagamento.meio !== "PIX" && pagamento.meio !== "BOLETO") return;
  if (pedido.status !== "PENDENTE" || !pedido.sessionId || !pagamento.venceEm) return;
  const prorrogada = await prorrogarReserva(pedido.sessionId, itens, pagamento.venceEm, agora, tx);
  // Sem reserva (venceu, ou o carrinho mudou), a aprovação cai na reconciliação da baixa.
  if (!prorrogada.ok)
    console.error(
      "Reserva não prorrogada para o pagamento pendente",
      pedido.number,
      pagamento.idExterno,
      prorrogada.erro,
    );
}

// RN06: Pix ou boleto que venceu (ou foi cancelado) sem pagar encerra o pedido e devolve as
// unidades. Cartão recusado não: o cliente pode tentar de novo enquanto a reserva durar.
// PBI-43: enquanto a preferência ainda aceita pagamento (prazo do checkout), o pedido também
// fica aberto, senão um cartão pago em seguida chegaria para um pedido cancelado.
async function encerrar(tx: Tx, pedido: Pedido, pagamento: PagamentoLido, agora: Date) {
  if (pagamento.meio !== "PIX" && pagamento.meio !== "BOLETO") return;
  if (pedido.status !== "PENDENTE") return;
  const outroEmAberto = await tx.payment.count({
    where: {
      orderId: pedido.id,
      externalId: { not: pagamento.idExterno },
      status: { in: ["PENDENTE", "APROVADO"] },
    },
  });
  if (outroEmAberto > 0) return;
  const prazo = prazoParaPagar(new Date(pedido.createdAt.getTime() + PRAZO_RESERVA_MS));
  if (prazo && agora < prazo) return voltarReservaAoPrazo(tx, pedido.id);
  await cancelarPedidoPendente(tx, pedido.id);
}

async function aplicar(
  tx: Tx,
  pagamento: PagamentoLido,
  dono: Dono,
  idEvento: string,
  agora: Date,
) {
  // RNF11: aviso já visto não faz nada. Um reenvio simultâneo espera aqui o primeiro terminar a
  // transação; se o primeiro foi desfeito, este processa no lugar dele.
  const { count } = await tx.webhookEvent.createMany({
    data: { eventId: idEvento, source: PROVEDOR, payload: pagamento.registro, processedAt: agora },
    skipDuplicates: true,
  });
  if (count === 0) return;
  // Mesma ordem de travas do checkout (usuário → pedido → sessão → obras): avisos do mesmo
  // pedido, e um checkout da mesma conta, se enfileiram aqui.
  await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${dono.userId}::uuid FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "order" WHERE id = ${dono.id}::uuid FOR UPDATE`;
  const pedido = await tx.order.findUniqueOrThrow({
    where: { id: dono.id },
    include: { items: true },
  });

  const chave = { provider: PROVEDOR, externalId: pagamento.idExterno };
  const anterior = await tx.payment.findUnique({ where: { provider_externalId: chave } });
  // Avisos fora de ordem: a situação do pagamento nunca volta atrás.
  if (anterior && ORDEM[anterior.status] >= ORDEM[pagamento.situacao]) return;
  const dados = {
    method: pagamento.meio,
    status: pagamento.situacao,
    amountCents: pagamento.valorCentavos,
    payload: pagamento.registro,
  };
  if (anterior) await tx.payment.update({ where: { id: anterior.id }, data: dados });
  else await tx.payment.create({ data: { ...chave, orderId: pedido.id, ...dados } });

  const itens = pedido.items.map((i) => ({ obraId: i.artworkId, quantidade: i.quantity }));
  if (pagamento.situacao === "APROVADO") await aprovar(tx, pedido, pagamento, agora);
  if (pagamento.situacao === "PENDENTE") await prorrogar(tx, pedido, itens, pagamento, agora);
  if (pagamento.situacao === "RECUSADO") await encerrar(tx, pedido, pagamento, agora);
  // Estorno ou chargeback de pedido já pago: o pedido segue na fila do admin, que precisa saber
  // antes de enviar. Tratar o pedido é do estorno administrativo (PBI-43).
  if (
    pagamento.situacao === "ESTORNADO" &&
    pedido.status !== "PENDENTE" &&
    pedido.status !== "CANCELADO"
  )
    console.error(
      "Pagamento estornado de pedido já pago: revisar antes de enviar (PBI-43)",
      pedido.number,
      pagamento.idExterno,
    );
}

async function tratar(
  idDado: string,
  idEvento: string,
  gateway: ConsultaPagamento,
  agora: Date,
): Promise<RespostaNotificacao> {
  const resposta = await gateway.consultarPagamento(idDado);
  // Aviso de teste do painel, ou de pagamento de outra conta: reenviar não ajuda.
  if (resposta === null) {
    console.error("Pagamento inexistente na API do Mercado Pago", idDado);
    return { status: 200 };
  }
  const lido = lerPagamento(resposta);
  if (!lido.ok) {
    // Disputa aberta e afins não mudam o pedido; reenviar não ajuda.
    if (lido.erro === "situacao_ignorada") return { status: 200 };
    // Meio novo no Checkout Pro: não grava como outro meio; o reenvio dá tempo de ajustar o Kolô.
    if (lido.erro === "meio_desconhecido")
      console.error("Pagamento com meio que o Kolô não conhece", idDado, lido.tipo);
    else console.error("Resposta inesperada da API de pagamentos", idDado);
    return { status: 500 };
  }
  // Pagamento de outra integração da conta, ou de pedido apagado: reenviar não ajuda.
  const dono = lido.dados.numeroPedido
    ? await obterPrisma().order.findUnique({
        where: { number: lido.dados.numeroPedido },
        select: { id: true, userId: true },
      })
    : null;
  if (!dono) {
    console.error("Pagamento sem pedido no Kolô", lido.dados.idExterno);
    return { status: 200 };
  }
  await obterPrisma().$transaction((tx) => aplicar(tx, lido.dados, dono, idEvento, agora));
  return { status: 200 };
}

// RF14/RNF11: Route Handler do Mercado Pago. Responde 401 sem assinatura válida, 200 quando o
// aviso foi tratado e 500 quando vale o Mercado Pago reenviar.
export async function processarNotificacao(
  requisicao: RequisicaoNotificacao,
  opcoes: OpcoesNotificacao,
): Promise<RespostaNotificacao> {
  const agora = opcoes.agora ?? new Date();
  const parametros = new URL(requisicao.url).searchParams;
  const idDado = parametros.get("data.id");
  // IPN (formato antigo, ?topic=&id=) não tem assinatura verificável: só confirma o recebimento,
  // para não ser reenviado; quem muda o pedido é o aviso assinado de Webhooks.
  if (!idDado && parametros.has("topic")) return { status: 200 };
  const assinada = assinaturaValida({
    assinatura: requisicao.cabecalhos.get("x-signature"),
    idRequisicao: requisicao.cabecalhos.get("x-request-id"),
    idDado,
    segredo: opcoes.segredo,
  });
  if (!assinada || !idDado) return { status: 401 };
  const corpo = schemaCorpo.safeParse(await requisicao.lerCorpo());
  const aviso = corpo.success ? corpo.data : {};
  // Só avisos de pagamento mudam o pedido; os demais (merchant_order etc.) só confirmam o recebimento.
  const tipo = parametros.get("type") ?? aviso.type;
  if (tipo !== "payment") return { status: 200 };
  // RNF11: o id do aviso se repete nos reenvios. Sem ele, cada requisição é um evento; a
  // idempotência continua pelo pagamento (linha única e situação que não volta atrás).
  const idAviso = aviso.id ?? requisicao.cabecalhos.get("x-request-id") ?? randomUUID();
  const idEvento = `${PROVEDOR}:${idAviso}`;

  try {
    return await tratar(idDado, idEvento, opcoes.gateway, agora);
  } catch (erro) {
    // API fora, tempo esgotado, deadlock (40P01) ou banco fora: nada foi gravado, e o Mercado
    // Pago reenvia. Só o tipo e o status HTTP: a mensagem pode trazer dados da conta.
    const status =
      erro instanceof Error && "status" in erro && typeof erro.status === "number"
        ? erro.status
        : null;
    console.error(
      "Falha ao processar o aviso do Mercado Pago",
      erro instanceof Error ? erro.name : "erro desconhecido",
      status,
    );
    return { status: 500 };
  }
}
