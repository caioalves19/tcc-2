// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { FormularioExclusaoConta } from "@/components/auth/formulario-exclusao-conta";
afterEach(cleanup);

it("RN12 só envia com a senha e a confirmação marcada", async () => {
  const acao = vi.fn();
  render(<FormularioExclusaoConta acao={acao} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Senha atual"), "senha-inicial-123");
  await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
  expect(
    await screen.findByText("Confirme que entende que a exclusão não pode ser desfeita."),
  ).toBeDefined();
  expect(acao).not.toHaveBeenCalled();

  await user.click(screen.getByLabelText(/Entendo que a exclusão não pode ser desfeita/));
  await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
  expect(acao).toHaveBeenCalledWith({ senha: "senha-inicial-123", confirmo: true });
});

it("RN12 mostra a senha incorreta no campo e o pedido a caminho no aviso", async () => {
  const acao = vi
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      erro: "senha_incorreta",
      mensagem: "Senha atual incorreta.",
    })
    .mockResolvedValueOnce({
      ok: false,
      erro: "pedido_em_andamento",
      mensagem:
        "Você tem um pedido a caminho. Aguarde a entrega para excluir a conta ou fale com o ateliê.",
    });
  render(<FormularioExclusaoConta acao={acao} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Senha atual"), "senha-errada-123");
  await user.click(screen.getByLabelText(/Entendo que a exclusão não pode ser desfeita/));
  await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
  expect(await screen.findByText("Senha atual incorreta.")).toBeDefined();
  expect(screen.getByLabelText("Senha atual").getAttribute("aria-invalid")).toBe("true");

  await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
  expect(
    await screen.findByText(
      "Você tem um pedido a caminho. Aguarde a entrega para excluir a conta ou fale com o ateliê.",
    ),
  ).toBeDefined();
});
