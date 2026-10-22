// Gera as imagens de demonstração com IA (Pollinations.ai, sem chave) em prisma/imagens-demo/imagens/.
// Uso: npx tsx prisma/imagens-demo/gerar.ts [--forcar]
// Sem --forcar, arquivos que já existem ficam como estão.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

import { chaveMiniatura } from "../../src/modules/media/miniatura";
import { obras, tatuagens } from "./catalogo";

const LARGURA = 1024;
const ALTURA = 768;
// O plano gratuito carimba o logo no canto inferior direito: pede mais alto e corta a faixa.
const FAIXA_DO_LOGO = 64;
const LARGURA_MINIATURA = 400; // a mesma de media/miniatura.ts
const PASTA = join(process.cwd(), "prisma", "imagens-demo", "imagens");
const forcar = process.argv.includes("--forcar");

function semente(texto: string): number {
  let hash = 0;
  for (const c of texto) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return hash % 1_000_000;
}

async function baixar(prompt: string, id: string): Promise<Buffer> {
  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
  url.search = new URLSearchParams({
    width: String(LARGURA),
    height: String(ALTURA + FAIXA_DO_LOGO),
    seed: String(semente(id)),
    model: "flux",
    nologo: "true",
  }).toString();
  for (let tentativa = 1; ; tentativa++) {
    await respeitarLimite();
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(180_000) });
      const tipo = resposta.headers.get("content-type") ?? "";
      if (resposta.ok && tipo.startsWith("image/"))
        return Buffer.from(await resposta.arrayBuffer());
      throw new Error(`HTTP ${resposta.status} ${tipo}`);
    } catch (erro) {
      if (tentativa === 4) throw erro;
      console.warn(`  ${id}: falhou (${String(erro)}), tentando de novo`);
    }
  }
}

// Plano gratuito: uma imagem a cada 45 s por IP; cada pedido antes disso zera a espera.
const INTERVALO_MS = 50_000;
let ultimoPedido = 0;
async function respeitarLimite(): Promise<void> {
  const espera = ultimoPedido + INTERVALO_MS - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimoPedido = Date.now();
}

async function gerar(pasta: string, nome: string, prompt: string): Promise<void> {
  const arquivo = join(PASTA, pasta, `${nome}.webp`);
  if (!forcar && existsSync(arquivo)) return console.log(`= ${pasta}/${nome}`);
  const bruto = await baixar(prompt, nome);
  const original = await sharp(bruto)
    .resize(LARGURA, ALTURA + FAIXA_DO_LOGO, { fit: "cover" })
    .extract({ left: 0, top: 0, width: LARGURA, height: ALTURA })
    .webp({ quality: 82 })
    .toBuffer();
  const miniatura = await sharp(original).resize({ width: LARGURA_MINIATURA }).webp().toBuffer();
  await mkdir(join(PASTA, pasta), { recursive: true });
  await writeFile(arquivo, original);
  await writeFile(join(PASTA, chaveMiniatura(`${pasta}/${nome}.webp`)), miniatura);
  console.log(`+ ${pasta}/${nome}`);
}

for (const obra of obras) await gerar("obras", obra.slug, obra.prompt);
for (const t of tatuagens) await gerar("tatuagens", t.id, t.prompt);
