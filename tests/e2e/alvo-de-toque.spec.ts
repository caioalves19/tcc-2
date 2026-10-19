import { expect, test } from "@playwright/test";

import { ADMIN, PEDIDO_PAGO } from "./dados";
import { entrar } from "./sessao";

// RNF20/RNF21 e docs/IDENTIDADE-VISUAL.md: alvo de toque de no mínimo 48 px. No celular, o botão
// "Marcar como …" do pedido quebra linha (o texto não cabe em 320 px), mas não pode encolher.
test("RNF20 no celular os botões de situação do pedido quebram linha sem perder o alvo de 48 px", async ({
  page,
}) => {
  await entrar(page, ADMIN.email);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`/admin/pedidos/${PEDIDO_PAGO.numero}`);

  const botoes = page.getByRole("button", { name: /^Marcar como/ });
  await expect(botoes.first()).toBeVisible();
  for (const botao of await botoes.all()) {
    const caixa = await botao.boundingBox();
    expect(caixa?.height ?? 0, await botao.innerText()).toBeGreaterThanOrEqual(48);
    expect((caixa?.x ?? 0) + (caixa?.width ?? 0)).toBeLessThanOrEqual(320);
  }
});
