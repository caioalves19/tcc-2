// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormularioPedidoRecuperacao } from "@/components/auth/formulario-pedido-recuperacao";

afterEach(cleanup);

async function pedir(email: string) {
  const usuario = userEvent.setup();
  if (email !== "") {
    await usuario.type(screen.getByLabelText(/e-mail/i), email);
  }
  await usuario.click(screen.getByRole("button", { name: /enviar link/i }));
}

describe("formulário de pedido de recuperação (RF03)", () => {
  it("envia o e-mail normalizado e troca o formulário pela mensagem neutra", async () => {
    const acao = vi.fn().mockResolvedValue({ ok: true });
    render(<FormularioPedidoRecuperacao acao={acao} />);

    await pedir(" Maria@Kolo.test ");

    expect(
      await screen.findByText(
        "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.",
      ),
    ).toBeDefined();
    expect(acao).toHaveBeenCalledWith({ email: "maria@kolo.test" });
    expect(screen.queryByRole("button", { name: /enviar link/i })).toBeNull();
  });

  it("e-mail inválido mostra o erro e não chama a action", async () => {
    const acao = vi.fn();
    render(<FormularioPedidoRecuperacao acao={acao} />);

    await pedir("maria-sem-arroba");

    expect(await screen.findByText("Informe um e-mail válido.")).toBeDefined();
    expect(acao).not.toHaveBeenCalled();
  });

  it("falha inesperada do servidor mostra aviso", async () => {
    const acao = vi.fn().mockRejectedValue(new Error("banco fora"));
    render(<FormularioPedidoRecuperacao acao={acao} />);

    await pedir("maria@kolo.test");

    expect(await screen.findByText("Não foi possível enviar agora. Tente de novo.")).toBeDefined();
  });
});
