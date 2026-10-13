// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { WizardAgendamento } from "../../src/components/scheduling/wizard-agendamento";

// Muitas interações por teste: com a suíte inteira em paralelo, o padrão de 5 s fica justo.
vi.setConfig({ testTimeout: 15_000 });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const opcoes = {
  artistas: [{ id: "ana", nome: "Ana", estilos: [{ id: "aquarela", nome: "Aquarela" }] }],
  tamanhos: [{ id: "pequena", nome: "Pequena" }],
};
const MENSAGEM = "Olá! Sou Maria e quero agendar uma tatuagem com Ana.\nEstilo: Aquarela";
const LINK = `https://wa.me/5511950901191?text=${encodeURIComponent(MENSAGEM)}`;

async function concluirWizard() {
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
  for (const caixa of screen.getAllByRole("checkbox")) await usuario.click(caixa);
  await usuario.click(screen.getByRole("button", { name: "Revisar preferências" }));
  await screen.findByRole("heading", { name: "Revise suas preferências" });
  return usuario;
}

const revisar = () =>
  vi.fn().mockImplementation(async (dados) => ({
    ok: true,
    dados: {
      ...dados,
      preferenciaEm: "2099-10-18T17:30:00.000Z",
      mensagem: MENSAGEM,
      linkWhatsApp: LINK,
    },
  }));

it("RF21 a etapa 8 mostra a prévia exata da mensagem e o link para a conversa com o estúdio", async () => {
  render(<WizardAgendamento opcoes={opcoes} revisar={revisar()} />);
  await concluirWizard();

  const etapas = screen.getByRole("list", { name: "Etapas do agendamento" });
  expect(etapas.children).toHaveLength(8);
  expect(within(etapas).getByText("8. WhatsApp").getAttribute("aria-current")).toBe("step");

  const previa = screen.getByRole("region", { name: "Prévia da sua mensagem" });
  expect(within(previa).getByText(/Olá! Sou Maria/).textContent).toBe(MENSAGEM);
  expect(screen.getByText(/fotos de referência/i)).toBeTruthy();

  const link = screen.getByRole("link", { name: "Abrir conversa no WhatsApp" });
  expect(link.getAttribute("href")).toBe(LINK);
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  expect(screen.queryByRole("button", { name: "Continuar para confirmação" })).toBeNull();
});

it("RF21 não abre o WhatsApp sozinho: só o clique da pessoa leva à conversa", async () => {
  const abrir = vi.spyOn(window, "open").mockImplementation(() => null);
  render(<WizardAgendamento opcoes={opcoes} revisar={revisar()} />);
  await concluirWizard();
  expect(abrir).not.toHaveBeenCalled();
  expect(window.location.href).not.toContain("wa.me");
});
