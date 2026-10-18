import { randomBytes } from "node:crypto";

import { expect, test } from "@playwright/test";

import { ID_PAGAMENTO_E2E, OBRA } from "./dados";
import { avisoDePagamento } from "./webhook";

// O playwright.config.ts sorteia o segredo da rodada e o worker o herda pelo process.env.
function segredoDoWebhook(): string {
  const segredo = process.env.E2E_MP_WEBHOOK_SECRET;
  if (!segredo) throw new Error("E2E_MP_WEBHOOK_SECRET ausente: rode pelo npm run test:e2e.");
  return segredo;
}

// §13 do escopo: cadastro → catálogo → compra com pagamento aprovado → pedido confirmado.
// RF14/RN05: o pedido só passa a Pago pelo webhook assinado, nunca pela volta do navegador; e
// a obra com uma unidade fica esgotada (RN11: continua visível, sem caminho de compra).
test("RF14 o cliente compra uma obra e o pedido só fica pago pelo webhook, com a obra esgotada", async ({
  page,
  request,
}) => {
  // O site real do Mercado Pago nunca é acessado: a ida ao checkout é atendida aqui.
  await page.route("https://www.mercadopago.com.br/**", (rota) =>
    rota.fulfill({ contentType: "text/html", body: "<h1>Checkout do Mercado Pago (E2E)</h1>" }),
  );

  // RF01: cadastro pela tela; o cadastro já entra na conta.
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill("Ana Compradora");
  await page.getByLabel("E-mail").fill("e2e-cliente@kolo.test");
  await page.getByLabel("Telefone").fill("11987654321");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(`E2e-${randomBytes(9).toString("base64url")}`);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL("/");

  // RF09/RF10/RF11: catálogo → ficha → carrinho.
  await page.goto("/obras");
  await page.getByRole("link", { name: OBRA.titulo }).first().click();
  await expect(page).toHaveURL(`/obras/${OBRA.slug}`);
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByRole("link", { name: /Carrinho, 1 item/ })).toBeVisible();

  // RF05: o checkout pede um endereço de entrega.
  await page.goto("/conta");
  await page.getByLabel("Nome de quem recebe").fill("Ana Compradora");
  await page.getByLabel("CEP").fill("01310100");
  await page.getByLabel("Rua ou avenida").fill("Avenida Paulista");
  await page.getByLabel("Número", { exact: true }).fill("1000");
  await page.getByLabel("Bairro").fill("Bela Vista");
  await page.getByLabel("Cidade").fill("São Paulo");
  await page.getByLabel("UF", { exact: true }).fill("SP");
  await page.getByRole("button", { name: "Salvar endereço" }).click();
  await expect(page.getByText("Endereço salvo com sucesso.")).toBeVisible();

  // RF12/RF15: o checkout cria o pedido aguardando pagamento, com a obra reservada.
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(page).toHaveURL(/\/checkout\/\d{8}-[A-Z0-9]{6}$/);
  await expect(page.getByText("Aguardando pagamento", { exact: false })).toBeVisible();
  const numero = page.url().split("/checkout/")[1];

  // RF13: o pagamento abre no checkout do Mercado Pago.
  await page.getByRole("button", { name: "Pagar com Mercado Pago" }).click();
  await expect(page).toHaveURL(/^https:\/\/www\.mercadopago\.com\.br\//);

  // RN05: a volta do Mercado Pago, mesmo dizendo "approved" na URL, não paga o pedido.
  await page.goto(
    `/checkout/${numero}?retorno=mercadopago&status=approved&collection_status=approved` +
      `&payment_id=${ID_PAGAMENTO_E2E}&external_reference=${numero}`,
  );
  await expect(page.getByText("Estamos confirmando seu pagamento")).toBeVisible();
  await expect(page.getByText("Aguardando pagamento", { exact: false })).toBeVisible();
  await page.goto("/conta/pedidos");
  const linha = page.getByRole("listitem").filter({ hasText: `Pedido ${numero}` });
  await expect(linha).toContainText("Aguardando pagamento");

  // RF14: o aviso assinado confirma o pagamento.
  const aviso = avisoDePagamento(ID_PAGAMENTO_E2E, segredoDoWebhook());
  const resposta = await request.post(aviso.caminho, {
    headers: aviso.cabecalhos,
    data: aviso.corpo,
  });
  expect(resposta.status()).toBe(200);

  await page.reload();
  await expect(linha).toContainText("Pago");
  await expect(linha).not.toContainText("Aguardando pagamento");

  // RF14/RN11: a única unidade foi baixada; a obra continua visível, sem compra.
  await page.goto(`/obras/${OBRA.slug}`);
  await expect(page.getByText("Esgotada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar ao carrinho" })).toHaveCount(0);
});
