import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  excluir: vi.fn(),
  sair: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth", () => ({ sair: mocks.sair }));
vi.mock("@/lib/endereco", () => ({}));
vi.mock("@/modules/customers", () => ({ excluirPropriaConta: mocks.excluir }));

import { excluirContaAcao } from "@/app/conta/actions";

afterEach(() => vi.clearAllMocks());

it("RN12 com a conta excluída, apaga o cookie da sessão e volta para a home", async () => {
  mocks.excluir.mockResolvedValue({ ok: true });

  await excluirContaAcao({ senha: "senha-inicial-123", confirmo: true });

  expect(mocks.excluir).toHaveBeenCalledWith(
    { senha: "senha-inicial-123", confirmo: true },
    expect.any(Headers),
  );
  expect(mocks.sair).toHaveBeenCalledOnce();
  expect(mocks.redirect).toHaveBeenCalledWith("/");
});

it("RN12 recusa volta para o formulário sem sair da conta", async () => {
  const recusa = { ok: false, erro: "senha_incorreta", mensagem: "Senha atual incorreta." };
  mocks.excluir.mockResolvedValue(recusa);

  expect(await excluirContaAcao({ senha: "errada", confirmo: true })).toEqual(recusa);
  expect(mocks.sair).not.toHaveBeenCalled();
  expect(mocks.redirect).not.toHaveBeenCalled();
});
