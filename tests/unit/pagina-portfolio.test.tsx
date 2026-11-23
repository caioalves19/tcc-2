// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ ler: vi.fn(), headers: new Headers({ cookie: "sessao=1" }) }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/portfolio/gestao",
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
  await expect(PaginaPortfolio(busca({}))).rejects.toThrow(
    "redirect:/login?destino=%2Fportfolio%2Fgestao",
  );
  mocks.ler.mockResolvedValueOnce({ ok: false, erro: "proibido", mensagem: "Só equipe." });
  render(await PaginaPortfolio(busca({})));
  expect(screen.getByRole("alert").textContent).toBe("Só equipe.");
  expect(screen.queryByLabelText("Título")).toBeNull();
});
it("RF19: carrega filtro da URL e entrega a tela da gestão", async () => {
  mocks.ler.mockResolvedValueOnce({
    ok: true,
    dados: {
      papel: "ARTISTA",
      artistaId: "ana",
      artistas: [],
      estilos: [],
      trabalhos: [],
      total: 0,
      pagina: 2,
      totalPaginas: 0,
    },
  });
  render(await PaginaPortfolio(busca({ artista: ["ana", "bia"], pagina: "2" })));
  expect(mocks.ler).toHaveBeenCalledWith(mocks.headers, "ana", "2");
  expect(screen.getByRole("heading", { level: 1, name: "Gestão do portfólio" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Novo trabalho" })).toBeDefined();
});
const dadosDe = (papel: "ADMIN" | "ARTISTA") => ({
  ok: true,
  dados: {
    papel,
    artistaId: "ana",
    artistas: [],
    estilos: [],
    trabalhos: [],
    total: 0,
    pagina: 1,
    totalPaginas: 0,
  },
});
it("RF32: o admin continua com o menu da administração, com Portfólio marcado", async () => {
  mocks.ler.mockResolvedValueOnce(dadosDe("ADMIN"));
  render(await PaginaPortfolio(busca({})));
  const menu = screen.getByRole("navigation", { name: "Administração" });
  expect(within(menu).getByRole("link", { name: "Portfólio" }).getAttribute("aria-current")).toBe(
    "page",
  );
});
it("RF19: o artista vê a gestão sem o menu da administração", async () => {
  mocks.ler.mockResolvedValueOnce(dadosDe("ARTISTA"));
  render(await PaginaPortfolio(busca({})));
  expect(screen.queryByRole("navigation", { name: "Administração" })).toBeNull();
});
