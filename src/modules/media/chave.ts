import { randomUUID } from "node:crypto";

export type DestinoImagem = "obras" | "portfolio";

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function gerarChaveObjeto(entrada: {
  destino: DestinoImagem;
  artistId: string;
  tipo: string;
}): string {
  const extensao = EXTENSOES[entrada.tipo];
  if (!extensao) throw new Error("Tipo de imagem não aceito.");
  if (!UUID.test(entrada.artistId)) throw new Error("Identificador de artista inválido.");
  return `${entrada.destino}/${entrada.artistId}/${randomUUID()}.${extensao}`;
}
