// O destino vem da URL, que qualquer um pode forjar: só caminho interno passa, senão vira open redirect.
const FORA_DO_CAMINHO_INTERNO = /[\\\s]/;

export function urlDeLogin(destino: string): string {
  return `/login?destino=${encodeURIComponent(destino)}`;
}

export function destinoPosLogin(destino: unknown): string {
  if (
    typeof destino !== "string" ||
    !destino.startsWith("/") ||
    destino.startsWith("//") ||
    FORA_DO_CAMINHO_INTERNO.test(destino)
  ) {
    return "/";
  }
  return destino;
}
