import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  iniciar: vi.fn(),
  gateway: { criarPreferencia: vi.fn() },
  // No Next, redirect() interrompe a action lançando um erro interno.
  redirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT ${destino}`);
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/modules/payments", () => ({
  iniciarPagamento: mocks.iniciar,
  gatewayMercadoPago: () => mocks.gateway,
}));

import { pagarPedidoAcao } from "@/app/checkout/[numero]/actions";

afterEach(() => vi.clearAllMocks());

it("RF13 leva o cliente ao checkout hospedado do Mercado Pago", async () => {
  mocks.iniciar.mockResolvedValue({
    ok: true,
    dados: { url: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1" },
  });

  await expect(pagarPedidoAcao("20261010-ABC234")).rejects.toThrow(
    "NEXT_REDIRECT https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
  );
  expect(mocks.iniciar).toHaveBeenCalledWith(
    "20261010-ABC234",
    { cabecalhos: expect.any(Headers), tokenVisitante: null },
    { gateway: mocks.gateway },
  );
});

it("RF13 recusa volta para a tela com a mensagem, sem redirecionar", async () => {
  const recusa = {
    ok: false,
    erro: "falha",
    mensagem: "Não foi possível abrir o pagamento agora. Tente de novo em instantes.",
  };
  mocks.iniciar.mockResolvedValue(recusa);

  expect(await pagarPedidoAcao("20261010-ABC234")).toEqual(recusa);
  expect(mocks.redirect).not.toHaveBeenCalled();
});
