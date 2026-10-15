// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  ler: vi.fn(),
  headers: new Headers({ cookie: "sessao=admin" }),
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/modules/customers", () => ({
  listarClientesAdmin: mocks.listar,
  lerClienteAdmin: mocks.ler,
}));

import PaginaClientesAdmin from "@/app/admin/clientes/page";
import PaginaClienteAdmin from "@/app/admin/clientes/[id]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const busca = (valores: Record<string, string | string[]>) => ({
  searchParams: Promise.resolve(valores),
});

it("RF30 a lista repassa busca e página da URL e mostra o erro de acesso", async () => {
  mocks.listar.mockResolvedValueOnce({
    ok: true,
    dados: { clientes: [], total: 0, pagina: 2, totalPaginas: 0, busca: "maria" },
  });
  render(await PaginaClientesAdmin(busca({ busca: ["maria", "x"], pagina: "2" })));
  expect(mocks.listar).toHaveBeenCalledWith({ busca: "maria", pagina: "2" }, mocks.headers);
  expect(screen.getByRole("heading", { level: 1, name: "Clientes" })).toBeDefined();
  cleanup();

  mocks.listar.mockResolvedValueOnce({
    ok: false,
    erro: "proibido",
    mensagem: "Acesso exclusivo de administradores.",
  });
  render(await PaginaClientesAdmin(busca({})));
  expect(screen.getByRole("alert").textContent).toBe("Acesso exclusivo de administradores.");
});

it("RF30 o perfil dá 404 para cliente não encontrado e mostra o perfil encontrado", async () => {
  const id = "0b6f1d3a-1c1e-4c33-9a43-1f1c8f6f0a01";
  const params = Promise.resolve({ id });
  mocks.ler.mockResolvedValueOnce({
    ok: false,
    erro: "nao_encontrado",
    mensagem: "Cliente não encontrado.",
  });
  await expect(PaginaClienteAdmin({ params })).rejects.toThrow("notFound");
  expect(mocks.ler).toHaveBeenCalledWith(id, mocks.headers);

  mocks.ler.mockResolvedValueOnce({
    ok: false,
    erro: "indisponivel",
    mensagem: "Tente novamente.",
  });
  render(await PaginaClienteAdmin({ params }));
  expect(screen.getByRole("alert").textContent).toBe("Tente novamente.");
  cleanup();

  mocks.ler.mockResolvedValueOnce({
    ok: true,
    dados: {
      id,
      nome: "Lucas Silveira",
      email: "lucas@pbi38.test",
      telefone: null,
      situacao: "ATIVO",
      cadastradoEm: new Date("2026-09-20T15:00:00Z"),
      excluido: false,
      endereco: null,
      pedidos: [],
      totalGastoCentavos: 0,
    },
  });
  render(await PaginaClienteAdmin({ params }));
  expect(screen.getByRole("heading", { level: 1, name: "Lucas Silveira" })).toBeDefined();
});
