// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { GestaoArtistas } from "../../src/components/admin/gestao-artistas";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
afterEach(cleanup);
// Testes com muitas interações de userEvent: sozinhos levam ~2 s, mas com a suíte inteira em
// paralelo passam dos 5 s padrão em máquinas mais lentas.
vi.setConfig({ testTimeout: 15_000 });
it("RF28 oferece nova conta e conta existente com seleção de estilos e sem transmitir senha ao vincular", async () => {
  const usuario = userEvent.setup();
  const criar = vi.fn().mockResolvedValue({ ok: true, dados: { id: "artista-1" } });
  const editar = vi.fn();
  const excluir = vi.fn();
  render(
    <GestaoArtistas
      registros={[]}
      contas={[{ id: "conta-1", name: "Maria", email: "maria@kolo.test" }]}
      estilos={[{ id: "estilo-1", nome: "Aquarela" }]}
      criar={criar}
      editar={editar}
      excluir={excluir}
    />,
  );
  await usuario.type(screen.getByLabelText("Nome"), "Ana");
  await usuario.type(screen.getByLabelText("E-mail"), "ana@kolo.test");
  await usuario.type(screen.getByLabelText("Telefone"), "11987654321");
  await usuario.type(screen.getByLabelText("Senha inicial"), "senha-inicial-123");
  await usuario.type(screen.getByLabelText("Slug"), "ana");
  await usuario.click(screen.getByLabelText("Aquarela"));
  await usuario.click(screen.getByRole("button", { name: "Salvar artista" }));
  await waitFor(() =>
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({
        modo: "novo",
        nome: "Ana",
        email: "ana@kolo.test",
        senha: "senha-inicial-123",
        estilos: ["estilo-1"],
      }),
    ),
  );
  expect((screen.getByLabelText("Senha inicial") as HTMLInputElement).value).toBe("");
  await usuario.selectOptions(screen.getByLabelText("Conta do artista"), "existente");
  expect(screen.queryByLabelText("Senha inicial")).toBeNull();
  await usuario.selectOptions(screen.getByLabelText("Usuário existente"), "conta-1");
  await usuario.type(screen.getByLabelText("Slug"), "maria");
  await usuario.click(screen.getByRole("button", { name: "Salvar artista" }));
  await waitFor(() =>
    expect(criar).toHaveBeenLastCalledWith(
      expect.objectContaining({ modo: "existente", userId: "conta-1", slug: "maria", estilos: [] }),
    ),
  );
  expect(criar.mock.calls.at(-1)?.[0]).not.toHaveProperty("senha");
});
