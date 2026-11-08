// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { Paginacao } from "@/components/ui/paginacao";

afterEach(cleanup);

it("mantém os filtros nos links e marca a página atual", () => {
  render(
    <Paginacao
      caminho="/tatuagens"
      parametros={{ artista: "ana", busca: "flor de ipê", estilo: undefined }}
      pagina={2}
      totalPaginas={3}
    />,
  );

  expect(screen.getByRole("link", { name: "Anterior" }).getAttribute("href")).toBe(
    "/tatuagens?artista=ana&busca=flor+de+ip%C3%AA",
  );
  expect(screen.getByRole("link", { name: "3" }).getAttribute("href")).toBe(
    "/tatuagens?artista=ana&busca=flor+de+ip%C3%AA&pagina=3",
  );
  expect(screen.getByRole("link", { name: "Próxima" })).toBeDefined();
  expect(screen.getByText("2").getAttribute("aria-current")).toBe("page");
});

it("na primeira e na última página não oferece o que não existe", () => {
  const { rerender } = render(<Paginacao caminho="/admin/tags" pagina={1} totalPaginas={2} />);
  expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull();

  rerender(<Paginacao caminho="/admin/tags" pagina={2} totalPaginas={2} />);
  expect(screen.queryByRole("link", { name: "Próxima" })).toBeNull();
  expect(screen.getByRole("link", { name: "1" }).getAttribute("href")).toBe("/admin/tags");
});

it("com uma página só não mostra navegação", () => {
  const { container } = render(<Paginacao caminho="/admin/tags" pagina={1} totalPaginas={1} />);
  expect(container.innerHTML).toBe("");
});
