import { expect, test } from "@playwright/test";

import { ARTISTA, WHATSAPP_E2E } from "./dados";

// AAAA-MM-DD daqui a 7 dias no horário de São Paulo (RN09): o campo não aceita datas passadas.
function daquiASeteDias(): string {
  const data = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(data);
}

// RF20–RF25 e RF21: o visitante sai da home, passa pelas 8 etapas sem conta e recebe o link do
// WhatsApp com a mensagem pronta. O site não envia nada: só monta o link (RN01).
test("RF20/RF21 o visitante completa o wizard e recebe o link do WhatsApp com a mensagem", async ({
  page,
}) => {
  const data = daquiASeteDias();
  const avancar = () => page.getByRole("button", { name: "Avançar" }).click();

  await page.goto("/");
  await page.getByRole("link", { name: "Agendar tatuagem" }).first().click();
  await expect(page.getByRole("heading", { name: "1. Nome" })).toBeVisible();

  await page.getByLabel("Seu nome").fill("Lucas Silveira");
  await avancar();
  await page.getByLabel("Artista").selectOption({ label: ARTISTA.nome });
  await avancar();
  await page.getByLabel("Estilo").selectOption({ label: "Fineline" });
  await avancar();
  await page.getByLabel("Região do corpo").fill("Antebraço");
  await avancar();
  await page.getByLabel("Tamanho aproximado").selectOption({ label: "Média" });
  await avancar();
  await page.getByLabel("Data de preferência").fill(data);
  await page.getByLabel("Horário de preferência").fill("14:30");
  await avancar();

  // RF23–RF25: sem os três avisos marcados, a revisão não sai e o link não aparece.
  await expect(page.getByRole("heading", { name: "7. Avisos" })).toBeVisible();
  await page.getByRole("button", { name: "Revisar preferências" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Confirme os três avisos para continuar." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir conversa no WhatsApp" })).toHaveCount(0);

  await page.getByRole("checkbox", { name: /anamnese/ }).check();
  await page.getByRole("checkbox", { name: /termo de consentimento/ }).check();
  await page.getByRole("checkbox", { name: /18 anos/ }).check();
  await page.getByRole("button", { name: "Revisar preferências" }).click();

  const link = page.getByRole("link", { name: "Abrir conversa no WhatsApp" });
  await expect(link).toBeVisible();
  const href = new URL((await link.getAttribute("href")) ?? "");
  expect(`${href.origin}${href.pathname}`).toBe(`https://wa.me/${WHATSAPP_E2E}`);
  expect(href.searchParams.get("text")).toBe(
    [
      `Olá! Sou Lucas Silveira e quero agendar uma tatuagem com ${ARTISTA.nome}.`,
      "Estilo: Fineline",
      "Região do corpo: Antebraço",
      "Tamanho: Média",
      `Preferência: ${data.split("-").reverse().join("/")} às 14:30 (horário de São Paulo)`,
      "Li e aceito os avisos: anamnese e termo de consentimento presenciais e declaração de maioridade.",
    ].join("\n"),
  );
});
