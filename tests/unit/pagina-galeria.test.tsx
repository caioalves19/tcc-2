// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const listar = vi.hoisted(() => vi.fn());
vi.mock("@/modules/portfolio", () => ({ listarGaleria: listar }));
vi.mock("next/headers", () => ({
  headers: () => {
    throw new Error("Galeria não exige sessão");
  },
}));
import PaginaGaleria from "@/app/tatuagens/page";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
const dados = {
  filtros: { artista: "ana", estilo: "floral", regiao: "Braço" },
  artistas: [{ id: "ana", nome: "Ana" }],
  estilos: [{ id: "floral", nome: "Floral" }],
  regioes: ["Braço"],
  trabalhos: [
    {
      id: "rosa",
      titulo: "Rosa",
      imagem: "portfolio/rosa.png",
      textoAlternativo: "Rosa — Ana · Braço",
      artistaNome: "Ana",
      regiaoCorpo: "Braço",
      estilos: ["Floral"],
    },
  ],
};
it("RF17/RN01: página anônima repassa filtros, exibe imagem responsiva e formulário combinável", async () => {
  vi.stubEnv("R2_PUBLIC_URL", "https://imagens.example.test");
  listar.mockResolvedValue(dados);
  render(
    await PaginaGaleria({
      searchParams: Promise.resolve({
        artista: ["ana", "bia"],
        estilo: "floral",
        regiao: "Braço",
        busca: "ignorada",
      }),
    }),
  );
  expect(listar).toHaveBeenCalledWith({ artista: "ana", estilo: "floral", regiao: "Braço" });
  const imagem = screen.getByRole("img", { name: "Rosa — Ana · Braço" });
  expect(imagem.getAttribute("sizes")).toContain("100vw");
  expect(imagem.getAttribute("srcset")).toContain("640w");
  for (const [nome, valor] of [
    ["Artista", "ana"],
    ["Estilo", "floral"],
    ["Região do corpo", "Braço"],
  ] as const) {
    expect((screen.getByLabelText(nome) as HTMLSelectElement).value).toBe(valor);
  }
  const form = screen.getByRole("button", { name: "Filtrar" }).closest("form");
  expect(form?.getAttribute("method")).toBe("get");
  expect(form?.getAttribute("action")).toBe("/tatuagens");
  expect(screen.queryByRole("searchbox")).toBeNull();
});
it("RF17: estado vazio diferencia acervo vazio de filtros sem resultado e permite limpar", async () => {
  listar.mockResolvedValue({ ...dados, trabalhos: [] });
  render(await PaginaGaleria({ searchParams: Promise.resolve({}) }));
  expect(
    screen.getByText("Nenhum trabalho encontrado para os filtros selecionados."),
  ).toBeDefined();
  expect(screen.getByRole("link", { name: "Limpar filtros" }).getAttribute("href")).toBe(
    "/tatuagens",
  );
  cleanup();
  listar.mockResolvedValue({
    ...dados,
    filtros: {},
    trabalhos: [],
    artistas: [],
    estilos: [],
    regioes: [],
  });
  render(await PaginaGaleria({ searchParams: Promise.resolve({}) }));
  expect(screen.getByText("Ainda não há tatuagens cadastradas.")).toBeDefined();
});
it("RF17: navegação pública leva à galeria", async () => {
  const { Cabecalho } = await import("@/components/layout/cabecalho");
  render(<Cabecalho />);
  expect(screen.getByRole("link", { name: "Tatuagem" }).getAttribute("href")).toBe("/tatuagens");
});
