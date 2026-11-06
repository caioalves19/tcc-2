import type { NextConfig } from "next";

type PadraoRemoto = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

// Libera o host público do R2 para o next/image (RNF14: formato moderno e tamanhos
// responsivos). Sem R2_PUBLIC_URL nenhuma imagem remota é aceita; caminho relativo (ex.: /seed,
// PBI-49) é imagem local, que o next/image já aceita.
export function hostsDeImagem(publica: string | undefined): PadraoRemoto[] {
  const url = publica?.trim();
  if (!url || url.startsWith("/")) return [];
  const { protocol, hostname, port } = new URL(url);
  return [{ protocol: protocol === "http:" ? "http" : "https", hostname, port, pathname: "/**" }];
}
