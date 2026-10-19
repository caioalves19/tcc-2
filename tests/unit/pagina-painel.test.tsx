// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Painel } from "@/modules/reports";

const mocks = vi.hoisted(() => ({ ler: vi.fn(), headers: new Headers({ cookie: "sessao=1" }) }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("@/modules/reports", () => ({ lerPainel: mocks.ler }));

import PaginaAdmin, { metadata } from "@/app/admin/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const PAINEL: Painel = {
  periodo: {
    tipo: "este-mes",
    de: "2026-10-01",
    ate: "2026-10-19",
    inicio: new Date("2026-10-01T03:00:00Z"),
    fim: new Date("2026-10-20T03:00:00Z"),
    aviso: null,
  },
  vendas: { faturamentoCentavos: 0, pedidosPagos: 0, ticketMedioCentavos: null },
  pedidos: {
    "a-fazer": 0,
    pendentes: 0,
    enviados: 0,
    entregues: 0,
    cancelados: 0,
    "estorno-pendente": 0,
  },
  obras: { RASCUNHO: 0, DISPONIVEL: 0, ESGOTADA: 0 },
  horarios: [],
};

it("RF32 a página inicial do admin é o painel, lido com a sessão da requisição", async () => {
  mocks.ler.mockResolvedValueOnce({ ok: true, dados: PAINEL });
  render(await PaginaAdmin());
  expect(mocks.ler).toHaveBeenCalledWith(mocks.headers);
  expect(screen.getByRole("heading", { level: 1, name: "Painel" })).toBeDefined();
  expect(metadata.title).toBe("Painel · Administração · Kolô");
});

it("RF32 falha ao ler o painel aparece como alerta", async () => {
  mocks.ler.mockResolvedValueOnce({
    ok: false,
    erro: "concorrencia",
    mensagem: "Outro cadastro foi alterado ao mesmo tempo. Atualize e tente novamente.",
  });
  render(await PaginaAdmin());
  expect(screen.getByRole("alert").textContent).toBe(
    "Outro cadastro foi alterado ao mesmo tempo. Atualize e tente novamente.",
  );
  expect(screen.queryByRole("heading", { level: 1, name: "Painel" })).toBeNull();
});
