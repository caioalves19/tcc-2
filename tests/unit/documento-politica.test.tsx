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

it("transforma [rótulo](endereço) do texto em link, em parágrafos e listas", () => {
  const politica: Politica = {
    ...TERMOS,
    secoes: [
      {
        id: "contato",
        titulo: "Contato",
        blocos: [
          "Altere seus dados em [Minha conta](/conta) ou escreva para [o Kolô](mailto:ateliekolo@gmail.com).",
          { itens: ["Leia também a [Política de privacidade](/politicas/privacidade)."] },
          "Colchetes sem endereço [ficam como texto].",
        ],
      },
    ],
  };
  render(<DocumentoPolitica politica={politica} />);
  const contato = secao("Contato");
  expect(contato.getByRole("link", { name: "Minha conta" }).getAttribute("href")).toBe("/conta");
  expect(contato.getByRole("link", { name: "o Kolô" }).getAttribute("href")).toBe(
    "mailto:ateliekolo@gmail.com",
  );
  expect(contato.getByRole("link", { name: "Política de privacidade" }).getAttribute("href")).toBe(
    "/politicas/privacidade",
  );
  expect(contato.getByText(/Altere seus dados em/).textContent).toBe(
    "Altere seus dados em Minha conta ou escreva para o Kolô.",
  );
  expect(contato.getByText("Colchetes sem endereço [ficam como texto].")).toBeDefined();
});

it("só vira link endereço seguro, para quando o PBI-39 deixar o admin editar o texto", () => {
  const politica: Politica = {
    ...TERMOS,
    secoes: [
      {
        id: "enderecos",
        titulo: "Endereços",
        blocos: [
          "Seguros: [site](https://kolo.art.br), [conta](/conta), [seção](#enderecos) e [e-mail](mailto:oi@kolo.art.br).",
          "Perigosos: [script](javascript:alert), [dados](data:text/html,oi) e [outro site](//golpe.com).",
        ],
      },
    ],
  };
  render(<DocumentoPolitica politica={politica} />);
  const enderecos = secao("Endereços");
  expect(enderecos.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
    "https://kolo.art.br",
    "/conta",
    "#enderecos",
    "mailto:oi@kolo.art.br",
  ]);
  expect(enderecos.getByText(/Perigosos:/).textContent).toBe(
    "Perigosos: script, dados e outro site.",
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
