// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  ler: vi.fn(),
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
vi.mock("@/modules/orders", () => ({
  listarMeusPedidos: mocks.listar,
  lerMeuPedido: mocks.ler,
}));

import PaginaPedidos, { metadata as metadataLista } from "@/app/conta/pedidos/page";
import PaginaPedido, { metadata as metadataPedido } from "@/app/conta/pedidos/[numero]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("RF16/RN01 a lista exige login e mostra os pedidos da sessão", async () => {
  mocks.listar.mockResolvedValueOnce(null);
  await expect(PaginaPedidos()).rejects.toThrow("redirect:/login");

  mocks.listar.mockResolvedValueOnce([
    {
      numero: "20260910-PAGO22",
      criadoEm: new Date("2026-09-10T15:00:00Z"),
      situacao: "PAGO",
      totalCentavos: 960000,
      unidades: 2,
    },
  ]);
  render(await PaginaPedidos());
  expect(mocks.listar).toHaveBeenLastCalledWith({ cabecalhos: mocks.headers });
  expect(screen.getByRole("link", { name: "Pedido 20260910-PAGO22" })).toBeDefined();
  expect(metadataLista.title).toBe("Meus pedidos · Kolô");
});

it("RN01 pedido alheio, oculto ou inexistente dá 404; o do dono mostra o detalhe", async () => {
  const params = Promise.resolve({ numero: "20260902-CARLA2" });
  mocks.ler.mockResolvedValueOnce(null);
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
