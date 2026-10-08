// @vitest-environment jsdom
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/modules/catalog", () => ({
  listarDestaques: async () => [
    {
      slug: "tinta-fresca",
      titulo: "Tinta fresca",
      tecnica: null,
      dimensoes: null,
      precoCentavos: 100000,
      disponivel: true,
      artistaNome: "Ana",
      imagem: null,
    },
  ],
}));

import Home from "@/app/page";
import { Cabecalho } from "@/components/layout/cabecalho";

afterEach(cleanup);

const APP = join(process.cwd(), "src", "app");

// Existe página para o caminho? Cada trecho é uma pasta em src/app, ou um segmento dinâmico
// ([slug]) quando não há pasta com o nome exato.
function temPagina(caminho: string): boolean {
  let pasta = APP;
  for (const trecho of caminho.split("/").filter(Boolean)) {
    const exata = join(pasta, trecho);
    const dinamica = readdirSync(pasta).find((nome) => /^\[[^.\]]+\]$/.test(nome));
    if (existsSync(exata)) pasta = exata;
    else if (dinamica) pasta = join(pasta, dinamica);
    else return false;
  }
  return existsSync(join(pasta, "page.tsx"));
}

function linksInternos(): string[] {
  return [...document.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href") ?? "")
    .filter((href) => href.startsWith("/"));
}

it("o verificador de rotas reconhece página fixa, dinâmica e inexistente", () => {
  expect(temPagina("/")).toBe(true);
  expect(temPagina("/obras")).toBe(true);
  expect(temPagina("/obras/qualquer-obra")).toBe(true);
  expect(temPagina("/rota-que-nao-existe")).toBe(false);
});

it("RF07 todo link interno da home e do cabeçalho leva a uma página que existe", async () => {
  render(
    <>
      <Cabecalho logado administrador acaoSair={async () => {}} />
      {await Home()}
    </>,
  );
  const links = linksInternos();
  expect(links).toContain("/obras/tinta-fresca");
  for (const href of links) {
    const caminho = href.split(/[?#]/)[0] ?? "";
    expect(temPagina(caminho), href).toBe(true);
  }
});

it("RF07 o menu Tatuagem leva ao bloco de tatuagem da home até o portfólio público existir", async () => {
  render(
    <>
      <Cabecalho />
      {await Home()}
    </>,
  );
  for (const link of screen.getAllByRole("link", { name: "Tatuagem" }))
    expect(link.getAttribute("href")).toBe("/#tatuagem");
  expect(document.getElementById("tatuagem")).not.toBeNull();
});
