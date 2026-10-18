import { expect, type Page } from "@playwright/test";

// O playwright.config.ts sorteia a senha da equipe e o worker a herda pelo process.env.
export function senhaDaEquipe(): string {
  const senha = process.env.E2E_SENHA_EQUIPE;
  if (!senha) throw new Error("E2E_SENHA_EQUIPE ausente: rode pelo npm run test:e2e.");
  return senha;
}

// RF02: entra pela tela de login com uma conta da fixture.
export async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senhaDaEquipe());
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}
