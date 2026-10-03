import { beforeEach, expect, it, vi } from "vitest";
import { APIError } from "better-auth/api";
const api = vi.hoisted(() => ({
  changePassword: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("better-auth", () => ({ betterAuth: () => ({ api }) }));
vi.mock("@/lib/db", () => ({ obterPool: vi.fn() }));
vi.mock("@/lib/email", () => ({
  despacharForaDaResposta: vi.fn(),
  enviarEmailDeRecuperacao: vi.fn(),
}));
import { atualizarPerfil, trocarSenha } from "@/lib/auth";
const entrada = {
  senhaAtual: "senha-atual",
  senha: "senha-nova-123",
  confirmacao: "senha-nova-123",
};
beforeEach(() => {
  vi.resetAllMocks();
  process.env.BETTER_AUTH_SECRET = "segredo-de-teste-com-pelo-menos-32-caracteres";
  api.getSession.mockResolvedValue({ session: { token: "token" }, user: { role: "CLIENTE" } });
});
it("exige sessão e delega a verificação da senha atual ao Better Auth", async () => {
  const headers = new Headers();
  api.changePassword.mockRejectedValueOnce(
    new APIError("BAD_REQUEST", { code: "INVALID_PASSWORD", message: "Invalid password" }),
  );
  expect(await trocarSenha(entrada, headers)).toEqual({ ok: false, erro: "senha_atual_incorreta" });
  expect(await trocarSenha(entrada, headers)).toEqual({ ok: true });
  expect(api.changePassword).toHaveBeenLastCalledWith({
    headers,
    body: { currentPassword: "senha-atual", newPassword: "senha-nova-123" },
  });
  api.getSession.mockResolvedValue(null);
  expect(await trocarSenha(entrada, headers)).toEqual({ ok: false, erro: "nao_autenticado" });
  expect(api.changePassword).toHaveBeenCalledTimes(2);
});
it("rejeita entrada inválida sem chamar Better Auth e não esconde falhas inesperadas", async () => {
  expect(await trocarSenha({ ...entrada, senhaAtual: "" }, new Headers())).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(api.changePassword).not.toHaveBeenCalled();
  api.changePassword.mockRejectedValueOnce(new Error("banco fora"));
  await expect(trocarSenha(entrada, new Headers())).rejects.toThrow("banco fora");
});

it("edição envia somente nome e telefone normalizados do usuário autenticado", async () => {
  const headers = new Headers();
  const entrada = {
    nome: " Maria Silva ",
    telefone: "(11) 98765-4321",
    userId: "outro",
    role: "ADMIN",
    email: "outro@kolo.test",
  };
  expect(await atualizarPerfil(entrada, headers)).toEqual({ ok: true });
  expect(api.updateUser).toHaveBeenCalledWith({
    headers,
    body: { name: "Maria Silva", phone: "11987654321" },
  });
  expect(await atualizarPerfil({ nome: "", telefone: "123" }, headers)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  api.getSession.mockResolvedValue(null);
  expect(await atualizarPerfil(entrada, headers)).toEqual({ ok: false, erro: "nao_autenticado" });
  expect(api.updateUser).toHaveBeenCalledTimes(1);
});
it("sessão revogada entre leitura e escrita recebe feedback de autenticação", async () => {
  api.changePassword.mockRejectedValueOnce(new APIError("UNAUTHORIZED"));
  api.updateUser.mockRejectedValueOnce(new APIError("UNAUTHORIZED"));
  expect(await trocarSenha(entrada, new Headers())).toEqual({ ok: false, erro: "nao_autenticado" });
  expect(await atualizarPerfil({ nome: "Maria", telefone: "11987654321" }, new Headers())).toEqual({
    ok: false,
    erro: "nao_autenticado",
  });
});
