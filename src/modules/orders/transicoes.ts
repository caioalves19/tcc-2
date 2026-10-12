import type { Prisma } from "../../../generated/prisma/client";
import { baixarEstoque } from "./reserva";

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
