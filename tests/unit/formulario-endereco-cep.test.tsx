// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { FormularioEndereco } from "@/components/auth/formulario-endereco";
import { ENDERECO_VAZIO } from "@/modules/endereco";

afterEach(cleanup);

const SE = { logradouro: "Praça da Sé", bairro: "Sé", cidade: "São Paulo", uf: "SP" };

function valor(rotulo: string) {
  return (screen.getByLabelText(rotulo) as HTMLInputElement).value;
}

it("RF05 ao sair do CEP, preenche rua, bairro, cidade e UF e vai para o número", async () => {
  const buscarCep = vi.fn().mockResolvedValue(SE);
  render(<FormularioEndereco dados={ENDERECO_VAZIO} acao={vi.fn()} buscarCep={buscarCep} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("CEP"), "01001-000");
  await user.tab();
  await waitFor(() => expect(valor("Rua ou avenida")).toBe("Praça da Sé"));
  expect(valor("Bairro")).toBe("Sé");
  expect(valor("Cidade")).toBe("São Paulo");
  expect(valor("UF")).toBe("SP");
  expect(document.activeElement).toBe(screen.getByLabelText("Número"));
  expect(buscarCep).toHaveBeenCalledWith("01001-000");
});

const SALVO = {
  destinatario: "Maria",
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

it("passar pelo CEP sem mudá-lo não consulta nem sobrescreve o endereço salvo", async () => {
  const buscarCep = vi.fn().mockResolvedValue(SE);
  render(<FormularioEndereco dados={SALVO} acao={vi.fn()} buscarCep={buscarCep} />);
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("CEP"));
  await user.tab();
  expect(buscarCep).not.toHaveBeenCalled();
  expect(valor("Rua ou avenida")).toBe("Avenida Paulista");
});

it("sem resposta do CEP, mantém o que a pessoa digitou e não mostra erro", async () => {
  const buscarCep = vi.fn().mockResolvedValue(null);
  render(<FormularioEndereco dados={SALVO} acao={vi.fn()} buscarCep={buscarCep} />);
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText("CEP"));
  await user.type(screen.getByLabelText("CEP"), "99999-999");
  await user.tab();
  await waitFor(() => expect(buscarCep).toHaveBeenCalledWith("99999-999"));
  expect(valor("Rua ou avenida")).toBe("Avenida Paulista");
  expect(screen.queryByRole("alert")).toBeNull();
});
