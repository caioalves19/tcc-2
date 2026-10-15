import type { Prisma, UserStatus } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao } from "../artists/index";
import type { DadosEndereco } from "../endereco/index";
import { pedidosDoClienteAdmin, type PedidoDoClienteAdmin } from "../orders/index";
import { totalGasto } from "./regras";
import { CLIENTES_POR_PAGINA, schemaIdCliente, schemaListaClientes } from "./validacao";

// RF30 (PBI-38): perfil unificado do cliente para o ADMIN. Toda leitura passa pelo comoAdmin
// (sessão e papel relidos no banco). Só consulta: nada aqui grava.

export type ClienteAdminLista = {
  id: string;
  nome: string;
  email: string;
  cadastradoEm: Date;
  // Conta excluída pelo cliente (RN12, PBI-40): continua na lista, marcada, com os pedidos.
  excluido: boolean;
};

export type PaginaClientesAdmin = {
  clientes: ClienteAdminLista[];
  total: number;
  pagina: number;
  totalPaginas: number;
  busca: string;
};

// Só o papel CLIENTE: ADMIN e ARTISTA não são clientes, mesmo que tenham comprado. Por nome; o
// id desempata, para um cliente não repetir nem sumir entre as páginas.
export function listarClientesAdmin(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx): Promise<PaginaClientesAdmin> => {
    const { busca, pagina } = schemaListaClientes.parse(
      typeof entrada === "object" && entrada !== null ? entrada : {},
    );
    const onde: Prisma.UserWhereInput = {
      role: "CLIENTE",
      ...(busca && {
        OR: [
          { name: { contains: busca, mode: "insensitive" } },
          { email: { contains: busca, mode: "insensitive" } },
        ],
      }),
    };
    const total = await tx.user.count({ where: onde });
    const clientes = await tx.user.findMany({
      where: onde,
      select: { id: true, name: true, email: true, createdAt: true, deletedAt: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * CLIENTES_POR_PAGINA,
      take: CLIENTES_POR_PAGINA,
    });
    return {
      clientes: clientes.map((cliente) => ({
        id: cliente.id,
        nome: cliente.name,
        email: cliente.email,
        cadastradoEm: cliente.createdAt,
        excluido: cliente.deletedAt !== null,
      })),
      total,
      pagina,
      totalPaginas: Math.ceil(total / CLIENTES_POR_PAGINA),
      busca,
    };
  });
}

export type ClienteAdmin = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  situacao: UserStatus;
  cadastradoEm: Date;
  excluido: boolean;
  // O único endereço de entrega da conta (RF05), como foi gravado; null se nunca cadastrou.
  endereco: DadosEndereco | null;
  // Todos os pedidos, inclusive as tentativas sem pagamento ("NAO_CONCLUIDO").
  pedidos: PedidoDoClienteAdmin[];
  // Soma dos pedidos pagos (de Pago a Entregue), em centavos.
  totalGastoCentavos: number;
};

// RF30: id fora do formato, inexistente ou de quem não é CLIENTE dá "nao_encontrado".
export function lerClienteAdmin(id: unknown, cabecalhos: Headers, agora = new Date()) {
  return comoAdmin(cabecalhos, async (tx): Promise<ClienteAdmin> => {
    const valido = schemaIdCliente.safeParse(id);
    const cliente = valido.success
      ? await tx.user.findFirst({
          where: { id: valido.data, role: "CLIENTE" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            deletedAt: true,
            address: true,
          },
        })
      : null;
    if (!cliente) throw new ErroGestao("nao_encontrado", "Cliente não encontrado.");
    const { address: endereco } = cliente;
    const pedidos = await pedidosDoClienteAdmin(tx, cliente.id, agora);
    return {
      id: cliente.id,
      nome: cliente.name,
      email: cliente.email,
      telefone: cliente.phone,
      situacao: cliente.status,
      cadastradoEm: cliente.createdAt,
      excluido: cliente.deletedAt !== null,
      endereco: endereco && {
        destinatario: endereco.recipient,
        cep: endereco.postalCode,
        logradouro: endereco.street,
        numero: endereco.number,
        complemento: endereco.complement,
        bairro: endereco.neighborhood,
        cidade: endereco.city,
        // Gravado por salvarEndereco, que só aceita as UFs de UFS.
        uf: endereco.state as DadosEndereco["uf"],
      },
      pedidos,
      totalGastoCentavos: totalGasto(pedidos),
    };
  });
}
