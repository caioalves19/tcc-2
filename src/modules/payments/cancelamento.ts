import { z } from "zod";
import { comoAdmin, ErroGestao, validar, type ResultadoGestao } from "../artists/index";
import { cancelarPedidoPendente, podeCancelarPedido } from "../orders/index";
import { tipoEStatus } from "./estorno";
import { lerPagamento } from "./leitura";
import type { GatewayPagamento } from "./pagamento";

// PBI-43 (complemento do RF29): o ADMIN cancela o pedido que não foi pago. Sem política automática:
// só quando o admin pede.

const schemaCancelamento = z.object({ numero: z.string().min(1).max(32) });

export type OpcoesCancelamento = {
  gateway: Pick<GatewayPagamento, "cancelarPagamento" | "consultarPagamento">;
};

// Pix e boleto emitidos e ainda não pagos: o Mercado Pago deixa de aceitá-los antes do pedido
// cancelar, para nenhum ser pago depois.
type Plano = { pedidoId: string; userId: string; emAberto: { id: string; idExterno: string }[] };

function naoPendente() {
  return new ErroGestao(
    "invalido",
    "Só pedido aguardando pagamento pode ser cancelado. Pedido pago se resolve pelo estorno.",
  );
}

// Se o cancelamento falhou porque o pagamento já estava cancelado (nova tentativa, resposta
// perdida), a consulta mostra e o Kolô segue. Só o tipo e o status HTTP vão ao log.
async function cancelarNoGateway(gateway: OpcoesCancelamento["gateway"], idExterno: string) {
  try {
    await gateway.cancelarPagamento(idExterno);
    return true;
  } catch (erro) {
    console.error("Falha ao cancelar no Mercado Pago", ...tipoEStatus(erro));
  }
  try {
    const lido = lerPagamento(await gateway.consultarPagamento(idExterno));
    return lido.ok && lido.dados.situacao === "RECUSADO";
  } catch (erro) {
    console.error("Falha ao consultar o pagamento cancelado", ...tipoEStatus(erro));
    return false;
  }
}

// RF29/PBI-43: pedido PENDENTE vira CANCELADO e solta a reserva. Só ADMIN.
export async function cancelarPedido(
  entrada: unknown,
  cabecalhos: Headers,
  opcoes: OpcoesCancelamento,
): Promise<ResultadoGestao<{ situacao: "CANCELADO" }>> {
  const conferido = await comoAdmin(cabecalhos, async (tx): Promise<Plano> => {
    const { numero } = validar(schemaCancelamento, entrada);
    const pedido = await tx.order.findFirst({
      where: { number: numero, deletedAt: null },
      include: { payments: { where: { status: "PENDENTE" } } },
    });
    if (!pedido) throw new ErroGestao("nao_encontrado", "Pedido não encontrado.");
    if (pedido.status !== "PENDENTE") throw naoPendente();
    // Cartão em análise (ou saldo) não se cancela: o Mercado Pago aprova ou recusa sozinho.
    if (
      !podeCancelarPedido(
        pedido.status,
        pedido.payments.map((p) => p.method),
      )
    )
      throw new ErroGestao(
        "invalido",
        "O pagamento deste pedido está em análise no Mercado Pago. Aguarde a resposta.",
      );
    return {
      pedidoId: pedido.id,
      userId: pedido.userId,
      emAberto: pedido.payments.flatMap((p) =>
        p.externalId ? [{ id: p.id, idExterno: p.externalId }] : [],
      ),
    };
  });
  if (!conferido.ok) return conferido;
  const plano = conferido.dados;
  for (const pagamento of plano.emAberto)
    if (!(await cancelarNoGateway(opcoes.gateway, pagamento.idExterno)))
      return {
        ok: false,
        erro: "falha",
        mensagem: "Não foi possível cancelar o pagamento no Mercado Pago. Tente de novo.",
      };

  return comoAdmin(cabecalhos, async (tx) => {
    // Mesma ordem de travas do webhook e do checkout (usuário → pedido).
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${plano.userId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "order" WHERE id = ${plano.pedidoId}::uuid FOR UPDATE`;
    await tx.payment.updateMany({
      where: { id: { in: plano.emAberto.map((p) => p.id) }, status: "PENDENTE" },
      data: { status: "RECUSADO" },
    });
    // Pagamento novo (cartão em análise, outro Pix) chegou depois da conferência: nada é gravado.
    const novos = await tx.payment.count({
      where: { orderId: plano.pedidoId, status: "PENDENTE" },
    });
    if (novos > 0)
      throw new ErroGestao(
        "invalido",
        "Chegou um pagamento novo para este pedido no Mercado Pago. Atualize a página.",
      );
    // Pago (ou cancelado) entre a conferência e aqui: nada é gravado.
    const cancelado = await cancelarPedidoPendente(tx, plano.pedidoId);
    if (!cancelado.ok) throw naoPendente();
    return { situacao: "CANCELADO" as const };
  });
}
