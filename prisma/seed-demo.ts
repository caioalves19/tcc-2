// Dados de demonstração (PBI-49): o artista, os estilos e as obras que prisma/imagens-demo/popular.ts
// liga às imagens. Fica fora do db:seed para não ir ao banco do cliente sem querer.
// Uso: npm run db:seed (antes) e depois npm run db:seed:demo. Pode rodar de novo: nada duplica.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "../src/lib/database-url";
import { situacaoPorEstoque } from "../src/modules/catalog/index";
import { planoDoSeed } from "../src/modules/identity/index";
import {
  ARTISTA_DEMO_ANTIGO,
  AVISO_DEMO,
  artistasDemo,
  estilosDemo,
  obrasDemo,
} from "./imagens-demo/catalogo";

const pool = new Pool({ connectionString: databaseUrl() });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function ligarEstilos(artistId: string, slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    const estilo = await prisma.tattooStyle.findUniqueOrThrow({ where: { slug } });
    await prisma.artistStyle.upsert({
      where: { artistId_tattooStyleId: { artistId, tattooStyleId: estilo.id } },
      update: {},
      create: { artistId, tattooStyleId: estilo.id },
    });
  }
}

async function main(): Promise<void> {
  const slugExemplo = planoDoSeed().artista.slug;
  const exemplo = await prisma.artist.findUnique({ where: { slug: slugExemplo } });
  if (!exemplo) throw new Error("Rode npm run db:seed antes do db:seed:demo.");

  for (const estilo of estilosDemo) {
    const dados = { name: estilo.nome, description: estilo.descricao };
    await prisma.tattooStyle.upsert({
      where: { slug: estilo.slug },
      update: dados,
      create: { slug: estilo.slug, ...dados },
    });
  }

  const artistas = new Map<string, string>();
  for (const artista of artistasDemo) {
    const usuario = await prisma.user.upsert({
      where: { email: artista.email },
      update: { role: "ARTISTA", name: artista.nome },
      create: { role: "ARTISTA", name: artista.nome, email: artista.email },
    });
    const salvo = await prisma.artist.upsert({
      where: { slug: artista.slug },
      update: { instagram: artista.instagram },
      create: { userId: usuario.id, slug: artista.slug, instagram: artista.instagram },
    });
    await ligarEstilos(salvo.id, artista.estilos);
    artistas.set(artista.slug, salvo.id);
  }

  // A conta de teste do db:seed não tatua na vitrine: sem estilo de demonstração, sai do
  // agendamento (RF20).
  await prisma.artistStyle.deleteMany({
    where: { artistId: exemplo.id, tattooStyle: { slug: { in: estilosDemo.map((e) => e.slug) } } },
  });

  for (const obra of obrasDemo) {
    const artistId = artistas.get(obra.artistaSlug);
    if (!artistId) throw new Error(`Artista ${obra.artistaSlug} fora da demonstração.`);
    const dados = {
      artistId,
      title: obra.titulo,
      description: `${obra.descricao} ${AVISO_DEMO}`,
      technique: obra.tecnica,
      dimensions: obra.dimensoes,
      year: obra.ano,
      priceCents: obra.precoCentavos,
      stockQuantity: obra.estoque,
      // Toda obra de demonstração é publicada; disponível ou esgotada sai do estoque (RN11).
      status: situacaoPorEstoque(true, obra.estoque),
      featured: obra.destaque,
    };
    await prisma.artwork.upsert({
      where: { slug: obra.slug },
      update: dados,
      create: { slug: obra.slug, ...dados },
    });
  }

  // A artista fictícia da demonstração anterior sai depois que as obras mudaram de dono. As
  // tatuagens dela vão junto (cascade) e o popular.ts recria cada uma com o novo artista.
  const antiga = await prisma.artist.findUnique({
    where: { slug: ARTISTA_DEMO_ANTIGO },
    include: { _count: { select: { artworks: true, appointments: true } } },
  });
  if (antiga && antiga._count.artworks + antiga._count.appointments > 0) {
    console.log(`! ${ARTISTA_DEMO_ANTIGO} mantida: ainda tem obras ou agendamentos fora da demo`);
  } else if (antiga) {
    await prisma.user.delete({ where: { id: antiga.userId } });
  }

  console.log(
    `Seed de demonstração: ${artistasDemo.length} artistas, ${estilosDemo.length} estilos, ${obrasDemo.length} obras`,
  );
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
