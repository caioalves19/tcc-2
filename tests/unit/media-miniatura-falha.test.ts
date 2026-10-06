import { expect, it, vi } from "vitest";
import type sharpReal from "sharp";

// Simula uma falha do sharp que não tem a ver com o arquivo (memória, por exemplo): a
// leitura do cabeçalho funciona e só a geração da miniatura falha.
const falha = vi.hoisted(() => ({ ativa: false }));
vi.mock("sharp", async (importOriginal) => {
  const real = (await importOriginal<{ default: typeof sharpReal }>()).default;
  const comFalha = (...args: Parameters<typeof sharpReal>) => {
    const instancia = real(...args);
    if (falha.ativa)
      instancia.toBuffer = (() => Promise.reject(new Error("vips: memória"))) as never;
    return instancia;
  };
  return { default: Object.assign(comFalha, real) };
});

const { default: sharp } = await import("sharp");
const { gerarMiniatura } = await import("../../src/modules/media");
type Armazenamento = import("../../src/modules/media").Armazenamento;

it("RF27 mantém o original quando a falha não é de formato: só imagem inválida é apagada", async () => {
  const chave = "portfolio/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/abc.png";
  const png = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#2c3e50" },
  })
    .png()
    .toBuffer();
  const objetos = new Map<string, Buffer>([[chave, png]]);
  const armazenamento: Armazenamento = {
    obter: async (c) => objetos.get(c) ?? null,
    gravar: async (c, corpo) => void objetos.set(c, corpo),
    remover: async (c) => void objetos.delete(c),
  };

  falha.ativa = true;
  try {
    await expect(gerarMiniatura(chave, armazenamento)).rejects.toThrow("vips: memória");
  } finally {
    falha.ativa = false;
  }

  expect([...objetos.keys()]).toEqual([chave]);
});
