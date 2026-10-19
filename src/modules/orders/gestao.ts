import type { OrderStatus, Prisma } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao, validar } from "../artists/index";
import type { DadosEndereco } from "../endereco/index";
import { comReservaAtiva, situacaoDe } from "./acompanhamento";
import type { Modalidade } from "./checkout";
import {
  aceitaRastreio,
  acaoDeEstorno,
  pagouOPedido,
  podeCancelarPedido,
  transicaoPermitida,
  type MotivoEstorno,
  type SituacaoCliente,
} from "./regras";
import {
  PEDIDOS_POR_PAGINA,
  schemaListaAdmin,
  schemaMudarSituacao,
  schemaRastreio,
  type FiltroPedidos,
} from "./validacao";

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

// PBI-43: aprovação que o webhook marcou para estorno e ainda não foi estornada, ou pedido pago
// (ainda não enviado) cujo pagamento já foi estornado no Mercado Pago e falta cancelar.
const ESTORNO_PENDENTE: Prisma.OrderWhereInput = {
  OR: [
    {
      payments: {
        some: {
          status: "APROVADO",
          refundReason: { in: ["PEDIDO_NAO_PENDENTE", "VALOR_DIVERGENTE"] },
        },
      },
    },
    // Sem unidade livre cancela o pedido no estorno: o pedido já enviado não tem mais o que fazer
    // aqui (mesma regra de acaoDeEstorno).
    {
      status: { notIn: ["ENVIADO", "ENTREGUE"] },
      payments: { some: { status: "APROVADO", refundReason: "SEM_ESTOQUE" } },
    },
    // PBI-42: se outro pagamento aprovado sem motivo pagou o pedido, não há o que concluir
    // (mesma regra de acaoDeEstorno com pagouOPedido).
    {
      status: { in: ["PAGO", "PROCESSANDO"] },
      AND: [
        {
          payments: {
            some: {
              status: "ESTORNADO",
              OR: [{ refundReason: null }, { refundReason: "SEM_ESTOQUE" }],
            },
          },
        },
        {
          payments: {
            none: {
              status: "APROVADO",
              OR: [{ refundReason: null }, { refundReason: "SEM_ESTOQUE" }],
            },
          },
        },
      ],
    },
  ],
};

const ONDE_DO_FILTRO: Record<FiltroPedidos, Prisma.OrderWhereInput> = {
  "a-fazer": { status: { in: ["PAGO", "PROCESSANDO"] } },
  pendentes: { status: "PENDENTE" },
  enviados: { status: "ENVIADO" },
  entregues: { status: "ENTREGUE" },
  cancelados: { status: "CANCELADO" },
  "estorno-pendente": ESTORNO_PENDENTE,
  todos: {},
};

// A lista do admin e as contagens do painel (PBI-48) usam o mesmo filtro, para os números baterem.
function ondeDaLista(filtro: FiltroPedidos, busca = ""): Prisma.OrderWhereInput {
  return {
    deletedAt: null,
    AND: [ONDE_DO_FILTRO[filtro]],
    ...(busca && {
      OR: [
        { number: { contains: busca, mode: "insensitive" } },
        { user: { email: { contains: busca, mode: "insensitive" } } },
      ],
    }),
  };
}

export type ContagemPedidos = Record<Exclude<FiltroPedidos, "todos">, number>;

// RF32 (PBI-48): quantos pedidos cada filtro da lista mostra agora, sem busca ("Todos" fica de
// fora). Roda na transação de quem chama, que já passou pelo comoAdmin: esta função não confere
// permissão sozinha.
export async function contarPedidosPorFiltro(
  tx: Prisma.TransactionClient,
): Promise<ContagemPedidos> {
  const contagem: ContagemPedidos = {
    "a-fazer": 0,
    pendentes: 0,
    enviados: 0,
    entregues: 0,
    cancelados: 0,
    "estorno-pendente": 0,
  };
  for (const filtro of Object.keys(contagem) as (keyof ContagemPedidos)[])
    contagem[filtro] = await tx.order.count({ where: ondeDaLista(filtro) });
  return contagem;
}

type PedidoComItens = Prisma.OrderGetPayload<{
  include: { items: true; payments: { select: { status: true } } };
}>;

// Uma linha de pedido do admin, sem o cliente: a lista de pedidos e o perfil do cliente (PBI-38).
function resumoDoPedido(
  pedido: PedidoComItens,
  reservados: Set<string>,
): Omit<PedidoAdminLista, "cliente"> {
  return {
    numero: pedido.number,
    criadoEm: pedido.createdAt,
    situacao: situacaoDe(pedido, reservados) ?? "NAO_CONCLUIDO",
    situacaoBanco: pedido.status,
    modalidade: pedido.deliveryMethod,
    totalCentavos: pedido.totalCents,
    unidades: pedido.items.reduce((soma, item) => soma + item.quantity, 0),
  };
}

export type PedidoDoClienteAdmin = Omit<PedidoAdminLista, "cliente">;

// RF30 (PBI-38): todos os pedidos de um cliente para o perfil no admin, com as tentativas sem
// pagamento ("NAO_CONCLUIDO"), dos mais recentes aos mais antigos. Roda na transação de quem
// chama, que já passou pelo comoAdmin: esta função não confere permissão sozinha.
export async function pedidosDoClienteAdmin(
  tx: Prisma.TransactionClient,
  userId: string,
  agora = new Date(),
): Promise<PedidoDoClienteAdmin[]> {
  const pedidos = await tx.order.findMany({
    where: { userId, deletedAt: null },
    include: { items: true, payments: { select: { status: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  const reservados = await comReservaAtiva(pedidos, agora, tx);
  return pedidos.map((pedido) => resumoDoPedido(pedido, reservados));
}

// "A fazer" é a fila de trabalho: os mais antigos primeiro. Os demais filtros mostram os mais
// recentes primeiro. O id desempata, para um pedido não repetir nem sumir entre as páginas.
export function listarPedidosAdmin(entrada: unknown, cabecalhos: Headers, agora = new Date()) {
  return comoAdmin(cabecalhos, async (tx): Promise<PaginaPedidosAdmin> => {
    const { filtro, busca, pagina } = schemaListaAdmin.parse(
      typeof entrada === "object" && entrada !== null ? entrada : {},
    );
    const onde = ondeDaLista(filtro, busca);
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
        ...resumoDoPedido(pedido, reservados),
        cliente: { nome: pedido.user.name, email: pedido.user.email },
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
  // perfilId (PBI-38): leva ao perfil em /admin/clientes; null se quem comprou não é CLIENTE.
  cliente: { nome: string; email: string; telefone: string | null; perfilId: string | null };
  itens: { titulo: string; precoCentavos: number; quantidade: number }[];
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  endereco: DadosEndereco;
  rastreio: string | null;
  pagoEm: Date | null;
  enviadoEm: Date | null;
  // PBI-43: o admin pode cancelar o pedido que não foi pago.
  cancelavel: boolean;
  pagamentos: {
    provedor: string;
    idExterno: string | null;
    metodo: "PIX" | "CARTAO" | "BOLETO" | "SALDO_MERCADO_PAGO";
    situacao: "PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO";
    valorCentavos: number;
    // PBI-43: por que o webhook pediu estorno e o que o admin pode fazer com o pagamento.
    motivoEstorno: MotivoEstorno | null;
    acaoEstorno: "estornar" | "concluir" | null;
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
                  refundReason: true,
                },
              },
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          })
        : null;
    if (!pedido) throw new ErroGestao("nao_encontrado", "Pedido não encontrado.");
    const reservados = await comReservaAtiva([pedido], agora, tx);
    const pagoPorOutro = pedido.payments.some((p) =>
      pagouOPedido({ situacao: p.status, motivo: p.refundReason }),
    );
    return {
      numero: pedido.number,
      criadoEm: pedido.createdAt,
      situacao: situacaoDe(pedido, reservados) ?? "NAO_CONCLUIDO",
      situacaoBanco: pedido.status,
      modalidade: pedido.deliveryMethod,
      cliente: {
        nome: pedido.user.name,
        email: pedido.user.email,
        telefone: pedido.user.phone,
        perfilId: pedido.user.role === "CLIENTE" ? pedido.user.id : null,
      },
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
      cancelavel: podeCancelarPedido(
        pedido.status,
        pedido.payments.filter((p) => p.status === "PENDENTE").map((p) => p.method),
      ),
      pagamentos: pedido.payments.map((pagamento) => ({
        provedor: pagamento.provider,
        idExterno: pagamento.externalId,
        metodo: pagamento.method,
        situacao: pagamento.status,
        valorCentavos: pagamento.amountCents,
        motivoEstorno: pagamento.refundReason,
        acaoEstorno: pagamento.externalId
          ? acaoDeEstorno(
              { situacao: pagamento.status, motivo: pagamento.refundReason },
              pedido.status,
              pagoPorOutro,
            )
          : null,
      })),
    };
  });
}

// RF29/RN05: só para frente a partir de Pago (transicaoPermitida); Pago é só do gateway (PBI-28).
// A situação que a tela mostrava (`de`) é conferida dentro da transação Serializable: se outro
// admin mudou antes, nada é gravado. Marcar como enviado grava a data do envio.
export function mudarSituacaoPedido(entrada: unknown, cabecalhos: Headers, agora = new Date()) {
  return comoAdmin(cabecalhos, async (tx) => {
    const { numero, de, para } = validar(schemaMudarSituacao, entrada);
    const pedido = await tx.order.findFirst({
      where: { number: numero, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!pedido) throw new ErroGestao("nao_encontrado", "Pedido não encontrado.");
    if (pedido.status !== de)
      throw new ErroGestao("conflito", "A situação deste pedido mudou. Atualize a página.");
    if (!transicaoPermitida(de, para))
      throw new ErroGestao("invalido", "Esta mudança de situação não é permitida.");
    await tx.order.update({
      where: { id: pedido.id },
      data: { status: para, ...(para === "ENVIADO" && { shippedAt: agora }) },
    });
    return { situacao: para };
  });
}

// RF29: registra, corrige ou limpa (código vazio) o rastreio. O cliente vê na conta (PBI-29).
export function registrarRastreio(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const { numero, codigo } = validar(schemaRastreio, entrada);
    const pedido = await tx.order.findFirst({
      where: { number: numero, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!pedido) throw new ErroGestao("nao_encontrado", "Pedido não encontrado.");
    if (!aceitaRastreio(pedido.status))
      throw new ErroGestao(
        "invalido",
        "O rastreio só pode ser registrado depois do pagamento aprovado e fora de pedido cancelado.",
      );
    await tx.order.update({ where: { id: pedido.id }, data: { trackingCode: codigo } });
    return { rastreio: codigo };
  });
}
