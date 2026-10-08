// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PedidoCheckout } from "../../src/components/loja/pedido-checkout";

const AGORA = new Date("2026-10-08T15:00:00Z");
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const pedido = (extra: Record<string, unknown> = {}) => ({
  numero: "20261008-ABC234",
  situacao: "PENDENTE" as const,
  modalidade: "RETIRADA" as const,
  criadoEm: AGORA,
  reservaExpiraEm: new Date(AGORA.getTime() + (9 * 60 + 30) * 1000),
  itens: [
    { obraId: "obra-1", titulo: "Metrópole em chamas", precoCentavos: 285000, quantidade: 1 },
  ],
  endereco: {
    destinatario: "Lucas Silveira",
    cep: "01327-000",
    logradouro: "Rua Treze de Maio",
    numero: "450",
    complemento: null,
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP" as const,
  },
  subtotalCentavos: 285000,
  freteCentavos: 0,
  totalCentavos: 285000,
  ...extra,
});

it("RF12/RN03 pedido pendente mostra número, resumo e o tempo que resta da reserva", () => {
  render(<PedidoCheckout pedido={pedido()} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("20261008-ABC234");
  expect(screen.getByText("Aguardando pagamento")).toBeDefined();
  const reserva = screen.getByRole("timer");
  expect(reserva.textContent).toContain("09:30");
  act(() => vi.advanceTimersByTime(1000));
  expect(reserva.textContent).toContain("09:29");

  const resumo = screen.getByRole("complementary", { name: "Resumo do pedido" });
  expect(within(resumo).getByRole("listitem").textContent).toContain("Metrópole em chamas");
  expect(resumo.textContent).toContain("Retirada no ateliê");
  expect(resumo.textContent).toContain("R$ 2.850,00");
  expect(screen.getByText(/Rua Treze de Maio, 450/)).toBeDefined();
  expect(screen.getByRole("button", { name: "Pagar com Mercado Pago" })).toHaveProperty(
    "disabled",
    true,
  );
});

it("RN03 reserva vencida avisa e leva de volta ao carrinho", () => {
  render(<PedidoCheckout pedido={pedido({ reservaExpiraEm: new Date(AGORA.getTime() + 2000) })} />);
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.queryByRole("timer")).toBeNull();
  const aviso = screen.getByRole("status");
  expect(aviso.textContent).toContain("A reserva expirou");
  expect(within(aviso).getByRole("link", { name: "Voltar ao carrinho" }).getAttribute("href")).toBe(
    "/carrinho",
  );
  expect(screen.queryByRole("button", { name: "Pagar com Mercado Pago" })).toBeNull();
});

it("RF12 pedido cancelado não oferece reserva nem pagamento", () => {
  render(<PedidoCheckout pedido={pedido({ situacao: "CANCELADO", reservaExpiraEm: null })} />);
  expect(screen.getByText("Pedido cancelado")).toBeDefined();
  expect(screen.queryByRole("timer")).toBeNull();
  expect(screen.queryByRole("button", { name: "Pagar com Mercado Pago" })).toBeNull();
});
