/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FormularioContato } from "@/app/contato/formulario";

const enviarContatoMock = vi.fn();
vi.mock("@/modules/contact/actions", () => ({
  enviarContato: (...args: any[]) => enviarContatoMock(...args),
}));

describe("Formulário de Contato", () => {
  it("renderiza os campos corretamente", () => {
    render(<FormularioContato />);
    
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensagem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeInTheDocument();
  });

  it("exibe erros de validação ao tentar enviar vazio", async () => {
    render(<FormularioContato />);
    
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Informe seu nome (mínimo de 2 caracteres).")).toBeInTheDocument();
    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(await screen.findByText("Escreva uma mensagem (mínimo de 10 caracteres).")).toBeInTheDocument();
    expect(enviarContatoMock).not.toHaveBeenCalled();
  });

  it("mostra mensagem de erro devolvida pelo servidor", async () => {
    enviarContatoMock.mockResolvedValueOnce({ ok: false, mensagem: "Muitas tentativas. Tente novamente mais tarde." });
    
    render(<FormularioContato />);
    
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Teste" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "teste@kolo.test" } });
    fireEvent.change(screen.getByLabelText("Mensagem"), { target: { value: "Mensagem de teste aqui." } });
    
    // Simulate turnstile callback
    const w = window as unknown as { onTurnstileSuccess?: (token: string) => void };
    if (w.onTurnstileSuccess) {
      w.onTurnstileSuccess("fake-token");
    }

    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Muitas tentativas. Tente novamente mais tarde.")).toBeInTheDocument();
  });
});
