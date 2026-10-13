import { afterEach, expect, it, vi } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  obterPrisma: () => ({
    siteSetting: {
      findMany: async () => {
        throw new Error("banco fora");
      },
    },
  }),
}));

import { lerConfiguracao, PADRAO } from "../../src/modules/settings";

afterEach(() => {
  vi.restoreAllMocks();
});

it("RF31 se o banco falhar, o site segue no ar com os valores padrão (o layout depende disso)", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const configuracao = await lerConfiguracao();
  expect(configuracao).toEqual(PADRAO);
  expect(configuracao).not.toBe(PADRAO);
  expect(log).toHaveBeenCalledWith("Falha ao ler as configurações do site", "Error");
});
