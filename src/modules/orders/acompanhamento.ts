import type { Prisma } from "../../../generated/prisma/client";
import { obterPrisma } from "../../lib/prisma";
import { sessaoAtiva, type ContextoCarrinho } from "./carrinho";
import { situacaoParaCliente, type SituacaoCliente } from "./regras";

// RF16 (PBI-29): o cliente acompanha os próprios pedidos. Só lê; quem muda a situação são o
// webhook (PBI-28) e o admin (PBI-30).

type Contexto = Pick<ContextoCarrinho, "cabecalhos">;

export type PedidoDaLista = {
  numero: string;
  criadoEm: Date;
  situacao: SituacaoCliente;
  totalCentavos: number;
  unidades: number;
};

const INCLUI = {
  items: true,
  payments: { select: { status: true } },
} satisfies Prisma.OrderInclude;

type PedidoLido = Prisma.OrderGetPayload<{ include: typeof INCLUI }>;

// Pedidos pendentes que ainda prendem unidades: há reserva da sessão que fez o checkout, numa obra
// do pedido, que não venceu. É a mesma leitura do lerPedido (PBI-26), feita de uma vez para a lista.
async function comReservaAtiva(pedidos: PedidoLido[], agora: Date): Promise<Set<string>> {
  const pendentes = pedidos.flatMap((p) =>
    p.status === "PENDENTE" && p.sessionId ? [{ ...p, sessionId: p.sessionId }] : [],
  );
  if (pendentes.length === 0) return new Set();
  const reservas = await obterPrisma().artworkReservation.findMany({
    where: {
      sessionId: { in: [...new Set(pendentes.map((p) => p.sessionId))] },
      expiresAt: { gt: agora },
    },
    select: { sessionId: true, artworkId: true },
  });
  const reservadas = new Set(reservas.map((r) => `${r.sessionId}:${r.artworkId}`));
  return new Set(
    pendentes
      .filter((p) => p.items.some((i) => reservadas.has(`${p.sessionId}:${i.artworkId}`)))
      .map((p) => p.id),
  );
}

function situacaoDe(pedido: PedidoLido, reservados: Set<string>): SituacaoCliente | null {
  return situacaoParaCliente({
    situacao: pedido.status,
    pagamentos: pedido.payments.map((p) => p.status),
    reservaAtiva: reservados.has(pedido.id),
  });
}

// RN01: só os pedidos de quem está logado (null para visitante), do mais recente ao mais antigo.
// Tentativas sem pagamento ficam de fora (situacaoParaCliente).
export async function listarMeusPedidos(
  contexto: Contexto,
  agora: Date = new Date(),
): Promise<PedidoDaLista[] | null> {
  const sessao = await sessaoAtiva(contexto.cabecalhos);
  if (!sessao) return null;
  const pedidos = await obterPrisma().order.findMany({
    where: { userId: sessao.userId, deletedAt: null },
    include: INCLUI,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  const reservados = await comReservaAtiva(pedidos, agora);
  return pedidos.flatMap((pedido) => {
    const situacao = situacaoDe(pedido, reservados);
    if (!situacao) return [];
    return [
      {
        numero: pedido.number,
        criadoEm: pedido.createdAt,
        situacao,
        totalCentavos: pedido.totalCents,
        unidades: pedido.items.reduce((soma, item) => soma + item.quantity, 0),
      },
    ];
  });
}
