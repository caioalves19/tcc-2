import { describe, expect, it } from "vitest";
import { periodoDoRelatorio } from "../../src/modules/reports";

// RF32 (PBI-48): o relatório soma pelo pago_em, em dias inteiros de São Paulo (RN09, UTC−03:00).
// O fim é exclusivo: o último dia vai até 02:59:59.999Z do dia seguinte.
const instante = (texto: string) => new Date(texto);

describe("RF32 este mês: do dia 1 até hoje, em São Paulo", () => {
  it("é o período padrão", () => {
    expect(periodoDoRelatorio({}, instante("2026-10-19T15:00:00Z"))).toEqual({
      tipo: "este-mes",
      de: "2026-10-01",
      ate: "2026-10-19",
      inicio: instante("2026-10-01T03:00:00Z"),
      fim: instante("2026-10-20T03:00:00Z"),
      aviso: null,
    });
  });

  it("às 23h30 de 31/10 em São Paulo (02:30Z de 01/11) ainda é outubro", () => {
    expect(periodoDoRelatorio({ periodo: "este-mes" }, instante("2026-11-01T02:30:00Z"))).toEqual({
      tipo: "este-mes",
      de: "2026-10-01",
      ate: "2026-10-31",
      inicio: instante("2026-10-01T03:00:00Z"),
      fim: instante("2026-11-01T03:00:00Z"),
      aviso: null,
    });
  });
});

describe("RF32 últimos 30 dias: hoje e os 29 anteriores", () => {
  it("atravessa o mês", () => {
    expect(periodoDoRelatorio({ periodo: "30-dias" }, instante("2026-10-19T15:00:00Z"))).toEqual({
      tipo: "30-dias",
      de: "2026-09-20",
      ate: "2026-10-19",
      inicio: instante("2026-09-20T03:00:00Z"),
      fim: instante("2026-10-20T03:00:00Z"),
      aviso: null,
    });
  });

  it("atravessa o ano, e às 23h59 de 31/12 em São Paulo ainda é dezembro", () => {
    expect(periodoDoRelatorio({ periodo: "30-dias" }, instante("2027-01-05T12:00:00Z"))).toEqual({
      tipo: "30-dias",
      de: "2026-12-07",
      ate: "2027-01-05",
      inicio: instante("2026-12-07T03:00:00Z"),
      fim: instante("2027-01-06T03:00:00Z"),
      aviso: null,
    });
    expect(periodoDoRelatorio({}, instante("2027-01-01T02:59:00Z"))).toMatchObject({
      de: "2026-12-01",
      ate: "2026-12-31",
      fim: instante("2027-01-01T03:00:00Z"),
    });
  });
});

describe("RF32 intervalo escolhido: de e até entram inteiros", () => {
  const agora = instante("2026-10-19T15:00:00Z");

  it("vai da meia-noite do primeiro dia à do dia seguinte ao último", () => {
    expect(
      periodoDoRelatorio({ periodo: "intervalo", de: "2026-09-01", ate: "2026-09-30" }, agora),
    ).toEqual({
      tipo: "intervalo",
      de: "2026-09-01",
      ate: "2026-09-30",
      inicio: instante("2026-09-01T03:00:00Z"),
      fim: instante("2026-10-01T03:00:00Z"),
      aviso: null,
    });
  });

  it("pode ser um dia só", () => {
    expect(
      periodoDoRelatorio({ periodo: "intervalo", de: "2026-10-05", ate: "2026-10-05" }, agora),
    ).toMatchObject({
      tipo: "intervalo",
      inicio: instante("2026-10-05T03:00:00Z"),
      fim: instante("2026-10-06T03:00:00Z"),
    });
  });
});

describe("RF32 intervalo inválido: volta ao mês corrente e avisa", () => {
  const agora = instante("2026-10-19T15:00:00Z");
  const esteMes = {
    tipo: "este-mes",
    de: "2026-10-01",
    ate: "2026-10-19",
    inicio: instante("2026-10-01T03:00:00Z"),
    fim: instante("2026-10-20T03:00:00Z"),
  };

  it("com a data inicial depois da final", () => {
    expect(
      periodoDoRelatorio({ periodo: "intervalo", de: "2026-10-10", ate: "2026-10-09" }, agora),
    ).toEqual({
      ...esteMes,
      aviso: "A data inicial deve ser igual ou anterior à final. Mostrando este mês.",
    });
  });

  it("sem as duas datas, com data impossível ou fora de 2020–2100", () => {
    for (const [de, ate] of [
      [undefined, undefined],
      ["2026-10-01", ""],
      ["abc", "2026-10-09"],
      ["2026-02-30", "2026-03-10"],
      ["2019-12-31", "2026-01-10"],
      ["2100-12-01", "2100-12-31"],
    ])
      expect(
        periodoDoRelatorio({ periodo: "intervalo", de, ate }, agora),
        `${de} a ${ate}`,
      ).toEqual({ ...esteMes, aviso: "Escolha as duas datas do intervalo. Mostrando este mês." });
  });
});

it("RF32 período desconhecido na URL volta ao mês corrente, sem aviso", () => {
  const agora = instante("2026-10-19T15:00:00Z");
  for (const entrada of [undefined, null, "30-dias", { periodo: "semana" }, { periodo: 7 }])
    expect(periodoDoRelatorio(entrada, agora), JSON.stringify(entrada)).toMatchObject({
      tipo: "este-mes",
      de: "2026-10-01",
      ate: "2026-10-19",
      aviso: null,
    });
});
