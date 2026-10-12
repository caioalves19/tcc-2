// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { ResultadoProcessamento } from "@/modules/media";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
import { FormularioTrabalho } from "@/components/portfolio/formulario-trabalho";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("RF19: aguarda processamento da nova imagem antes de salvar uma edição", async () => {
  const usuario = userEvent.setup();
  let concluir!: (resultado: ResultadoProcessamento) => void;
  const processamento = new Promise<ResultadoProcessamento>((resolve) => {
    concluir = resolve;
  });
  const editar = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  render(
    <FormularioTrabalho
      artistaId="ana"
      estilos={[]}
      trabalho={{
        id: "t1",
        titulo: "Rosa",
        descricao: null,
        regiaoCorpo: null,
        estilos: [],
        destaque: false,
        ordem: 1,
        imagemUrl: "/antiga.png",
        miniaturaUrl: "/antiga.webp",
      }}
      criar={vi.fn()}
      editar={editar}
      aoCancelar={vi.fn()}
      solicitar={vi.fn().mockResolvedValue({
        ok: true,
        dados: { url: "https://r2.test/upload", chave: "portfolio/ana/nova.png", cabecalhos: {} },
      })}
      processar={() => processamento}
    />,
  );
  await usuario.upload(
    screen.getByLabelText("Imagem"),
    new File(["png"], "nova.png", { type: "image/png" }),
  );
  const salvar = screen.getByRole("button", { name: "Salvar trabalho" });
  expect((salvar as HTMLButtonElement).disabled).toBe(true);
  await usuario.click(salvar);
  expect(editar).not.toHaveBeenCalled();
  await act(async () =>
    concluir({ ok: true, dados: { chaveMiniatura: "portfolio/ana/nova_thumb.webp" } }),
  );
  await waitFor(() => expect((salvar as HTMLButtonElement).disabled).toBe(false));
  await usuario.click(salvar);
  expect(editar).toHaveBeenCalledWith(
    expect.objectContaining({ id: "t1", chave: "portfolio/ana/nova.png" }),
  );
});

it("RF19: nova tentativa com falha não salva a imagem da tentativa anterior", async () => {
  const usuario = userEvent.setup();
  const editar = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValueOnce({ ok: true }).mockRejectedValueOnce(new Error("rede")),
  );
  render(
    <FormularioTrabalho
      artistaId="ana"
      estilos={[]}
      trabalho={{
        id: "t1",
        titulo: "Rosa",
        descricao: null,
        regiaoCorpo: null,
        estilos: [],
        destaque: false,
        ordem: 1,
        imagemUrl: "/antiga.png",
        miniaturaUrl: "/antiga.webp",
      }}
      criar={vi.fn()}
      editar={editar}
      aoCancelar={vi.fn()}
      solicitar={vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          dados: { url: "https://r2.test/a", chave: "portfolio/ana/a.png", cabecalhos: {} },
        })
        .mockResolvedValueOnce({
          ok: true,
          dados: { url: "https://r2.test/b", chave: "portfolio/ana/b.png", cabecalhos: {} },
        })}
      processar={vi
        .fn()
        .mockResolvedValue({ ok: true, dados: { chaveMiniatura: "portfolio/ana/a_thumb.webp" } })}
    />,
  );
  const campo = screen.getByLabelText("Imagem");
  await usuario.upload(campo, new File(["a"], "a.png", { type: "image/png" }));
  expect(await screen.findByText("Imagem enviada com sucesso.")).toBeDefined();
  await usuario.upload(campo, new File(["b"], "b.png", { type: "image/png" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Não foi possível enviar a imagem. Tente de novo.",
  );
  const salvar = screen.getByRole("button", { name: "Salvar trabalho" });
  expect((salvar as HTMLButtonElement).disabled).toBe(true);
  await usuario.click(salvar);
  expect(editar).not.toHaveBeenCalled();
  await usuario.click(screen.getByRole("button", { name: "Manter imagem atual" }));
  expect((salvar as HTMLButtonElement).disabled).toBe(false);
  await usuario.click(salvar);
  expect(editar).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
  expect(editar.mock.calls[0]?.[0]).not.toHaveProperty("chave");
});
