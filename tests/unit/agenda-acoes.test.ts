import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
  mudar: vi.fn(),
  revalidar: vi.fn(),
  headers: new Headers({ cookie: "sessao=1" }),
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("@/modules/scheduling", () => ({
  cadastrarHorario: mocks.cadastrar,
  editarHorario: mocks.editar,
  mudarSituacaoHorario: mocks.mudar,
}));

import {
  cadastrarHorarioAcao,
  editarHorarioAcao,
  mudarSituacaoHorarioAcao,
} from "@/app/agenda/actions";

afterEach(() => vi.clearAllMocks());

it("RF22 as actions repassam a entrada como veio, com a sessão, e atualizam a agenda no sucesso", async () => {
  mocks.cadastrar.mockResolvedValue({ ok: true, dados: { id: "h1", codigo: "AG-1" } });
  mocks.editar.mockResolvedValue({ ok: true, dados: undefined });
  mocks.mudar.mockResolvedValue({ ok: true, dados: undefined });

  expect(await cadastrarHorarioAcao({ nomeContato: "Lucas" })).toMatchObject({ ok: true });
  expect(mocks.cadastrar).toHaveBeenCalledWith({ nomeContato: "Lucas" }, mocks.headers);
  await editarHorarioAcao({ id: "h1" });
  expect(mocks.editar).toHaveBeenCalledWith({ id: "h1" }, mocks.headers);
  await mudarSituacaoHorarioAcao({ id: "h1", situacao: "CANCELADO" });
  expect(mocks.mudar).toHaveBeenCalledWith({ id: "h1", situacao: "CANCELADO" }, mocks.headers);
  expect(mocks.revalidar).toHaveBeenCalledTimes(3);
  expect(mocks.revalidar).toHaveBeenCalledWith("/agenda");
});

it("RF22 recusa volta para a tela sem atualizar a agenda", async () => {
  const recusa = { ok: false, erro: "sobreposto", mensagem: "Este artista já tem um horário." };
  mocks.cadastrar.mockResolvedValue(recusa);
  expect(await cadastrarHorarioAcao({})).toEqual(recusa);
  expect(mocks.revalidar).not.toHaveBeenCalled();
});
