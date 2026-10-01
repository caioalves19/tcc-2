// Em produção o Caddy é o único que fala com o app e grava o IP real do cliente
// no X-Forwarded-For; o primeiro item é o cliente.
export function ipDaRequisicao(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || cabecalhos.get("x-real-ip") || "desconhecido";
}
