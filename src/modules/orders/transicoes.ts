import type { Prisma } from "../../../generated/prisma/client";
import { baixarEstoque, PRAZO_RESERVA_MS } from "./reserva";

// PBI-43 (achado R4 do PBI-28): as transições do pedido ficam em `orders` e rodam na transação
// de quem chama (webhook, checkout, admin), que já travou o usuário e o pedido.
type Tx = Prisma.TransactionClient;

export type ResultadoConfirmacao =
  { ok: true; estoqueBaixado: boolean } | { ok: false; erro: "nao_pendente" };

// RF14/RN05: com o pagamento aprovado, o pedido vai a PAGO, o estoque baixa e as obras saem do
// carrinho. RN06: o cliente pagou, então o pedido fica pago mesmo sem unidade livre
// (`estoqueBaixado: false`); quem resolve é o estorno.
export async function confirmarPedidoPago(
  tx: Tx,
  pedidoId: string,
  agora: Date,
): Promise<ResultadoConfirmacao> {
  const pedido = await tx.order.findUniqueOrThrow({
    where: { id: pedidoId },
    include: { items: true },
  });
  if (pedido.status !== "PENDENTE") return { ok: false, erro: "nao_pendente" };
  const itens = pedido.items.map((i) => ({ obraId: i.artworkId, quantidade: i.quantity }));
  await tx.order.update({ where: { id: pedido.id }, data: { status: "PAGO", paidAt: agora } });
  const baixa = await baixarEstoque(pedido.sessionId, itens, agora, tx);
  await tx.cartItem.deleteMany({
    where: { cart: { userId: pedido.userId }, artworkId: { in: itens.map((i) => i.obraId) } },
  });
  return { ok: true, estoqueBaixado: baixa.ok };
}

// RN06: pedido que não vai ser pago (abandonado, Pix ou boleto vencido, cancelado pelo admin)
// vira CANCELADO e solta as unidades que a sessão dele segurava. Só o que ainda está PENDENTE:
// um pagamento aprovado que terminou antes não pode ter o pedido pago cancelado por cima.
export async function cancelarPedidoPendente(
  tx: Tx,
  pedidoId: string,
): Promise<{ ok: true } | { ok: false; erro: "nao_pendente" }> {
  const { count } = await tx.order.updateMany({
    where: { id: pedidoId, status: "PENDENTE" },
    data: { status: "CANCELADO" },
  });
  if (count === 0) return { ok: false, erro: "nao_pendente" };
  const pedido = await tx.order.findUniqueOrThrow({
    where: { id: pedidoId },
    include: { items: true },
  });
  if (pedido.sessionId)
    await tx.artworkReservation.deleteMany({
      where: {
        sessionId: pedido.sessionId,
        artworkId: { in: pedido.items.map((i) => i.artworkId) },
      },
    });
  return { ok: true };
}

// RN06: o Pix ou boleto que prorrogou a reserva acabou sem pagar, mas o pedido segue aberto (o
// cliente ainda pode pagar de outro jeito): a reserva volta ao prazo do checkout, e não segura
// as unidades até o vencimento de um pagamento que não existe mais.
export async function voltarReservaAoPrazo(tx: Tx, pedidoId: string): Promise<void> {
  const pedido = await tx.order.findUniqueOrThrow({
    where: { id: pedidoId },
    include: { items: true },
  });
  if (!pedido.sessionId) return;
  const prazo = new Date(pedido.createdAt.getTime() + PRAZO_RESERVA_MS);
  await tx.artworkReservation.updateMany({
    where: {
      sessionId: pedido.sessionId,
      artworkId: { in: pedido.items.map((i) => i.artworkId) },
      expiresAt: { gt: prazo },
    },
    data: { expiresAt: prazo },
  });
}
