// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ListaClientesAdmin } from "../../src/components/admin/lista-clientes-admin";
import type { PaginaClientesAdmin } from "../../src/modules/customers";

afterEach(cleanup);

const LUCAS = "0b6f1d3a-1c1e-4c33-9a43-1f1c8f6f0a01";
const ZE = "0b6f1d3a-1c1e-4c33-9a43-1f1c8f6f0a02";

const PAGINA: PaginaClientesAdmin = {
  clientes: [
    {
      id: LUCAS,
      nome: "Lucas Silveira",
      email: "lucas@pbi38.test",
      cadastradoEm: new Date("2026-10-05T15:00:00Z"),
      excluido: false,
    },
    {
      id: ZE,
      nome: "Zé Antigo",
      email: "ze@pbi38.test",
      cadastradoEm: new Date("2026-09-01T15:00:00Z"),
      excluido: true,
    },
  ],
  total: 42,
  pagina: 2,
  totalPaginas: 3,
  busca: "pbi38",
};

it("RF30 lista os clientes com link para o perfil e marca a conta excluída", () => {
  render(<ListaClientesAdmin {...PAGINA} />);
  expect(screen.getByRole("heading", { level: 1, name: "Clientes" })).toBeDefined();
  expect(screen.getByText("42 clientes")).toBeDefined();

  const itens = within(screen.getByRole("list", { name: "Lista de clientes" })).getAllByRole(
    "listitem",
  );
  expect(itens).toHaveLength(2);
  const lucas = within(itens[0]!);
  expect(lucas.getByRole("link", { name: "Lucas Silveira" }).getAttribute("href")).toBe(
    `/admin/clientes/${LUCAS}`,
  );
  expect(lucas.getByText("lucas@pbi38.test")).toBeDefined();
  expect(lucas.getByText("Cliente desde 05/10/2026")).toBeDefined();
  expect(lucas.queryByText("Conta excluída")).toBeNull();

  const ze = within(itens[1]!);
  expect(ze.getByRole("link", { name: "Zé Antigo" }).getAttribute("href")).toBe(
    `/admin/clientes/${ZE}`,
  );
  expect(ze.getByText("Conta excluída")).toBeDefined();
});

it("RF30 a busca e a paginação ficam na URL", () => {
  render(<ListaClientesAdmin {...PAGINA} />);
  const busca = screen.getByRole("search");
  expect(busca.getAttribute("action")).toBe("/admin/clientes");
  expect(within(busca).getByLabelText<HTMLInputElement>("Buscar por nome ou e-mail").value).toBe(
    "pbi38",
  );

  const paginacao = screen.getByRole("navigation", { name: "Paginação" });
  expect(within(paginacao).getByText("Página 2 de 3")).toBeDefined();
  expect(within(paginacao).getByRole("link", { name: "Anterior" }).getAttribute("href")).toBe(
    "/admin/clientes?busca=pbi38",
  );
  expect(within(paginacao).getByRole("link", { name: "Próxima" }).getAttribute("href")).toBe(
    "/admin/clientes?busca=pbi38&pagina=3",
  );
});

it("RF30 sem resultado, avisa e não mostra paginação", () => {
  render(<ListaClientesAdmin clientes={[]} total={0} pagina={1} totalPaginas={0} busca="x" />);
  expect(screen.getByText("Nenhum cliente encontrado.")).toBeDefined();
  expect(screen.queryByRole("navigation", { name: "Paginação" })).toBeNull();
  expect(screen.queryByText("1 cliente")).toBeNull();
});
