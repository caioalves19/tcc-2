import { expect, it } from "vitest";
import { cenarioWebhook, AGORA } from "./webhook-de-teste";

// PBI-43 (achado R4 do PBI-28): transições do pedido na API pública de `orders`, dentro da
// transação de quem chama (webhook, checkout e admin).
const cenario = cenarioWebhook("kolo_pbi43_transicoes_test");
const { itensNoCarrinho, estado, pedidoPendente } = cenario;

async function naTransacao<T>(executar: (tx: never) => Promise<T>): Promise<T> {
  const { obterPrisma } = await import("../../src/lib/prisma");
  return obterPrisma().$transaction((tx) => executar(tx as never));
}

it("RN05 confirmarPedidoPago paga o pedido, baixa o estoque e tira as obras do carrinho", async () => {
  const { confirmarPedidoPago } = await import("../../src/modules/orders");
  const { obra, cliente, pedidoId } = await pedidoPendente(
    "r4-pago",
    "20261012-R4PAG1",
    "r4-pago@pbi43.test",
  );
  await itensNoCarrinho(cliente, obra);

  expect(await naTransacao((tx) => confirmarPedidoPago(tx, pedidoId, AGORA))).toEqual({
    ok: true,
    estoqueBaixado: true,
  });

  expect(await estado("20261012-R4PAG1", obra)).toMatchObject({
    situacao: "PAGO",
    pagoEm: AGORA,
    estoque: 0,
    situacaoObra: "ESGOTADA",
    reservas: 0,
  });
  const { rows } = await cenario.db.query(
    "SELECT count(*)::int AS n FROM cart_item ci JOIN cart c ON c.id = ci.cart_id WHERE c.user_id = $1",
    [cliente.userId],
  );
  expect(rows[0].n).toBe(0);
});

it("RN06 cancelarPedidoPendente cancela o pedido e devolve as unidades que ele segurava", async () => {
  const { cancelarPedidoPendente } = await import("../../src/modules/orders");
  const { obra, pedidoId } = await pedidoPendente(
    "r4-cancela",
    "20261012-R4CAN1",
    "r4-cancela@pbi43.test",
  );

  expect(await naTransacao((tx) => cancelarPedidoPendente(tx, pedidoId))).toEqual({ ok: true });

  expect(await estado("20261012-R4CAN1", obra)).toMatchObject({
    situacao: "CANCELADO",
    pagoEm: null,
    estoque: 2,
    situacaoObra: "DISPONIVEL",
    reservas: 0,
  });
});

async function pedidoPago(slug: string, numero: string, situacao: "PAGO" | "ENVIADO" = "PAGO") {
  const obra = await cenario.fabrica.obraPublicada(slug, "4.800,00", 2);
  const cliente = await cenario.fabrica.novoCliente(`${slug}@pbi43.test`);
  const pedidoId = await cenario.fabrica.pedidoDeTeste(cliente, {
    numero,
    situacao,
    criadoEm: AGORA.toISOString(),
    pagoEm: AGORA.toISOString(),
    obra,
  });
  // As duas unidades já saíram do estoque na aprovação.
  await cenario.db.query(
    "UPDATE artwork SET quantidade_estoque = 0, situacao = 'ESGOTADA' WHERE id = $1",
    [obra],
  );
  return { obra, pedidoId };
}

it("PBI-43 cancelarPedidoPago cancela o pedido pago e devolve as unidades ao estoque", async () => {
  const { cancelarPedidoPago } = await import("../../src/modules/orders");
  const { obra, pedidoId } = await pedidoPago("t6-devolve", "20261012-T6DEV1");

  expect(
    await naTransacao((tx) => cancelarPedidoPago(tx, pedidoId, { devolverEstoque: true })),
  ).toEqual({ ok: true });

  expect(await estado("20261012-T6DEV1", obra)).toMatchObject({
    situacao: "CANCELADO",
    estoque: 2,
    situacaoObra: "DISPONIVEL",
  });
});

it("PBI-43 cancelarPedidoPago sem devolver estoque (a aprovação não baixou) não mexe na obra", async () => {
  const { cancelarPedidoPago } = await import("../../src/modules/orders");
  const { obra, pedidoId } = await pedidoPago("t6-sem-baixa", "20261012-T6SEM1");

  await naTransacao((tx) => cancelarPedidoPago(tx, pedidoId, { devolverEstoque: false }));

  expect(await estado("20261012-T6SEM1", obra)).toMatchObject({
    situacao: "CANCELADO",
    estoque: 0,
    situacaoObra: "ESGOTADA",
  });
});

it("PBI-43 cancelarPedidoPago devolve estoque à obra em rascunho sem publicá-la", async () => {
  const { cancelarPedidoPago } = await import("../../src/modules/orders");
  const { obra, pedidoId } = await pedidoPago("t6-rascunho", "20261012-T6RAS1");
  await cenario.db.query("UPDATE artwork SET situacao = 'RASCUNHO' WHERE id = $1", [obra]);

  await naTransacao((tx) => cancelarPedidoPago(tx, pedidoId, { devolverEstoque: true }));

  expect(await estado("20261012-T6RAS1", obra)).toMatchObject({
    estoque: 2,
    situacaoObra: "RASCUNHO",
  });
});

it("PBI-43 cancelarPedidoPago recusa pedido já enviado e não mexe em nada", async () => {
  const { cancelarPedidoPago } = await import("../../src/modules/orders");
  const { obra, pedidoId } = await pedidoPago("t6-enviado", "20261012-T6ENV1", "ENVIADO");

  expect(
    await naTransacao((tx) => cancelarPedidoPago(tx, pedidoId, { devolverEstoque: true })),
  ).toEqual({ ok: false, erro: "nao_cancelavel" });

  expect(await estado("20261012-T6ENV1", obra)).toMatchObject({
    situacao: "ENVIADO",
    estoque: 0,
  });
});
