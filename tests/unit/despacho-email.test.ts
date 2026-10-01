import { beforeEach, describe, expect, it, vi } from "vitest";

const { after } = vi.hoisted(() => ({ after: vi.fn() }));
vi.mock("next/server", () => ({ after }));

import { despacharForaDaResposta } from "@/lib/email";

beforeEach(() => {
  after.mockReset();
});

describe("despacho do e-mail fora da resposta", () => {
  it("dentro de uma requisição só agenda: a resposta não espera o envio", async () => {
    const tarefa = vi.fn(async () => undefined);

    await despacharForaDaResposta(tarefa);

    expect(after).toHaveBeenCalledWith(tarefa);
    expect(tarefa).not.toHaveBeenCalled();
  });

  it("fora de uma requisição (testes, scripts) roda na hora", async () => {
    after.mockImplementation(() => {
      throw new Error("`after` was called outside a request scope. Read more: https://nextjs.org");
    });
    const tarefa = vi.fn(async () => undefined);

    await despacharForaDaResposta(tarefa);

    expect(tarefa).toHaveBeenCalledOnce();
  });

  it("outro erro do after sobe e a tarefa não roda", async () => {
    after.mockImplementation(() => {
      throw new Error("waitUntil indisponível");
    });
    const tarefa = vi.fn(async () => undefined);

    await expect(despacharForaDaResposta(tarefa)).rejects.toThrow("waitUntil indisponível");
    expect(tarefa).not.toHaveBeenCalled();
  });
});
