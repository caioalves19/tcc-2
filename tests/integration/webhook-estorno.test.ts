import { expect, it, vi } from "vitest";
import {
  cenarioWebhook,
  AGORA,
  RESERVA_ATE,
  SEGREDO,
  notificacao,
  pagamentoMp,
  gatewayDeTeste,
} from "./webhook-de-teste";

// PBI-43: o webhook grava no pagamento por que ele precisa ser estornado (migração 0008), para o
// admin achar e estornar sem depender do log.
const cenario = cenarioWebhook("kolo_pbi43_webhook_estorno_test");
const { pedidoPendente } = cenario;

async function motivos(numero: string) {
  const { rows } = await cenario.db.query(
    `SELECT p.id_externo, p.situacao, p.estornar_motivo
       FROM payment p JOIN "order" o ON o.id = p.order_id WHERE o.numero = $1 ORDER BY p.id_externo`,
    [numero],
  );
  return rows;
}

it("PBI-43 aprovação de pedido cancelado fica marcada para estorno: pedido não aguardava pagamento", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const obra = await cenario.fabrica.obraPublicada("e1-cancelado", "4.800,00", 2);
  const cliente = await cenario.fabrica.novoCliente("e1-cancelado@pbi43.test");
  await cenario.fabrica.pedidoDeTeste(cliente, {
    numero: "20261012-E1CAN1",
    situacao: "CANCELADO",
    criadoEm: AGORA.toISOString(),
    obra,
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeTeste({ "710001": pagamentoMp("710001", "20261012-E1CAN1") });

  await processarNotificacao(notificacao("710001"), { gateway, segredo: SEGREDO, agora: AGORA });

  expect(await motivos("20261012-E1CAN1")).toEqual([
    { id_externo: "710001", situacao: "APROVADO", estornar_motivo: "PEDIDO_NAO_PENDENTE" },
  ]);
});

it("PBI-43 aprovação normal não fica marcada para estorno", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  await pedidoPendente("e1-normal", "20261012-E1NOR1", "e1-normal@pbi43.test");
  const gateway = gatewayDeTeste({ "710002": pagamentoMp("710002", "20261012-E1NOR1") });

  await processarNotificacao(notificacao("710002"), { gateway, segredo: SEGREDO, agora: AGORA });

  expect(await motivos("20261012-E1NOR1")).toEqual([
    { id_externo: "710002", situacao: "APROVADO", estornar_motivo: null },
  ]);
});

it("PBI-43 aprovação com valor diferente do pedido fica marcada para estorno", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  await pedidoPendente("e1-valor", "20261012-E1VAL1", "e1-valor@pbi43.test");
  vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeTeste({
    "710003": pagamentoMp("710003", "20261012-E1VAL1", { transaction_amount: 9500 }),
  });

  await processarNotificacao(notificacao("710003"), { gateway, segredo: SEGREDO, agora: AGORA });

  expect(await motivos("20261012-E1VAL1")).toEqual([
    { id_externo: "710003", situacao: "APROVADO", estornar_motivo: "VALOR_DIVERGENTE" },
  ]);
});

it("PBI-43 aprovação sem unidade livre fica marcada para estorno", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const obra = await cenario.fabrica.obraPublicada("e1-sem-estoque", "4.800,00", 2);
  const atrasado = await cenario.fabrica.novoCliente("e1-atrasado@pbi43.test");
  const outro = await cenario.fabrica.novoCliente("e1-outro@pbi43.test");
  await cenario.fabrica.pedidoDeTeste(atrasado, {
    numero: "20261012-E1SEM1",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
  });
  await cenario.fabrica.pedidoDeTeste(outro, {
    numero: "20261012-E1OUT1",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: RESERVA_ATE,
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeTeste({ "710004": pagamentoMp("710004", "20261012-E1SEM1") });

  await processarNotificacao(notificacao("710004"), { gateway, segredo: SEGREDO, agora: AGORA });

  expect(await motivos("20261012-E1SEM1")).toEqual([
    { id_externo: "710004", situacao: "APROVADO", estornar_motivo: "SEM_ESTOQUE" },
  ]);
});
