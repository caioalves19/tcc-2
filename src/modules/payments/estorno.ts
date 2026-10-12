import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao, validar, type ResultadoGestao } from "../artists/index";
import {
  acaoDeEstorno,
  cancelarPedidoPago,
  estornoCancelaPedido,
  estornoDevolveEstoque,
  pagouOPedido,
  type MotivoEstorno,
} from "../orders/index";
import { lerPagamento, PROVEDOR } from "./leitura";
import type { GatewayPagamento } from "./pagamento";

// PBI-43 (complemento do RF29): estorno e cancelamento pelo ADMIN. A chamada ao Mercado Pago fica
// fora da transação do banco: primeiro confere o que fazer, depois chama o gateway e, só se ele
// aceitar, grava o resultado numa transação nova que confere tudo de novo.

type Tx = Prisma.TransactionClient;

const schemaEstorno = z.object({
  numero: z.string().min(1).max(32),
  idExterno: z.string().min(1).max(64),
});

export type OpcoesEstorno = {
  gateway: Pick<GatewayPagamento, "estornarPagamento" | "consultarPagamento">;
};

// O que o estorno faz com o pedido segue o motivo marcado pelo webhook (regras em `orders`).
type Plano = {
  pagamentoId: string;
  idExterno: string;
  pedidoId: string;
  userId: string;
  motivo: MotivoEstorno | null;
  // Estornado no painel do Mercado Pago (o webhook já gravou): falta só o pedido.
  jaEstornado: boolean;
};

async function pagamentoDoPedido(tx: Tx, numero: string, idExterno: string) {
  const pagamento = await tx.payment.findFirst({
    where: {
      provider: PROVEDOR,
      externalId: idExterno,
      order: { number: numero, deletedAt: null },
    },
    include: { order: true },
  });
  if (!pagamento) throw new ErroGestao("nao_encontrado", "Pagamento não encontrado.");
  return pagamento;
}

// PBI-42: outro pagamento aprovado sem motivo pagou o pedido (regra de acaoDeEstorno).
async function pagoPorOutro(tx: Tx, pedidoId: string) {
  const pagamentos = await tx.payment.findMany({
    where: { orderId: pedidoId },
    select: { status: true, refundReason: true },
  });
  return pagamentos.some((p) => pagouOPedido({ situacao: p.status, motivo: p.refundReason }));
}

const PAGO_POR_OUTRO = "Outro pagamento aprovado pagou este pedido; ele não é cancelado.";

export function tipoEStatus(erro: unknown): [string, number | null] {
  const status =
    erro instanceof Error && "status" in erro && typeof erro.status === "number"
      ? erro.status
      : null;
  return [erro instanceof Error ? erro.name : "erro desconhecido", status];
}

// A chave de idempotência é do pagamento: a nova tentativa (clique duplo, resposta perdida) não
// estorna de novo. Se a resposta se perdeu mas o estorno aconteceu, a consulta mostra o
// pagamento estornado e o Kolô conclui. Só o tipo e o status HTTP vão ao log.
async function estornarNoGateway(gateway: OpcoesEstorno["gateway"], plano: Plano) {
  try {
    await gateway.estornarPagamento(plano.idExterno, `kolo-estorno-${plano.pagamentoId}`);
    return true;
  } catch (erro) {
    console.error("Falha ao estornar no Mercado Pago", ...tipoEStatus(erro));
  }
  try {
    const lido = lerPagamento(await gateway.consultarPagamento(plano.idExterno));
    return lido.ok && lido.dados.situacao === "ESTORNADO";
  } catch (erro) {
    console.error("Falha ao consultar o pagamento estornado", ...tipoEStatus(erro));
    return false;
  }
}

// RF29/PBI-43: estorno total do pagamento pelo gateway. Só ADMIN (sessão e papel relidos no banco).
export async function estornarPagamento(
  entrada: unknown,
  cabecalhos: Headers,
  opcoes: OpcoesEstorno,
): Promise<ResultadoGestao<{ situacao: "ESTORNADO" }>> {
  const conferido = await comoAdmin(cabecalhos, async (tx): Promise<Plano> => {
    const { numero, idExterno } = validar(schemaEstorno, entrada);
    const pagamento = await pagamentoDoPedido(tx, numero, idExterno);
    const outro = await pagoPorOutro(tx, pagamento.orderId);
    const acao = acaoDeEstorno(
      { situacao: pagamento.status, motivo: pagamento.refundReason },
      pagamento.order.status,
      outro,
    );
    if (!acao)
      throw new ErroGestao(
        "invalido",
        pagamento.order.status === "ENVIADO" || pagamento.order.status === "ENTREGUE"
          ? "Pedido enviado ou entregue não pode ser estornado aqui."
          : pagamento.status === "ESTORNADO" && outro
            ? PAGO_POR_OUTRO
            : "Só pagamento aprovado pode ser estornado.",
      );
    return {
      pagamentoId: pagamento.id,
      idExterno,
      pedidoId: pagamento.orderId,
      userId: pagamento.order.userId,
      motivo: pagamento.refundReason,
      jaEstornado: acao === "concluir",
    };
  });
  if (!conferido.ok) return conferido;
  const plano = conferido.dados;

  if (!plano.jaEstornado && !(await estornarNoGateway(opcoes.gateway, plano)))
    return {
      ok: false,
      erro: "falha",
      mensagem: "Não foi possível estornar agora. Tente de novo em instantes.",
    };

  return comoAdmin(cabecalhos, async (tx) => {
    // Mesma ordem de travas do webhook (usuário → pedido): um aviso do mesmo pedido espera aqui.
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${plano.userId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "order" WHERE id = ${plano.pedidoId}::uuid FOR UPDATE`;
    // Concluir não chama o gateway: um pagamento que pagou o pedido entre as duas transações
    // ainda impede o cancelamento.
    if (plano.jaEstornado && (await pagoPorOutro(tx, plano.pedidoId)))
      throw new ErroGestao("invalido", PAGO_POR_OUTRO);
    await tx.payment.update({ where: { id: plano.pagamentoId }, data: { status: "ESTORNADO" } });
    if (estornoCancelaPedido(plano.motivo))
      await cancelarPedidoPago(tx, plano.pedidoId, {
        devolverEstoque: estornoDevolveEstoque(plano.motivo),
      });
    return { situacao: "ESTORNADO" as const };
  });
}
