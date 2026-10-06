import sharp from "sharp";
import { expect, it } from "vitest";
import { gerarMiniatura, type Armazenamento } from "../../src/modules/media";

const chave = "obras/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/abc.png";

function armazenamentoEmMemoria(inicial: Record<string, Buffer>) {
  const objetos = new Map(Object.entries(inicial));
  const armazenamento: Armazenamento = {
    obter: async (c) => {
      const objeto = objetos.get(c);
      if (!objeto) throw new Error("objeto inexistente");
      return objeto;
    },
    gravar: async (c, corpo) => void objetos.set(c, corpo),
    remover: async (c) => void objetos.delete(c),
  };
  return { armazenamento, objetos };
}

async function imagem(largura: number, altura: number) {
  return sharp({
    create: { width: largura, height: altura, channels: 3, background: "#c0392b" },
  })
    .png()
    .toBuffer();
}

it("RF27 gera miniatura WebP de até 400 px, mantendo a proporção, ao lado do original", async () => {
  const { armazenamento, objetos } = armazenamentoEmMemoria({ [chave]: await imagem(1200, 800) });

  const resultado = await gerarMiniatura(chave, armazenamento);

  expect(resultado).toEqual({
    ok: true,
    chaveMiniatura: "obras/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/abc_thumb.webp",
  });
  const miniatura = objetos.get("obras/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/abc_thumb.webp");
  const meta = await sharp(miniatura).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(["webp", 400, 267]);
  expect(objetos.has(chave)).toBe(true);
});

it("RF27 rejeita arquivo que não decodifica como imagem e remove o original do bucket", async () => {
  const falsa = "obras/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/falsa.jpg";
  const { armazenamento, objetos } = armazenamentoEmMemoria({
    [falsa]: Buffer.from("<html><script>alert(1)</script></html>"),
  });

  expect(await gerarMiniatura(falsa, armazenamento)).toEqual({
    ok: false,
    motivo: "imagem_invalida",
  });
  expect([...objetos.keys()]).toEqual([]);
});

it("RF27 rejeita SVG e GIF válidos enviados com extensão de imagem aceita", async () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
  );
  const gif = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "#000" },
  })
    .gif()
    .toBuffer();
  for (const corpo of [svg, gif]) {
    const { armazenamento, objetos } = armazenamentoEmMemoria({ [chave]: corpo });
    expect(await gerarMiniatura(chave, armazenamento)).toEqual({
      ok: false,
      motivo: "imagem_invalida",
    });
    expect([...objetos.keys()]).toEqual([]);
  }
});

it("RF27 não amplia imagem menor que a miniatura", async () => {
  const { armazenamento, objetos } = armazenamentoEmMemoria({ [chave]: await imagem(200, 100) });

  await gerarMiniatura(chave, armazenamento);

  const miniatura = objetos.get("obras/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/abc_thumb.webp");
  const meta = await sharp(miniatura).metadata();
  expect([meta.width, meta.height]).toEqual([200, 100]);
});
