import { expect, it } from "vitest";

import nextConfig from "../../next.config";

// RNF07 (APS, achado do OWASP ZAP): a resposta não anuncia o framework (X-Powered-By: Next.js).
it("RNF07 o servidor não manda o cabeçalho X-Powered-By", () => {
  expect(nextConfig.poweredByHeader).toBe(false);
});

// RNF07: o proxy (src/proxy.ts) pula caminhos com ponto; o next.config cobre exatamente esses.
it("RNF07 o next.config aplica os cabeçalhos de arquivo a todo caminho com ponto", async () => {
  const regras = (await nextConfig.headers?.()) ?? [];
  const arquivos = regras.find((regra) => regra.source === "/:arquivo(.*\\..*)");

  expect(arquivos?.headers).toEqual(
    expect.arrayContaining([
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ]),
  );
});
