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
