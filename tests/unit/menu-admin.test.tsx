// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const rota = vi.hoisted(() => ({ atual: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => rota.atual }));

import { MenuAdmin } from "../../src/components/admin/menu-admin";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Rodape } from "@/components/layout/rodape";
import { PADRAO } from "@/modules/settings";

afterEach(cleanup);

it("RF32 o menu do admin leva a todas as telas da administração, com Painel e Relatório", () => {
  render(<MenuAdmin />);
  const menu = screen.getByRole("navigation", { name: "Administração" });
  expect(
    within(menu)
      .getAllByRole("link")
      .map((link) => [link.textContent, link.getAttribute("href")]),
  ).toEqual([
    ["Painel", "/admin"],
    ["Relatório", "/admin/relatorio"],
    ["Pedidos", "/admin/pedidos"],
    ["Clientes", "/admin/clientes"],
    ["Obras", "/admin/obras"],
    ["Artistas", "/admin/artistas"],
    ["Estilos", "/admin/estilos"],
    ["Tags", "/admin/tags"],
    ["Configurações", "/admin/configuracoes"],
  ]);
});

it("RF32 marca a tela atual: o Painel só em /admin; as outras também nas telas de dentro", () => {
  const marcados = (caminho: string) => {
    rota.atual = caminho;
    render(<MenuAdmin />);
    const atuais = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.textContent);
    cleanup();
    return atuais;
  };
  expect(marcados("/admin")).toEqual(["Painel"]);
  expect(marcados("/admin/relatorio")).toEqual(["Relatório"]);
  expect(marcados("/admin/pedidos")).toEqual(["Pedidos"]);
  expect(marcados("/admin/pedidos/20261010-AB23CD")).toEqual(["Pedidos"]);
  expect(marcados("/admin/clientes/6f1c2a8e-0000-4000-8000-000000000000")).toEqual(["Clientes"]);
  // Só o começo do nome não basta.
  expect(marcados("/admin/pedidos-antigos")).toEqual([]);
});

it("RF32 na impressão (relatório em papel ou PDF) não saem o menu do admin, o cabeçalho e o rodapé", () => {
  render(
    <>
      <Cabecalho logado administrador />
      <MenuAdmin />
      <Rodape configuracao={PADRAO} />
    </>,
  );
  // Tailwind print:hidden: display none só na impressão.
  expect(screen.getByRole("banner").classList.contains("print:hidden")).toBe(true);
  expect(
    screen.getByRole("navigation", { name: "Administração" }).classList.contains("print:hidden"),
  ).toBe(true);
  expect(screen.getByRole("contentinfo").classList.contains("print:hidden")).toBe(true);
});
