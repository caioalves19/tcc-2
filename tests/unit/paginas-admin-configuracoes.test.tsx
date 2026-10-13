// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ler: vi.fn(),
  salvar: vi.fn(),
  revalidar: vi.fn(),
  headers: new Headers({ cookie: "sessao=admin" }),
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/modules/settings", async (original) => ({
  ...(await original<typeof import("@/modules/settings")>()),
  lerConfiguracao: mocks.ler,
  salvarConfiguracao: mocks.salvar,
}));

import PaginaConfiguracoes, { metadata } from "@/app/admin/configuracoes/page";
import { salvarConfiguracaoAcao } from "@/app/admin/configuracoes/actions";
import { PADRAO } from "@/modules/settings";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("RF31 a página mostra o formulário com a configuração atual", async () => {
  mocks.ler.mockResolvedValue({ ...PADRAO, horarios: ["Sáb, 10h às 16h"] });
  render(await PaginaConfiguracoes());
  expect(screen.getByRole("heading", { level: 1, name: "Configurações do site" })).toBeDefined();
  expect(
    (screen.getByLabelText("Horários (uma linha por item, até 4)") as HTMLTextAreaElement).value,
  ).toBe("Sáb, 10h às 16h");
  expect(metadata.title).toBe("Configurações · Administração · Kolô");
});

it("RF31 a action salva com a sessão e atualiza o site inteiro só quando dá certo", async () => {
  const entrada = { contato: PADRAO.contato, horarios: "", textos: PADRAO.textos };
  mocks.salvar.mockResolvedValueOnce({ ok: true, dados: PADRAO });
  expect((await salvarConfiguracaoAcao(entrada)).ok).toBe(true);
  expect(mocks.salvar).toHaveBeenCalledWith(entrada, mocks.headers);
  expect(mocks.revalidar).toHaveBeenCalledWith("/", "layout");

  mocks.revalidar.mockClear();
  mocks.salvar.mockResolvedValueOnce({
    ok: false,
    erro: "proibido",
    mensagem: "Acesso exclusivo.",
  });
  expect((await salvarConfiguracaoAcao(entrada)).ok).toBe(false);
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
