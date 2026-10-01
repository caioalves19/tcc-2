// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormularioRedefinicao } from "@/components/auth/formulario-redefinicao";

afterEach(cleanup);

async function preencher(senha: string, confirmacao: string) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/^nova senha$/i), senha);
  await usuario.type(screen.getByLabelText(/confirme/i), confirmacao);
  await usuario.click(screen.getByRole("button", { name: /salvar nova senha/i }));
}

describe("formulário de nova senha (RF03)", () => {
  it("confirmação diferente mostra o erro e não chama a action", async () => {
    const acao = vi.fn();
    render(<FormularioRedefinicao token="abc" acao={acao} />);

    await preencher("senha-nova-123", "senha-outra-123");

    expect(await screen.findByText("As senhas não conferem.")).toBeDefined();
    expect(acao).not.toHaveBeenCalled();
  });

  it("envia token e senha; link inválido mostra o aviso e o caminho para pedir outro", async () => {
    const acao = vi.fn().mockResolvedValue({ ok: false, erro: "token_invalido" });
    render(<FormularioRedefinicao token="abc" acao={acao} />);

    await preencher("senha-nova-123", "senha-nova-123");

    expect(await screen.findByText("Link inválido ou expirado. Peça um novo.")).toBeDefined();
    expect(screen.getByRole("link", { name: /pedir novo link/i }).getAttribute("href")).toBe(
      "/esqueci-senha",
    );
    expect(acao).toHaveBeenCalledWith({
      token: "abc",
      senha: "senha-nova-123",
      confirmacao: "senha-nova-123",
    });
  });

  it("falha inesperada do servidor mostra aviso", async () => {
    const acao = vi.fn().mockRejectedValue(new Error("banco fora"));
    render(<FormularioRedefinicao token="abc" acao={acao} />);

    await preencher("senha-nova-123", "senha-nova-123");

    expect(await screen.findByText("Não foi possível salvar agora. Tente de novo.")).toBeDefined();
  });

  it("tira o token da barra de endereço ao abrir: não fica no histórico nem vai no POST", () => {
    window.history.replaceState(null, "", "/redefinir-senha?token=abc");

    render(<FormularioRedefinicao token="abc" acao={vi.fn()} />);

    expect(window.location.pathname + window.location.search).toBe("/redefinir-senha");
  });
});
