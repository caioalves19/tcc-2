// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { FormularioPerfil } from "@/components/auth/formulario-perfil";
afterEach(cleanup);
it("exibe os dados existentes, salva e mostra sucesso ou erro do servidor", async () => {
  const acao = vi
    .fn()
    .mockResolvedValueOnce({ ok: true })
    .mockRejectedValueOnce(new Error("offline"));
  render(<FormularioPerfil dados={{ nome: "Maria", telefone: "11987654321" }} acao={acao} />);
  const user = userEvent.setup();
  expect(screen.getByDisplayValue("Maria")).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Salvar dados" }));
  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Dados atualizados com sucesso.",
  );
  await user.click(screen.getByRole("button", { name: "Salvar dados" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Não foi possível salvar agora. Tente de novo.",
  );
  expect(screen.queryByRole("status")).toBeNull();
});
it("valida campos antes do envio e mostra erros de validação devolvidos pelo servidor", async () => {
  const acao = vi.fn().mockResolvedValue({
    ok: false,
    erro: "invalido",
    campos: { telefone: "Informe o telefone com DDD." },
  });
  render(<FormularioPerfil dados={{ nome: "", telefone: "" }} acao={acao} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Salvar dados" }));
  expect(await screen.findByText("Informe seu nome.")).toBeDefined();
  expect(acao).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Nome"), " Maria ");
  await user.type(screen.getByLabelText("Telefone"), "(11) 98765-4321");
  await user.click(screen.getByRole("button", { name: "Salvar dados" }));
  expect(await screen.findByText("Informe o telefone com DDD.")).toBeDefined();
  expect(acao).toHaveBeenCalledWith({ nome: "Maria", telefone: "11987654321" });
});
it("sessão expirada recebe feedback visível", async () => {
  render(
    <FormularioPerfil
      dados={{ nome: "Maria", telefone: "11987654321" }}
      acao={vi.fn().mockResolvedValue({ ok: false, erro: "nao_autenticado" })}
    />,
  );
  await userEvent.setup().click(screen.getByRole("button", { name: "Salvar dados" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Sua sessão expirou. Entre novamente para continuar.",
  );
});
