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

it("RF08 liga as três políticas e marca a página atual", () => {
  render(<DocumentoPolitica politica={TERMOS} />);
  const todas = within(screen.getByRole("navigation", { name: "Todas as políticas" }));
  const privacidade = todas.getByRole("link", { name: "Privacidade" });
  const termos = todas.getByRole("link", { name: "Termos de uso" });
  const cancelamento = todas.getByRole("link", { name: "Política de cancelamento" });
  expect(privacidade.getAttribute("href")).toBe("/politicas/privacidade");
  expect(termos.getAttribute("href")).toBe("/politicas/termos");
  expect(cancelamento.getAttribute("href")).toBe("/politicas/cancelamento");
  expect(termos.getAttribute("aria-current")).toBe("page");
  expect(privacidade.getAttribute("aria-current")).toBeNull();
  expect(cancelamento.getAttribute("aria-current")).toBeNull();
});

it("oferece WhatsApp e e-mail do Kolô para quem ficou com dúvida", () => {
  render(<DocumentoPolitica politica={TERMOS} />);
  const duvidas = within(screen.getByRole("complementary", { name: "Dúvidas?" }));
  expect(duvidas.getByRole("link", { name: /WhatsApp/ }).getAttribute("href")).toBe(
    "https://wa.me/5511950901191",
  );
  expect(duvidas.getByRole("link", { name: /ateliekolo@gmail\.com/ }).getAttribute("href")).toBe(
    "mailto:ateliekolo@gmail.com",
  );
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
