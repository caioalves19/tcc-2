import { describe, expect, it } from "vitest";
import {
  codigoDoHorario,
  deSaoPauloParaUtc,
  inicioDaSemana,
  paraHorarioSaoPaulo,
  somarDias,
} from "../../src/modules/scheduling/agenda-regras";

describe("RN09: horário de São Paulo na tela, UTC no banco", () => {
  it("converte o horário digitado (datetime-local) para UTC e volta", () => {
    expect(deSaoPauloParaUtc("2026-10-15T14:00")).toEqual(new Date("2026-10-15T17:00:00Z"));
    // 23:30 em São Paulo já é o dia seguinte em UTC.
    expect(deSaoPauloParaUtc("2026-10-15T23:30")).toEqual(new Date("2026-10-16T02:30:00Z"));
    expect(paraHorarioSaoPaulo(new Date("2026-10-16T02:30:00Z"))).toBe("2026-10-15T23:30");
    expect(paraHorarioSaoPaulo(new Date("2026-10-15T17:00:00Z"))).toBe("2026-10-15T14:00");
  });

  it("recusa texto que não é um horário válido do período aceito", () => {
    for (const texto of [
      "",
      "abc",
      "2026-10-15 14:00",
      "2026-13-01T10:00",
      "2026-02-30T10:00",
      "2026-10-15T24:00",
      "2026-10-15T10:60",
      "2019-12-31T23:59",
      "2101-01-01T00:00",
    ])
      expect(deSaoPauloParaUtc(texto), texto).toBeNull();
  });
});

describe("RF22: semana da agenda, de segunda a domingo em São Paulo", () => {
  it("acha a segunda-feira da data pedida", () => {
    expect(inicioDaSemana("2026-10-15")).toBe("2026-10-12");
    expect(inicioDaSemana("2026-10-12")).toBe("2026-10-12");
    expect(inicioDaSemana("2026-10-18")).toBe("2026-10-12");
  });

  it("sem data válida, usa a semana de agora no horário de São Paulo", () => {
    // 02:00 UTC de segunda (19/10) ainda é domingo (18/10) em São Paulo.
    const agora = new Date("2026-10-19T02:00:00Z");
    expect(inicioDaSemana(undefined, agora)).toBe("2026-10-12");
    expect(inicioDaSemana("xyz", agora)).toBe("2026-10-12");
    expect(inicioDaSemana("2026-02-30", agora)).toBe("2026-10-12");
  });

  it("anda de semana em semana, atravessando o mês", () => {
    expect(somarDias("2026-10-12", 7)).toBe("2026-10-19");
    expect(somarDias("2026-10-12", -7)).toBe("2026-10-05");
    expect(somarDias("2026-10-26", 7)).toBe("2026-11-02");
  });
});

it("RF22 o código do horário é AG-AAAAMMDD-XXXXXX com a data de São Paulo", () => {
  const agora = new Date("2026-10-15T02:30:00Z");
  expect(codigoDoHorario(agora, Uint8Array.from([0, 1, 2, 3, 4, 5]))).toBe("AG-20261014-234567");
});
