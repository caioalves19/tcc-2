import { obterPrisma } from "../../lib/prisma";
import type { DadosEndereco } from "../endereco/index";
import { sessaoAtiva, type ContextoCarrinho } from "./carrinho";
import type { Modalidade } from "./checkout";

export type SituacaoPedido =
  "PENDENTE" | "PAGO" | "PROCESSANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO";

export type PedidoResumo = {
  numero: string;
  situacao: SituacaoPedido;
  modalidade: Modalidade;
  criadoEm: Date;
  // Até quando as unidades do pedido pendente seguem presas (null se não há reserva ativa).
  reservaExpiraEm: Date | null;
  itens: { obraId: string; titulo: string; precoCentavos: number; quantidade: number }[];
  endereco: DadosEndereco;
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
};

// RN01: o pedido só existe para o dono. Para outro cliente ou visitante, a resposta é a mesma
// de um número que não existe, sem revelar que o pedido existe.
export async function lerPedido(
  numero: unknown,
  contexto: ContextoCarrinho,
  agora: Date = new Date(),
): Promise<PedidoResumo | null> {
  if (typeof numero !== "string" || numero.length === 0 || numero.length > 32) return null;
  const sessao = await sessaoAtiva(contexto.cabecalhos);
  if (!sessao) return null;
  const prisma = obterPrisma();
  const pedido = await prisma.order.findFirst({
    where: { number: numero, userId: sessao.userId, deletedAt: null },
    include: { items: { orderBy: { titleSnapshot: "asc" } } },
  });
  if (!pedido) return null;

  const reserva =
    pedido.status === "PENDENTE" && pedido.sessionId
      ? await prisma.artworkReservation.aggregate({
          where: {
            sessionId: pedido.sessionId,
            artworkId: { in: pedido.items.map((i) => i.artworkId) },
            expiresAt: { gt: agora },
          },
          _max: { expiresAt: true },
        })
      : null;
  return {
    numero: pedido.number,
    situacao: pedido.status,
    modalidade: pedido.deliveryMethod,
    criadoEm: pedido.createdAt,
    reservaExpiraEm: reserva?._max.expiresAt ?? null,
    itens: pedido.items.map((i) => ({
      obraId: i.artworkId,
      titulo: i.titleSnapshot,
      precoCentavos: i.priceCents,
      quantidade: i.quantity,
    })),
    // Cópia gravada pelo próprio checkout, já validada por validarEndereco.
    endereco: pedido.addressSnapshot as DadosEndereco,
    subtotalCentavos: pedido.subtotalCents,
    freteCentavos: pedido.shippingCents,
    totalCentavos: pedido.totalCents,
  };
}
