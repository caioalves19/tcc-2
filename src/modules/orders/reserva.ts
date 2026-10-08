import { z } from "zod";
import { obterPrisma } from "../../lib/prisma";
import { obraDisponivel } from "./regras";

// RN03: as unidades ficam presas ao checkout por 10 minutos.
export const PRAZO_RESERVA_MS = 10 * 60 * 1000;

export type ItemReserva = { obraId: string; quantidade: number };
export type ResultadoReserva<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: "invalido"; mensagem: string }
  | { ok: false; erro: "indisponivel"; obras: string[] };

const schemaItens = z
  .array(
    z.object({
      obraId: z.uuid("Obra inválida."),
      quantidade: z.number().int().min(1).max(999),
    }),
  )
  .min(1, "Nenhuma obra para reservar.")
  .refine(
    (itens) => new Set(itens.map((i) => i.obraId)).size === itens.length,
    "Obra repetida na reserva.",
  );

// RF15/RN02/RN03: reserva tudo ou nada; disponível = estoque − reservas ativas das outras sessões.
// Uma nova reserva da mesma sessão substitui a anterior (o cliente voltou ao checkout).
export async function reservarItens(
  sessaoId: string,
  entrada: unknown,
  agora: Date = new Date(),
): Promise<ResultadoReserva<{ expiraEm: Date }>> {
  const validado = schemaItens.safeParse(entrada);
  if (!validado.success)
    return {
      ok: false,
      erro: "invalido",
      mensagem: validado.error.issues.map((i) => i.message).join(" "),
    };
  const itens = validado.data;
  const ids = itens.map((i) => i.obraId).sort();
  const expiraEm = new Date(agora.getTime() + PRAZO_RESERVA_MS);

  return obterPrisma().$transaction(async (tx) => {
    // RN04: trava as linhas das obras, sempre na mesma ordem (id), para não haver deadlock.
    await tx.$queryRaw`SELECT id FROM artwork WHERE id = ANY(${ids}::uuid[]) ORDER BY id FOR UPDATE`;
    const obras = await tx.artwork.findMany({ where: { id: { in: ids } } });
    const reservadas = await tx.artworkReservation.groupBy({
      by: ["artworkId"],
      where: { artworkId: { in: ids }, sessionId: { not: sessaoId }, expiresAt: { gt: agora } },
      _sum: { quantity: true },
    });
    const indisponiveis = ids.filter((id) => {
      const obra = obras.find((o) => o.id === id);
      const item = itens.find((i) => i.obraId === id);
      if (!obra || !item) return true;
      const ocupadas = reservadas.find((r) => r.artworkId === id)?._sum.quantity ?? 0;
      return (
        !obraDisponivel({
          situacao: obra.status,
          arquivada: obra.deletedAt !== null,
          estoque: obra.stockQuantity,
        }) || obra.stockQuantity - ocupadas < item.quantidade
      );
    });
    if (indisponiveis.length > 0) return { ok: false, erro: "indisponivel", obras: indisponiveis };

    await tx.artworkReservation.deleteMany({ where: { sessionId: sessaoId } });
    await tx.artworkReservation.createMany({
      data: itens.map((i) => ({
        artworkId: i.obraId,
        sessionId: sessaoId,
        quantity: i.quantidade,
        expiresAt: expiraEm,
      })),
    });
    return { ok: true, dados: { expiraEm } };
  });
}

// RN06: Pix e boleto deixam o pedido pendente; a reserva ainda ativa passa a vencer
// junto com o meio de pagamento. Reserva já vencida não é ressuscitada.
export async function prorrogarReserva(
  sessaoId: string,
  ate: Date,
  agora: Date = new Date(),
): Promise<{ ok: true; dados: { expiraEm: Date } } | { ok: false; erro: "sem_reserva" }> {
  const { count } = await obterPrisma().artworkReservation.updateMany({
    where: { sessionId: sessaoId, expiresAt: { gt: agora } },
    data: { expiresAt: ate },
  });
  if (count === 0) return { ok: false, erro: "sem_reserva" };
  return { ok: true, dados: { expiraEm: ate } };
}

// Tarefa do pg-boss: apaga as reservas vencidas. A disponibilidade já ignora as vencidas,
// então rodar duas vezes (ou atrasar) não muda o estoque livre.
export async function liberarReservasExpiradas(agora: Date = new Date()): Promise<number> {
  const { count } = await obterPrisma().artworkReservation.deleteMany({
    where: { expiresAt: { lte: agora } },
  });
  return count;
}

// O cliente saiu do checkout (ou o pedido foi cancelado antes de pagar): as unidades voltam.
export async function liberarReservas(sessaoId: string): Promise<void> {
  await obterPrisma().artworkReservation.deleteMany({ where: { sessionId: sessaoId } });
}

// Unidades que o checkout ainda pode reservar agora: 0 se a obra não está à venda.
export async function estoqueDisponivel(obraId: string, agora: Date = new Date()): Promise<number> {
  const prisma = obterPrisma();
  const obra = await prisma.artwork.findUnique({ where: { id: obraId } });
  if (
    !obra ||
    !obraDisponivel({
      situacao: obra.status,
      arquivada: obra.deletedAt !== null,
      estoque: obra.stockQuantity,
    })
  )
    return 0;
  const { _sum } = await prisma.artworkReservation.aggregate({
    where: { artworkId: obraId, expiresAt: { gt: agora } },
    _sum: { quantity: true },
  });
  return Math.max(0, obra.stockQuantity - (_sum.quantity ?? 0));
}
