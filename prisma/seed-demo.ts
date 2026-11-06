// Dados de demonstração (PBI-49): o artista, os estilos e as obras que prisma/imagens-demo/popular.ts
// liga às imagens. Fica fora do db:seed para não ir ao banco do cliente sem querer.
// Uso: npm run db:seed (antes) e depois npm run db:seed:demo. Pode rodar de novo: nada duplica.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "../src/lib/database-url";
import {
  AVISO_DEMO,
  artistaDemo,
  estilosDemo,
  estilosDoArtistaExemplo,
  obrasDemo,
  situacaoDemo,
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
  const exemplo = await prisma.artist.findUnique({ where: { slug: "artista-exemplo" } });
  if (!exemplo) throw new Error("Rode npm run db:seed antes do db:seed:demo.");

  for (const estilo of estilosDemo) {
    const dados = { name: estilo.nome, description: estilo.descricao };
    await prisma.tattooStyle.upsert({
      where: { slug: estilo.slug },
      update: dados,
      create: { slug: estilo.slug, ...dados },
    });
  }

  const usuario = await prisma.user.upsert({
    where: { email: artistaDemo.email },
    update: { role: "ARTISTA", name: artistaDemo.nome },
    create: { role: "ARTISTA", name: artistaDemo.nome, email: artistaDemo.email },
  });
  const marina = await prisma.artist.upsert({
    where: { slug: artistaDemo.slug },
    update: { bio: artistaDemo.bio },
    create: { userId: usuario.id, slug: artistaDemo.slug, bio: artistaDemo.bio },
  });
  await ligarEstilos(marina.id, artistaDemo.estilos);
  await ligarEstilos(exemplo.id, estilosDoArtistaExemplo);

  const artistas = new Map([
    [artistaDemo.slug, marina.id],
    ["artista-exemplo", exemplo.id],
  ]);
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
      status: situacaoDemo(obra),
      featured: obra.destaque,
    };
    await prisma.artwork.upsert({
      where: { slug: obra.slug },
      update: dados,
      create: { slug: obra.slug, ...dados },
    });
  }

  console.log(
    `Seed de demonstração: ${artistaDemo.slug}, ${estilosDemo.length} estilos, ${obrasDemo.length} obras`,
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
