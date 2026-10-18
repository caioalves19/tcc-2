import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { expect, it } from "vitest";

import nextConfig from "../../next.config";
import { config, proxy } from "../../src/proxy";

function nonceDa(csp: string | null): string | undefined {
  return csp?.match(/'nonce-([^']+)'/)?.[1];
}

// O Next lê o nonce da CSP da requisição para aplicá-lo aos próprios scripts; o navegador lê a
// da resposta. As duas precisam ser a mesma.
it("RNF05 o proxy aplica a CSP na resposta e repassa a mesma à página, com nonce novo por requisição", () => {
  const primeira = proxy(new NextRequest("http://localhost:3000/obras"));
  const segunda = proxy(new NextRequest("http://localhost:3000/obras"));

  const csp = primeira.headers.get("Content-Security-Policy");
  expect(nonceDa(csp)).toMatch(/^[A-Za-z0-9+/=]{16,}$/);
  expect(primeira.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
  expect(primeira.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(nonceDa(segunda.headers.get("Content-Security-Policy"))).not.toBe(nonceDa(csp));
});

// RF14 (PBI-28): o webhook responde ao Mercado Pago sem passar pelo proxy; arquivos do build e
// imagens otimizadas não são páginas e não precisam de CSP.
it("RNF05 o proxy roda nas páginas e fica fora do webhook e dos arquivos estáticos", () => {
  const roda = (url: string) => unstable_doesMiddlewareMatch({ config, nextConfig, url });

  expect(roda("/")).toBe(true);
  expect(roda("/obras/uma-obra")).toBe(true);
  expect(roda("/checkout/K-0001")).toBe(true);
  expect(roda("/api/webhooks/mercadopago")).toBe(false);
  expect(roda("/_next/static/chunks/app.js")).toBe(false);
  expect(roda("/_next/image?url=%2Fx.webp&w=640&q=75")).toBe(false);
  expect(roda("/marca/atelie-selo.svg")).toBe(false);
});
