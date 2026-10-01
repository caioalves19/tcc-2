import { execSync } from "node:child_process";
import { Client } from "pg";

const ADMIN_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_db";

// Cria um banco descartável com as migrações aplicadas e aponta o app para ele.
export async function prepararBancoDeTeste(nome: string): Promise<Client> {
  const url = `postgresql://kolo_user:kolo_password@localhost:5432/${nome}`;
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
    [nome],
  );
  await admin.query(`DROP DATABASE IF EXISTS ${nome}`);
  await admin.query(`CREATE DATABASE ${nome}`);
  await admin.end();

  process.env.DATABASE_URL = url;
  process.env.BETTER_AUTH_SECRET = `${nome}-secret-with-at-least-32-characters`;
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
  });

  const db = new Client({ connectionString: url });
  await db.connect();
  return db;
}
