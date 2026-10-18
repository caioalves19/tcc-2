import { randomBytes } from "node:crypto";

import { expect, type Page } from "@playwright/test";

// O playwright.config.ts sorteia a senha da equipe e o worker a herda pelo process.env.
export function senhaDaEquipe(): string {
  const senha = process.env.E2E_SENHA_EQUIPE;
  if (!senha) throw new Error("E2E_SENHA_EQUIPE ausente: rode pelo npm run test:e2e.");
  return senha;
}

// RF01: cadastro de cliente pela tela, com senha sorteada; o cadastro já entra na conta.
export async function cadastrarCliente(
  page: Page,
  cliente: { nome: string; email: string; telefone: string },
): Promise<void> {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill(cliente.nome);
  await page.getByLabel("E-mail", { exact: true }).fill(cliente.email);
  await page.getByLabel("Telefone", { exact: true }).fill(cliente.telefone);
  await page
    .getByLabel("Senha", { exact: true })
    .fill(`E2e-${randomBytes(9).toString("base64url")}`);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL("/");
}

// RF02: entra pela tela de login com uma conta da fixture.
export async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senhaDaEquipe());
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}
