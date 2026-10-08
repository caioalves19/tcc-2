import { PgBoss } from "pg-boss";
import { FILA_LIBERAR_RESERVAS, registrarTarefasDeReserva } from "../modules/orders/index";
import { databaseUrl } from "./database-url";

export { FILA_LIBERAR_RESERVAS };

// Fila de tarefas no próprio Postgres (ESCOPO §8). Sobe junto com o servidor do Next.
export async function iniciarTarefas(): Promise<PgBoss> {
  const fila = new PgBoss(databaseUrl());
  fila.on("error", (erro) => {
    console.error("Falha na fila de tarefas", erro instanceof Error ? erro.name : "erro");
  });
  await fila.start();
  await registrarTarefasDeReserva(fila);
  return fila;
}
