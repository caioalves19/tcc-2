import { expect, it } from "vitest";
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
};
const agora = new Date("2026-10-05T12:00:00Z");

it("RF20 valida as seis etapas, normaliza o nome e interpreta a preferência em São Paulo", () => {
  expect(validarDadosWizard(dados, opcoes, agora)).toEqual({
    ok: true,
    dados: { ...dados, nome: "Maria", preferenciaEm: "2026-10-18T17:30:00.000Z" },
  });
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
