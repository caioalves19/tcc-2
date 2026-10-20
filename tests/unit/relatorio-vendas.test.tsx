// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RelatorioVendas } from "../../src/components/admin/relatorio-vendas";
import type { RelatorioVendas as Relatorio } from "../../src/modules/reports";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const RELATORIO: Relatorio = {
  periodo: {
    tipo: "intervalo",
    de: "2026-10-01",
    ate: "2026-10-31",
    inicio: new Date("2026-10-01T03:00:00Z"),
    fim: new Date("2026-11-01T03:00:00Z"),
    aviso: null,
  },
  faturamentoCentavos: 757500,
  pedidosPagos: 4,
  ticketMedioCentavos: 189375,
  obras: [
    {
      obraId: "o1",
      titulo: "Mar de dentro",
      artista: "Bia",
      unidades: 3,
      valorCentavos: 150000,
    },
    { obraId: "o2", titulo: "Rua velha", artista: "Ana", unidades: 2, valorCentavos: 400000 },
  ],
  artistas: [
    { artistaId: "a1", nome: "Ana", unidades: 4, valorCentavos: 600000 },
    { artistaId: "a2", nome: "Bia", unidades: 3, valorCentavos: 150000 },
  ],
};

// Cabeçalho e linhas de uma tabela, como texto de cada célula (o cabeçalho da linha vem antes).
const linhas = (tabela: HTMLElement) =>
  within(tabela)
    .getAllByRole("row")
    .map((linha) =>
      [
        ...within(linha).queryAllByRole("columnheader"),
        ...within(linha).queryAllByRole("rowheader"),
        ...within(linha).queryAllByRole("cell"),
      ].map((celula) => celula.textContent),
    );

it("RF32 mostra o total do período, as obras mais vendidas e o faturamento por artista", () => {
  render(<RelatorioVendas relatorio={RELATORIO} />);
  expect(screen.getByRole("heading", { level: 1, name: "Relatório de vendas" })).toBeDefined();
  expect(screen.getByText("De 01/10/2026 a 31/10/2026, pela data do pagamento.")).toBeDefined();

  const total = screen.getByRole("region", { name: "Total do período" });
  const valor = (rotulo: string) =>
    within(total).getByText(rotulo, { selector: "dt" }).nextElementSibling?.textContent;
  expect(valor("Faturamento")).toBe("R$ 7.575,00");
  expect(valor("Pedidos pagos")).toBe("4");
  expect(valor("Ticket médio")).toBe("R$ 1.893,75");

  // A artista fica sob o título (cabe em 320 px); o leitor de tela ouve "Mar de dentro, Bia".
  expect(linhas(screen.getByRole("table", { name: "Obras mais vendidas" }))).toEqual([
    ["Obra e artista", "Unidades", "Valor"],
    ["Mar de dentro, Bia", "3", "R$ 1.500,00"],
    ["Rua velha, Ana", "2", "R$ 4.000,00"],
  ]);
  expect(linhas(screen.getByRole("table", { name: "Faturamento por artista" }))).toEqual([
    ["Artista", "Unidades", "Valor"],
    ["Ana", "4", "R$ 6.000,00"],
    ["Bia", "3", "R$ 1.500,00"],
  ]);
  // O faturamento tem o frete; as tabelas, não.
  expect(
    screen.getByText(
      "O faturamento soma o total dos pedidos, com o frete. As tabelas somam só as obras (preço × quantidade), sem o frete, por isso os totais podem não bater.",
    ),
  ).toBeDefined();
});

it("RF32 escolhe o período: este mês, últimos 30 dias ou um intervalo, pela URL", () => {
  const { rerender } = render(<RelatorioVendas relatorio={RELATORIO} />);
  const periodos = screen.getByRole("navigation", { name: "Período do relatório" });
  expect(
    within(periodos)
      .getAllByRole("link")
      .map((link) => [
        link.textContent,
        link.getAttribute("href"),
        link.getAttribute("aria-current"),
      ]),
  ).toEqual([
    ["Este mês", "/admin/relatorio", null],
    ["Últimos 30 dias", "/admin/relatorio?periodo=30-dias", null],
  ]);

  // Formulário GET: funciona sem JavaScript e deixa o período na URL.
  const intervalo = screen.getByRole("form", { name: "Intervalo" });
  expect(intervalo.getAttribute("action")).toBe("/admin/relatorio");
  expect(intervalo.getAttribute("method")).toBeNull();
  expect(within(intervalo).getByLabelText<HTMLInputElement>("De").value).toBe("2026-10-01");
  expect(within(intervalo).getByLabelText<HTMLInputElement>("Até").value).toBe("2026-10-31");
  expect(intervalo.querySelector<HTMLInputElement>('input[name="periodo"]')?.value).toBe(
    "intervalo",
  );
  expect(within(intervalo).getByRole("button", { name: "Ver intervalo" })).toBeDefined();

  rerender(
    <RelatorioVendas
      relatorio={{ ...RELATORIO, periodo: { ...RELATORIO.periodo, tipo: "30-dias" } }}
    />,
  );
  expect(
    within(screen.getByRole("navigation", { name: "Período do relatório" }))
      .getByRole("link", { name: "Últimos 30 dias" })
      .getAttribute("aria-current"),
  ).toBe("page");
});

it("RF32 intervalo inválido: o aviso do servidor aparece como alerta", () => {
  render(
    <RelatorioVendas
      relatorio={{
        ...RELATORIO,
        periodo: {
          ...RELATORIO.periodo,
          tipo: "este-mes",
          aviso: "A data inicial deve ser igual ou anterior à final. Mostrando este mês.",
        },
      }}
    />,
  );
  expect(screen.getByRole("alert").textContent).toBe(
    "A data inicial deve ser igual ou anterior à final. Mostrando este mês.",
  );
});

it("RF32 sem aviso, nenhum alerta", () => {
  render(<RelatorioVendas relatorio={RELATORIO} />);
  expect(screen.queryByRole("alert")).toBeNull();
});

it("RF32 sem venda no período, as tabelas dão lugar a um aviso", () => {
  render(
    <RelatorioVendas
      relatorio={{
        ...RELATORIO,
        faturamentoCentavos: 0,
        pedidosPagos: 0,
        ticketMedioCentavos: null,
        obras: [],
        artistas: [],
      }}
    />,
  );
  expect(screen.queryAllByRole("table")).toEqual([]);
  for (const nome of ["Obras mais vendidas", "Faturamento por artista"])
    expect(
      within(screen.getByRole("region", { name: nome })).getByText("Nenhuma venda no período."),
    ).toBeDefined();
  const total = screen.getByRole("region", { name: "Total do período" });
  expect(
    within(total).getByText("Ticket médio", { selector: "dt" }).nextElementSibling?.textContent,
  ).toBe("—");
});

it("RF32 versão para impressão: o botão imprime e os controles ficam de fora do papel", () => {
  const imprimir = vi.spyOn(window, "print").mockImplementation(() => {});
  render(<RelatorioVendas relatorio={RELATORIO} />);
  const botao = screen.getByRole("button", { name: "Imprimir" });
  fireEvent.click(botao);
  expect(imprimir).toHaveBeenCalledOnce();

  // Tailwind print:hidden (display: none na impressão), no controle ou num ancestral.
  const naImpressao = (elemento: HTMLElement) => {
    for (let atual: HTMLElement | null = elemento; atual; atual = atual.parentElement)
      if (atual.classList.contains("print:hidden")) return false;
    return true;
  };
  expect(naImpressao(botao)).toBe(false);
  expect(naImpressao(screen.getByRole("navigation", { name: "Período do relatório" }))).toBe(false);
  expect(naImpressao(screen.getByRole("form", { name: "Intervalo" }))).toBe(false);
  // O conteúdo do relatório continua.
  expect(naImpressao(screen.getByRole("heading", { level: 1, name: "Relatório de vendas" }))).toBe(
    true,
  );
  expect(naImpressao(screen.getByRole("table", { name: "Obras mais vendidas" }))).toBe(true);
});
