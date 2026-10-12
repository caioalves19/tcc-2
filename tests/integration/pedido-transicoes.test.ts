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
