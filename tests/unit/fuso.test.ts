import { describe, expect, it } from "vitest";
import { deSaoPauloParaUtc, paraHorarioSaoPaulo, somarDias } from "@/lib/fuso";

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

  it("soma dias a uma data, atravessando o mês e o ano", () => {
    expect(somarDias("2026-10-12", 7)).toBe("2026-10-19");
    expect(somarDias("2026-10-12", -7)).toBe("2026-10-05");
    expect(somarDias("2026-10-26", 7)).toBe("2026-11-02");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});
