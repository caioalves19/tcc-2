// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { BotaoAdicionarAoCarrinho } from "../../src/components/loja/botao-adicionar-carrinho";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  unstable_rethrow: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("RF11 adiciona a obra, atualiza o cabeçalho e oferece ir ao carrinho", async () => {
  const usuario = userEvent.setup();
  const adicionar = vi.fn().mockResolvedValue({ ok: true, dados: undefined });
  render(<BotaoAdicionarAoCarrinho obraId="obra-1" adicionar={adicionar} />);

  await usuario.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));
  await waitFor(() => expect(adicionar).toHaveBeenCalledWith("obra-1"));
  expect((await screen.findByRole("status")).textContent).toContain("Obra adicionada ao carrinho.");
  expect(screen.getByRole("link", { name: "Ver carrinho" }).getAttribute("href")).toBe("/carrinho");
  expect(refresh).toHaveBeenCalled();
});

it("RF11 mostra o motivo quando o servidor recusa", async () => {
  const usuario = userEvent.setup();
  const adicionar = vi.fn().mockResolvedValue({
    ok: false,
    erro: "quantidade_invalida",
    mensagem: "Você já tem no carrinho todas as unidades disponíveis desta obra.",
  });
  render(<BotaoAdicionarAoCarrinho obraId="obra-1" adicionar={adicionar} />);

  await usuario.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Você já tem no carrinho todas as unidades disponíveis desta obra.",
  );
  expect(refresh).not.toHaveBeenCalled();
});
