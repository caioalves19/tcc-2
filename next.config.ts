import type { NextConfig } from "next";

import { hostsDeImagem } from "./src/lib/imagens-remotas";
import { cabecalhosDeArquivo } from "./src/lib/seguranca";

// Hosts extras que o `next dev` aceita, separados por vírgula (ex.: o túnel https do teste do
// webhook no sandbox, PBI-28). Sem isso o Next bloqueia os próprios scripts nesses hosts.
function origensDeDesenvolvimento(): string[] {
  return (process.env.DEV_ORIGINS ?? "")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: origensDeDesenvolvimento(),
  // RNF07: a resposta não anuncia o framework.
  poweredByHeader: false,
  // O `next dev` registra os argumentos das Server Actions, e o login e o cadastro levam senha.
  logging: { serverFunctions: false },
  // RNF07: o proxy (src/proxy.ts) pula todo caminho com ponto (robots.txt, sitemap.xml,
  // /_next/static, public); aqui esses caminhos recebem os cabeçalhos de segurança.
  async headers() {
    return [
      {
        source: "/:arquivo(.*\\..*)",
        headers: Object.entries(cabecalhosDeArquivo(process.env)).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: hostsDeImagem(process.env.R2_PUBLIC_URL),
  },
};

export default nextConfig;
