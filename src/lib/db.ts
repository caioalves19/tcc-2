import { Pool } from "pg";

import { databaseUrl } from "./database-url";

// Pool único para o SQL direto (rate limit, e-mail). O Better Auth usa o Prisma dele.
let pool: Pool | undefined;

export function obterPool(): Pool {
  pool ??= new Pool({ connectionString: databaseUrl() });
  return pool;
}
