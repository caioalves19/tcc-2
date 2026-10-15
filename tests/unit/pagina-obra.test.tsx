// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ obra: vi.fn(), outras: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound");
  },
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/modules/catalog", () => ({
  lerObraPublica: mocks.obra,
  outrasObrasDoArtista: mocks.outras,
}));
vi.mock("@/app/carrinho/actions", () => ({ adicionarAoCarrinhoAcao: vi.fn() }));
vi.mock("@/modules/settings", async (original) => {
  const modulo = await original<typeof import("@/modules/settings")>();
  return {
    ...modulo,
    lerConfiguracao: async () => ({
      ...modulo.PADRAO,
      contato: { ...modulo.PADRAO.contato, whatsapp: "5511912345678" },
    }),
  };
});

import PaginaObra, { generateMetadata } from "@/app/obras/[slug]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const OBRA = {
  id: "obra-1",
  slug: "metropole-em-chamas",
  titulo: "Metrópole em chamas",
  descricao: "Camadas de acrílica e spray sobre a Avenida Paulista.",
  tecnica: null,
  dimensoes: null,
  ano: null,
  precoCentavos: 285000,
  disponivel: true,
  artista: { id: "ana", nome: "Ana", slug: "ana" },
  imagens: [],
};

it("RN01 rascunho, arquivada ou inexistente responde como página não encontrada", async () => {
  mocks.obra.mockResolvedValue(null);
  await expect(PaginaObra(params("esboco"))).rejects.toThrow("notFound");
  expect(mocks.obra).toHaveBeenCalledWith("esboco");
  expect(mocks.outras).not.toHaveBeenCalled();
  expect(await generateMetadata(params("esboco"))).toEqual({
    title: "Obra não encontrada · Kolô",
  });
});

it("RF10 a obra publicada abre para qualquer visitante, com as outras obras do artista", async () => {
  mocks.obra.mockResolvedValue(OBRA);
  mocks.outras.mockResolvedValue([]);
  render(await PaginaObra(params("metropole-em-chamas")));
  expect(screen.getByRole("heading", { level: 1, name: "Metrópole em chamas" })).toBeDefined();
  // RF31: o WhatsApp da obra é o das configurações do site (PBI-39).
  expect(
    screen
      .getByRole("link", { name: "Tirar dúvidas com o ateliê pelo WhatsApp" })
      .getAttribute("href"),
  ).toMatch(/^https:\/\/wa\.me\/5511912345678\?text=/);
  expect(mocks.outras).toHaveBeenCalledWith(OBRA);
});

it("RF10 título e descrição da página vêm da obra", async () => {
  mocks.obra.mockResolvedValue(OBRA);
  expect(await generateMetadata(params("metropole-em-chamas"))).toEqual({
    title: "Metrópole em chamas · Kolô",
    description: "Camadas de acrílica e spray sobre a Avenida Paulista.",
  });
  mocks.obra.mockResolvedValue({ ...OBRA, descricao: null });
  expect(await generateMetadata(params("metropole-em-chamas"))).toEqual({
    title: "Metrópole em chamas · Kolô",
    description: "Metrópole em chamas, obra de Ana no Kolô Ateliê.",
  });
  // A descrição da obra aceita até 4.000 caracteres; a da página fica em 160.
  mocks.obra.mockResolvedValue({ ...OBRA, descricao: "palavra ".repeat(60) });
  const { description } = await generateMetadata(params("metropole-em-chamas"));
  expect(description).toHaveLength(160);
  expect(description?.endsWith("…")).toBe(true);
});
