// Roda uma vez quando o servidor do Next sobe (não roda no build).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { verificarAmbienteDeProducao } = await import("./lib/ambiente");
  verificarAmbienteDeProducao(process.env);
}
