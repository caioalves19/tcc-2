import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  criar: vi.fn(),
  editar: vi.fn(),
  mover: vi.fn(),
  remover: vi.fn(),
  revalidar: vi.fn(),
  headers: new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("@/modules/portfolio", () => ({
  criarTrabalho: mocks.criar,
  editarTrabalho: mocks.editar,
  moverTrabalho: mocks.mover,
  removerTrabalho: mocks.remover,
}));
import {
  criarTrabalhoAcao,
  editarTrabalhoAcao,
  moverTrabalhoAcao,
  removerTrabalhoAcao,
} from "@/app/portfolio/gestao/actions";
afterEach(() => vi.clearAllMocks());
it("RF19: actions encaminham entrada e sessão ao módulo; revalidam só no sucesso", async () => {
  for (const [acao, mock, entrada] of [
    [criarTrabalhoAcao, mocks.criar, { titulo: "Rosa" }],
    [editarTrabalhoAcao, mocks.editar, { id: "a" }],
    [moverTrabalhoAcao, mocks.mover, { id: "a", direcao: "antes" }],
    [removerTrabalhoAcao, mocks.remover, "a"],
  ] as const) {
    mock.mockResolvedValueOnce({ ok: true, dados: undefined });
    await acao(entrada);
    expect(mock).toHaveBeenCalledWith(entrada, mocks.headers);
    expect(mocks.revalidar).toHaveBeenLastCalledWith("/portfolio/gestao");
    mocks.revalidar.mockClear();
    const erro = { ok: false, erro: "proibido", mensagem: "Sem acesso." };
    mock.mockResolvedValueOnce(erro);
    expect(await acao(entrada)).toEqual(erro);
    expect(mocks.revalidar).not.toHaveBeenCalled();
  }
});
