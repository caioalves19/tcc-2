// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  ler: vi.fn(),
  sessao: vi.fn(),
  headers: new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/lib/auth", () => ({ sessaoDaRequisicao: mocks.sessao }));
vi.mock("@/modules/orders", () => ({
  listarMeusPedidosPaginados: mocks.listar,
  lerMeuPedido: mocks.ler,
}));

import PaginaPedidos, { metadata as metadataLista } from "@/app/conta/pedidos/page";
import PaginaPedido, { metadata as metadataPedido } from "@/app/conta/pedidos/[numero]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const naPagina2 = { searchParams: Promise.resolve({ pagina: "2" }) };

it("RF16 página além do fim oferece voltar à primeira, sem dizer que não há pedidos", async () => {
  mocks.listar.mockResolvedValueOnce({ pedidos: [], total: 21, pagina: 9, totalPaginas: 2 });
  render(await PaginaPedidos(naPagina2));
  expect(screen.queryByText("Você ainda não tem pedidos.")).toBeNull();
  expect(screen.getByRole("link", { name: "Ir para a primeira página" }).getAttribute("href")).toBe(
    "/conta/pedidos",
  );
});

it("RF16/RN01 a lista exige login e mostra os pedidos da sessão", async () => {
  mocks.listar.mockResolvedValueOnce(null);
  await expect(PaginaPedidos(naPagina2)).rejects.toThrow(
    "redirect:/login?destino=%2Fconta%2Fpedidos",
  );

  mocks.listar.mockResolvedValueOnce({
    pedidos: [
      {
        numero: "20260910-PAGO22",
        criadoEm: new Date("2026-09-10T15:00:00Z"),
        situacao: "PAGO",
        modalidade: "RETIRADA",
        totalCentavos: 960000,
        unidades: 2,
      },
    ],
    total: 21,
    pagina: 2,
    totalPaginas: 2,
  });
  render(await PaginaPedidos(naPagina2));
  expect(mocks.listar).toHaveBeenLastCalledWith({ cabecalhos: mocks.headers }, { pagina: "2" });
  expect(screen.getByRole("link", { name: "1" }).getAttribute("href")).toBe("/conta/pedidos");
  expect(screen.getByRole("link", { name: "Pedido 20260910-PAGO22" })).toBeDefined();
  expect(metadataLista.title).toBe("Meus pedidos · Kolô");
});

it("RN01 pedido alheio, oculto ou inexistente dá 404; o do dono mostra o detalhe", async () => {
  const params = Promise.resolve({ numero: "20260902-CARLA2" });
  mocks.ler.mockResolvedValueOnce(null);
  mocks.sessao.mockResolvedValueOnce({ token: "sessao" });
  await expect(PaginaPedido({ params })).rejects.toThrow("notFound");
  expect(mocks.ler).toHaveBeenCalledWith("20260902-CARLA2", { cabecalhos: mocks.headers });

  mocks.ler.mockResolvedValueOnce({
    numero: "20260902-CARLA2",
    criadoEm: new Date("2026-09-02T15:00:00Z"),
    situacao: "PAGO",
    modalidade: "RETIRADA",
    itens: [{ titulo: "Metrópole em chamas", precoCentavos: 480000, quantidade: 1 }],
    subtotalCentavos: 480000,
    freteCentavos: 0,
    totalCentavos: 480000,
    endereco: {
      destinatario: "Carla",
      cep: "01327000",
      logradouro: "Rua Treze de Maio",
      numero: "450",
      complemento: "",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
    },
    rastreio: null,
    pagoEm: new Date("2026-09-02T15:05:00Z"),
    enviadoEm: null,
  });
  render(await PaginaPedido({ params }));
  expect(screen.getByRole("heading", { level: 1, name: "Pedido 20260902-CARLA2" })).toBeDefined();
  expect(metadataPedido.title).toBe("Pedido · Kolô");
});

it("RF16 visitante que abre um pedido vai para o login, sem saber se o pedido existe", async () => {
  mocks.ler.mockResolvedValueOnce(null);
  mocks.sessao.mockResolvedValueOnce(null);
  await expect(
    PaginaPedido({ params: Promise.resolve({ numero: "20260902-CARLA2" }) }),
  ).rejects.toThrow("redirect:/login?destino=%2Fconta%2Fpedidos%2F20260902-CARLA2");
  expect(mocks.sessao).toHaveBeenCalledWith(mocks.headers);
});
