// Roda uma vez quando o servidor do Next sobe (não roda no build).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { verificarAmbienteDeProducao } = await import("./lib/ambiente");
  verificarAmbienteDeProducao(process.env);
  // RN03: worker do pg-boss que libera as reservas vencidas (PBI-25).
  const { iniciarTarefas } = await import("./lib/tarefas");
  await iniciarTarefas();
}
