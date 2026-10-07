// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { GestaoImagensObra } from "../../src/components/admin/gestao-imagens-obra";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ARTISTA = "6f1c2b9e-1d2a-4c3b-8e4f-5a6b7c8d9e0f";
const imagem = (n: number, principal: boolean) => ({
  id: `imagem-${n}`,
  chave: `obras/${ARTISTA}/foto-${n}.png`,
  chaveMiniatura: `obras/${ARTISTA}/foto-${n}_thumb.webp`,
  ordem: n,
  principal,
  textoAlternativo: `Foto ${n}`,
});

function montar(imagens = [imagem(1, true), imagem(2, false)]) {
  const acoes = {
    solicitar: vi.fn().mockResolvedValue({
      ok: true,
      dados: {
        url: "https://r2.test/assinada",
        cabecalhos: {},
        chave: `obras/${ARTISTA}/nova.png`,
      },
    }),
    adicionar: vi
      .fn()
      .mockResolvedValue({ ok: true, dados: { id: "imagem-3", chaveMiniatura: "mini.webp" } }),
    definirPrincipal: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
    mover: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
    editarTexto: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
    remover: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
    enviar: vi.fn().mockResolvedValue({ ok: true }),
  };
  render(
    <GestaoImagensObra
      obra={{ id: "obra-1", artistaId: ARTISTA, imagens }}
      baseImagens="https://imagens.kolo.test"
      {...acoes}
    />,
  );
  return acoes;
}

it("RNF21/RF27 só libera o envio com texto alternativo e grava a imagem pelo servidor", async () => {
  const usuario = userEvent.setup();
  const acoes = montar([]);
  expect(
    screen.getByText("Nenhuma imagem ainda. A primeira enviada vira a principal."),
  ).toBeDefined();
  expect(screen.queryByLabelText("Imagem")).toBeNull();

  await usuario.type(
    screen.getByLabelText("Texto alternativo da nova imagem"),
    "Tela vista de frente",
  );
  const arquivo = new File(["png"], "tela.png", { type: "image/png" });
  await usuario.upload(screen.getByLabelText("Imagem"), arquivo);

  await waitFor(() =>
    expect(acoes.adicionar).toHaveBeenCalledWith({
      obraId: "obra-1",
      chave: `obras/${ARTISTA}/nova.png`,
      textoAlternativo: "Tela vista de frente",
    }),
  );
  expect(acoes.solicitar).toHaveBeenCalledWith(
    expect.objectContaining({ destino: "obras", artistId: ARTISTA }),
  );
});

it("RF26 mostra as imagens em ordem e aciona principal, ordem, texto e remoção", async () => {
  const usuario = userEvent.setup();
  const acoes = montar();
  const [primeira, segunda] = within(
    screen.getByRole("list", { name: "Imagens da obra" }),
  ).getAllByRole("listitem");
  if (!primeira || !segunda) throw new Error("Imagens não renderizadas");

  const miniatura = within(primeira).getByRole("img", { name: "Foto 1" });
  expect(miniatura.getAttribute("src")).toBe(
    `https://imagens.kolo.test/obras/${ARTISTA}/foto-1_thumb.webp`,
  );
  expect(primeira.textContent).toContain("Principal");
  expect(within(primeira).getByRole("button", { name: "Subir Foto 1" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(within(segunda).getByRole("button", { name: "Descer Foto 2" })).toHaveProperty(
    "disabled",
    true,
  );

  await usuario.click(within(primeira).getByRole("button", { name: "Descer Foto 1" }));
  await waitFor(() => expect(acoes.mover).toHaveBeenCalledWith("imagem-1", "depois"));
  await usuario.click(within(segunda).getByRole("button", { name: "Tornar principal Foto 2" }));
  await waitFor(() => expect(acoes.definirPrincipal).toHaveBeenCalledWith("imagem-2"));

  const texto = within(segunda).getByLabelText("Texto alternativo");
  await usuario.clear(texto);
  await usuario.type(texto, "Detalhe da assinatura");
  await usuario.click(within(segunda).getByRole("button", { name: "Salvar texto Foto 2" }));
  await waitFor(() =>
    expect(acoes.editarTexto).toHaveBeenCalledWith("imagem-2", "Detalhe da assinatura"),
  );

  vi.spyOn(window, "confirm").mockReturnValueOnce(true);
  await usuario.click(within(primeira).getByRole("button", { name: "Remover Foto 1" }));
  await waitFor(() => expect(acoes.remover).toHaveBeenCalledWith("imagem-1"));
});
