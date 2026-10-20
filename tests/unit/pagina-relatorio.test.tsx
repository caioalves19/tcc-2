// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { RelatorioVendas } from "@/modules/reports";

const mocks = vi.hoisted(() => ({ ler: vi.fn(), headers: new Headers({ cookie: "sessao=1" }) }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("@/modules/reports", () => ({ lerRelatorioVendas: mocks.ler }));

import PaginaRelatorio, { metadata } from "@/app/admin/relatorio/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const busca = (valores: Record<string, string | string[]>) => ({
  searchParams: Promise.resolve(valores),
});

const RELATORIO: RelatorioVendas = {
  periodo: {
    tipo: "intervalo",
    de: "2026-10-01",
    ate: "2026-10-31",
    inicio: new Date("2026-10-01T03:00:00Z"),
    fim: new Date("2026-11-01T03:00:00Z"),
    aviso: null,
  },
  faturamentoCentavos: 0,
  pedidosPagos: 0,
  ticketMedioCentavos: null,
  obras: [],
  artistas: [],
};

it("RF32 o relatório lê o período da URL (o primeiro valor de cada parâmetro) no servidor", async () => {
  mocks.ler.mockResolvedValueOnce({ ok: true, dados: RELATORIO });
  render(
    await PaginaRelatorio(
      busca({ periodo: ["intervalo", "30-dias"], de: "2026-10-01", ate: "2026-10-31", x: "1" }),
    ),
  );
  expect(mocks.ler).toHaveBeenCalledWith(
    { periodo: "intervalo", de: "2026-10-01", ate: "2026-10-31" },
    mocks.headers,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Relatório de vendas" })).toBeDefined();
  expect(metadata.title).toBe("Relatório de vendas · Administração · Kolô");
});

it("RF32 falha ao ler o relatório aparece como alerta", async () => {
  mocks.ler.mockResolvedValueOnce({
    ok: false,
    erro: "proibido",
    mensagem: "Acesso exclusivo de administradores ativos.",
  });
  render(await PaginaRelatorio(busca({})));
  expect(screen.getByRole("alert").textContent).toBe("Acesso exclusivo de administradores ativos.");
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
});
