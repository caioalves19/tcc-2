import type { Prisma } from "../../../generated/prisma/client";
import { comoAdmin } from "../artists/index";
import { CLIENTES_POR_PAGINA, schemaListaClientes } from "./validacao";

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
