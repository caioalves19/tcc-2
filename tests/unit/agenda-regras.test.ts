import { describe, expect, it } from "vitest";
import { codigoDoHorario, inicioDaSemana } from "../../src/modules/scheduling/agenda-regras";

// O fuso de São Paulo (RN09) e a soma de dias ficam em tests/unit/fuso.test.ts.

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

  it("atravessa o mês ao voltar para a segunda-feira", () => {
    expect(inicioDaSemana("2026-11-01")).toBe("2026-10-26");
  });
});

it("RF22 o código do horário é AG-AAAAMMDD-XXXXXX com a data de São Paulo", () => {
  const agora = new Date("2026-10-15T02:30:00Z");
  expect(codigoDoHorario(agora, Uint8Array.from([0, 1, 2, 3, 4, 5]))).toBe("AG-20261014-234567");
});
