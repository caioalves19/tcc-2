// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { WizardAgendamento } from "../../src/components/scheduling/wizard-agendamento";

// Muitas interações por teste: com a suíte inteira em paralelo, o padrão de 5 s fica justo.
vi.setConfig({ testTimeout: 15_000 });
afterEach(cleanup);
const opcoes = {
  artistas: [{ id: "ana", nome: "Ana", estilos: [{ id: "aquarela", nome: "Aquarela" }] }],
  tamanhos: [{ id: "pequena", nome: "Pequena" }],
};
const AVISOS = [
  ["anamnese", /ficha de anamnese será preenchida presencialmente/],
  ["termo", /termo de consentimento será assinado presencialmente/],
  ["maioridade", /Declaro ter 18 anos ou mais/],
] as const;

async function irParaAvisos() {
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
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  return usuario;
}

const caixa = (nome: RegExp) => screen.getByRole("checkbox", { name: nome }) as HTMLInputElement;

it("RF23–RF25 mostra a etapa 7 com os três avisos desmarcados", async () => {
  render(<WizardAgendamento opcoes={opcoes} revisar={vi.fn()} />);
  await irParaAvisos();
  expect(document.activeElement).toBe(screen.getByRole("heading", { name: "7. Avisos" }));
  // A barra tem 8 itens desde o PBI-33 (a etapa 8, WhatsApp, é a revisão).
  expect(screen.getByRole("list", { name: "Etapas do agendamento" }).children).toHaveLength(8);
  for (const [, nome] of AVISOS) expect(caixa(nome).checked).toBe(false);
  expect(screen.getByText(/sem ele, o horário será cancelado/)).toBeTruthy();
});

it.each(AVISOS)(
  "RF23–RF25 bloqueia a revisão sem o aceite de %s e leva o foco até ele",
  async (faltando, nomeFaltando) => {
    const revisar = vi.fn();
    render(<WizardAgendamento opcoes={opcoes} revisar={revisar} />);
    const usuario = await irParaAvisos();
    for (const [chave, nome] of AVISOS) if (chave !== faltando) await usuario.click(caixa(nome));
    await usuario.click(screen.getByRole("button", { name: "Revisar preferências" }));
    expect(revisar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Confirme os três avisos para continuar.");
    expect(document.activeElement).toBe(caixa(nomeFaltando));
    expect(caixa(nomeFaltando).getAttribute("aria-invalid")).toBe("true");
  },
);

it("RF21 envia os três aceites à revisão e os preserva ao voltar e editar", async () => {
  const revisar = vi.fn().mockImplementation(async (dados) => ({
    ok: true,
    dados: { ...dados, preferenciaEm: "2099-10-18T17:30:00.000Z" },
  }));
  render(<WizardAgendamento opcoes={opcoes} revisar={revisar} />);
  const usuario = await irParaAvisos();
  for (const [, nome] of AVISOS) await usuario.click(caixa(nome));
  await usuario.click(screen.getByRole("button", { name: "Voltar" }));
  await usuario.click(screen.getByRole("button", { name: "Avançar" }));
  for (const [, nome] of AVISOS) expect(caixa(nome).checked).toBe(true);
  await usuario.click(screen.getByRole("button", { name: "Revisar preferências" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Revise suas preferências" })).toBeTruthy(),
  );
  expect(revisar).toHaveBeenCalledWith(
    expect.objectContaining({ aceites: { anamnese: true, termo: true, maioridade: true } }),
  );
  await usuario.click(screen.getByRole("button", { name: "Editar preferências" }));
  expect(screen.getByRole("heading", { name: "7. Avisos" })).toBeTruthy();
  for (const [, nome] of AVISOS) expect(caixa(nome).checked).toBe(true);
});

it("RF23–RF25 desmarcar um aviso volta a bloquear a revisão", async () => {
  const revisar = vi.fn();
  render(<WizardAgendamento opcoes={opcoes} revisar={revisar} />);
  const usuario = await irParaAvisos();
  for (const [, nome] of AVISOS) await usuario.click(caixa(nome));
  await usuario.click(caixa(AVISOS[1][1]));
  await usuario.click(screen.getByRole("button", { name: "Revisar preferências" }));
  expect(revisar).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(caixa(AVISOS[1][1]));
});

it("RF23–RF25 sem nenhum aceite leva o foco ao primeiro aviso e marca os três como inválidos", async () => {
  const revisar = vi.fn();
  render(<WizardAgendamento opcoes={opcoes} revisar={revisar} />);
  const usuario = await irParaAvisos();
  await usuario.click(screen.getByRole("button", { name: "Revisar preferências" }));
  expect(revisar).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(caixa(AVISOS[0][1]));
  for (const [, nome] of AVISOS) expect(caixa(nome).getAttribute("aria-invalid")).toBe("true");
});
