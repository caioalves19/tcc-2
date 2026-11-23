import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ usuario: vi.fn(), buscar: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ usuarioIdDaRequisicao: mocks.usuario }));
vi.mock("@/lib/endereco", () => ({}));
vi.mock("@/modules/customers", () => ({}));
vi.mock("@/modules/endereco", () => ({ buscarEnderecoPorCep: mocks.buscar }));

import { buscarCepAcao } from "@/app/conta/actions";

afterEach(() => vi.clearAllMocks());

const SE = { logradouro: "Praça da Sé", bairro: "Sé", cidade: "São Paulo", uf: "SP" };

it("RF05 com sessão, devolve o endereço do CEP", async () => {
  mocks.usuario.mockResolvedValue("usuario-1");
  mocks.buscar.mockResolvedValue(SE);
  expect(await buscarCepAcao("01001-000")).toEqual(SE);
  expect(mocks.buscar).toHaveBeenCalledWith("01001-000");
});

it("sem sessão não consulta o ViaCEP: o site não serve de intermediário para terceiros", async () => {
  mocks.usuario.mockResolvedValue(null);
  expect(await buscarCepAcao("01001-000")).toBeNull();
  expect(mocks.buscar).not.toHaveBeenCalled();
});

it("entrada que não é texto devolve null sem consultar", async () => {
  mocks.usuario.mockResolvedValue("usuario-1");
  expect(await buscarCepAcao({ cep: "01001-000" })).toBeNull();
  expect(mocks.buscar).not.toHaveBeenCalled();
});
