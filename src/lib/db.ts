import { Pool } from "pg";

import { databaseUrl } from "./database-url";

// Pool único do app: o Prisma do Better Auth, o rate limit e o e-mail usam o mesmo.
let pool: Pool | undefined;

export function obterPool(): Pool {
  pool ??= new Pool({ connectionString: databaseUrl() });
  return pool;
}
