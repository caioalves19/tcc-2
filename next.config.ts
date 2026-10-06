import type { NextConfig } from "next";

// Libera o host público do R2 para o next/image (RNF14: formato moderno e tamanhos
// responsivos). Sem R2_PUBLIC_URL nenhuma imagem remota é aceita.
function hostsDeImagem(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const publica = process.env.R2_PUBLIC_URL;
  if (!publica) return [];
  const { protocol, hostname, port } = new URL(publica);
  return [{ protocol: protocol === "http:" ? "http" : "https", hostname, port, pathname: "/**" }];
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: hostsDeImagem(),
  },
};

export default nextConfig;
