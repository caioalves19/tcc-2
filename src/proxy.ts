import { NextResponse, type NextRequest } from "next/server";

import { cabecalhosDeSeguranca } from "@/lib/seguranca";

// RNF05/RNF07 (PBI-45): nonce novo a cada requisição. O Next tira o nonce da CSP da requisição e
// o aplica aos próprios scripts; o navegador aplica a CSP da resposta. Só cabeçalhos: a checagem
// de sessão e papel continua nos módulos.
export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");
  const cabecalhos = cabecalhosDeSeguranca(nonce, process.env);

  const daRequisicao = new Headers(request.headers);
  daRequisicao.set("Content-Security-Policy", cabecalhos["Content-Security-Policy"]);
  const resposta = NextResponse.next({ request: { headers: daRequisicao } });
  for (const [nome, valor] of Object.entries(cabecalhos)) resposta.headers.set(nome, valor);
  return resposta;
}

// Fora: rotas de API (o webhook do Mercado Pago, PBI-28), arquivos do build, imagens otimizadas,
// arquivos com extensão (ícones e marca em public/) e os prefetches do next/link.
export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
