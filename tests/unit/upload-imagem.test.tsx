// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { UploadImagem } from "@/components/media/upload-imagem";

afterEach(cleanup);

const artistId = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const chave = `obras/${artistId}/7c1d0f52-3b0a-4f0e-9c55-0a1b2c3d4e5f.png`;
const chaveMiniatura = `obras/${artistId}/7c1d0f52-3b0a-4f0e-9c55-0a1b2c3d4e5f_thumb.webp`;
const assinado = {
  ok: true,
  dados: {
    url: "https://r2.test/assinada",
    chave,
    cabecalhos: { "Content-Type": "image/png" },
    expiraEm: "2026-10-05T12:05:00.000Z",
  },
};

function arquivo(nome = "tatuagem.png", tipo = "image/png", tamanho = 2048) {
  return new File([new Uint8Array(tamanho)], nome, { type: tipo });
}

it("RF27 envia o arquivo direto ao R2 pela URL assinada, gera a miniatura e avisa o sucesso", async () => {
  const solicitar = vi.fn().mockResolvedValue(assinado);
  const enviar = vi.fn().mockResolvedValue({ ok: true });
  const processar = vi.fn().mockResolvedValue({ ok: true, dados: { chaveMiniatura } });
  const aoConcluir = vi.fn();
  render(
    <UploadImagem
      destino="obras"
      artistId={artistId}
      solicitar={solicitar}
      processar={processar}
      enviar={enviar}
      aoConcluir={aoConcluir}
    />,
  );

  const imagem = arquivo();
  await userEvent.setup().upload(screen.getByLabelText("Imagem"), imagem);

  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Imagem enviada com sucesso.",
  );
  expect(solicitar).toHaveBeenCalledWith({
    destino: "obras",
    artistId,
    tipo: "image/png",
    tamanho: 2048,
  });
  expect(enviar).toHaveBeenCalledWith("https://r2.test/assinada", {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: imagem,
  });
  expect(processar).toHaveBeenCalledWith(chave);
  expect(aoConcluir).toHaveBeenCalledWith({ chave, chaveMiniatura });
});

it("RF27 recusa no navegador SVG e arquivo acima de 5 MB, sem pedir assinatura", async () => {
  const solicitar = vi.fn();
  render(
    <UploadImagem
      destino="portfolio"
      artistId={artistId}
      solicitar={solicitar}
      processar={vi.fn()}
      enviar={vi.fn()}
      aoConcluir={vi.fn()}
    />,
  );
  const user = userEvent.setup({ applyAccept: false });
  const campo = screen.getByLabelText("Imagem");

  await user.upload(campo, arquivo("logo.svg", "image/svg+xml"));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Envie uma imagem JPEG, PNG ou WebP.",
  );

  await user.upload(campo, arquivo("grande.png", "image/png", 5 * 1024 * 1024 + 1));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "A imagem deve ter até 5 MB.",
  );
  expect(solicitar).not.toHaveBeenCalled();
});

it("RF27 mostra a falha de rede no envio e permite tentar de novo com o mesmo arquivo", async () => {
  const solicitar = vi.fn().mockResolvedValue(assinado);
  const enviar = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true });
  const processar = vi.fn().mockResolvedValue({ ok: true, dados: { chaveMiniatura } });
  const aoConcluir = vi.fn();
  render(
    <UploadImagem
      destino="obras"
      artistId={artistId}
      solicitar={solicitar}
      processar={processar}
      enviar={enviar}
      aoConcluir={aoConcluir}
    />,
  );
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Imagem"), arquivo());

  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Não foi possível enviar a imagem. Tente de novo.",
  );
  expect(processar).not.toHaveBeenCalled();
  expect(aoConcluir).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Não foi possível enviar a imagem. Tente de novo.",
  );

  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Imagem enviada com sucesso.",
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(solicitar).toHaveBeenCalledTimes(3);
  expect(aoConcluir).toHaveBeenCalledTimes(1);
});

it("RF27 mostra o motivo devolvido pelo servidor quando nega a assinatura ou falha a miniatura", async () => {
  const solicitar = vi
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      erro: "proibido",
      mensagem: "Você não tem permissão para enviar imagens para este perfil.",
    })
    .mockResolvedValueOnce(assinado)
    .mockRejectedValueOnce(new Error("falha de rede na action"));
  const processar = vi.fn().mockResolvedValue({
    ok: false,
    erro: "imagem_invalida",
    mensagem: "O arquivo enviado não é uma imagem JPEG, PNG ou WebP válida.",
  });
  render(
    <UploadImagem
      destino="obras"
      artistId={artistId}
      solicitar={solicitar}
      processar={processar}
      enviar={vi.fn().mockResolvedValue({ ok: true })}
      aoConcluir={vi.fn()}
    />,
  );
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Imagem"), arquivo());
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Você não tem permissão para enviar imagens para este perfil.",
  );

  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "O arquivo enviado não é uma imagem JPEG, PNG ou WebP válida.",
  );

  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Não foi possível enviar a imagem. Tente de novo.",
  );
});

// RF26 prevê várias imagens por obra: cada campo precisa do próprio rótulo (RNF21).
it("RNF21 duas instâncias na mesma tela têm cada uma o seu campo rotulado", () => {
  const props = {
    destino: "portfolio" as const,
    artistId,
    solicitar: vi.fn(),
    processar: vi.fn(),
    aoConcluir: vi.fn(),
  };
  render(
    <>
      <UploadImagem {...props} />
      <UploadImagem {...props} />
    </>,
  );

  const campos = screen.getAllByLabelText("Imagem");
  expect(campos).toHaveLength(2);
  expect(new Set(campos).size).toBe(2);
  expect(new Set(campos.map((campo) => campo.id)).size).toBe(2);
});

// O navegador só dispara "change" se o valor mudar: sem limpar o campo, escolher de novo o
// mesmo arquivo (para trocar a imagem enviada, por exemplo) não faria nada.
it("RF27 limpa o campo depois de cada tentativa para aceitar de novo o mesmo arquivo", async () => {
  render(
    <UploadImagem
      destino="portfolio"
      artistId={artistId}
      solicitar={vi.fn().mockResolvedValue(assinado)}
      processar={vi.fn().mockResolvedValue({ ok: true, dados: { chaveMiniatura } })}
      enviar={vi.fn().mockResolvedValue({ ok: true })}
      aoConcluir={vi.fn()}
    />,
  );
  const campo = screen.getByLabelText<HTMLInputElement>("Imagem");

  await userEvent.setup().upload(campo, arquivo());

  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Imagem enviada com sucesso.",
  );
  expect(campo.value).toBe("");
});
