import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cancelar: vi.fn(),
  estornar: vi.fn(),
  revalidar: vi.fn(),
  gateway: { estornarPagamento: vi.fn() },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("@/modules/orders", () => ({}));
vi.mock("@/modules/payments", () => ({
  cancelarPedido: mocks.cancelar,
  estornarPagamento: mocks.estornar,
  gatewayMercadoPago: () => mocks.gateway,
}));

import { cancelarPedidoAcao, estornarPagamentoAcao } from "@/app/admin/pedidos/actions";

afterEach(() => vi.clearAllMocks());

it("PBI-43 as ações do admin repassam a sessão e o gateway do Mercado Pago e atualizam a tela", async () => {
  mocks.cancelar.mockResolvedValue({ ok: true, dados: { situacao: "CANCELADO" } });
  mocks.estornar.mockResolvedValue({ ok: true, dados: { situacao: "ESTORNADO" } });

  await cancelarPedidoAcao({ numero: "20261012-ABC234" });
  await estornarPagamentoAcao({ numero: "20261012-ABC234", idExterno: "182441100783" });

  expect(mocks.cancelar).toHaveBeenCalledWith({ numero: "20261012-ABC234" }, expect.any(Headers), {
    gateway: mocks.gateway,
  });
  expect(mocks.estornar).toHaveBeenCalledWith(
    { numero: "20261012-ABC234", idExterno: "182441100783" },
    expect.any(Headers),
    { gateway: mocks.gateway },
  );
  expect(mocks.revalidar).toHaveBeenCalledTimes(2);
});

it("PBI-43 recusa do módulo volta para a tela sem atualizar a lista", async () => {
  const recusa = { ok: false, erro: "proibido", mensagem: "Acesso exclusivo de administradores." };
  mocks.estornar.mockResolvedValue(recusa);

  expect(await estornarPagamentoAcao({ numero: "20261012-ABC234", idExterno: "1" })).toEqual(
    recusa,
  );
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
