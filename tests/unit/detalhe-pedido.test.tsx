// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DetalhePedido } from "../../src/components/conta/detalhe-pedido";
import type { PedidoDetalhado } from "../../src/modules/orders";

afterEach(cleanup);

const ENVIADO: PedidoDetalhado = {
  numero: "20260902-CARLA2",
  criadoEm: new Date("2026-09-02T15:00:00Z"),
  situacao: "ENVIADO",
  modalidade: "RETIRADA",
  itens: [
    { titulo: "Metrópole em chamas", precoCentavos: 480000, quantidade: 2 },
    { titulo: "Retalho paulistano", precoCentavos: 9990, quantidade: 1 },
  ],
  subtotalCentavos: 969990,
  freteCentavos: 0,
  totalCentavos: 969990,
  endereco: {
    destinatario: "Lucas Silveira",
    cep: "01327000",
    logradouro: "Rua Treze de Maio",
    numero: "450",
    complemento: "Apto 82",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
  },
  rastreio: "BR987654321SP",
  pagoEm: new Date("2026-09-02T15:05:00Z"),
  enviadoEm: new Date("2026-09-04T10:00:00Z"),
};

it("RF16 o pedido enviado mostra itens, valores, andamento com datas, rastreio e endereço", () => {
  render(<DetalhePedido pedido={ENVIADO} />);
  expect(screen.getByRole("heading", { level: 1, name: "Pedido 20260902-CARLA2" })).toBeDefined();
  expect(screen.getByRole("link", { name: "Meus pedidos" }).getAttribute("href")).toBe(
    "/conta/pedidos",
  );
  expect(screen.getByText("Feito em 02/09/2026")).toBeDefined();

  const andamento = screen.getByRole("list", { name: "Andamento do pedido" });
  const passos = within(andamento).getAllByRole("listitem");
  expect(passos.map((p) => p.textContent)).toEqual([
    "Pedido feito02/09/2026",
    "Pago02/09/2026",
    "Em preparação",
    "Pronto para retirada04/09/2026",
    "Retirado",
  ]);
  expect(passos.map((p) => p.getAttribute("aria-current"))).toEqual([
    null,
    null,
    null,
    "step",
    null,
  ]);

  expect(screen.getByText("BR987654321SP")).toBeDefined();
  expect(screen.getByRole("button", { name: "Copiar código de rastreio" })).toBeDefined();

  const resumo = screen.getByRole("region", { name: "Resumo do pedido" }).textContent ?? "";
  expect(resumo).toContain("Metrópole em chamas");
  expect(resumo).toContain("R$ 4.800,00 × 2");
  expect(resumo).toContain("Retalho paulistano");
  expect(resumo).toContain("Retirada no ateliê");
  expect(resumo).toContain("R$ 9.699,90");

  const entrega = screen.getByRole("region", { name: "Entrega" }).textContent ?? "";
  expect(entrega).toContain("Lucas Silveira");
  expect(entrega).toContain("Rua Treze de Maio, 450 — Apto 82");
  expect(entrega).toContain("CEP 01327000");

  expect(screen.queryByRole("link", { name: "Ir para o pagamento" })).toBeNull();
});

it("RN06 aguardando pagamento leva ao pagamento do pedido, sem rastreio", () => {
  render(
    <DetalhePedido
      pedido={{
        ...ENVIADO,
        situacao: "AGUARDANDO_PAGAMENTO",
        rastreio: null,
        pagoEm: null,
        enviadoEm: null,
      }}
    />,
  );
  expect(screen.getByRole("link", { name: "Ir para o pagamento" }).getAttribute("href")).toBe(
    "/checkout/20260902-CARLA2",
  );
  const passos = within(screen.getByRole("list", { name: "Andamento do pedido" })).getAllByRole(
    "listitem",
  );
  expect(passos[0]?.getAttribute("aria-current")).toBe("step");
  expect(passos[1]?.textContent).toBe("Pago");
  expect(screen.queryByRole("region", { name: "Código de rastreio" })).toBeNull();
});

it("cancelado não mostra andamento nem pagamento; aponta a política de cancelamento", () => {
  render(
    <DetalhePedido
      pedido={{ ...ENVIADO, situacao: "CANCELADO", rastreio: null, enviadoEm: null }}
    />,
  );
  expect(screen.queryByRole("list", { name: "Andamento do pedido" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Ir para o pagamento" })).toBeNull();
  expect(screen.getByText(/Este pedido foi cancelado/)).toBeDefined();
  expect(screen.getByRole("link", { name: "política de cancelamento" }).getAttribute("href")).toBe(
    "/politicas/cancelamento",
  );
});
