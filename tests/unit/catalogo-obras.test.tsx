// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CatalogoObras } from "../../src/components/loja/catalogo-obras";

const navegar = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navegar }) }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const card = (n: number) => ({
  slug: `obra-${n}`,
  titulo: `Obra ${n}`,
  artistaNome: "Ana",
  tecnica: null,
  dimensoes: null,
  precoCentavos: 10000,
  disponivel: true,
  imagem: null,
});
type Ordem = "recentes" | "menor-preco" | "maior-preco" | "destaque";
function montar(pagina: number, total: number, quantidade: number, ordem: Ordem = "recentes") {
  render(
    <CatalogoObras
      obras={Array.from({ length: quantidade }, (_, i) => card(i))}
      total={total}
      pagina={pagina}
      totalPaginas={Math.ceil(total / 12)}
      ordem={ordem}
      baseImagens={null}
    />,
  );
}

it("RF09 mostra a grade e quantas obras estão na página", () => {
  montar(2, 30, 12, "menor-preco");
  expect(screen.getByRole("heading", { level: 1, name: "Catálogo de obras" })).toBeDefined();
  expect(screen.getAllByRole("article")).toHaveLength(12);
  expect(screen.getByText("Mostrando 13 a 24 de 30 obras")).toBeDefined();
});

it("RF09 a paginação preserva a ordenação e marca a página atual", () => {
  montar(2, 30, 12, "menor-preco");
  const paginacao = screen.getByRole("navigation", { name: "Paginação" });
  expect(
    within(paginacao)
      .getAllByRole("link")
      .map((a) => [a.textContent, a.getAttribute("href")]),
  ).toEqual([
    ["Anterior", "/obras?ordem=menor-preco"],
    ["1", "/obras?ordem=menor-preco"],
    ["3", "/obras?ordem=menor-preco&pagina=3"],
    ["Próxima", "/obras?ordem=menor-preco&pagina=3"],
  ]);
  expect(within(paginacao).getByText("2").getAttribute("aria-current")).toBe("page");
  cleanup();

  // Na ordem padrão, a URL fica limpa; sem página anterior nem próxima, sem esses links.
  montar(1, 12, 12);
  expect(screen.queryByRole("navigation", { name: "Paginação" })).toBeNull();
  cleanup();
  montar(1, 13, 12);
  const unica = screen.getByRole("navigation", { name: "Paginação" });
  expect(within(unica).queryByRole("link", { name: "Anterior" })).toBeNull();
  expect(within(unica).getByRole("link", { name: "Próxima" }).getAttribute("href")).toBe(
    "/obras?pagina=2",
  );
});

it("RF09 trocar a ordenação volta para a primeira página com o novo critério", async () => {
  const usuario = userEvent.setup();
  montar(3, 40, 4, "destaque");
  const seletor = screen.getByLabelText("Ordenar por");
  expect((seletor as HTMLSelectElement).value).toBe("destaque");
  expect(
    within(seletor)
      .getAllByRole("option")
      .map((o) => o.textContent),
  ).toEqual(["Mais recentes", "Menor preço", "Maior preço", "Destaque"]);
  await usuario.selectOptions(seletor, "maior-preco");
  await waitFor(() => expect(navegar).toHaveBeenCalledWith("/obras?ordem=maior-preco"));
  await usuario.selectOptions(seletor, "recentes");
  await waitFor(() => expect(navegar).toHaveBeenLastCalledWith("/obras"));
});

it("RF09 catálogo vazio e página sem resultados têm aviso próprio", () => {
  montar(1, 0, 0);
  expect(screen.getByText("Ainda não há obras publicadas.")).toBeDefined();
  expect(screen.queryByRole("article")).toBeNull();
  expect(screen.queryByText(/Mostrando/)).toBeNull();
  cleanup();

  montar(5, 15, 0, "destaque");
  expect(screen.getByText("Esta página não tem obras.")).toBeDefined();
  expect(screen.getByRole("link", { name: "Ir para a primeira página" }).getAttribute("href")).toBe(
    "/obras?ordem=destaque",
  );
});
