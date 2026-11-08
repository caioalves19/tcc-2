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
  filtros: { artista: "ana", estilo: "floral", regiao: "Braço", busca: "rosa" },
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
  total: 1,
  pagina: 1,
  totalPaginas: 1,
};
it("a contagem usa o total e os links de página mantêm os filtros", async () => {
  listar.mockResolvedValue({ ...dados, total: 13, totalPaginas: 2 });
  render(await PaginaGaleria({ searchParams: Promise.resolve({ artista: "ana", pagina: "1" }) }));
  expect(listar).toHaveBeenCalledWith(expect.objectContaining({ pagina: "1" }));
  expect(screen.getByRole("status").textContent).toBe("13 trabalhos encontrados");
  expect(screen.getByRole("link", { name: "2" }).getAttribute("href")).toBe(
    "/tatuagens?artista=ana&estilo=floral&regiao=Bra%C3%A7o&busca=rosa&pagina=2",
  );
});
it("página além do fim oferece voltar à primeira, mantendo os filtros", async () => {
  listar.mockResolvedValue({ ...dados, trabalhos: [], total: 13, pagina: 9, totalPaginas: 2 });
  render(await PaginaGaleria({ searchParams: Promise.resolve({ pagina: "9" }) }));
  expect(screen.getByRole("link", { name: "Ir para a primeira página" }).getAttribute("href")).toBe(
    "/tatuagens?artista=ana&estilo=floral&regiao=Bra%C3%A7o&busca=rosa",
  );
});
it("RF17/RF18/RN01: página anônima repassa filtros e busca, exibe imagem responsiva e formulário combinável", async () => {
  vi.stubEnv("R2_PUBLIC_URL", "https://imagens.example.test");
  listar.mockResolvedValue(dados);
  render(
    await PaginaGaleria({
      searchParams: Promise.resolve({
        artista: ["ana", "bia"],
        estilo: "floral",
        regiao: "Braço",
        busca: ["rosa", "lua"],
      }),
    }),
  );
  expect(listar).toHaveBeenCalledWith({
    artista: "ana",
    estilo: "floral",
    regiao: "Braço",
    busca: "rosa",
  });
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
  // RF18 (PBI-37): a palavra-chave vai no mesmo formulário dos filtros.
  const busca = screen.getByRole("searchbox", { name: "Buscar por palavra-chave" });
  expect((busca as HTMLInputElement).value).toBe("rosa");
  expect(busca.closest("form")).toBe(form);
  expect(screen.getByRole("status").textContent).toBe("1 trabalho encontrado");
  expect(screen.getByRole("link", { name: "Limpar busca e filtros" }).getAttribute("href")).toBe(
    "/tatuagens",
  );
});
it("RF17: estado vazio diferencia acervo vazio de filtros sem resultado e permite limpar", async () => {
  listar.mockResolvedValue({
    ...dados,
    filtros: { ...dados.filtros, busca: "" },
    trabalhos: [],
    total: 0,
  });
  render(await PaginaGaleria({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("status").textContent).toBe(
    "Nenhum trabalho encontrado para os filtros selecionados.",
  );
  expect(screen.getByRole("link", { name: "Limpar busca e filtros" }).getAttribute("href")).toBe(
    "/tatuagens",
  );
  cleanup();
  listar.mockResolvedValue({
    ...dados,
    filtros: { busca: "" },
    trabalhos: [],
    total: 0,
    artistas: [],
    estilos: [],
    regioes: [],
  });
  render(await PaginaGaleria({ searchParams: Promise.resolve({}) }));
  expect(screen.getByText("Ainda não há tatuagens cadastradas.")).toBeDefined();
  expect(screen.queryByRole("link", { name: "Limpar busca e filtros" })).toBeNull();
});

it("RF18: sem resultado, a mensagem cita o termo buscado; sem busca nem filtro, não há contagem", async () => {
  listar.mockResolvedValue({ ...dados, filtros: { busca: "dragão" }, trabalhos: [], total: 0 });
  render(await PaginaGaleria({ searchParams: Promise.resolve({ busca: "dragão" }) }));
  expect(screen.getByRole("status").textContent).toBe("Nenhum trabalho encontrado para “dragão”.");
  expect(screen.getByRole("link", { name: "Limpar busca e filtros" })).toBeDefined();
  cleanup();

  listar.mockResolvedValue({
    ...dados,
    filtros: { busca: "dragão", estilo: "floral" },
    trabalhos: [],
    total: 0,
  });
  render(await PaginaGaleria({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("status").textContent).toBe(
    "Nenhum trabalho encontrado para “dragão” com os filtros selecionados.",
  );
  cleanup();

  listar.mockResolvedValue({ ...dados, filtros: { busca: "" } });
  render(await PaginaGaleria({ searchParams: Promise.resolve({}) }));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("link", { name: "Limpar busca e filtros" })).toBeNull();
});
it("RF17: navegação pública leva à galeria", async () => {
  const { Cabecalho } = await import("@/components/layout/cabecalho");
  render(<Cabecalho />);
  expect(screen.getByRole("link", { name: "Tatuagem" }).getAttribute("href")).toBe("/tatuagens");
});
