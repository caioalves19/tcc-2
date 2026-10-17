// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
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
  excluirContaAcao: vi.fn(),
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
  const trocaSenha = screen.getByRole("region", { name: "Alterar senha" });
  expect(within(trocaSenha).getByLabelText("Senha atual")).toBeDefined();
  expect(screen.getByLabelText<HTMLInputElement>("CEP").value).toBe("");
  expect(mocks.endereco).toHaveBeenCalledWith(mocks.headers);
});
it("RF16 leva aos pedidos do cliente", async () => {
  mocks.perfil.mockResolvedValueOnce({ nome: "Maria", telefone: "11987654321" });
  mocks.endereco.mockResolvedValueOnce(null);
  render(await PaginaConta());
  expect(screen.getByRole("link", { name: "Meus pedidos" }).getAttribute("href")).toBe(
    "/conta/pedidos",
  );
});
it("RN12 oferece excluir a conta com senha e confirmação", async () => {
  mocks.perfil.mockResolvedValueOnce({ nome: "Maria", telefone: "11987654321" });
  mocks.endereco.mockResolvedValueOnce(null);
  render(await PaginaConta());
  const exclusao = screen.getByRole("region", { name: "Excluir conta" });
  expect(within(exclusao).getByLabelText("Senha atual")).toBeDefined();
  expect(
    within(exclusao).getByLabelText(/Entendo que a exclusão não pode ser desfeita/),
  ).toBeDefined();
  expect(within(exclusao).getByRole("button", { name: "Excluir minha conta" })).toBeDefined();
  expect(
    within(exclusao).getByRole("link", { name: "política de privacidade" }).getAttribute("href"),
  ).toBe("/politicas/privacidade#direitos");
});
