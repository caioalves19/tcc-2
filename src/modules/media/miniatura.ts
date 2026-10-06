import sharp from "sharp";

export type Armazenamento = {
  obter(chave: string): Promise<Buffer>;
  gravar(chave: string, corpo: Buffer, tipo: string): Promise<void>;
  remover(chave: string): Promise<void>;
};

export type ResultadoMiniatura =
  { ok: true; chaveMiniatura: string } | { ok: false; motivo: "imagem_invalida" };

const LARGURA_MINIATURA = 400;
const LIMITE_PIXELS = 40_000_000;
const FORMATOS_ACEITOS = ["jpeg", "png", "webp"];

export function chaveMiniatura(chave: string): string {
  return `${chave.replace(/\.[^./]+$/, "")}_thumb.webp`;
}

export async function gerarMiniatura(
  chave: string,
  armazenamento: Armazenamento,
): Promise<ResultadoMiniatura> {
  const original = await armazenamento.obter(chave);
  let miniatura: Buffer;
  try {
    // O sharp também decodifica SVG e GIF: o formato real precisa ser um dos aceitos.
    const { format } = await sharp(original).metadata();
    if (format === undefined || !FORMATOS_ACEITOS.includes(format)) throw new Error("formato");
    // O limite de pixels barra imagem pequena em bytes mas enorme ao decodificar; o rotate()
    // aplica a orientação EXIF, que o WebP gerado deixa de carregar.
    miniatura = await sharp(original, { limitInputPixels: LIMITE_PIXELS, failOn: "error" })
      .rotate()
      .resize({ width: LARGURA_MINIATURA, withoutEnlargement: true })
      .webp()
      .toBuffer();
  } catch {
    await armazenamento.remover(chave);
    return { ok: false, motivo: "imagem_invalida" };
  }
  const destino = chaveMiniatura(chave);
  await armazenamento.gravar(destino, miniatura, "image/webp");
  return { ok: true, chaveMiniatura: destino };
}
