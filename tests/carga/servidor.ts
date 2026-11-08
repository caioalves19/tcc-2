// APS (qualidade): sobe o build de produção num banco descartável para o k6 e o OWASP ZAP.
// Reaproveita o preparo do E2E (kolo_e2e + dublês do Mercado Pago e do R2) e acrescenta as duas
// obras da carga. Nunca aponta para o banco de desenvolvimento. Fora da CI.
//
//   npm run build && npx tsx tests/carga/servidor.ts
import { execSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Client } from "pg";

import { ARTISTA, BANCO_E2E, R2_BUCKET_E2E, R2_CONTA_E2E } from "../e2e/dados";
import { OBRA_CARGA, OBRA_RAJADA, PORTA_CARGA } from "./dados";

const URL_BANCO = `postgresql://kolo_user:kolo_password@localhost:5432/${BANCO_E2E}`;
const URL_APP = `http://localhost:${PORTA_CARGA}`;
const segredo = () => randomBytes(32).toString("hex");

const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  NODE_OPTIONS: "--import ./tests/e2e/mercado-pago-falso.ts --import ./tests/e2e/r2-falso.ts",
  // O preparo do E2E exige este sufixo antes de esvaziar a pasta.
  E2E_R2_DIR: join(tmpdir(), "kolo-carga", "kolo-e2e-r2"),
  E2E_SENHA_EQUIPE: segredo(),
  DATABASE_URL: URL_BANCO,
  BETTER_AUTH_SECRET: segredo(),
  BETTER_AUTH_URL: URL_APP,
  APP_URL: "https://kolo-carga.test",
  MP_WEBHOOK_SECRET: segredo(),
  RESEND_API_KEY: `re_${segredo()}`,
  MP_ACCESS_TOKEN: `TEST-${segredo()}`,
  R2_ACCOUNT_ID: R2_CONTA_E2E,
  R2_BUCKET: R2_BUCKET_E2E,
  R2_ACCESS_KEY_ID: segredo(),
  R2_SECRET_ACCESS_KEY: segredo(),
  R2_PUBLIC_URL: "https://imagens-carga.invalid",
};

const shell = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
execSync("npx tsx tests/e2e/preparar-banco.ts", { env, stdio: "inherit", shell });

const db = new Client({ connectionString: URL_BANCO });
await db.connect();
for (const [obra, estoque] of [
  [OBRA_CARGA, 100_000],
  [OBRA_RAJADA, 1],
] as const) {
  await db.query(
    `INSERT INTO artwork (id, artist_id, titulo, slug, preco_centavos, quantidade_estoque, situacao)
     VALUES ($1, $2, $3, $4, $5, $6, 'DISPONIVEL')`,
    [obra.id, ARTISTA.id, obra.titulo, obra.slug, obra.precoCentavos, estoque],
  );
}
await db.end();

// O binário do Next direto pelo Node (sem npx nem shell): um processo só, que morre junto.
const servidor = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(PORTA_CARGA)],
  { env, stdio: "inherit" },
);
for (const sinal of ["SIGINT", "SIGTERM"] as const) process.on(sinal, () => servidor.kill(sinal));
process.on("exit", () => servidor.kill());
servidor.on("exit", (codigo) => process.exit(codigo ?? 0));
