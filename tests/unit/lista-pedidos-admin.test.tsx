// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ListaPedidosAdmin } from "../../src/components/admin/lista-pedidos-admin";
import type { PaginaPedidosAdmin } from "../../src/modules/orders";

afterEach(cleanup);

const PAGINA: PaginaPedidosAdmin = {
  pedidos: [
    {
      numero: "20261005-LUCAS3",
      criadoEm: new Date("2026-10-05T15:00:00Z"),
      cliente: { nome: "Lucas Silveira", email: "lucas@pbi30.test" },
      situacao: "ENVIADO",
      situacaoBanco: "ENVIADO",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
    {
      numero: "20261006-LUCAS4",
      criadoEm: new Date("2026-10-06T15:00:00Z"),
      cliente: { nome: "Lucas Silveira", email: "lucas@pbi30.test" },
      situacao: "NAO_CONCLUIDO",
      situacaoBanco: "PENDENTE",
      modalidade: "RETIRADA",
      totalCentavos: 9990,
      unidades: 1,
    },
  ],
  total: 42,
  pagina: 2,
  totalPaginas: 3,
  filtro: "todos",
  busca: "lucas",
};

it("RF29 filtra por situação mantendo a busca, com o filtro atual marcado", () => {
  render(<ListaPedidosAdmin {...PAGINA} />);
  expect(screen.getByRole("heading", { level: 1, name: "Pedidos" })).toBeDefined();
  const filtros = screen.getByRole("navigation", { name: "Filtrar pedidos" });
  const links = within(filtros).getAllByRole("link");
  expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
    ["A fazer", "/admin/pedidos?busca=lucas"],
    ["Pendentes", "/admin/pedidos?filtro=pendentes&busca=lucas"],
    ["Prontos ou enviados", "/admin/pedidos?filtro=enviados&busca=lucas"],
    ["Retirados ou entregues", "/admin/pedidos?filtro=entregues&busca=lucas"],
    ["Cancelados", "/admin/pedidos?filtro=cancelados&busca=lucas"],
    ["Todos", "/admin/pedidos?filtro=todos&busca=lucas"],
  ]);
  expect(within(filtros).getByRole("link", { name: "Todos" }).getAttribute("aria-current")).toBe(
    "page",
  );

  const busca = screen.getByRole("search");
  expect(within(busca).getByLabelText<HTMLInputElement>("Buscar por número ou e-mail").value).toBe(
    "lucas",
  );
  expect(busca.querySelector<HTMLInputElement>('input[name="filtro"]')?.value).toBe("todos");
});

it("RF29 cada pedido mostra cliente, situação e total, levando ao detalhe; pagina mantendo filtro e busca", () => {
  render(<ListaPedidosAdmin {...PAGINA} />);
  const lista = screen.getByRole("list", { name: "Lista de pedidos" });
  const [enviado, abandonado] = within(lista).getAllByRole("listitem");
  if (!enviado || !abandonado) throw new Error("Esperava dois pedidos");
  expect(
    within(enviado).getByRole("link", { name: "Pedido 20261005-LUCAS3" }).getAttribute("href"),
  ).toBe("/admin/pedidos/20261005-LUCAS3");
  expect(enviado.textContent).toContain("Lucas Silveira");
  expect(enviado.textContent).toContain("lucas@pbi30.test");
  expect(enviado.textContent).toContain("05/10/2026");
  expect(enviado.textContent).toContain("Pronto para retirada");
  expect(enviado.textContent).toContain("R$ 9.600,00");
  expect(abandonado.textContent).toContain("Não concluído");

  expect(screen.getByText("42 pedidos")).toBeDefined();
  const paginacao = screen.getByRole("navigation", { name: "Paginação" });
  expect(within(paginacao).getByRole("link", { name: "Anterior" }).getAttribute("href")).toBe(
    "/admin/pedidos?filtro=todos&busca=lucas",
  );
  expect(within(paginacao).getByRole("link", { name: "Próxima" }).getAttribute("href")).toBe(
    "/admin/pedidos?filtro=todos&busca=lucas&pagina=3",
  );
  expect(paginacao.textContent).toContain("Página 2 de 3");
});

it("sem pedidos no filtro, avisa", () => {
  render(<ListaPedidosAdmin {...PAGINA} pedidos={[]} total={0} totalPaginas={0} pagina={1} />);
  expect(screen.getByText("Nenhum pedido encontrado.")).toBeDefined();
  expect(screen.queryByRole("navigation", { name: "Paginação" })).toBeNull();
});
