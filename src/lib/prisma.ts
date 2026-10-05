import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { obterPool } from "./db";

let prisma: PrismaClient | undefined;
export function obterPrisma(): PrismaClient {
  prisma ??= new PrismaClient({ adapter: new PrismaPg(obterPool()) });
  return prisma;
}
