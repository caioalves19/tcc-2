// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

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
const paginaUnica = { total: 2, pagina: 1, totalPaginas: 1 };
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
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
      {...paginaUnica}
      total={0}
      {...funcs}
    />,
  );
  expect(screen.queryByLabelText("Artista")).toBeNull();
  expect(screen.getByText("Nenhum trabalho cadastrado.")).toBeDefined();
  expect(screen.queryByLabelText("Título")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Novo trabalho" }));
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
  expect((await screen.findByRole("status")).textContent).toContain("Trabalho cadastrado");
  expect(screen.queryByLabelText("Título")).toBeNull();
});

it("o cadastro abre pelo botão e fecha ao cancelar", async () => {
  const user = userEvent.setup();
  render(
    <GestaoPortfolio
      papel="ARTISTA"
      artistaId="ana"
      artistas={[]}
      estilos={[]}
      trabalhos={[]}
      {...paginaUnica}
      total={0}
      {...acoes()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Novo trabalho" }));
  expect(document.activeElement).toBe(screen.getByLabelText("Título"));
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByLabelText("Título")).toBeNull();
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
      {...paginaUnica}
      {...funcs}
    />,
  );
  expect(screen.getByRole("img", { name: "Rosa" })).toBeDefined();
  expect((screen.getByRole("button", { name: "Subir Rosa" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect((screen.getByRole("button", { name: "Descer Lírio" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  await user.click(screen.getByRole("button", { name: "Subir Lírio" }));
  expect(funcs.mover).toHaveBeenCalledWith({ id: "b", direcao: "antes" });
  await user.click(screen.getByRole("button", { name: "Editar Rosa" }));
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Rosa");
  expect(document.activeElement).toBe(screen.getByLabelText("Título"));
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
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

const desabilitado = (nome: string) =>
  (screen.getByRole("button", { name: nome }) as HTMLButtonElement).disabled;

it("nas bordas da página os botões de mover só travam no primeiro e no último geral", () => {
  const props = { papel: "ADMIN" as const, artistaId: "ana", estilos: [], ...acoes() };
  const artistas = [{ id: "ana", nome: "Ana" }];
  const { rerender } = render(
    <GestaoPortfolio
      {...props}
      artistas={artistas}
      trabalhos={[trabalho("a", "Rosa"), trabalho("b", "Lírio")]}
      total={3}
      pagina={1}
      totalPaginas={2}
    />,
  );
  expect(desabilitado("Subir Rosa")).toBe(true);
  expect(desabilitado("Descer Lírio")).toBe(false);
  expect(screen.getByRole("link", { name: "2" }).getAttribute("href")).toBe(
    "/portfolio/gestao?artista=ana&pagina=2",
  );

  rerender(
    <GestaoPortfolio
      {...props}
      artistas={artistas}
      trabalhos={[trabalho("c", "Ipê")]}
      total={3}
      pagina={2}
      totalPaginas={2}
    />,
  );
  expect(desabilitado("Subir Ipê")).toBe(false);
  expect(desabilitado("Descer Ipê")).toBe(true);
});

it("página além do fim oferece voltar à primeira", () => {
  render(
    <GestaoPortfolio
      papel="ARTISTA"
      artistaId="ana"
      artistas={[]}
      estilos={[]}
      trabalhos={[]}
      total={3}
      pagina={9}
      totalPaginas={1}
      {...acoes()}
    />,
  );
  expect(screen.queryByText("Nenhum trabalho cadastrado.")).toBeNull();
  expect(screen.getByRole("link", { name: "Ir para a primeira página" })).toBeDefined();
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
      {...paginaUnica}
      total={0}
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
