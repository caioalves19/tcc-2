// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { VitrineDestaques } from "../../src/components/loja/vitrine-destaques";

afterEach(cleanup);

const card = (slug: string, titulo: string, disponivel = true) => ({
  slug,
  titulo,
  tecnica: null,
  dimensoes: null,
  precoCentavos: 100000,
  disponivel,
  artistaNome: "Ana",
  imagem: null,
});

it("RF07 mostra os destaques, cada um levando à página da obra, e o caminho para o catálogo", () => {
  render(
    <VitrineDestaques
      destaques={[card("tinta-fresca", "Tinta fresca"), card("muro-alto", "Muro alto", false)]}
      baseImagens={null}
    />,
  );
  const secao = screen.getByRole("region", { name: "Obras em destaque" });
  expect(within(secao).getAllByRole("article")).toHaveLength(2);
  expect(within(secao).getByRole("link", { name: "Tinta fresca" }).getAttribute("href")).toBe(
    "/obras/tinta-fresca",
  );
  expect(within(secao).getByRole("link", { name: "Muro alto" }).getAttribute("href")).toBe(
    "/obras/muro-alto",
  );
  expect(within(secao).getByText("Esgotada")).toBeDefined();
  expect(
    within(secao).getByRole("link", { name: "Ver catálogo completo" }).getAttribute("href"),
  ).toBe("/obras");
});

it("RF07 sem nenhuma obra marcada, a seção não aparece (nem título vazio)", () => {
  const { container } = render(<VitrineDestaques destaques={[]} baseImagens={null} />);
  expect(container.innerHTML).toBe("");
});
