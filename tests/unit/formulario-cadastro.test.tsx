// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormularioCadastro } from "@/components/auth/formulario-cadastro";

afterEach(cleanup);

async function preencher(campos: { nome: string; email: string; telefone: string; senha: string }) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/nome/i), campos.nome);
  await usuario.type(screen.getByLabelText(/e-mail/i), campos.email);
  await usuario.type(screen.getByLabelText(/telefone/i), campos.telefone);
  await usuario.type(screen.getByLabelText(/senha/i), campos.senha);
  await usuario.click(screen.getByRole("button", { name: /criar conta/i }));
}

describe("formulário de cadastro (RF01)", () => {
  it("com e-mail inválido mostra o erro e não chama a action", async () => {
    const acao = vi.fn();
    render(<FormularioCadastro acao={acao} />);

    await preencher({
      nome: "Maria Silva",
      email: "maria-sem-arroba",
      telefone: "(11) 98765-4321",
      senha: "senha-segura",
    });

    expect(await screen.findByText("Informe um e-mail válido.")).toBeDefined();
    expect(acao).not.toHaveBeenCalled();
  });

  it("com dados válidos envia normalizado e mostra o erro de e-mail já cadastrado", async () => {
    const acao = vi.fn().mockResolvedValue({ ok: false, erro: "email_duplicado" });
    render(<FormularioCadastro acao={acao} />);

    await preencher({
      nome: "Maria Silva",
      email: "Maria@Kolo.test",
      telefone: "(11) 98765-4321",
      senha: "senha-segura",
    });

    expect(await screen.findByText("Este e-mail já está cadastrado.")).toBeDefined();
    expect(acao).toHaveBeenCalledWith({
      nome: "Maria Silva",
      email: "maria@kolo.test",
      telefone: "11987654321",
      senha: "senha-segura",
    });
  });
});
