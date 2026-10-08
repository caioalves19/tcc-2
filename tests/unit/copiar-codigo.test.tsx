// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CopiarCodigo } from "../../src/components/conta/copiar-codigo";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("RF16 copia o código de rastreio e avisa", async () => {
  const usuario = userEvent.setup();
  render(<CopiarCodigo codigo="BR987654321SP" />);
  await usuario.click(screen.getByRole("button", { name: "Copiar código de rastreio" }));
  expect(await navigator.clipboard.readText()).toBe("BR987654321SP");
  expect(screen.getByRole("status").textContent).toBe("Código copiado.");
});

it("sem acesso à área de transferência, pede para copiar à mão", async () => {
  const usuario = userEvent.setup();
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("negado"));
  render(<CopiarCodigo codigo="BR987654321SP" />);
  await usuario.click(screen.getByRole("button", { name: "Copiar código de rastreio" }));
  expect(screen.getByRole("status").textContent).toBe(
    "Não foi possível copiar. Selecione o código e copie.",
  );
});
