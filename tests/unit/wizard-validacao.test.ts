import { expect, it } from "vitest";
import { linkWhatsApp } from "../../src/lib/contato";
import { validarDadosWizard } from "../../src/modules/scheduling/index";

const artista = "11111111-1111-4111-8111-111111111111";
const estilo = "22222222-2222-4222-8222-222222222222";
const tamanho = "33333333-3333-4333-8333-333333333333";
const opcoes = {
  artistas: [{ id: artista, nome: "Ana", estilos: [{ id: estilo, nome: "Aquarela" }] }],
  tamanhos: [{ id: tamanho, nome: "Pequena" }],
};
const dados = {
  nome: " Maria ",
  artistaId: artista,
  estiloId: estilo,
  regiao: "Antebraço",
  tamanhoId: tamanho,
  data: "2026-10-18",
  horario: "14:30",
  aceites: { anamnese: true, termo: true, maioridade: true },
};
const agora = new Date("2026-10-05T12:00:00Z");

it("RF20/RF23–RF25 valida as etapas com os três aceites, normaliza o nome e interpreta a preferência em São Paulo", () => {
  expect(validarDadosWizard(dados, opcoes, agora)).toEqual({
    ok: true,
    dados: {
      ...dados,
      nome: "Maria",
      preferenciaEm: "2026-10-18T17:30:00.000Z",
      mensagem: expect.stringContaining("Sou Maria e quero agendar uma tatuagem com Ana."),
    },
  });
});

it("RF21 a mensagem leva os nomes escolhidos e chega inteira, codificada, pelo link", () => {
  const resultado = validarDadosWizard(
    { ...dados, nome: "Zé & Ana", regiao: "Ombro / costas" },
    opcoes,
    agora,
  );
  if (!resultado.ok) throw new Error(resultado.mensagem);
  const { mensagem } = resultado.dados;
  expect(mensagem.split("\n")).toEqual([
    "Olá! Sou Zé & Ana e quero agendar uma tatuagem com Ana.",
    "Estilo: Aquarela",
    "Região do corpo: Ombro / costas",
    "Tamanho: Pequena",
    "Preferência: 18/10/2026 às 14:30 (horário de São Paulo)",
    "Li e aceito os avisos: anamnese e termo de consentimento presenciais e declaração de maioridade.",
  ]);
  // Acentos, "&", "/" e as quebras de linha codificados: o texto chega inteiro ao WhatsApp. O número
  // vem das configurações do site na revisão (PBI-39); aqui qualquer um serve.
  const link = linkWhatsApp(mensagem, "5511950901191");
  expect(link).toContain("Z%C3%A9%20%26%20Ana");
  expect(link).toContain("%0AEstilo%3A%20Aquarela%0A");
  expect(new URL(link).searchParams.get("text")).toBe(mensagem);
});

it.each([
  { nome: " " },
  { nome: "a".repeat(101) },
  { artistaId: "inválido" },
  { artistaId: "44444444-4444-4444-8444-444444444444" },
  { estiloId: "44444444-4444-4444-8444-444444444444" },
  { tamanhoId: "44444444-4444-4444-8444-444444444444" },
  { regiao: " " },
  { data: "2026-02-30" },
  { data: "2026-10-04" },
  { horario: "24:00" },
  { horario: "14:60" },
  { saude: "não permitido" },
])("RF20/RNF09 rejeita dados inválidos ou campos extras: %j", (alteracao) => {
  expect(validarDadosWizard({ ...dados, ...alteracao }, opcoes, agora).ok).toBe(false);
});

it("rejeita preferência que já passou no mesmo dia, respeitando São Paulo", () => {
  expect(
    validarDadosWizard({ ...dados, data: "2026-10-05", horario: "08:59" }, opcoes, agora).ok,
  ).toBe(false);
});

it.each([
  { aceites: undefined },
  { aceites: { termo: true, maioridade: true } },
  { aceites: { anamnese: true, maioridade: true } },
  { aceites: { anamnese: true, termo: true } },
  { aceites: { anamnese: false, termo: true, maioridade: true } },
  { aceites: { anamnese: true, termo: false, maioridade: true } },
  { aceites: { anamnese: true, termo: true, maioridade: false } },
  { aceites: { anamnese: "true", termo: true, maioridade: true } },
  { aceites: { anamnese: true, termo: true, maioridade: true, saude: "não permitido" } },
])("RF23–RF25/RNF18 rejeita aceite ausente, falso ou campo extra: %j", (alteracao) => {
  expect(validarDadosWizard({ ...dados, ...alteracao }, opcoes, agora)).toEqual({
    ok: false,
    mensagem: "Confirme os três avisos para continuar.",
  });
});
