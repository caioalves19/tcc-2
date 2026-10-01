// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormularioLogin } from "@/components/auth/formulario-login";

afterEach(cleanup);

async function preencher(campos: { email: string; senha: string }) {
  const usuario = userEvent.setup();
  if (campos.email !== "") {
    await usuario.type(screen.getByLabelText(/e-mail/i), campos.email);
  }
  if (campos.senha !== "") {
    await usuario.type(screen.getByLabelText(/senha/i), campos.senha);
  }
  await usuario.click(screen.getByRole("button", { name: /entrar/i }));
}

describe("formulário de login (RF02)", () => {
  it("credenciais erradas mostram a mensagem genérica", async () => {
    const acao = vi.fn().mockResolvedValue({ ok: false, erro: "credenciais_invalidas" });
    render(<FormularioLogin acao={acao} />);

    await preencher({ email: "Maria@Kolo.test", senha: "senha-errada" });

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeDefined();
    expect(acao).toHaveBeenCalledWith({ email: "maria@kolo.test", senha: "senha-errada" });
  });

  it("bloqueio mostra quantos minutos faltam", async () => {
    const acao = vi.fn().mockResolvedValue({ ok: false, erro: "bloqueado", minutos: 15 });
    render(<FormularioLogin acao={acao} />);

    await preencher({ email: "maria@kolo.test", senha: "senha-certa" });

    expect(await screen.findByText("Muitas tentativas. Tente de novo em 15 min.")).toBeDefined();
  });

  it("senha vazia não chama a action", async () => {
    const acao = vi.fn();
    render(<FormularioLogin acao={acao} />);

    await preencher({ email: "maria@kolo.test", senha: "" });

    expect(await screen.findByText("Informe sua senha.")).toBeDefined();
    expect(acao).not.toHaveBeenCalled();
  });

  it("falha inesperada do servidor mostra aviso em vez de sumir calada", async () => {
    const acao = vi.fn().mockRejectedValue(new Error("banco fora"));
    render(<FormularioLogin acao={acao} />);

    await preencher({ email: "maria@kolo.test", senha: "senha-certa" });

    expect(await screen.findByText("Não foi possível entrar agora. Tente de novo.")).toBeDefined();
  });
});
