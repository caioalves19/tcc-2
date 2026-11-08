import { expect, it } from "vitest";

import { cabecalhosDeArquivo, cabecalhosDeSeguranca } from "../../src/lib/seguranca";

// Lê uma diretiva da CSP ("script-src 'self' ...") e devolve as fontes, sem o nome.
function diretiva(csp: string, nome: string): string[] | undefined {
  const achada = csp
    .split(";")
    .map((parte) => parte.trim().split(/\s+/))
    .find(([chave]) => chave === nome);
  return achada?.slice(1);
}

it("RNF05 em produção o script-src só aceita o nonce da requisição, sem unsafe-inline nem unsafe-eval", () => {
  const csp = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" })[
    "Content-Security-Policy"
  ];

  const scripts = diretiva(csp, "script-src");
  expect(scripts).toEqual(expect.arrayContaining(["'self'", "'nonce-abc123'", "'strict-dynamic'"]));
  expect(scripts).not.toContain("'unsafe-inline'");
  expect(scripts).not.toContain("'unsafe-eval'");
});

// O React usa eval no next dev para reconstruir as pilhas de erro; em produção, não.
it("RNF05 no next dev o script-src acrescenta unsafe-eval", () => {
  const csp = cabecalhosDeSeguranca("abc123", { NODE_ENV: "development" })[
    "Content-Security-Policy"
  ];

  expect(diretiva(csp, "script-src")).toContain("'unsafe-eval'");
});

it("RNF05 a CSP restringe o resto ao próprio site e proíbe plugins e ser embutido em frame", () => {
  const csp = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" })[
    "Content-Security-Policy"
  ];

  expect(diretiva(csp, "default-src")).toEqual(["'self'"]);
  expect(diretiva(csp, "object-src")).toEqual(["'none'"]);
  expect(diretiva(csp, "base-uri")).toEqual(["'self'"]);
  expect(diretiva(csp, "form-action")).toEqual(["'self'"]);
  expect(diretiva(csp, "frame-ancestors")).toEqual(["'none'"]);
});

// RF27: as imagens vêm do endereço público do bucket e o navegador envia direto ao R2 (PBI-17).
it("RF27 a CSP libera o endereço público do R2 nas imagens e o endpoint da conta no envio", () => {
  const csp = cabecalhosDeSeguranca("abc123", {
    NODE_ENV: "production",
    R2_PUBLIC_URL: "https://pub-exemplo.r2.dev/",
    R2_ACCOUNT_ID: "conta123",
  })["Content-Security-Policy"];

  expect(diretiva(csp, "img-src")).toEqual(["'self'", "data:", "https://pub-exemplo.r2.dev"]);
  expect(diretiva(csp, "connect-src")).toEqual(
    expect.arrayContaining(["'self'", "https://conta123.r2.cloudflarestorage.com"]),
  );
});

// PBI-49: em desenvolvimento as imagens de demonstração saem de public/seed (R2_PUBLIC_URL=/seed),
// do próprio site.
it("RF27 com R2_PUBLIC_URL relativa as imagens ficam restritas ao próprio site", () => {
  const csp = cabecalhosDeSeguranca("abc123", {
    NODE_ENV: "development",
    R2_PUBLIC_URL: "/seed",
  })["Content-Security-Policy"];

  expect(diretiva(csp, "img-src")).toEqual(["'self'", "data:"]);
});

// RNF08 (PBI-44): o desafio do Turnstile abre num iframe da Cloudflare.
it("RNF08 a CSP libera o iframe do Turnstile e nenhum outro", () => {
  const csp = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" })[
    "Content-Security-Policy"
  ];

  expect(diretiva(csp, "frame-src")).toEqual(["https://challenges.cloudflare.com"]);
});

it("RNF05 o style-src aceita as folhas do site e os estilos inline com o nonce da requisição", () => {
  const csp = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" })[
    "Content-Security-Policy"
  ];

  expect(diretiva(csp, "style-src")).toEqual(["'self'", "'nonce-abc123'"]);
});

// O next/image escreve style="color:transparent" no <img>, e atributo não aceita nonce. Só os
// atributos ficam livres; as tags <style> continuam exigindo o nonce.
it("RNF05 atributos style são aceitos sem liberar tags <style> sem nonce", () => {
  const csp = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" })[
    "Content-Security-Policy"
  ];

  expect(diretiva(csp, "style-src-attr")).toEqual(["'unsafe-inline'"]);
  expect(diretiva(csp, "style-src")).not.toContain("'unsafe-inline'");
});

it("RNF07 toda página leva nosniff, Referrer-Policy e X-Frame-Options", () => {
  const cabecalhos = cabecalhosDeSeguranca("abc123", { NODE_ENV: "development" });

  expect(cabecalhos).toMatchObject({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
  });
});

// RNF01/RNF07: só em produção, que roda atrás do HTTPS. Em localhost por http, o HSTS e o
// upgrade-insecure-requests deixariam o navegador preso em https.
it("RNF07 HSTS e upgrade-insecure-requests só em produção", () => {
  const producao = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" });
  const dev = cabecalhosDeSeguranca("abc123", { NODE_ENV: "development" });

  expect(producao["Strict-Transport-Security"]).toBe("max-age=31536000");
  expect(diretiva(producao["Content-Security-Policy"], "upgrade-insecure-requests")).toEqual([]);
  expect(dev).not.toHaveProperty("Strict-Transport-Security");
  expect(diretiva(dev["Content-Security-Policy"], "upgrade-insecure-requests")).toBeUndefined();
});

// RNF07 (APS, achado do OWASP ZAP): o site não usa câmera, microfone nem localização; nenhum
// script, nem de terceiro (Turnstile), pode pedir esses recursos ao navegador.
it("RNF07 a Permissions-Policy desliga câmera, microfone e localização", () => {
  const politica = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" })[
    "Permissions-Policy"
  ];

  expect(politica?.split(",").map((p) => p.trim())).toEqual(
    expect.arrayContaining(["camera=()", "microphone=()", "geolocation=()"]),
  );
});

// RNF07 (APS, achado do OWASP ZAP): robots.txt, sitemap.xml, /_next/static e os arquivos do public
// ficam fora do matcher do proxy (sem nonce); recebem os mesmos cabeçalhos e uma CSP que não executa
// nada, porque nenhum deles é uma página.
it("RNF07 arquivos fora do proxy recebem nosniff, DENY, Permissions-Policy e CSP sem execução", () => {
  const cabecalhos = cabecalhosDeArquivo({ NODE_ENV: "production" });

  expect(cabecalhos).toMatchObject({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000",
  });
  expect(cabecalhos["Permissions-Policy"]).toContain("camera=()");
  const csp = cabecalhos["Content-Security-Policy"];
  expect(diretiva(csp, "default-src")).toEqual(["'none'"]);
  // Estas três não herdam do default-src (achado 10055 do ZAP na segunda rodada).
  expect(diretiva(csp, "frame-ancestors")).toEqual(["'none'"]);
  expect(diretiva(csp, "form-action")).toEqual(["'none'"]);
  expect(diretiva(csp, "base-uri")).toEqual(["'none'"]);
});

it("RNF01 fora de produção os arquivos não recebem HSTS (localhost por http)", () => {
  expect(cabecalhosDeArquivo({ NODE_ENV: "development" })).not.toHaveProperty(
    "Strict-Transport-Security",
  );
});
