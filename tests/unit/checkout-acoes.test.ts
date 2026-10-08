import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  finalizar: vi.fn(),
  cookie: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
  // No Next, redirect() interrompe a action lançando um erro interno.
  redirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT ${destino}`);
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "sessao=1" }),
  cookies: async () => mocks.cookie,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/modules/orders", () => ({
  finalizarCompra: mocks.finalizar,
  juntarCarrinhos: vi.fn(),
}));

import { finalizarCompraAcao } from "@/app/checkout/actions";

afterEach(() => vi.clearAllMocks());

it("RF12 repassa a entrada como veio e leva ao pedido criado", async () => {
  mocks.cookie.get.mockReturnValue(undefined);
  mocks.finalizar.mockResolvedValue({
    ok: true,
    dados: { numero: "20261008-ABC234", expiraEm: new Date() },
  });

  await expect(finalizarCompraAcao({ modalidade: "RETIRADA", totalCentavos: 1 })).rejects.toThrow(
    "NEXT_REDIRECT /checkout/20261008-ABC234",
  );
  expect(mocks.finalizar).toHaveBeenCalledWith(
    { modalidade: "RETIRADA", totalCentavos: 1 },
    expect.objectContaining({ tokenVisitante: null }),
  );
});

it("RN06 com pagamento em aberto leva ao pedido existente", async () => {
  mocks.finalizar.mockResolvedValue({
    ok: false,
    erro: "pendente",
    numero: "20261007-XYZ789",
    mensagem: "Você já tem um pedido aguardando pagamento.",
  });
  await expect(finalizarCompraAcao({ modalidade: "RETIRADA" })).rejects.toThrow(
    "NEXT_REDIRECT /checkout/20261007-XYZ789",
  );
});

it("RN01 sem sessão leva ao login", async () => {
  mocks.finalizar.mockResolvedValue({
    ok: false,
    erro: "nao_autenticado",
    mensagem: "Entre na sua conta para comprar.",
  });
  await expect(finalizarCompraAcao({ modalidade: "RETIRADA" })).rejects.toThrow(
    "NEXT_REDIRECT /login",
  );
});

it("RF12 recusa volta para a tela com a mensagem, sem redirecionar", async () => {
  const recusa = {
    ok: false,
    erro: "indisponivel",
    obras: ["obra-1"],
    mensagem: "Algumas obras do carrinho não estão mais disponíveis nessa quantidade.",
  };
  mocks.finalizar.mockResolvedValue(recusa);
  expect(await finalizarCompraAcao({ modalidade: "RETIRADA" })).toEqual(recusa);
  expect(mocks.redirect).not.toHaveBeenCalled();
});
