import type { PgBoss } from "pg-boss";
import { liberarReservasExpiradas } from "./reserva";

export const FILA_LIBERAR_RESERVAS = "liberar-reservas-expiradas";

// RN03: a cada minuto o pg-boss apaga as reservas vencidas. A disponibilidade já ignora as
// vencidas, então um atraso ou uma execução repetida não muda o estoque livre.
export async function registrarTarefasDeReserva(
  fila: Pick<PgBoss, "createQueue" | "schedule" | "work">,
): Promise<void> {
  await fila.createQueue(FILA_LIBERAR_RESERVAS);
  await fila.schedule(FILA_LIBERAR_RESERVAS, "* * * * *");
  await fila.work(FILA_LIBERAR_RESERVAS, async () => {
    await liberarReservasExpiradas();
  });
}
