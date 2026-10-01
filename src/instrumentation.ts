// Roda uma vez quando o servidor do Next sobe (não no build).
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }
  // Falha cedo: em produção sem RESEND_API_KEY o servidor não sobe (o link nunca vai para log).
  const { escolherEnviador } = await import("./lib/email");
  escolherEnviador(process.env);
}
