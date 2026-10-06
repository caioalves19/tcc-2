import sharp from "sharp";

export type Armazenamento = {
  // null quando o objeto não existe (o navegador não chegou a enviar).
  obter(chave: string): Promise<Buffer | null>;
  gravar(chave: string, corpo: Buffer, tipo: string): Promise<void>;
  remover(chave: string): Promise<void>;
};

export type ResultadoMiniatura =
  | { ok: true; chaveMiniatura: string }
  | { ok: false; motivo: "imagem_invalida" | "objeto_inexistente" };

const LARGURA_MINIATURA = 400;
const LIMITE_PIXELS = 40_000_000;
const FORMATOS_ACEITOS = ["jpeg", "png", "webp"];

export function chaveMiniatura(chave: string): string {
  return `${chave.replace(/\.[^./]+$/, "")}_thumb.webp`;
}

// Só o que diz respeito ao arquivo: não decodifica, formato fora da lista (o sharp também lê
// SVG e GIF) ou pixels demais (pequeno em bytes, enorme ao decodificar).
async function formatoValido(original: Buffer): Promise<boolean> {
  try {
    const { format, width, height } = await sharp(original, { failOn: "error" }).metadata();
    if (format === undefined || !FORMATOS_ACEITOS.includes(format)) return false;
    if (!width || !height || width * height > LIMITE_PIXELS) return false;
    await sharp(original, { limitInputPixels: LIMITE_PIXELS, failOn: "error" }).stats();
    return true;
  } catch {
    return false;
  }
}

export async function gerarMiniatura(
  chave: string,
  armazenamento: Armazenamento,
): Promise<ResultadoMiniatura> {
  const original = await armazenamento.obter(chave);
  if (original === null) return { ok: false, motivo: "objeto_inexistente" };
  if (!(await formatoValido(original))) {
    await armazenamento.remover(chave);
    return { ok: false, motivo: "imagem_invalida" };
  }
  // Daqui em diante o arquivo já passou pela checagem de formato: uma falha aqui (memória,
  // por exemplo) sobe como erro e o original fica, porque pode já estar em uso numa obra.
  // O rotate() aplica a orientação EXIF, que o WebP gerado deixa de carregar.
  const miniatura = await sharp(original, { limitInputPixels: LIMITE_PIXELS })
    .rotate()
    .resize({ width: LARGURA_MINIATURA, withoutEnlargement: true })
    .webp()
    .toBuffer();
  const destino = chaveMiniatura(chave);
  await armazenamento.gravar(destino, miniatura, "image/webp");
  return { ok: true, chaveMiniatura: destino };
}
