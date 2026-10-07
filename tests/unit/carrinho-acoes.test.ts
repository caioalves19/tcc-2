import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adicionar: vi.fn(),
  cookie: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => mocks.cookie,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/modules/orders", () => ({
  adicionarAoCarrinho: mocks.adicionar,
  alterarQuantidade: vi.fn(),
  removerDoCarrinho: vi.fn(),
  juntarCarrinhos: vi.fn(),
}));

import { adicionarAoCarrinhoAcao } from "@/app/carrinho/actions";

afterEach(() => vi.clearAllMocks());

it("RF11 grava o cookie do carrinho novo sem devolver o token ao navegador", async () => {
  mocks.cookie.get.mockReturnValue(undefined);
  mocks.adicionar.mockResolvedValue({ ok: true, dados: { tokenNovo: "token-secreto" } });

  expect(await adicionarAoCarrinhoAcao("obra-1")).toEqual({ ok: true, dados: undefined });
  expect(mocks.adicionar).toHaveBeenCalledWith(
    { obraId: "obra-1", quantidade: 1 },
    expect.objectContaining({ tokenVisitante: null }),
  );
  expect(mocks.cookie.set).toHaveBeenCalledWith(
    "kolo_carrinho",
    "token-secreto",
    expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
  );
});

it("RF11 usa o cookie existente e não regrava quando o carrinho já existe", async () => {
  mocks.cookie.get.mockReturnValue({ value: "token-antigo" });
  mocks.adicionar.mockResolvedValue({ ok: true, dados: { tokenNovo: null } });

  await adicionarAoCarrinhoAcao("obra-1", 2);
  expect(mocks.adicionar).toHaveBeenCalledWith(
    { obraId: "obra-1", quantidade: 2 },
    expect.objectContaining({ tokenVisitante: "token-antigo" }),
  );
  expect(mocks.cookie.set).not.toHaveBeenCalled();
});
