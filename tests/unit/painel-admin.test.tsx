// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PainelAdmin } from "../../src/components/admin/painel-admin";
import type { Painel } from "../../src/modules/reports";

afterEach(cleanup);

const PAINEL: Painel = {
  periodo: {
    tipo: "este-mes",
    de: "2026-10-01",
    ate: "2026-10-19",
    inicio: new Date("2026-10-01T03:00:00Z"),
    fim: new Date("2026-10-20T03:00:00Z"),
    aviso: null,
  },
  vendas: { faturamentoCentavos: 1062000, pedidosPagos: 2, ticketMedioCentavos: 531000 },
  pedidos: {
    "a-fazer": 2,
    pendentes: 1,
    enviados: 3,
    entregues: 9,
    cancelados: 4,
    "estorno-pendente": 1,
  },
  obras: { RASCUNHO: 2, DISPONIVEL: 12, ESGOTADA: 3 },
  horarios: [
    {
      codigo: "AG-20261019-AAAAAA",
      inicio: "2026-10-19T12:00",
      fim: "2026-10-19T13:00",
      artista: "Ana",
      contato: "Lucas Silveira",
    },
    {
      codigo: "AG-20261019-BBBBBB",
      inicio: "2026-10-20T09:00",
      fim: "2026-10-20T11:00",
      artista: "Bia",
      contato: "Maria Prado",
    },
  ],
};

// O valor de um indicador (<dd>) pelo rótulo (<dt>) dentro de uma seção.
const indicador = (secao: HTMLElement, rotulo: string) =>
  within(secao).getByText(rotulo, { selector: "dt" }).nextElementSibling?.textContent;

it("RF32 mostra faturamento, pedidos pagos e ticket médio do mês, com link para o relatório", () => {
  render(<PainelAdmin painel={PAINEL} />);
  expect(screen.getByRole("heading", { level: 1, name: "Painel" })).toBeDefined();
  const vendas = screen.getByRole("region", { name: "Vendas de outubro de 2026" });
  expect(
    within(vendas).getByText("De 01/10/2026 a 19/10/2026, pela data do pagamento."),
  ).toBeDefined();
  expect(indicador(vendas, "Faturamento")).toBe("R$ 10.620,00");
  expect(indicador(vendas, "Pedidos pagos")).toBe("2");
  expect(indicador(vendas, "Ticket médio")).toBe("R$ 5.310,00");
  expect(
    within(vendas).getByRole("link", { name: "Ver relatório de vendas" }).getAttribute("href"),
  ).toBe("/admin/relatorio");
});

it("RF32 sem pedido pago no mês, o ticket médio fica vazio", () => {
  render(
    <PainelAdmin
      painel={{
        ...PAINEL,
        vendas: { faturamentoCentavos: 0, pedidosPagos: 0, ticketMedioCentavos: null },
      }}
    />,
  );
  const vendas = screen.getByRole("region", { name: "Vendas de outubro de 2026" });
  expect(indicador(vendas, "Faturamento")).toBe("R$ 0,00");
  expect(indicador(vendas, "Pedidos pagos")).toBe("0");
  expect(indicador(vendas, "Ticket médio")).toBe("—");
});

it("RF32 pedidos pela situação de agora, cada um levando à lista com o filtro", () => {
  render(<PainelAdmin painel={PAINEL} />);
  const pedidos = screen.getByRole("region", { name: "Pedidos agora" });
  expect(
    within(pedidos)
      .getAllByRole("link")
      .map((link) => [link.textContent, link.getAttribute("href")]),
  ).toEqual([
    ["A fazer 2", "/admin/pedidos"],
    ["Pendentes 1", "/admin/pedidos?filtro=pendentes"],
    ["Prontos ou enviados 3", "/admin/pedidos?filtro=enviados"],
    ["Retirados ou entregues 9", "/admin/pedidos?filtro=entregues"],
    ["Cancelados 4", "/admin/pedidos?filtro=cancelados"],
    ["Estorno pendente 1", "/admin/pedidos?filtro=estorno-pendente"],
  ]);
});

it("RF32 obras do acervo por situação, com link para a gestão de obras", () => {
  render(<PainelAdmin painel={PAINEL} />);
  const obras = screen.getByRole("region", { name: "Obras" });
  expect(indicador(obras, "Disponíveis")).toBe("12");
  expect(indicador(obras, "Esgotadas")).toBe("3");
  expect(indicador(obras, "Rascunhos")).toBe("2");
  expect(within(obras).getByRole("link", { name: "Gerenciar obras" }).getAttribute("href")).toBe(
    "/admin/obras",
  );
});

it("RF32 horários dos próximos 7 dias, com link para a agenda", () => {
  render(<PainelAdmin painel={PAINEL} />);
  const agenda = screen.getByRole("region", { name: "Próximos 7 dias" });
  const itens = within(agenda).getAllByRole("listitem");
  expect(itens).toHaveLength(2);
  // 19/10/2026 é segunda-feira.
  expect(within(itens[0]!).getByText("Segunda, 19/10 · 12:00 às 13:00")).toBeDefined();
  expect(within(itens[0]!).getByText("Lucas Silveira")).toBeDefined();
  expect(within(itens[0]!).getByText("Artista: Ana")).toBeDefined();
  expect(within(itens[1]!).getByText("Terça, 20/10 · 09:00 às 11:00")).toBeDefined();
  expect(within(itens[1]!).getByText("Maria Prado")).toBeDefined();
  expect(within(agenda).getByRole("link", { name: "Abrir agenda" }).getAttribute("href")).toBe(
    "/agenda",
  );
});

it("RF32 sem horário agendado nos próximos 7 dias, avisa", () => {
  render(<PainelAdmin painel={{ ...PAINEL, horarios: [] }} />);
  const agenda = screen.getByRole("region", { name: "Próximos 7 dias" });
  expect(within(agenda).queryAllByRole("listitem")).toEqual([]);
  expect(within(agenda).getByText("Nenhum horário agendado nos próximos 7 dias.")).toBeDefined();
  expect(within(agenda).getByRole("link", { name: "Abrir agenda" })).toBeDefined();
});
