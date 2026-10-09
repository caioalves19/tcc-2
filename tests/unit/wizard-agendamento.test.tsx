// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { WizardAgendamento } from "../../src/components/scheduling/wizard-agendamento";

afterEach(cleanup);
// Testes com muitas interações de userEvent: sozinhos levam ~2 s, mas com a suíte inteira em
// paralelo passam dos 5 s padrão em máquinas mais lentas.
vi.setConfig({ testTimeout: 15_000 });
const opcoes = {
  artistas: [
    { id: "ana", nome: "Ana", estilos: [{ id: "aquarela", nome: "Aquarela" }] },
    { id: "bia", nome: "Bia", estilos: [{ id: "fine-line", nome: "Fine line" }] },
  ],
  tamanhos: [{ id: "pequena", nome: "Pequena" }],
};

async function preencherWizard() {
  const usuario = userEvent.setup();
  for (const [rotulo, valor, selecao] of [
    ["Seu nome", "Maria", false],
    ["Artista", "ana", true],
    ["Estilo", "aquarela", true],
    ["Região do corpo", "Antebraço", false],
    ["Tamanho aproximado", "pequena", true],
  ] as const) {
    if (selecao) await usuario.selectOptions(screen.getByLabelText(rotulo), valor);
    else await usuario.type(screen.getByLabelText(rotulo), valor);
    await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  }
  await usuario.type(screen.getByLabelText("Data de preferência"), "2099-10-18");
  await usuario.type(screen.getByLabelText("Horário de preferência"), "14:30");
  return usuario;
}

it("bloqueia edição durante revisão e preserva preferências quando o servidor rejeita", async () => {
  let responder!: (resultado: { ok: false; mensagem: string }) => void;
  const revisar = vi.fn().mockImplementation(
    () =>
      new Promise((resolve) => {
        responder = resolve;
      }),
  );
  render(<WizardAgendamento opcoes={opcoes} revisar={revisar} />);
  const usuario = await preencherWizard();
  await usuario.click(screen.getByRole("button", { name: "Revisar preferências" }));
  expect(screen.getByLabelText("Data de preferência").hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "Voltar" }).hasAttribute("disabled")).toBe(true);
  responder({
    ok: false,
    mensagem: "Artista indisponível. Atualize a página e escolha novamente.",
  });
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("Artista indisponível"),
  );
  expect(screen.queryByRole("heading", { name: "Revise suas preferências" })).toBeNull();
  expect((screen.getByLabelText("Data de preferência") as HTMLInputElement).value).toBe(
    "2099-10-18",
  );
  expect(
    screen.getByRole("button", { name: "Revisar preferências" }).hasAttribute("disabled"),
  ).toBe(false);
});

it("RF20 navega pelas seis etapas, preserva dados e apresenta resumo sem concluir agendamento", async () => {
  const usuario = userEvent.setup();
  const revisar = vi.fn().mockImplementation(async (dados) => ({
    ok: true,
    dados: { ...dados, preferenciaEm: "2099-10-18T17:30:00.000Z" },
  }));
  render(<WizardAgendamento opcoes={opcoes} revisar={revisar} />);
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  expect(screen.getByRole("alert").textContent).toContain("Preencha");
  expect(document.activeElement).toBe(screen.getByLabelText("Seu nome"));
  await usuario.type(screen.getByLabelText("Seu nome"), "Maria");
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  expect(document.activeElement).toBe(screen.getByRole("heading", { name: "2. Artista" }));
  await usuario.selectOptions(screen.getByLabelText("Artista"), "ana");
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  await usuario.selectOptions(screen.getByLabelText("Estilo"), "aquarela");
  await usuario.click(screen.getByRole("button", { name: "Voltar" }));
  await usuario.selectOptions(screen.getByLabelText("Artista"), "bia");
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  expect((screen.getByLabelText("Estilo") as HTMLSelectElement).value).toBe("");
  expect(screen.queryByRole("option", { name: "Aquarela" })).toBeNull();
  await usuario.selectOptions(screen.getByLabelText("Estilo"), "fine-line");
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  await usuario.type(screen.getByLabelText("Região do corpo"), "Antebraço");
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  await usuario.selectOptions(screen.getByLabelText("Tamanho aproximado"), "pequena");
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  await usuario.type(screen.getByLabelText("Data de preferência"), "2099-10-18");
  await usuario.type(screen.getByLabelText("Horário de preferência"), "14:30");
  await usuario.click(screen.getByRole("button", { name: "Revisar preferências" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Revise suas preferências" })).toBeTruthy(),
  );
  expect(revisar).toHaveBeenCalledWith({
    nome: "Maria",
    artistaId: "bia",
    estiloId: "fine-line",
    regiao: "Antebraço",
    tamanhoId: "pequena",
    data: "2099-10-18",
    horario: "14:30",
  });
  expect(
    screen.getByRole("button", { name: "Continuar para confirmação" }).hasAttribute("disabled"),
  ).toBe(true);
  expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  await usuario.click(screen.getByRole("button", { name: "Editar preferências" }));
  expect((screen.getByLabelText("Data de preferência") as HTMLInputElement).value).toBe(
    "2099-10-18",
  );
});

it("mostra estado vazio quando faltam artistas ou tamanhos", () => {
  const { rerender } = render(
    <WizardAgendamento opcoes={{ artistas: [], tamanhos: opcoes.tamanhos }} revisar={vi.fn()} />,
  );
  expect(screen.getByRole("status").textContent).toContain("Ainda não há opções");
  expect(screen.queryByRole("button", { name: "Avançar" })).toBeNull();
  rerender(
    <WizardAgendamento opcoes={{ artistas: opcoes.artistas, tamanhos: [] }} revisar={vi.fn()} />,
  );
  expect(screen.getByRole("status").textContent).toContain("Ainda não há opções");
});

it("permite avançar com teclado e bloqueia nome composto apenas por espaços", async () => {
  const usuario = userEvent.setup();
  render(<WizardAgendamento opcoes={opcoes} revisar={vi.fn()} />);
  await usuario.click(screen.getByLabelText("Seu nome"));
  await usuario.type(screen.getByLabelText("Seu nome"), "   {Enter}");
  expect(screen.getByRole("alert")).toBeTruthy();
  await usuario.clear(screen.getByLabelText("Seu nome"));
  await usuario.type(screen.getByLabelText("Seu nome"), "Maria{Enter}");
  expect(screen.getByLabelText("Artista")).toBeTruthy();
  await usuario.click(screen.getByRole("button", { name: "Voltar" }));
  expect((screen.getByLabelText("Seu nome") as HTMLInputElement).value).toBe("Maria");
});
