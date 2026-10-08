import type { Prisma } from "../../../generated/prisma/client";
import { obterPrisma } from "../../lib/prisma";
import type { DadosEndereco } from "../endereco/index";
import { sessaoAtiva, type ContextoCarrinho } from "./carrinho";
import type { Modalidade } from "./checkout";
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
  items: { orderBy: { titleSnapshot: "asc" } },
  payments: { select: { status: true } },
} satisfies Prisma.OrderInclude;

export type PedidoDetalhado = {
  numero: string;
  criadoEm: Date;
  situacao: SituacaoCliente;
  modalidade: Modalidade;
  // Cópias gravadas no checkout (PBI-26): editar ou arquivar a obra depois não muda o pedido.
  itens: { titulo: string; precoCentavos: number; quantidade: number }[];
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  endereco: DadosEndereco;
  rastreio: string | null;
  pagoEm: Date | null;
  enviadoEm: Date | null;
};

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

// RN01: pedido de outro cliente, oculto (tentativa sem pagamento) ou inexistente, visitante e
// número fora do formato dão a mesma resposta (null), sem revelar que o pedido existe.
export async function lerMeuPedido(
  numero: unknown,
  contexto: Contexto,
  agora: Date = new Date(),
): Promise<PedidoDetalhado | null> {
  if (typeof numero !== "string" || numero.length === 0 || numero.length > 32) return null;
  const sessao = await sessaoAtiva(contexto.cabecalhos);
  if (!sessao) return null;
  const pedido = await obterPrisma().order.findFirst({
    where: { number: numero, userId: sessao.userId, deletedAt: null },
    include: INCLUI,
  });
  if (!pedido) return null;
  const situacao = situacaoDe(pedido, await comReservaAtiva([pedido], agora));
  if (!situacao) return null;
  return {
    numero: pedido.number,
    criadoEm: pedido.createdAt,
    situacao,
    modalidade: pedido.deliveryMethod,
    itens: pedido.items.map((item) => ({
      titulo: item.titleSnapshot,
      precoCentavos: item.priceCents,
      quantidade: item.quantity,
    })),
    subtotalCentavos: pedido.subtotalCents,
    freteCentavos: pedido.shippingCents,
    totalCentavos: pedido.totalCents,
    // Cópia gravada pelo próprio checkout, já validada por validarEndereco.
    endereco: pedido.addressSnapshot as DadosEndereco,
    rastreio: pedido.trackingCode,
    pagoEm: pedido.paidAt,
    enviadoEm: pedido.shippedAt,
  };
}
