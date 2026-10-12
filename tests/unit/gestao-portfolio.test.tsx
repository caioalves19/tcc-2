// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
vi.mock("@/components/media/upload-imagem", () => ({
  UploadImagem: ({
    aoConcluir,
    artistId,
  }: {
    aoConcluir: (i: { chave: string }) => void;
    artistId: string;
  }) => (
    <button type="button" onClick={() => aoConcluir({ chave: `portfolio/${artistId}/foto.png` })}>
      Simular upload
    </button>
  ),
}));
import { GestaoPortfolio } from "@/components/portfolio/gestao-portfolio";

const acoes = () => ({
  criar: vi.fn().mockResolvedValue({ ok: true, dados: { id: "novo" } }),
  editar: vi.fn().mockResolvedValue({ ok: true }),
  mover: vi.fn().mockResolvedValue({ ok: true }),
  remover: vi.fn().mockResolvedValue({ ok: true }),
  solicitar: vi.fn(),
  processar: vi.fn(),
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("RF19: artista cadastra com upload, estilos e região, sem seletor de artista", async () => {
  const user = userEvent.setup();
  const funcs = acoes();
  render(
    <GestaoPortfolio
      papel="ARTISTA"
      artistaId="ana"
      artistas={[]}
      estilos={[{ id: "floral", nome: "Floral" }]}
      trabalhos={[]}
      {...funcs}
    />,
  );
  expect(screen.queryByLabelText("Artista")).toBeNull();
  expect(screen.getByText("Nenhum trabalho cadastrado.")).toBeDefined();
  await user.type(screen.getByLabelText("Título"), "Rosa no braço");
  await user.type(screen.getByLabelText("Região do corpo"), "Braço");
  await user.click(screen.getByLabelText("Floral"));
  await user.click(screen.getByRole("button", { name: "Salvar trabalho" }));
  expect(funcs.criar).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("Envie uma imagem");
  await user.click(screen.getByRole("button", { name: "Simular upload" }));
  await user.click(screen.getByRole("button", { name: "Salvar trabalho" }));
  await waitFor(() =>
    expect(funcs.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        artistaId: "ana",
        titulo: "Rosa no braço",
        estilos: ["floral"],
        regiaoCorpo: "Braço",
        chave: "portfolio/ana/foto.png",
      }),
    ),
  );
  expect(screen.getByRole("status").textContent).toContain("Trabalho cadastrado");
});

const trabalho = (id: string, titulo: string) => ({
  id,
  titulo,
  descricao: "Traço fino",
  regiaoCorpo: "Braço",
  estilos: ["floral"],
  destaque: false,
  ordem: 1,
  imagemUrl: "https://imagens.example.test/foto.png",
  miniaturaUrl: "https://imagens.example.test/foto_thumb.webp",
});
it("RF19: lista, edita, move e confirma remoção; erro preserva o formulário", async () => {
  const user = userEvent.setup();
  const funcs = acoes();
  render(
    <GestaoPortfolio
      papel="ARTISTA"
      artistaId="ana"
      artistas={[]}
      estilos={[{ id: "floral", nome: "Floral" }]}
      trabalhos={[trabalho("a", "Rosa"), trabalho("b", "Lírio")]}
      {...funcs}
    />,
  );
  expect(screen.getByRole("img", { name: "Rosa" })).toBeDefined();
  expect(
    (screen.getByRole("button", { name: "Mover Rosa para cima" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(
    (screen.getByRole("button", { name: "Mover Lírio para baixo" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  await user.click(screen.getByRole("button", { name: "Mover Lírio para cima" }));
  expect(funcs.mover).toHaveBeenCalledWith({ id: "b", direcao: "antes" });
  await user.click(screen.getByRole("button", { name: "Editar Rosa" }));
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Rosa");
  await user.click(screen.getByLabelText("Destacar trabalho"));
  funcs.editar.mockResolvedValueOnce({
    ok: false,
    erro: "concorrencia",
    mensagem: "Atualize e tente novamente.",
  });
  await user.click(screen.getByRole("button", { name: "Salvar trabalho" }));
  expect(funcs.editar).toHaveBeenCalledWith(expect.objectContaining({ id: "a", destaque: true }));
  expect(funcs.editar.mock.calls[0]?.[0]).not.toHaveProperty("chave");
  expect(screen.getByRole("alert").textContent).toBe("Atualize e tente novamente.");
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Rosa");
  const confirmar = vi.spyOn(window, "confirm").mockReturnValue(false);
  await user.click(screen.getByRole("button", { name: "Remover Rosa" }));
  expect(funcs.remover).not.toHaveBeenCalled();
  confirmar.mockReturnValue(true);
  await user.click(screen.getByRole("button", { name: "Remover Rosa" }));
  expect(funcs.remover).toHaveBeenCalledWith("a");
});

it("RF19: ADMIN escolhe artista antes de cadastrar e filtro usa a URL da gestão", () => {
  render(
    <GestaoPortfolio
      papel="ADMIN"
      artistaId={null}
      artistas={[
        { id: "ana", nome: "Ana" },
        { id: "bia", nome: "Bia" },
      ]}
      estilos={[]}
      trabalhos={[]}
      {...acoes()}
    />,
  );
  expect(screen.queryByLabelText("Título")).toBeNull();
  const seletor = screen.getByLabelText("Artista") as HTMLSelectElement;
  fireEvent.change(seletor, { target: { value: "bia" } });
  expect(seletor.value).toBe("bia");
  expect(seletor.name).toBe("artista");
  expect(seletor.form?.getAttribute("action")).toBe("/portfolio/gestao");
  expect(screen.getByText("Selecione um artista para gerenciar o portfólio.")).toBeDefined();
});
