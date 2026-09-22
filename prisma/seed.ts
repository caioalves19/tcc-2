import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "../src/lib/database-url";
import { planoDoSeed, seedFundacao } from "../src/modules/identity/index";

const pool = new Pool({ connectionString: databaseUrl() });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main(): Promise<void> {
  await seedFundacao({
    async upsertUsuario(usuario) {
      const salvo = await prisma.user.upsert({
        where: { email: usuario.email },
        update: { role: usuario.papel, name: usuario.nome },
        create: {
          role: usuario.papel,
          name: usuario.nome,
          email: usuario.email,
        },
      });
      return { id: salvo.id };
    },
    async upsertArtista(input) {
      await prisma.artist.upsert({
        where: { userId: input.userId },
        update: { slug: input.slug },
        create: { userId: input.userId, slug: input.slug },
      });
    },
  });

  const plano = planoDoSeed();
  console.log(
    `Seed: ${plano.usuarios.map((usuario) => `${usuario.papel} ${usuario.email}`).join(", ")}`,
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
