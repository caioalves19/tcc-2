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
