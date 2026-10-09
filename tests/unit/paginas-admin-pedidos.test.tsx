// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  ler: vi.fn(),
  mudar: vi.fn(),
  rastrear: vi.fn(),
  revalidar: vi.fn(),
  headers: new Headers({ cookie: "sessao=admin" }),
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound");
  },
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/modules/orders", () => ({
  listarPedidosAdmin: mocks.listar,
  lerPedidoAdmin: mocks.ler,
  mudarSituacaoPedido: mocks.mudar,
  registrarRastreio: mocks.rastrear,
}));

import PaginaPedidosAdmin from "@/app/admin/pedidos/page";
import PaginaPedidoAdmin from "@/app/admin/pedidos/[numero]/page";
import { mudarSituacaoAcao, registrarRastreioAcao } from "@/app/admin/pedidos/actions";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const busca = (valores: Record<string, string | string[]>) => ({
  searchParams: Promise.resolve(valores),
});

it("RF29 a lista repassa filtro, busca e página da URL e mostra o erro de acesso", async () => {
  mocks.listar.mockResolvedValueOnce({
    ok: true,
    dados: { pedidos: [], total: 0, pagina: 1, totalPaginas: 0, filtro: "todos", busca: "maria" },
  });
  render(await PaginaPedidosAdmin(busca({ filtro: "todos", busca: ["maria", "x"], pagina: "2" })));
  expect(mocks.listar).toHaveBeenCalledWith(
    { filtro: "todos", busca: "maria", pagina: "2" },
    mocks.headers,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Pedidos" })).toBeDefined();
  cleanup();

  mocks.listar.mockResolvedValueOnce({
    ok: false,
    erro: "proibido",
    mensagem: "Acesso exclusivo de administradores.",
  });
  render(await PaginaPedidosAdmin(busca({})));
  expect(screen.getByRole("alert").textContent).toBe("Acesso exclusivo de administradores.");
});

it("RF29 o detalhe dá 404 para pedido inexistente e mostra o pedido encontrado", async () => {
  const params = Promise.resolve({ numero: "20261002-DETAL1" });
  mocks.ler.mockResolvedValueOnce({
    ok: false,
    erro: "nao_encontrado",
    mensagem: "Pedido não encontrado.",
  });
  await expect(PaginaPedidoAdmin({ params })).rejects.toThrow("notFound");
  expect(mocks.ler).toHaveBeenCalledWith("20261002-DETAL1", mocks.headers);

  mocks.ler.mockResolvedValueOnce({
    ok: false,
    erro: "indisponivel",
    mensagem: "Tente novamente.",
  });
  render(await PaginaPedidoAdmin({ params }));
  expect(screen.getByRole("alert").textContent).toBe("Tente novamente.");
  cleanup();

  mocks.ler.mockResolvedValueOnce({
    ok: true,
    dados: {
      numero: "20261002-DETAL1",
      criadoEm: new Date("2026-10-02T15:00:00Z"),
      situacao: "PAGO",
      situacaoBanco: "PAGO",
      modalidade: "RETIRADA",
      cliente: { nome: "Maria", email: "maria@pbi30.test", telefone: null },
      itens: [],
      subtotalCentavos: 0,
      freteCentavos: 0,
      totalCentavos: 0,
      endereco: {
        destinatario: "Maria",
        cep: "01327000",
        logradouro: "Rua",
        numero: "1",
        complemento: "",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
      },
      rastreio: null,
      pagoEm: null,
      enviadoEm: null,
      pagamentos: [],
    },
  });
  render(await PaginaPedidoAdmin({ params }));
  expect(screen.getByRole("heading", { level: 1, name: "Pedido 20261002-DETAL1" })).toBeDefined();
});

it("RF29 as ações chamam o módulo com a sessão e atualizam as telas só quando dão certo", async () => {
  mocks.mudar.mockResolvedValueOnce({ ok: true, dados: { situacao: "ENVIADO" } });
  const entrada = { numero: "20261002-DETAL1", de: "PAGO" as const, para: "ENVIADO" as const };
  expect(await mudarSituacaoAcao(entrada)).toEqual({ ok: true, dados: { situacao: "ENVIADO" } });
  expect(mocks.mudar).toHaveBeenCalledWith(entrada, mocks.headers);
  expect(mocks.revalidar).toHaveBeenCalledWith("/admin/pedidos", "layout");

  mocks.revalidar.mockClear();
  mocks.rastrear.mockResolvedValueOnce({
    ok: false,
    erro: "invalido",
    mensagem: "Código inválido.",
  });
  expect((await registrarRastreioAcao({ numero: "20261002-DETAL1", codigo: "x" })).ok).toBe(false);
  expect(mocks.rastrear).toHaveBeenCalledWith(
    { numero: "20261002-DETAL1", codigo: "x" },
    mocks.headers,
  );
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
