import { z } from "zod";
import type { Prisma, RefundReason } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao, validar, type ResultadoGestao } from "../artists/index";
import { cancelarPedidoPago } from "../orders/index";
import type { GatewayPagamento } from "./pagamento";

// PBI-43 (complemento do RF29): estorno e cancelamento pelo ADMIN. A chamada ao Mercado Pago fica
// fora da transação do banco: primeiro confere o que fazer, depois chama o gateway e, só se ele
// aceitar, grava o resultado numa transação nova que confere tudo de novo.

type Tx = Prisma.TransactionClient;

const PROVEDOR = "mercado_pago";

const schemaEstorno = z.object({
  numero: z.string().min(1).max(32),
  idExterno: z.string().min(1).max(64),
});

export type OpcoesEstorno = {
  gateway: Pick<GatewayPagamento, "estornarPagamento" | "consultarPagamento">;
};

// O que o estorno faz com o pedido. O pagamento que pagou o pedido cancela o pedido e devolve as
// unidades que a aprovação baixou (sem unidade livre, não baixou nada). O que não pagou o pedido
// (pedido que não aguardava pagamento, valor diferente) só devolve o dinheiro.
type Efeito = "cancelar_devolvendo" | "cancelar_sem_devolver" | "nenhum";
type Plano = {
  pagamentoId: string;
  idExterno: string;
  pedidoId: string;
  userId: string;
  efeito: Efeito;
};

function efeitoDo(motivo: RefundReason | null): Efeito {
  if (motivo === null) return "cancelar_devolvendo";
  if (motivo === "SEM_ESTOQUE") return "cancelar_sem_devolver";
  return "nenhum";
}

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

// RF29/PBI-43: estorno total do pagamento pelo gateway. Só ADMIN (sessão e papel relidos no banco).
export async function estornarPagamento(
  entrada: unknown,
  cabecalhos: Headers,
  opcoes: OpcoesEstorno,
): Promise<ResultadoGestao<{ situacao: "ESTORNADO" }>> {
  const conferido = await comoAdmin(cabecalhos, async (tx): Promise<Plano> => {
    const { numero, idExterno } = validar(schemaEstorno, entrada);
    const pagamento = await pagamentoDoPedido(tx, numero, idExterno);
    if (pagamento.status !== "APROVADO")
      throw new ErroGestao("invalido", "Só pagamento aprovado pode ser estornado.");
    const efeito = efeitoDo(pagamento.refundReason);
    // Pedido que já saiu do ateliê: a devolução é combinada fora do sistema.
    if (
      efeito !== "nenhum" &&
      (pagamento.order.status === "ENVIADO" || pagamento.order.status === "ENTREGUE")
    )
      throw new ErroGestao("invalido", "Pedido enviado ou entregue não pode ser estornado aqui.");
    return {
      pagamentoId: pagamento.id,
      idExterno,
      pedidoId: pagamento.orderId,
      userId: pagamento.order.userId,
      efeito,
    };
  });
  if (!conferido.ok) return conferido;
  const plano = conferido.dados;

  await opcoes.gateway.estornarPagamento(plano.idExterno, `kolo-estorno-${plano.pagamentoId}`);

  return comoAdmin(cabecalhos, async (tx) => {
    // Mesma ordem de travas do webhook (usuário → pedido): um aviso do mesmo pedido espera aqui.
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${plano.userId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "order" WHERE id = ${plano.pedidoId}::uuid FOR UPDATE`;
    await tx.payment.update({ where: { id: plano.pagamentoId }, data: { status: "ESTORNADO" } });
    if (plano.efeito !== "nenhum")
      await cancelarPedidoPago(tx, plano.pedidoId, {
        devolverEstoque: plano.efeito === "cancelar_devolvendo",
      });
    return { situacao: "ESTORNADO" as const };
  });
}
