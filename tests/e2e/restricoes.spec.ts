import { expect, test } from "@playwright/test";

import { ARTISTA, OUTRO_ARTISTA } from "./dados";
import { cadastrarCliente, entrar } from "./sessao";

// RF06: a checagem de papel roda no servidor; a tela mostra o motivo e nenhum formulário.
test("RF06 o cliente não entra no admin nem na agenda", async ({ page }) => {
  await cadastrarCliente(page, {
    nome: "Cliente Curioso",
    email: "e2e-curioso@kolo.test",
    telefone: "11912345678",
  });

  await page.goto("/admin");
  await expect(page.getByRole("alert").filter({ hasText: "administradores" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Administração" })).toHaveCount(0);

  await page.goto("/agenda");
  await expect(
    page.getByRole("alert").filter({ hasText: "A agenda é só da equipe do Kolô." }),
  ).toBeVisible();
});

// RF06/RN10: o artista não entra no admin e só gerencia o próprio portfólio. Pedir o de outro
// artista pela URL não dá acesso a ele: o servidor ignora o ?artista= e devolve o portfólio da
// própria artista, com o formulário dela e sem o trabalho do outro.
test("RN10 o artista não entra no admin e não gerencia o portfólio de outro artista", async ({
  page,
}) => {
  await entrar(page, ARTISTA.email);

  await page.goto("/admin");
  await expect(page.getByRole("alert").filter({ hasText: "administradores" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Administração" })).toHaveCount(0);

  await page.goto(`/portfolio/gestao?artista=${OUTRO_ARTISTA.id}`);
  await expect(page.getByRole("heading", { name: "Cadastrar trabalho" })).toBeVisible();
  // Nenhuma das recusas do portfólio (o Next também tem um role=alert, o anunciador de rotas).
  await expect(
    page.getByRole("alert").filter({ hasText: /seu próprio portfólio|gerenciado pela equipe/ }),
  ).toHaveCount(0);
  await expect(page.getByText(OUTRO_ARTISTA.trabalho.titulo)).toHaveCount(0);
});
