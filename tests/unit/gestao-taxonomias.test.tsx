// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { GestaoTaxonomias } from "../../src/components/admin/gestao-taxonomias";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
afterEach(cleanup);
it("pagina a lista no caminho do tipo e, além do fim, oferece voltar à primeira", () => {
  render(
    <GestaoTaxonomias
      tipo="estilos"
      registros={[]}
      total={21}
      pagina={9}
      totalPaginas={2}
      salvar={vi.fn()}
      excluir={vi.fn()}
    />,
  );
  expect(screen.queryByText("Nenhum estilo cadastrado.")).toBeNull();
  expect(screen.getByRole("link", { name: "Ir para a primeira página" }).getAttribute("href")).toBe(
    "/admin/estilos",
  );
  expect(screen.getByRole("link", { name: "2" }).getAttribute("href")).toBe(
    "/admin/estilos?pagina=2",
  );
});
it("RF28 administra tags com formulário rotulado, feedback e confirmação de exclusão", async () => {
  const usuario = userEvent.setup();
  const salvar = vi.fn().mockResolvedValue({ ok: true, dados: undefined });
  const excluir = vi.fn().mockResolvedValue({
    ok: false,
    erro: "vinculado",
    mensagem: "Esta tag está associada a obras.",
  });
  render(
    <GestaoTaxonomias
      tipo="tags"
      registros={[{ id: "tag-1", nome: "Urbana", slug: "urbana", descricao: null }]}
      total={1}
      pagina={1}
      totalPaginas={1}
      salvar={salvar}
      excluir={excluir}
    />,
  );
  await usuario.type(screen.getByLabelText("Nome"), "Pintura");
  await usuario.type(screen.getByLabelText("Slug"), "pintura");
  await usuario.click(screen.getByRole("button", { name: "Salvar tag" }));
  await waitFor(() =>
    expect(salvar).toHaveBeenCalledWith(
      { nome: "Pintura", slug: "pintura", descricao: "" },
      undefined,
    ),
  );
  expect(screen.getByRole("status").textContent).toContain("Salvo");
  await usuario.click(screen.getByRole("button", { name: "Editar Urbana" }));
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Urbana");
  const confirmacao = vi.spyOn(window, "confirm").mockReturnValue(false);
  await usuario.click(screen.getByRole("button", { name: "Excluir Urbana" }));
  expect(excluir).not.toHaveBeenCalled();
  confirmacao.mockReturnValue(true);
  await usuario.click(screen.getByRole("button", { name: "Excluir Urbana" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("associada a obras"));
  confirmacao.mockRestore();
});
