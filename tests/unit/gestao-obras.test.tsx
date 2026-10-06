// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { GestaoObras } from "../../src/components/admin/gestao-obras";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const artistas = [{ id: "artista-1", nome: "Caio Alves" }];
const tags = [
  { id: "tag-1", nome: "Grafite" },
  { id: "tag-2", nome: "Colagem" },
];
const publicada = {
  id: "obra-1",
  titulo: "Metrópole em chamas",
  slug: "metropole-em-chamas",
  descricao: null,
  artistaId: "artista-1",
  artistaNome: "Caio Alves",
  tecnica: "Spray sobre tela",
  dimensoes: "60 x 80 cm",
  ano: 2024,
  precoCentavos: 480000,
  estoque: 1,
  situacao: "DISPONIVEL" as const,
  destaque: true,
  tags: ["tag-1"],
  imagens: [],
};

function montar(registros = [publicada]) {
  const criar = vi.fn().mockResolvedValue({ ok: true, dados: { id: "nova" } });
  const editar = vi.fn().mockResolvedValue({ ok: true, dados: undefined });
  const excluir = vi.fn().mockResolvedValue({ ok: true, dados: { modo: "apagada" } });
  render(
    <GestaoObras
      registros={registros}
      artistas={artistas}
      tags={tags}
      criar={criar}
      editar={editar}
      excluir={excluir}
    />,
  );
  return { criar, editar, excluir };
}

it("RF26/RN02 cadastra obra com preço em reais, estoque padrão 1, artista e tags", async () => {
  const usuario = userEvent.setup();
  const { criar } = montar([]);
  expect(screen.getByRole("heading", { name: "Cadastrar obra" })).toBeDefined();
  expect((screen.getByLabelText("Estoque") as HTMLInputElement).value).toBe("1");

  await usuario.type(screen.getByLabelText("Título"), "Metrópole em chamas");
  await usuario.click(screen.getByRole("button", { name: "Gerar slug pelo título" }));
  expect((screen.getByLabelText("Slug") as HTMLInputElement).value).toBe("metropole-em-chamas");
  await usuario.selectOptions(screen.getByLabelText("Artista"), "artista-1");
  await usuario.type(screen.getByLabelText("Preço (R$)"), "4.800,00");
  await usuario.click(screen.getByLabelText("Colagem"));
  await usuario.click(screen.getByRole("button", { name: "Salvar obra" }));

  await waitFor(() =>
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: "Metrópole em chamas",
        slug: "metropole-em-chamas",
        artistaId: "artista-1",
        preco: "4.800,00",
        estoque: "1",
        destaque: false,
        tags: ["tag-2"],
      }),
    ),
  );
  expect(criar.mock.calls[0]?.[0]).not.toHaveProperty("publicada");
});

it("RN11 lista situação e preço, e edita escolhendo entre rascunho e publicada", async () => {
  const usuario = userEvent.setup();
  const { editar } = montar();
  const item = within(screen.getByRole("list", { name: "Obras cadastradas" })).getByRole(
    "listitem",
  );
  expect(item.textContent).toContain("R$ 4.800,00");
  expect(item.textContent).toContain("Disponível");
  expect(item.textContent).toContain("Destaque");

  await usuario.click(screen.getByRole("button", { name: "Editar Metrópole em chamas" }));
  expect(screen.getByRole("heading", { name: "Editar obra" })).toBeDefined();
  expect((screen.getByLabelText("Preço (R$)") as HTMLInputElement).value).toBe("4.800,00");
  expect((screen.getByLabelText("Situação") as HTMLSelectElement).value).toBe("publicada");
  expect((screen.getByLabelText("Destacar na home") as HTMLInputElement).checked).toBe(true);

  await usuario.clear(screen.getByLabelText("Estoque"));
  await usuario.type(screen.getByLabelText("Estoque"), "0");
  await usuario.click(screen.getByRole("button", { name: "Salvar obra" }));
  await waitFor(() =>
    expect(editar).toHaveBeenCalledWith(
      expect.objectContaining({ id: "obra-1", publicada: true, estoque: "0", tags: ["tag-1"] }),
    ),
  );
});

it("RF26 só exclui depois da confirmação", async () => {
  const usuario = userEvent.setup();
  const { excluir } = montar();
  const confirmar = vi
    .spyOn(window, "confirm")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  const botao = screen.getByRole("button", { name: "Excluir Metrópole em chamas" });

  await usuario.click(botao);
  expect(excluir).not.toHaveBeenCalled();
  await usuario.click(botao);
  await waitFor(() => expect(excluir).toHaveBeenCalledWith("obra-1"));
  expect(confirmar).toHaveBeenCalledTimes(2);
  expect(await screen.findByRole("status")).toBeDefined();
});
