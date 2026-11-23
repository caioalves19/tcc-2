// Dados de demonstração (PBI-49): o artista, os estilos e as obras que prisma/imagens-demo/popular.ts
// liga às imagens. Fica fora do db:seed para não ir ao banco do cliente sem querer.
// Uso: npm run db:seed (antes) e depois npm run db:seed:demo. Pode rodar de novo: nada duplica.
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "../src/lib/database-url";
import { situacaoPorEstoque } from "../src/modules/catalog/index";
import { planoDoSeed, schemaSenhaNova } from "../src/modules/identity/index";
import {
  ARTISTA_DEMO_ANTIGO,
  AVISO_DEMO,
  ESTILOS_DEMO_ANTIGOS,
  OBRAS_DEMO_ANTIGAS,
  OBRAS_RETIRADAS,
  TATUAGENS_DEMO_ANTIGAS,
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

// Como a senha do admin no db:seed: só cria a credencial que falta, nunca troca a existente.
async function darLogin(userId: string, variavel: string): Promise<void> {
  const senha = process.env[variavel];
  if (!senha) return;
  const validacao = schemaSenhaNova.safeParse(senha);
  if (!validacao.success) throw new Error(`${variavel} deve ter entre 8 e 128 caracteres.`);
  await prisma.account.upsert({
    where: { provider_externalId: { provider: "credential", externalId: userId } },
    update: {},
    create: {
      userId,
      provider: "credential",
      externalId: userId,
      passwordHash: await hashPassword(validacao.data),
    },
  });
}

// A demonstração anterior tinha obras, tatuagens e estilos com imagem gerada por IA. Saem antes
// dos estilos reais (o nome "Blackwork" é único), junto com as obras reais que o estúdio retirou.
// Obra presa a carrinho ou pedido (Restrict) não é apagada: fica excluída e some do catálogo.
async function tirarDemonstracaoDeIa(): Promise<void> {
  const obras = await prisma.artwork.findMany({
    where: { slug: { in: [...OBRAS_DEMO_ANTIGAS, ...OBRAS_RETIRADAS] } },
    include: { _count: { select: { cartItems: true, orderItems: true } } },
  });
  for (const obra of obras) {
    if (obra._count.cartItems + obra._count.orderItems === 0) {
      await prisma.artwork.delete({ where: { id: obra.id } });
    } else if (!obra.deletedAt) {
      await prisma.artwork.update({ where: { id: obra.id }, data: { deletedAt: new Date() } });
    }
  }
  await prisma.portfolioItem.deleteMany({ where: { id: { in: TATUAGENS_DEMO_ANTIGAS } } });
  await prisma.tattooStyle.deleteMany({ where: { slug: { in: ESTILOS_DEMO_ANTIGOS } } });
}

async function main(): Promise<void> {
  const slugExemplo = planoDoSeed().artista.slug;
  const exemplo = await prisma.artist.findUnique({ where: { slug: slugExemplo } });
  if (!exemplo) throw new Error("Rode npm run db:seed antes do db:seed:demo.");

  await tirarDemonstracaoDeIa();

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
    await darLogin(usuario.id, artista.variavelSenha);
    artistas.set(artista.slug, salvo.id);
  }

  // A conta de teste do db:seed ("Artista") não é do Kolô: sem estilo sai do agendamento (RF20) e,
  // excluída, da gestão do portfólio e da vitrine. Fica no banco para o db:seed continuar valendo.
  await prisma.artistStyle.deleteMany({
    where: { artistId: exemplo.id, tattooStyle: { slug: { in: estilosDemo.map((e) => e.slug) } } },
  });
  const contaExemplo = await prisma.user.findUniqueOrThrow({ where: { id: exemplo.userId } });
  if (!contaExemplo.deletedAt) {
    await prisma.user.update({
      where: { id: exemplo.userId },
      data: { deletedAt: new Date(), status: "INATIVO" },
    });
  }

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
  // Com histórico que o banco protege (obra, agendamento, pedido, e-mail), ela não é apagada:
  // sai da vitrine (excluído_em) e do agendamento (sem estilo).
  const antiga = await prisma.artist.findUnique({
    where: { slug: ARTISTA_DEMO_ANTIGO },
    include: {
      _count: { select: { artworks: true, appointments: true } },
      user: { include: { _count: { select: { orders: true, emailLogs: true } } } },
    },
  });
  if (antiga) {
    const historico =
      antiga._count.artworks +
      antiga._count.appointments +
      antiga.user._count.orders +
      antiga.user._count.emailLogs;
    if (historico === 0) {
      await prisma.user.delete({ where: { id: antiga.userId } });
    } else {
      await prisma.artistStyle.deleteMany({ where: { artistId: antiga.id } });
      await prisma.user.update({
        where: { id: antiga.userId },
        data: { deletedAt: antiga.user.deletedAt ?? new Date(), status: "INATIVO" },
      });
      console.log(`! ${ARTISTA_DEMO_ANTIGO} tem histórico: saiu da vitrine sem ser apagada`);
    }
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
