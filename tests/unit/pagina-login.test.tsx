// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  entrarAcao: vi.fn(),
  acaoRecebida: undefined as ((entrada: unknown) => unknown) | undefined,
}));
vi.mock("@/app/login/actions", () => ({ entrarAcao: mocks.entrarAcao }));
vi.mock("@/components/auth/formulario-login", () => ({
  FormularioLogin: ({ acao }: { acao: (entrada: unknown) => unknown }) => {
    mocks.acaoRecebida = acao;
    return null;
  },
}));

import PaginaLogin from "@/app/login/page";

afterEach(cleanup);

it("entrega ao login o destino que veio na URL", async () => {
  const entrada = { email: "maria@kolo.test", senha: "senha-inicial-123" };

  render(await PaginaLogin({ searchParams: Promise.resolve({ destino: "/checkout" }) }));
  mocks.acaoRecebida?.(entrada);

  expect(mocks.entrarAcao).toHaveBeenCalledWith("/checkout", entrada);
});
