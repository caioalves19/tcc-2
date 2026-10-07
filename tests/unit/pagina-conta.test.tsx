// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ perfil: vi.fn(), endereco: vi.fn(), headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/lib/auth", () => ({ perfilDaRequisicao: mocks.perfil }));
vi.mock("@/lib/endereco", () => ({ enderecoDaRequisicao: mocks.endereco }));
vi.mock("@/app/conta/actions", () => ({
  atualizarPerfilAcao: vi.fn(),
  trocarSenhaAcao: vi.fn(),
  salvarEnderecoAcao: vi.fn(),
}));
import PaginaConta from "@/app/conta/page";
afterEach(cleanup);
it("redireciona visitantes sem sessão para o login", async () => {
  mocks.perfil.mockResolvedValueOnce(null);
  await expect(PaginaConta()).rejects.toThrow("redirect:/login");
  expect(mocks.perfil).toHaveBeenCalledWith(mocks.headers);
});
it("preenche nome e telefone da sessão e oferece troca de senha", async () => {
  mocks.perfil.mockResolvedValueOnce({ nome: "Maria", telefone: "11987654321" });
  mocks.endereco.mockResolvedValueOnce(null);
  render(await PaginaConta());
  expect(screen.getByDisplayValue("Maria")).toBeDefined();
  expect(screen.getByDisplayValue("11987654321")).toBeDefined();
  expect(screen.getByLabelText("Senha atual")).toBeDefined();
  expect(screen.getByLabelText<HTMLInputElement>("CEP").value).toBe("");
  expect(mocks.endereco).toHaveBeenCalledWith(mocks.headers);
});
