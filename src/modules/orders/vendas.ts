import { OrderStatus, type Prisma } from "../../../generated/prisma/client";
import { pedidoPago } from "./regras";

// RF32 (PBI-48): vendas do relatório. Pedido pago é a mesma regra do total gasto do cliente
// (pedidoPago, de Pago a Entregue); o período é o do pagamento (pago_em).
const SITUACOES_PAGAS = Object.values(OrderStatus).filter(pedidoPago);

export type VendaDoPeriodo = {
  // Total do pedido, com o frete.
  totalCentavos: number;
  // Preço é a cópia gravada no pedido; título e artista são os atuais da obra, inclusive da
  // arquivada (PBI-18), para agrupar a mesma obra mesmo que o título mude.
  itens: {
    obraId: string;
    titulo: string;
    artistaId: string;
    artista: string;
    precoCentavos: number;
    quantidade: number;
  }[];
};

// Pedidos pagos com pago_em em [inicio, fim). Roda na transação de quem chama, que já passou pelo
// comoAdmin: esta função não confere permissão sozinha.
export async function vendasDoPeriodo(
  tx: Prisma.TransactionClient,
  intervalo: { inicio: Date; fim: Date },
): Promise<VendaDoPeriodo[]> {
  const pedidos = await tx.order.findMany({
    where: {
      deletedAt: null,
      status: { in: SITUACOES_PAGAS },
      paidAt: { gte: intervalo.inicio, lt: intervalo.fim },
    },
    select: {
      totalCents: true,
      items: {
        select: {
          priceCents: true,
          quantity: true,
          artwork: {
            select: {
              id: true,
              title: true,
              artist: { select: { id: true, user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  return pedidos.map((pedido) => ({
    totalCentavos: pedido.totalCents,
    itens: pedido.items.map((item) => ({
      obraId: item.artwork.id,
      titulo: item.artwork.title,
      artistaId: item.artwork.artist.id,
      artista: item.artwork.artist.user.name,
      precoCentavos: item.priceCents,
      quantidade: item.quantity,
    })),
  }));
}
