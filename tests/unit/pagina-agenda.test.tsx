// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ ler: vi.fn(), headers: new Headers({ cookie: "sessao=1" }) }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/modules/scheduling", () => ({ lerAgenda: mocks.ler }));
vi.mock("@/app/agenda/actions", () => ({
  cadastrarHorarioAcao: vi.fn(),
  editarHorarioAcao: vi.fn(),
  mudarSituacaoHorarioAcao: vi.fn(),
}));

import PaginaAgenda, { metadata } from "@/app/agenda/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const busca = (valores: Record<string, string | string[]>) => ({
  searchParams: Promise.resolve(valores),
});

it("RN10 visitante vai para o login; cliente vê que a agenda é só da equipe", async () => {
  mocks.ler.mockResolvedValueOnce({ ok: false, erro: "nao_autenticado", mensagem: "Entre." });
  await expect(PaginaAgenda(busca({}))).rejects.toThrow("redirect:/login");

  mocks.ler.mockResolvedValueOnce({
    ok: false,
    erro: "proibido",
    mensagem: "A agenda é só da equipe do Kolô.",
  });
  render(await PaginaAgenda(busca({})));
  expect(screen.getByRole("alert").textContent).toContain("A agenda é só da equipe do Kolô.");
  expect(screen.getByRole("link", { name: "Voltar ao início" }).getAttribute("href")).toBe("/");
  expect(metadata.title).toBe("Agenda · Kolô");
});

it("RF22 a equipe vê a agenda da semana pedida na URL", async () => {
  mocks.ler.mockResolvedValueOnce({
    ok: true,
    dados: {
      papel: "ARTISTA",
      artistaId: "ana",
      artistas: [],
      semana: {
        inicio: "2026-10-12",
        fim: "2026-10-18",
        anterior: "2026-10-05",
        proxima: "2026-10-19",
      },
      dias: [],
      opcoes: { estilos: [], tamanhos: [] },
    },
  });
  render(await PaginaAgenda(busca({ semana: ["2026-10-15", "x"], artista: "bia" })));
  expect(mocks.ler).toHaveBeenCalledWith(mocks.headers, { semana: "2026-10-15", artista: "bia" });
  expect(screen.getByRole("heading", { level: 1, name: "Agenda" })).toBeDefined();
});
