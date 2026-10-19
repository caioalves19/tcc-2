import { expect, test } from "@playwright/test";

import { ADMIN, ARTISTA, OBRA } from "./dados";
import { fotoJpeg, simularR2 } from "./r2";
import { entrar } from "./sessao";

const TITULO = "Viaduto ao Entardecer";
const SLUG = "viaduto-ao-entardecer";

// RF26/RF27/RN11: a obra nasce rascunho e fica fora da vitrine; publicar exige uma imagem, que
// vai do navegador ao R2 e é reprocessada no servidor; publicada, aparece no catálogo.
test("RF26 o admin cadastra uma obra, envia a imagem, publica e ela aparece no catálogo", async ({
  page,
  browser,
}) => {
  await simularR2(page);
  await entrar(page, ADMIN.email);

  await page.goto("/admin/obras");
  await page.getByLabel("Título", { exact: true }).fill(TITULO);
  await page.getByLabel("Slug", { exact: true }).fill(SLUG);
  await page.getByLabel("Artista", { exact: true }).selectOption({ label: ARTISTA.nome });
  await page.getByLabel("Preço (R$)", { exact: true }).fill("2.500,00");
  await page.getByRole("button", { name: "Salvar obra" }).click();
  await expect(
    page.getByText("Obra cadastrada como rascunho. Agora adicione as imagens."),
  ).toBeVisible();

  // RN11: rascunho não aparece na vitrine, vista por um visitante sem sessão. A obra da fixture
  // aparece, para a ausência não passar com um catálogo vazio por erro.
  const visitante = await browser.newContext();
  const vitrine = await visitante.newPage();
  await vitrine.goto("/obras");
  await expect(vitrine.getByRole("link", { name: OBRA.titulo }).first()).toBeVisible();
  await expect(vitrine.getByRole("link", { name: TITULO })).toHaveCount(0);

  // RF27/RNF21: o envio só libera depois do texto alternativo.
  await page
    .getByLabel("Texto alternativo da nova imagem", { exact: true })
    .fill("Viaduto pintado em tons de laranja");
  await page.getByLabel("Imagem", { exact: true }).setInputFiles({
    name: "viaduto.jpg",
    mimeType: "image/jpeg",
    buffer: await fotoJpeg(),
  });
  await expect(page.getByText("Imagem adicionada.")).toBeVisible();

  await page.getByLabel("Situação", { exact: true }).selectOption({ label: "Publicada" });
  await page.getByRole("button", { name: "Salvar obra" }).click();
  await expect(page.getByText("Obra salva.", { exact: true })).toBeVisible();

  await vitrine.goto("/obras");
  await expect(vitrine.getByRole("link", { name: TITULO }).first()).toBeVisible();
  await vitrine.goto(`/obras/${SLUG}`);
  await expect(vitrine.getByRole("heading", { name: TITULO })).toBeVisible();
  await expect(vitrine.getByText("R$ 2.500,00").first()).toBeVisible();
  await expect(vitrine.getByRole("button", { name: "Adicionar ao carrinho" })).toBeVisible();
  await visitante.close();
});
