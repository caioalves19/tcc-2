import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Page } from "@playwright/test";
import sharp from "sharp";

import { R2_BUCKET_E2E, R2_CONTA_E2E } from "./dados";

function pastaDoR2(): string {
  const pasta = process.env.E2E_R2_DIR;
  if (!pasta) throw new Error("E2E_R2_DIR ausente: rode pelo npm run test:e2e.");
  return pasta;
}

// RF27: o navegador envia direto ao R2 pela URL assinada (path-style: /<bucket>/<chave>). Aqui o
// envio é gravado na pasta que o dublê do servidor lê; o R2 real nunca é acessado.
export async function simularR2(page: Page): Promise<void> {
  await page.route(`https://${R2_CONTA_E2E}.r2.cloudflarestorage.com/**`, async (rota) => {
    const requisicao = rota.request();
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "PUT",
      "access-control-allow-headers": "content-type",
    };
    if (requisicao.method() !== "PUT") return rota.fulfill({ status: 204, headers: cors });
    const chave = decodeURIComponent(new URL(requisicao.url()).pathname).replace(
      `/${R2_BUCKET_E2E}/`,
      "",
    );
    const arquivo = join(pastaDoR2(), chave);
    mkdirSync(dirname(arquivo), { recursive: true });
    writeFileSync(arquivo, requisicao.postDataBuffer() ?? Buffer.alloc(0));
    await rota.fulfill({ status: 200, headers: { ...cors, etag: '"e2e"' } });
  });
}

// Uma foto JPEG pequena e válida, gerada na hora: nenhum binário fica no repositório.
export async function fotoJpeg(): Promise<Buffer> {
  return sharp({
    create: { width: 96, height: 64, channels: 3, background: { r: 30, g: 90, b: 200 } },
  })
    .jpeg()
    .toBuffer();
}
