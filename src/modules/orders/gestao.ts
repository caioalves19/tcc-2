import type { OrderStatus, Prisma } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao } from "../artists/index";
import type { DadosEndereco } from "../endereco/index";
import { comReservaAtiva, situacaoDe } from "./acompanhamento";
import type { Modalidade } from "./checkout";
import type { SituacaoCliente } from "./regras";
import { PEDIDOS_POR_PAGINA, schemaListaAdmin, type FiltroPedidos } from "./validacao";

// RF29 (PBI-30): gestão de pedidos pelo ADMIN. Toda leitura e escrita passa pelo comoAdmin
// (sessão e papel relidos no banco, transação Serializable).

type SituacaoNoBanco = OrderStatus;

export type PedidoAdminLista = {
  numero: string;
  criadoEm: Date;
  cliente: { nome: string; email: string };
  // A mesma leitura do cliente (PBI-29); "NAO_CONCLUIDO" é a tentativa que o cliente não vê.
  situacao: SituacaoCliente | "NAO_CONCLUIDO";
  situacaoBanco: SituacaoNoBanco;
  modalidade: Modalidade;
  totalCentavos: number;
  unidades: number;
};

export type PaginaPedidosAdmin = {
  pedidos: PedidoAdminLista[];
  total: number;
  pagina: number;
  totalPaginas: number;
  filtro: FiltroPedidos;
  busca: string;
};

const SITUACOES_DO_FILTRO: Record<FiltroPedidos, SituacaoNoBanco[] | null> = {
  "a-fazer": ["PAGO", "PROCESSANDO"],
  pendentes: ["PENDENTE"],
  enviados: ["ENVIADO"],
  entregues: ["ENTREGUE"],
  cancelados: ["CANCELADO"],
  todos: null,
};

// "A fazer" é a fila de trabalho: os mais antigos primeiro. Os demais filtros mostram os mais
// recentes primeiro. O id desempata, para um pedido não repetir nem sumir entre as páginas.
export function listarPedidosAdmin(entrada: unknown, cabecalhos: Headers, agora = new Date()) {
  return comoAdmin(cabecalhos, async (tx): Promise<PaginaPedidosAdmin> => {
    const { filtro, busca, pagina } = schemaListaAdmin.parse(
      typeof entrada === "object" && entrada !== null ? entrada : {},
    );
    const situacoes = SITUACOES_DO_FILTRO[filtro];
    const onde: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(situacoes && { status: { in: situacoes } }),
      ...(busca && {
        OR: [
          { number: { contains: busca, mode: "insensitive" } },
          { user: { email: { contains: busca, mode: "insensitive" } } },
        ],
      }),
    };
    const total = await tx.order.count({ where: onde });
    const pedidos = await tx.order.findMany({
      where: onde,
      include: {
        items: true,
        payments: { select: { status: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ createdAt: filtro === "a-fazer" ? "asc" : "desc" }, { id: "asc" }],
      skip: (pagina - 1) * PEDIDOS_POR_PAGINA,
      take: PEDIDOS_POR_PAGINA,
    });
    const reservados = await comReservaAtiva(pedidos, agora, tx);
    return {
      pedidos: pedidos.map((pedido) => ({
        numero: pedido.number,
        criadoEm: pedido.createdAt,
        cliente: { nome: pedido.user.name, email: pedido.user.email },
        situacao: situacaoDe(pedido, reservados) ?? "NAO_CONCLUIDO",
        situacaoBanco: pedido.status,
        modalidade: pedido.deliveryMethod,
        totalCentavos: pedido.totalCents,
        unidades: pedido.items.reduce((soma, item) => soma + item.quantity, 0),
      })),
      total,
      pagina,
      totalPaginas: Math.ceil(total / PEDIDOS_POR_PAGINA),
      filtro,
      busca,
    };
  });
}

export type PedidoAdmin = {
  numero: string;
  criadoEm: Date;
  situacao: SituacaoCliente | "NAO_CONCLUIDO";
  situacaoBanco: SituacaoNoBanco;
  modalidade: Modalidade;
  cliente: { nome: string; email: string; telefone: string | null };
  itens: { titulo: string; precoCentavos: number; quantidade: number }[];
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  endereco: DadosEndereco;
  rastreio: string | null;
  pagoEm: Date | null;
  enviadoEm: Date | null;
  pagamentos: {
    provedor: string;
    idExterno: string | null;
    metodo: "PIX" | "CARTAO" | "BOLETO";
    situacao: "PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO";
    valorCentavos: number;
  }[];
};

// RF29: dados de pagamento sem o payload do gateway, que fica só no banco (select explícito).
// Número fora do formato ou inexistente dá "nao_encontrado".
export function lerPedidoAdmin(numero: unknown, cabecalhos: Headers, agora = new Date()) {
  return comoAdmin(cabecalhos, async (tx): Promise<PedidoAdmin> => {
    const pedido =
      typeof numero === "string" && numero.length > 0 && numero.length <= 32
        ? await tx.order.findFirst({
            where: { number: numero, deletedAt: null },
            include: {
              items: { orderBy: { titleSnapshot: "asc" } },
              payments: {
                select: {
                  provider: true,
                  externalId: true,
                  method: true,
                  status: true,
                  amountCents: true,
                },
              },
              user: { select: { name: true, email: true, phone: true } },
            },
          })
        : null;
    if (!pedido) throw new ErroGestao("nao_encontrado", "Pedido não encontrado.");
    const reservados = await comReservaAtiva([pedido], agora, tx);
    return {
      numero: pedido.number,
      criadoEm: pedido.createdAt,
      situacao: situacaoDe(pedido, reservados) ?? "NAO_CONCLUIDO",
      situacaoBanco: pedido.status,
      modalidade: pedido.deliveryMethod,
      cliente: { nome: pedido.user.name, email: pedido.user.email, telefone: pedido.user.phone },
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
      pagamentos: pedido.payments.map((pagamento) => ({
        provedor: pagamento.provider,
        idExterno: pagamento.externalId,
        metodo: pagamento.method,
        situacao: pagamento.status,
        valorCentavos: pagamento.amountCents,
      })),
    };
  });
}
