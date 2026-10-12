import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.{test,spec}.ts"],
    // Postgres real entra na 0A; até lá a suíte de integração fica vazia / fumaça.
    passWithNoTests: true,
    // O primeiro teste de cada arquivo carrega o app (Prisma, better-auth) no import dinâmico:
    // ~1,6 s sozinho, mais de 5 s com os arquivos em paralelo criando bancos e gerando hash de
    // senha. O padrão de 5 s derrubava esse teste ao acaso.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
