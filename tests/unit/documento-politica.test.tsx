// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { DocumentoPolitica, type Politica } from "@/components/politicas/documento-politica";

afterEach(cleanup);

function secao(titulo: string) {
  const elemento = screen.getByRole("heading", { level: 2, name: titulo }).closest("section");
  if (!elemento) throw new Error(`A seção "${titulo}" não está dentro de um <section>`);
  return within(elemento);
}

const TERMOS: Politica = {
  slug: "termos",
  titulo: "Termos de uso",
  resumo: "As regras para usar o site do Kolô.",
  atualizadaEm: "2026-10-05",
  secoes: [
    { id: "conta", titulo: "Sua conta", blocos: ["Guarde sua senha só com você."] },
    {
      id: "compras",
      titulo: "Compras",
      blocos: [{ itens: ["O pagamento é feito pelo Mercado Pago.", "A obra é peça única."] }],
    },
  ],
};

it("RF08 mostra título, resumo e a data de atualização sem trocar o dia pelo fuso", () => {
  render(<DocumentoPolitica politica={TERMOS} />);
  expect(screen.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeDefined();
  expect(screen.getByText("As regras para usar o site do Kolô.")).toBeDefined();
  expect(screen.getByText("05/10/2026").getAttribute("datetime")).toBe("2026-10-05");
});

it("RF08 divide o texto em seções com índice de âncoras", () => {
  render(<DocumentoPolitica politica={TERMOS} />);
  const indice = within(screen.getByRole("navigation", { name: "Nesta página" }));
  expect(indice.getByRole("link", { name: "Sua conta" }).getAttribute("href")).toBe("#conta");
  expect(indice.getByRole("link", { name: "Compras" }).getAttribute("href")).toBe("#compras");
  expect(screen.getByRole("heading", { level: 2, name: "Sua conta" }).id).toBe("conta");
  expect(screen.getByRole("heading", { level: 2, name: "Compras" }).id).toBe("compras");
  expect(secao("Sua conta").getByText("Guarde sua senha só com você.").tagName).toBe("P");
  const itens = secao("Compras")
    .getAllByRole("listitem")
    .map((item) => item.textContent);
  expect(itens).toEqual(["O pagamento é feito pelo Mercado Pago.", "A obra é peça única."]);
});
