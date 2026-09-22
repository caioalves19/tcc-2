import { execSync } from "node:child_process";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ADMIN_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_db";
const TEST_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_test";

async function recreateTestDatabase(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kolo_test' AND pid <> pg_backend_pid()",
  );
  await admin.query("DROP DATABASE IF EXISTS kolo_test");
  await admin.query("CREATE DATABASE kolo_test");
  await admin.end();
}

function runPrisma(command: string): void {
  execSync(command, {
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: "pipe",
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
  });
}

describe("migrate e seed da fundação", () => {
  let db: Client;

  beforeAll(async () => {
    await recreateTestDatabase();
    runPrisma("npx prisma migrate deploy");
    runPrisma("npx prisma db seed");
    db = new Client({ connectionString: TEST_URL });
    await db.connect();
  }, 120_000);

  afterAll(async () => {
    await db.end();
  });

  it("sobe do zero com um ADMIN, um CLIENTE e um ARTISTA vinculado", async () => {
    const constraint = await db.query<{ conname: string }>(
      "SELECT conname FROM pg_constraint WHERE conname = 'appointment_no_overlap'",
    );
    expect(constraint.rows).toEqual([{ conname: "appointment_no_overlap" }]);

    const papeis = await db.query<{ papel: string; email: string }>(
      'SELECT papel::text AS papel, email FROM "user" ORDER BY email',
    );
    expect(papeis.rows).toEqual([
      { papel: "ADMIN", email: "admin@kolo.test" },
      { papel: "ARTISTA", email: "artista@kolo.test" },
      { papel: "CLIENTE", email: "cliente@kolo.test" },
    ]);

    const artista = await db.query<{ slug: string; papel: string }>(
      `SELECT artist.slug, "user".papel::text AS papel
       FROM artist
       JOIN "user" ON "user".id = artist.user_id`,
    );
    expect(artista.rows).toEqual([{ slug: "artista-exemplo", papel: "ARTISTA" }]);
  });
});
