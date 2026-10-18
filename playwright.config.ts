import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";

import { BANCO_E2E, PORTA_E2E, R2_BUCKET_E2E, R2_CONTA_E2E } from "./tests/e2e/dados";

const URL_E2E = `http://localhost:${PORTA_E2E}`;

// Segredos do servidor do E2E: aleatórios a cada rodada, nunca escritos no código. Ficam no
// process.env para os workers do Playwright herdarem o mesmo valor do servidor (o webhook
// simulado da compra precisa assinar com o mesmo segredo).
function segredoDaRodada(nome: string): string {
  process.env[nome] ??= randomBytes(32).toString("hex");
  return process.env[nome];
}

// RF27: pasta que faz as vezes do bucket. O page.route grava nela o que o navegador envia e o
// dublê do servidor lê e grava nela; o preparo do banco a esvazia a cada rodada.
process.env.E2E_R2_DIR ??= join(tmpdir(), "kolo-e2e-r2");

// PBI-45: E2E contra o build de produção (`npm run build` antes), num banco descartável
// (kolo_e2e) recriado a cada rodada. Só Chromium: o upgrade-insecure-requests da CSP de produção
// quebraria o WebKit servido por http.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: URL_E2E,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx tsx tests/e2e/preparar-banco.ts && npx next start -p ${PORTA_E2E}`,
    url: URL_E2E,
    // Nunca reaproveitar um servidor já de pé: ele poderia estar no banco de desenvolvimento.
    reuseExistingServer: false,
    timeout: 120_000,
    // O app recusa subir em produção sem os quatro primeiros (src/lib/ambiente.ts). Mercado Pago e
    // R2 também ficam fixos: o Playwright mescla este env com o do processo e o Next completa com o
    // .env local, que tem credenciais reais de sandbox e do bucket de teste. Nenhum é real.
    env: {
      // Dublês do Mercado Pago e do R2 no processo do servidor (tests/e2e/*-falso.ts).
      NODE_OPTIONS: "--import ./tests/e2e/mercado-pago-falso.ts --import ./tests/e2e/r2-falso.ts",
      E2E_R2_DIR: process.env.E2E_R2_DIR,
      DATABASE_URL: `postgresql://kolo_user:kolo_password@localhost:5432/${BANCO_E2E}`,
      BETTER_AUTH_SECRET: segredoDaRodada("E2E_BETTER_AUTH_SECRET"),
      BETTER_AUTH_URL: URL_E2E,
      APP_URL: "https://kolo-e2e.test",
      MP_WEBHOOK_SECRET: segredoDaRodada("E2E_MP_WEBHOOK_SECRET"),
      // Senha das contas da equipe na fixture (tests/e2e/preparar-banco.ts) e do login no teste.
      E2E_SENHA_EQUIPE: segredoDaRodada("E2E_SENHA_EQUIPE"),
      RESEND_API_KEY: `re_${segredoDaRodada("E2E_RESEND_API_KEY")}`,
      MP_ACCESS_TOKEN: `TEST-${segredoDaRodada("E2E_MP_ACCESS_TOKEN")}`,
      R2_ACCOUNT_ID: R2_CONTA_E2E,
      R2_BUCKET: R2_BUCKET_E2E,
      R2_ACCESS_KEY_ID: segredoDaRodada("E2E_R2_ACCESS_KEY_ID"),
      R2_SECRET_ACCESS_KEY: segredoDaRodada("E2E_R2_SECRET_ACCESS_KEY"),
      R2_PUBLIC_URL: "https://imagens-e2e.invalid",
    },
  },
});
