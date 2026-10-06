import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PedidoAssinatura } from "./assinatura";

function variavel(nome: string): string {
  const valor = process.env[nome];
  if (valor === undefined || valor.trim() === "") throw new Error(`${nome} ausente`);
  return valor;
}

export function criarClienteR2(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${variavel("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: variavel("R2_ACCESS_KEY_ID"),
      secretAccessKey: variavel("R2_SECRET_ACCESS_KEY"),
    },
  });
}

// Content-Type e Content-Length entram na assinatura: o R2 recusa um arquivo de tipo ou
// tamanho diferente do que foi validado antes de assinar.
export async function assinarComR2(pedido: PedidoAssinatura): Promise<string> {
  return getSignedUrl(
    criarClienteR2(),
    new PutObjectCommand({
      Bucket: variavel("R2_BUCKET"),
      Key: pedido.chave,
      ContentType: pedido.tipo,
      ContentLength: pedido.tamanho,
    }),
    {
      expiresIn: pedido.expiraEmSegundos,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );
}
