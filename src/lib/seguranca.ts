type Ambiente = {
  NODE_ENV?: string;
  R2_PUBLIC_URL?: string;
  R2_ACCOUNT_ID?: string;
};

// Junta "nome fonte fonte" ignorando as fontes que o ambiente não configurou.
function diretiva(nome: string, ...fontes: (string | undefined)[]): string {
  return [nome, ...fontes.filter(Boolean)].join(" ");
}

export type CabecalhosDeSeguranca = {
  "Content-Security-Policy": string;
  "X-Content-Type-Options": string;
  "Referrer-Policy": string;
  "X-Frame-Options": string;
  "Strict-Transport-Security"?: string;
};

// RNF05: CSP estrita por nonce. O proxy gera um nonce novo a cada requisição e o Next o aplica
// aos próprios scripts; 'strict-dynamic' libera o que esses scripts carregarem (ex.: Turnstile).
export function cabecalhosDeSeguranca(nonce: string, ambiente: Ambiente): CabecalhosDeSeguranca {
  // O React usa eval no next dev para reconstruir as pilhas de erro; em produção, não.
  const evalEmDev = ambiente.NODE_ENV === "development" ? "'unsafe-eval'" : undefined;
  // RNF01: só produção roda atrás do HTTPS; em localhost por http, o HSTS e o
  // upgrade-insecure-requests deixariam o navegador preso em https.
  const producao = ambiente.NODE_ENV === "production";
  // RF27 (PBI-17): imagens do endereço público do bucket; envio direto do navegador ao endpoint
  // da conta (URL assinada em path-style, ver modules/media/r2.ts).
  const r2Publico = ambiente.R2_PUBLIC_URL?.trim()
    ? new URL(ambiente.R2_PUBLIC_URL).origin
    : undefined;
  const r2Envio = ambiente.R2_ACCOUNT_ID?.trim()
    ? `https://${ambiente.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`
    : undefined;
  const diretivas = [
    "default-src 'self'",
    diretiva("script-src", "'self'", `'nonce-${nonce}'`, "'strict-dynamic'", evalEmDev),
    diretiva("style-src", "'self'", `'nonce-${nonce}'`),
    // O next/image escreve style="..." no <img>, e atributo não aceita nonce: só os atributos
    // ficam livres; as tags <style> continuam exigindo o nonce.
    "style-src-attr 'unsafe-inline'",
    diretiva("img-src", "'self'", "data:", r2Publico),
    diretiva("connect-src", "'self'", r2Envio),
    // RNF08 (PBI-44): o desafio do Turnstile abre num iframe da Cloudflare.
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(producao ? ["upgrade-insecure-requests"] : []),
  ];
  // RNF07. O X-Frame-Options repete o frame-ancestors para navegadores antigos.
  return {
    "Content-Security-Policy": diretivas.join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    ...(producao ? { "Strict-Transport-Security": "max-age=31536000" } : {}),
  };
}
