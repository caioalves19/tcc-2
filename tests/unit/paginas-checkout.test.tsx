// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resumo: vi.fn(),
  pedido: vi.fn(),
  headers: new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/headers", () => ({
  headers: async () => mocks.headers,
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/modules/orders", () => ({
  resumoCheckout: mocks.resumo,
  lerPedido: mocks.pedido,
  juntarCarrinhos: vi.fn(),
}));
vi.mock("@/app/checkout/actions", () => ({ finalizarCompraAcao: vi.fn() }));
vi.mock("@/app/checkout/[numero]/actions", () => ({ pagarPedidoAcao: vi.fn() }));

import PaginaCheckout from "@/app/checkout/page";
import PaginaPedido from "@/app/checkout/[numero]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ENDERECO = {
  destinatario: "Lucas Silveira",
  cep: "01327-000",
  logradouro: "Rua Treze de Maio",
  numero: "450",
  complemento: null,
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

it("RN01 visitante vai para o login e carrinho vazio volta ao carrinho", async () => {
  mocks.resumo.mockResolvedValueOnce({ ok: false, erro: "nao_autenticado", mensagem: "Entre." });
  await expect(PaginaCheckout()).rejects.toThrow("redirect:/login");
  expect(mocks.resumo).toHaveBeenCalledWith(
    expect.objectContaining({ cabecalhos: mocks.headers, tokenVisitante: null }),
  );
  mocks.resumo.mockResolvedValueOnce({ ok: false, erro: "carrinho_vazio", mensagem: "Vazio." });
  await expect(PaginaCheckout()).rejects.toThrow("redirect:/carrinho");
});

it("RF05 sem endereço pede o cadastro na conta; obra indisponível manda ao carrinho", async () => {
  mocks.resumo.mockResolvedValueOnce({
    ok: false,
    erro: "sem_endereco",
    mensagem: "Cadastre um endereço válido na sua conta antes de finalizar.",
  });
  render(await PaginaCheckout());
  expect(screen.getByRole("alert").textContent).toContain("Cadastre um endereço válido");
  expect(screen.getByRole("link", { name: "Cadastrar endereço" }).getAttribute("href")).toBe(
    "/conta",
  );
  cleanup();

  mocks.resumo.mockResolvedValueOnce({
    ok: false,
    erro: "indisponivel",
    obras: ["obra-1"],
    mensagem: "Algumas obras do carrinho não estão mais disponíveis nessa quantidade.",
  });
  render(await PaginaCheckout());
  expect(screen.getByRole("link", { name: "Voltar ao carrinho" }).getAttribute("href")).toBe(
    "/carrinho",
  );
});

it("RF12 com resumo válido mostra a tela de checkout", async () => {
  mocks.resumo.mockResolvedValueOnce({
    ok: true,
    dados: {
      itens: [
        {
          obraId: "obra-1",
          titulo: "Metrópole em chamas",
          artistaNome: "Caio Alves",
          quantidade: 1,
          precoCentavos: 285000,
          chaveMiniatura: null,
          textoAlternativo: "Tela",
        },
      ],
      endereco: ENDERECO,
      modalidade: "RETIRADA",
      subtotalCentavos: 285000,
      freteCentavos: 0,
      totalCentavos: 285000,
    },
  });
  render(await PaginaCheckout());
  expect(screen.getByRole("heading", { level: 1, name: "Finalizar compra" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Finalizar compra" })).toBeDefined();
});

it("RN01 pedido de outro cliente ou inexistente responde como página não encontrada", async () => {
  mocks.pedido.mockResolvedValueOnce(null);
  await expect(
    PaginaPedido({
      params: Promise.resolve({ numero: "20261008-ABC234" }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow("notFound");
  expect(mocks.pedido).toHaveBeenCalledWith(
    "20261008-ABC234",
    expect.objectContaining({ cabecalhos: mocks.headers }),
  );
});

it("RF12 o dono vê o pedido criado", async () => {
  mocks.pedido.mockResolvedValueOnce({
    numero: "20261008-ABC234",
    situacao: "PENDENTE",
    modalidade: "RETIRADA",
    criadoEm: new Date(),
    reservaExpiraEm: new Date(Date.now() + 5 * 60 * 1000),
    itens: [
      { obraId: "obra-1", titulo: "Metrópole em chamas", precoCentavos: 285000, quantidade: 1 },
    ],
    endereco: ENDERECO,
    subtotalCentavos: 285000,
    freteCentavos: 0,
    totalCentavos: 285000,
  });
  render(
    await PaginaPedido({
      params: Promise.resolve({ numero: "20261008-ABC234" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("20261008-ABC234");
});

it("RN05 a volta do Mercado Pago só troca o aviso; o pedido segue lido do banco", async () => {
  mocks.pedido.mockResolvedValueOnce({
    numero: "20261008-ABC234",
    situacao: "PENDENTE",
    modalidade: "RETIRADA",
    criadoEm: new Date(),
    reservaExpiraEm: new Date(Date.now() + 5 * 60 * 1000),
    itens: [
      { obraId: "obra-1", titulo: "Metrópole em chamas", precoCentavos: 285000, quantidade: 1 },
    ],
    endereco: ENDERECO,
    subtotalCentavos: 285000,
    freteCentavos: 0,
    totalCentavos: 285000,
  });
  render(
    await PaginaPedido({
      params: Promise.resolve({ numero: "20261008-ABC234" }),
      // O Mercado Pago acrescenta seus próprios parâmetros; nenhum deles decide nada aqui.
      searchParams: Promise.resolve({
        retorno: "mercadopago",
        collection_status: "approved",
        status: "approved",
      }),
    }),
  );
  expect(screen.getByRole("status").textContent).toContain("Estamos confirmando seu pagamento");
  expect(screen.getByText("Aguardando pagamento")).toBeDefined();
});
