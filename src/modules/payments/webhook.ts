import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { obterPrisma } from "../../lib/prisma";
import { baixarEstoque } from "../orders/index";
import { assinaturaValida } from "./assinatura";
import { lerPagamento, type PagamentoLido, type SituacaoPagamento } from "./leitura";

// Porta da consulta: o webhook só confia na situação que a API de pagamentos devolve (RN05).
export type ConsultaPagamento = { consultarPagamento(id: string): Promise<unknown> };

export type RequisicaoNotificacao = { url: string; cabecalhos: Headers; corpo: unknown };
export type OpcoesNotificacao = { gateway: ConsultaPagamento; segredo: string; agora?: Date };
export type RespostaNotificacao = { status: 200 | 401 | 500 };

const PROVEDOR = "mercado_pago";

const schemaCorpo = z.object({ id: z.union([z.string(), z.number()]).nullish() });

type Tx = Prisma.TransactionClient;

// Pendente vira aprovado ou recusado, que só viram estornado.
const ORDEM: Record<SituacaoPagamento, number> = {
  PENDENTE: 0,
  APROVADO: 1,
  RECUSADO: 1,
  ESTORNADO: 2,
};

// RF14/RN05: com o pagamento aprovado, o pedido vai a PAGO, o estoque baixa e as obras saem do
// carrinho, tudo na mesma transação do evento (RNF11).
async function aplicar(tx: Tx, pagamento: PagamentoLido, idEvento: string, agora: Date) {
  // RNF11: aviso já visto não faz nada. Um reenvio simultâneo espera aqui o primeiro terminar a
  // transação; se o primeiro foi desfeito, este processa no lugar dele.
  const { count } = await tx.webhookEvent.createMany({
    data: { eventId: idEvento, source: PROVEDOR, payload: pagamento.registro, processedAt: agora },
    skipDuplicates: true,
  });
  if (count === 0) return;
  const numero = pagamento.numeroPedido ?? "";
  const dono = await tx.order.findUniqueOrThrow({ where: { number: numero } });
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
  if (pagamento.situacao !== "APROVADO") return;
  const itens = pedido.items.map((i) => ({ obraId: i.artworkId, quantidade: i.quantity }));
  await tx.order.update({ where: { id: pedido.id }, data: { status: "PAGO", paidAt: agora } });
  // RN06: o cliente pagou, então o pedido fica pago; sem unidade livre, quem resolve é o
  // estorno (PBI-43).
  const baixa = await baixarEstoque(pedido.sessionId, itens, agora, tx);
  if (!baixa.ok)
    console.error(
      "Pagamento aprovado sem unidade livre: estornar (PBI-43)",
      pedido.number,
      pagamento.idExterno,
    );
  await tx.cartItem.deleteMany({
    where: { cart: { userId: pedido.userId }, artworkId: { in: itens.map((i) => i.obraId) } },
  });
}

// RF14/RNF11: Route Handler do Mercado Pago. Responde 401 sem assinatura válida, 200 quando o
// aviso foi tratado e 500 quando vale o Mercado Pago reenviar.
export async function processarNotificacao(
  requisicao: RequisicaoNotificacao,
  opcoes: OpcoesNotificacao,
): Promise<RespostaNotificacao> {
  const agora = opcoes.agora ?? new Date();
  const idDado = new URL(requisicao.url).searchParams.get("data.id");
  const assinada = assinaturaValida({
    assinatura: requisicao.cabecalhos.get("x-signature"),
    idRequisicao: requisicao.cabecalhos.get("x-request-id"),
    idDado,
    segredo: opcoes.segredo,
  });
  if (!assinada || !idDado) return { status: 401 };
  const corpo = schemaCorpo.safeParse(requisicao.corpo);
  const idEvento = `${PROVEDOR}:${corpo.success ? corpo.data.id : ""}`;

  const lido = lerPagamento(await opcoes.gateway.consultarPagamento(idDado));
  if (!lido.ok) return { status: 500 };
  await obterPrisma().$transaction((tx) => aplicar(tx, lido.dados, idEvento, agora));
  return { status: 200 };
}
