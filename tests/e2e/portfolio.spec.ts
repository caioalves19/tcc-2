import { expect, test } from "@playwright/test";

import { ARTISTA } from "./dados";
import { fotoJpeg, simularR2 } from "./r2";
import { entrar } from "./sessao";

const TITULO = "Rosa em Fineline";

// RF19/RN10: a artista inclui um trabalho com imagem no próprio portfólio (o servidor reprocessa
// o arquivo enviado ao R2); RF17: o trabalho aparece na galeria pública de tatuagens.
test("RF19 a artista inclui um trabalho no portfólio e ele aparece na galeria pública", async ({
  page,
}) => {
  await simularR2(page);
  await entrar(page, ARTISTA.email);

  await page.goto("/portfolio/gestao");
  await page.getByLabel("Título", { exact: true }).fill(TITULO);
  await page.getByLabel("Região do corpo", { exact: true }).fill("Antebraço");
  await page.getByRole("checkbox", { name: "Fineline" }).check();
  await page.getByLabel("Imagem", { exact: true }).setInputFiles({
    name: "rosa.jpg",
    mimeType: "image/jpeg",
    buffer: await fotoJpeg(),
  });
  await expect(page.getByText("Imagem enviada com sucesso.")).toBeVisible();
  await page.getByRole("button", { name: "Salvar trabalho" }).click();
  await expect(page.getByText("Trabalho cadastrado.", { exact: true })).toBeVisible();

  await page.goto("/tatuagens");
  await expect(page.getByRole("heading", { name: TITULO })).toBeVisible();
});
