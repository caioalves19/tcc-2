// Sobe as imagens geradas por gerar.ts e liga ao banco: uma imagem principal por obra de
// demonstração e as tatuagens do portfólio. Pode rodar de novo: nada é duplicado.
// Uso: npx tsx prisma/imagens-demo/popular.ts
// Com R2_PUBLIC_URL local (ex.: /seed), grava em public/seed/ em vez do R2.
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../generated/prisma/client";
import { databaseUrl } from "../../src/lib/database-url";
import { armazenamentoR2, chaveMiniatura } from "../../src/modules/media/index";
import type { Armazenamento } from "../../src/modules/media/index";
import { obras, tatuagens } from "./catalogo";

const pool = new Pool({ connectionString: databaseUrl() });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const PASTA = join(process.cwd(), "prisma", "imagens-demo", "imagens");

function destino(): Armazenamento {
  const publica = process.env.R2_PUBLIC_URL?.trim() ?? "";
  if (!publica.startsWith("/")) return armazenamentoR2();
  const raiz = join(process.cwd(), "public", publica);
  return {
    obter: () => Promise.resolve(null),
    async gravar(chave, corpo) {
      await mkdir(dirname(join(raiz, chave)), { recursive: true });
      await writeFile(join(raiz, chave), corpo);
    },
    remover: () => Promise.resolve(),
  };
}
const armazenamento = destino();

// Mesmo formato de chave do upload real (media/chave.ts), para a obra passar na checagem de
// pasta do artista.
async function enviar(arquivoLocal: string, chave: string): Promise<void> {
  await armazenamento.gravar(chave, await readFile(join(PASTA, arquivoLocal)), "image/webp");
  await armazenamento.gravar(
    chaveMiniatura(chave),
    await readFile(join(PASTA, chaveMiniatura(arquivoLocal))),
    "image/webp",
  );
}

async function main(): Promise<void> {
  for (const imagem of obras) {
    const obra = await prisma.artwork.findUnique({
      where: { slug: imagem.slug },
      include: { images: true },
    });
    if (!obra) {
      console.log(`- obra ${imagem.slug} não cadastrada, pulando`);
      continue;
    }
    const chave = `obras/${obra.artistId}/${imagem.slug}.webp`;
    await enviar(`obras/${imagem.slug}.webp`, chave);
    if (obra.images.some((i) => i.url === chave)) {
      console.log(`= obra ${imagem.slug}`);
      continue;
    }
    await prisma.artworkImage.create({
      data: {
        artworkId: obra.id,
        url: chave,
        order: Math.max(0, ...obra.images.map((i) => i.order)) + 1,
        primary: obra.images.length === 0,
        altText: imagem.textoAlternativo,
      },
    });
    console.log(`+ obra ${imagem.slug}`);
  }

  for (const t of tatuagens) {
    const artista = await prisma.artist.findUnique({ where: { slug: t.artistaSlug } });
    const estilo = await prisma.tattooStyle.findUnique({ where: { slug: t.estiloSlug } });
    if (!artista || !estilo) {
      console.log(`- tatuagem ${t.titulo}: artista ou estilo ausente, pulando`);
      continue;
    }
    const chave = `portfolio/${artista.id}/${t.id}.webp`;
    await enviar(`tatuagens/${t.id}.webp`, chave);
    if (await prisma.portfolioItem.findUnique({ where: { id: t.id } })) {
      console.log(`= tatuagem ${t.titulo}`);
      continue;
    }
    const ultimo = await prisma.portfolioItem.aggregate({
      where: { artistId: artista.id },
      _max: { order: true },
    });
    await prisma.portfolioItem.create({
      data: {
        id: t.id,
        artistId: artista.id,
        title: t.titulo,
        description: t.descricao,
        imageUrl: chave,
        bodyRegion: t.regiaoCorpo,
        durationMins: t.duracaoMinutos,
        featured: t.destaque,
        order: (ultimo._max.order ?? 0) + 1,
        styles: { create: [{ tattooStyleId: estilo.id }] },
      },
    });
    console.log(`+ tatuagem ${t.titulo}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
