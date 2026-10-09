// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ListaPedidos } from "../../src/components/conta/lista-pedidos";

afterEach(cleanup);

it("RF16 lista cada pedido com data, situação, total e itens, levando ao detalhe", () => {
  render(
    <ListaPedidos
      pedidos={[
        {
          numero: "20260920-PIXABE",
          criadoEm: new Date("2026-09-20T15:00:00Z"),
          situacao: "AGUARDANDO_PAGAMENTO",
          totalCentavos: 960000,
          unidades: 2,
        },
        {
          numero: "20260901-ENVIAD",
          criadoEm: new Date("2026-09-01T02:00:00Z"),
          situacao: "ENVIADO",
          totalCentavos: 9990,
          unidades: 1,
        },
      ]}
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Meus pedidos" })).toBeDefined();
  const [pix, enviado] = screen.getAllByRole("listitem");
  if (!pix || !enviado) throw new Error("Esperava dois pedidos na lista");

  expect(
    within(pix).getByRole("link", { name: "Pedido 20260920-PIXABE" }).getAttribute("href"),
  ).toBe("/conta/pedidos/20260920-PIXABE");
  expect(pix.textContent).toContain("20/09/2026");
  expect(pix.textContent).toContain("Aguardando pagamento");
  expect(pix.textContent).toContain("R$ 9.600,00");
  expect(pix.textContent).toContain("2 itens");

  // Data de São Paulo (RN09): 01/09 às 2h UTC ainda é 31/08 aqui.
  expect(enviado.textContent).toContain("31/08/2026");
  expect(enviado.textContent).toContain("Enviado");
  expect(enviado.textContent).toContain("R$ 99,90");
  expect(enviado.textContent).toContain("1 item");
});

it("RF16 sem pedidos, avisa e leva ao catálogo", () => {
  render(<ListaPedidos pedidos={[]} />);
  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByText("Você ainda não tem pedidos.")).toBeDefined();
  expect(screen.getByRole("link", { name: "Ver obras" }).getAttribute("href")).toBe("/obras");
});
