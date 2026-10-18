import { randomBytes } from "node:crypto";

import { expect, test } from "@playwright/test";

import { ARTISTA, OUTRO_ARTISTA } from "./dados";
import { entrar } from "./sessao";

// RF06: a checagem de papel roda no servidor; a tela mostra o motivo e nenhum formulário.
test("RF06 o cliente não entra no admin nem na agenda", async ({ page }) => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill("Cliente Curioso");
  await page.getByLabel("E-mail", { exact: true }).fill("e2e-curioso@kolo.test");
  await page.getByLabel("Telefone", { exact: true }).fill("11912345678");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(`E2e-${randomBytes(9).toString("base64url")}`);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/admin");
  await expect(page.getByRole("alert").filter({ hasText: "administradores" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Administração" })).toHaveCount(0);

  await page.goto("/agenda");
  await expect(
    page.getByRole("alert").filter({ hasText: "A agenda é só da equipe do Kolô." }),
  ).toBeVisible();
});

// RF06/RN10: o artista não entra no admin e só gerencia o próprio portfólio: pedir o de outro
// artista pela URL devolve o dele mesmo.
test("RN10 o artista não entra no admin e não gerencia o portfólio de outro artista", async ({
  page,
}) => {
  await entrar(page, ARTISTA.email);

  await page.goto("/admin");
  await expect(page.getByRole("alert").filter({ hasText: "administradores" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Administração" })).toHaveCount(0);

  await page.goto(`/portfolio/gestao?artista=${OUTRO_ARTISTA.id}`);
  await expect(page.getByRole("heading", { name: /portfólio/i }).first()).toBeVisible();
  await expect(page.getByText(OUTRO_ARTISTA.trabalho.titulo)).toHaveCount(0);
});
