// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { FormularioTrocaSenha } from "@/components/auth/formulario-troca-senha";
afterEach(cleanup);
it("exibe senha atual incorreta, permite corrigir e limpa senhas após sucesso", async () => {
  const acao = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, erro: "senha_atual_incorreta" })
    .mockResolvedValueOnce({ ok: true });
  render(<FormularioTrocaSenha acao={acao} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Senha atual"), "senha-atual-123");
  await user.type(screen.getByLabelText("Nova senha"), "senha-nova-123");
  await user.type(screen.getByLabelText("Confirme a nova senha"), "senha-nova-123");
  await user.click(screen.getByRole("button", { name: "Alterar senha" }));
  expect(await screen.findByText("Senha atual incorreta.")).toBeDefined();
  await user.clear(screen.getByLabelText("Senha atual"));
  await user.type(screen.getByLabelText("Senha atual"), "senha-correta-123");
  await user.click(screen.getByRole("button", { name: "Alterar senha" }));
  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Senha alterada com sucesso.",
  );
  for (const rotulo of ["Senha atual", "Nova senha", "Confirme a nova senha"])
    expect(screen.getByLabelText(rotulo)).toHaveProperty("value", "");
});
