import { expect, it } from "vitest";
import { mensagemAgendamento } from "../../src/modules/scheduling/whatsapp";

const ACEITES = { anamnese: true, termo: true, maioridade: true } as const;

it("RF21 a mensagem traz nome, artista, estilo, região, tamanho, preferência e os aceites", () => {
  expect(
    mensagemAgendamento({
      nome: "Mariana Costa",
      artista: "Vicente Nogueira",
      estilo: "Fine Line",
      regiao: "Antebraço",
      tamanho: "Média (10 a 20 cm)",
      data: "2026-10-21",
      horario: "14:30",
      aceites: ACEITES,
    }),
  ).toBe(
    [
      "Olá! Sou Mariana Costa e quero agendar uma tatuagem com Vicente Nogueira.",
      "Estilo: Fine Line",
      "Região do corpo: Antebraço",
      "Tamanho: Média (10 a 20 cm)",
      "Preferência: 21/10/2026 às 14:30 (horário de São Paulo)",
      "Li e aceito os avisos: anamnese e termo de consentimento presenciais e declaração de maioridade.",
    ].join("\n"),
  );
});
