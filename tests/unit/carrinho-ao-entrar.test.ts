import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  entrar: vi.fn(),
  cadastrarCliente: vi.fn(),
  juntar: vi.fn(),
  cookie: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => mocks.cookie,
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/lib/auth", () => ({
  entrar: mocks.entrar,
  sair: vi.fn(),
  cadastrarCliente: mocks.cadastrarCliente,
}));
vi.mock("@/lib/requisicao", () => ({ ipDaRequisicao: () => "127.0.0.1" }));
vi.mock("@/modules/orders", () => ({ juntarCarrinhos: mocks.juntar }));

import { cadastrar } from "@/app/cadastro/actions";
import { entrarAcao } from "@/app/login/actions";

afterEach(() => vi.clearAllMocks());

const login = { email: "maria@kolo.test", senha: "senha-inicial-123" };

it("RF11 ao entrar, junta o carrinho do visitante ao da conta e apaga o cookie", async () => {
  mocks.entrar.mockResolvedValue({ ok: true, token: "sessao-1" });
  mocks.cookie.get.mockReturnValue({ value: "token-visitante" });
  mocks.juntar.mockResolvedValue({ ok: true, dados: undefined });

  await expect(entrarAcao(login)).rejects.toThrow("redirect:/");
  expect(mocks.cookie.get).toHaveBeenCalledWith("kolo_carrinho");
  expect(mocks.juntar).toHaveBeenCalledWith("sessao-1", "token-visitante");
  expect(mocks.cookie.delete).toHaveBeenCalledWith("kolo_carrinho");
});

it("RF11 ao se cadastrar, também junta o carrinho do visitante", async () => {
  mocks.cadastrarCliente.mockResolvedValue({ ok: true, token: "sessao-2" });
  mocks.cookie.get.mockReturnValue({ value: "token-visitante" });
  mocks.juntar.mockResolvedValue({ ok: true, dados: undefined });

  await expect(
    cadastrar({ nome: "Maria", email: login.email, telefone: "11987654321", senha: login.senha }),
  ).rejects.toThrow("redirect:/");
  expect(mocks.juntar).toHaveBeenCalledWith("sessao-2", "token-visitante");
  expect(mocks.cookie.delete).toHaveBeenCalledWith("kolo_carrinho");
});

it("sem cookie não junta nada; login recusado não toca no carrinho", async () => {
  mocks.entrar.mockResolvedValue({ ok: true, token: "sessao-3" });
  mocks.cookie.get.mockReturnValue(undefined);
  await expect(entrarAcao(login)).rejects.toThrow("redirect:/");
  expect(mocks.juntar).not.toHaveBeenCalled();

  mocks.entrar.mockResolvedValue({ ok: false, erro: "credenciais" });
  mocks.cookie.get.mockReturnValue({ value: "token-visitante" });
  expect(await entrarAcao(login)).toEqual({ ok: false, erro: "credenciais" });
  expect(mocks.juntar).not.toHaveBeenCalled();
  expect(mocks.cookie.delete).not.toHaveBeenCalled();
});
