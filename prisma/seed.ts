import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "../src/lib/database-url";
import { planoDoSeed, seedFundacao, schemaSenhaNova } from "../src/modules/identity/index";

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

  // Categorias iniciais do RF20. Um catálogo já configurado permanece intacto.
  if ((await prisma.sizeTier.count()) === 0) {
    await prisma.sizeTier.createMany({
      data: [
        { id: "00000000-0000-4000-8000-000000000001", name: "Pequena", order: 1 },
        { id: "00000000-0000-4000-8000-000000000002", name: "Média", order: 2 },
        { id: "00000000-0000-4000-8000-000000000003", name: "Grande", order: 3 },
      ],
      skipDuplicates: true,
    });
  }

  // Só provisiona a credencial ausente: repetir o seed nunca troca a senha do ADMIN.
  const senhaInicial = process.env.SEED_ADMIN_PASSWORD;
  if (senhaInicial) {
    const validacao = schemaSenhaNova.safeParse(senhaInicial);
    if (!validacao.success)
      throw new Error("SEED_ADMIN_PASSWORD deve ter entre 8 e 128 caracteres.");
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@kolo.test" } });
    const senhaHash = await hashPassword(validacao.data);
    await prisma.account.upsert({
      where: { provider_externalId: { provider: "credential", externalId: admin.id } },
      update: {},
      create: {
        userId: admin.id,
        provider: "credential",
        externalId: admin.id,
        passwordHash: senhaHash,
      },
    });
  }

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
