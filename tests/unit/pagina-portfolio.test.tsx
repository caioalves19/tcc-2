// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ ler: vi.fn(), headers: new Headers({ cookie: "sessao=1" }) }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/modules/portfolio", () => ({ lerPortfolio: mocks.ler }));
vi.mock("@/app/portfolio/gestao/actions", () => ({
  criarTrabalhoAcao: vi.fn(),
  editarTrabalhoAcao: vi.fn(),
  moverTrabalhoAcao: vi.fn(),
  removerTrabalhoAcao: vi.fn(),
}));
vi.mock("@/app/imagens/actions", () => ({
  solicitarUploadAcao: vi.fn(),
  processarImagemAcao: vi.fn(),
}));
import PaginaPortfolio from "@/app/portfolio/gestao/page";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const busca = (valores: Record<string, string | string[]>) => ({
  searchParams: Promise.resolve(valores),
});
it("RN10: visitante vai ao login e acesso proibido mostra recusa sem formulário", async () => {
  mocks.ler.mockResolvedValueOnce({ ok: false, erro: "nao_autenticado", mensagem: "Entre." });
  await expect(PaginaPortfolio(busca({}))).rejects.toThrow("redirect:/login");
  mocks.ler.mockResolvedValueOnce({ ok: false, erro: "proibido", mensagem: "Só equipe." });
  render(await PaginaPortfolio(busca({})));
  expect(screen.getByRole("alert").textContent).toBe("Só equipe.");
  expect(screen.queryByLabelText("Título")).toBeNull();
});
it("RF19: carrega filtro da URL e entrega a tela da gestão", async () => {
  mocks.ler.mockResolvedValueOnce({
    ok: true,
    dados: { papel: "ARTISTA", artistaId: "ana", artistas: [], estilos: [], trabalhos: [] },
  });
  render(await PaginaPortfolio(busca({ artista: ["ana", "bia"] })));
  expect(mocks.ler).toHaveBeenCalledWith(mocks.headers, "ana");
  expect(screen.getByRole("heading", { level: 1, name: "Gestão do portfólio" })).toBeDefined();
  expect(screen.getByLabelText("Título")).toBeDefined();
});
