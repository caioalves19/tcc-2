import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.{test,spec}.ts"],
    // Postgres real entra na 0A; até lá a suíte de integração fica vazia / fumaça.
    passWithNoTests: true,
  },
});
