// Roda uma vez quando o servidor do Next sobe (não roda no build).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { verificarAmbienteDeProducao } = await import("./lib/ambiente");
  verificarAmbienteDeProducao(process.env);
  // RN03: worker do pg-boss que libera as reservas vencidas (PBI-25). É só higiene, porque a
  // disponibilidade já ignora as vencidas: se a fila não sobe, a loja sobe mesmo assim.
  try {
    const { iniciarTarefas } = await import("./lib/tarefas");
    await iniciarTarefas();
  } catch (erro) {
    console.error("Fila de tarefas não iniciou", erro instanceof Error ? erro.message : "erro");
  }
}
