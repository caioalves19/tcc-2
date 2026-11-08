// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GestaoArtistas } from "../../src/components/admin/gestao-artistas";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
// Testes com muitas interações de userEvent: sozinhos levam ~2 s, mas com a suíte inteira em
// paralelo passam dos 5 s padrão em máquinas mais lentas.
vi.setConfig({ testTimeout: 15_000 });
const semAcao = { contas: [], estilos: [], criar: vi.fn(), editar: vi.fn(), excluir: vi.fn() };
it("pagina a lista e, além do fim, oferece voltar à primeira", () => {
  render(<GestaoArtistas {...semAcao} registros={[]} total={21} pagina={9} totalPaginas={2} />);
  expect(screen.queryByText("Nenhum artista cadastrado.")).toBeNull();
  expect(screen.getByRole("link", { name: "Ir para a primeira página" }).getAttribute("href")).toBe(
    "/admin/artistas",
  );
  expect(screen.getByRole("link", { name: "2" }).getAttribute("href")).toBe(
    "/admin/artistas?pagina=2",
  );
});
it("o cadastro fecha ao cancelar e Editar abre preenchido, com foco no primeiro campo", async () => {
  const usuario = userEvent.setup();
  render(
    <GestaoArtistas
      {...semAcao}
      registros={[
        {
          id: "a1",
          userId: "u1",
          nome: "Ana",
          email: "ana@kolo.test",
          telefone: "11987654321",
          slug: "ana",
          bio: null,
          avatarUrl: null,
          instagram: null,
          estilos: [],
        },
      ]}
      total={1}
      pagina={1}
      totalPaginas={1}
    />,
  );
  await usuario.click(screen.getByRole("button", { name: "Novo artista" }));
  await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByLabelText("Nome")).toBeNull();

  await usuario.click(screen.getByRole("button", { name: "Editar Ana" }));
  const nome = screen.getByLabelText("Nome") as HTMLInputElement;
  expect(nome.value).toBe("Ana");
  expect(document.activeElement).toBe(nome);
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});
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
      total={0}
      pagina={1}
      totalPaginas={0}
    />,
  );
  expect(screen.queryByLabelText("Nome")).toBeNull();
  await usuario.click(screen.getByRole("button", { name: "Novo artista" }));
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
  expect(await screen.findByRole("status")).toBeDefined();
  expect(screen.queryByLabelText("Senha inicial")).toBeNull();
  await usuario.click(screen.getByRole("button", { name: "Novo artista" }));
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
