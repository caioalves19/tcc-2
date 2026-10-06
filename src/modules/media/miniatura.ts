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

// Mensagens do libvips para arquivo que não decodifica (cortado, corrompido ou que não é
// imagem). Qualquer outra falha (memória, por exemplo) não diz nada sobre o arquivo.
const ERRO_DE_DECODIFICACAO =
  /^(VipsJpeg|vipspng|VipsForeignLoad|Input buffer (has corrupt|contains unsupported))/i;

// Só pelo cabeçalho: formato fora da lista (o sharp também lê SVG e GIF) ou pixels demais
// (pequeno em bytes, enorme ao decodificar). Cabeçalho ilegível também é arquivo inválido.
async function cabecalhoAceito(original: Buffer): Promise<boolean> {
  try {
    const { format, width, height } = await sharp(original, { failOn: "error" }).metadata();
    if (format === undefined || !FORMATOS_ACEITOS.includes(format)) return false;
    return Boolean(width && height && width * height <= LIMITE_PIXELS);
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
  let miniatura: Buffer | null = null;
  if (await cabecalhoAceito(original)) {
    try {
      // O rotate() aplica a orientação EXIF, que o WebP gerado deixa de carregar.
      miniatura = await sharp(original, { limitInputPixels: LIMITE_PIXELS, failOn: "error" })
        .rotate()
        .resize({ width: LARGURA_MINIATURA, withoutEnlargement: true })
        .webp()
        .toBuffer();
    } catch (erro) {
      // Só o arquivo que não decodifica é apagado; outra falha sobe e o original fica,
      // porque pode já estar em uso numa obra.
      if (!(erro instanceof Error && ERRO_DE_DECODIFICACAO.test(erro.message))) throw erro;
    }
  }
  if (miniatura === null) {
    await armazenamento.remover(chave);
    return { ok: false, motivo: "imagem_invalida" };
  }
  const destino = chaveMiniatura(chave);
  await armazenamento.gravar(destino, miniatura, "image/webp");
  return { ok: true, chaveMiniatura: destino };
}
