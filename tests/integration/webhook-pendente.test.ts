import { expect, it, vi } from "vitest";
import {
  cenarioWebhook,
  AGORA,
  SEGREDO,
  PIX_PENDENTE,
  notificacao,
  pagamentoMp,
  gatewayDeTeste,
} from "./webhook-de-teste";

// PBI-28: Pix/boleto pendente, expirado, cartão recusado e avisos fora de ordem.
const cenario = cenarioWebhook("kolo_pbi28_pendente_test");
const { estado, pedidoPendente, vencimentoDaReserva } = cenario;

it("RN06 Pix pendente deixa o pedido pendente e prorroga a reserva até o vencimento do Pix", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra, cliente } = await pedidoPendente("t7-pix", "20261011-PIXPE1", "pix@pbi28.test");
  const gateway = gatewayDeTeste({
    "700031": pagamentoMp("700031", "20261011-PIXPE1", PIX_PENDENTE),
  });

  expect(
    await processarNotificacao(notificacao("700031"), { gateway, segredo: SEGREDO, agora: AGORA }),
  ).toEqual({ status: 200 });

  const final = await estado("20261011-PIXPE1", obra);
  expect(final).toMatchObject({ situacao: "PENDENTE", pagoEm: null, estoque: 2 });
  expect(final.pagamentos).toMatchObject([
    { id_externo: "700031", metodo: "PIX", situacao: "PENDENTE" },
  ]);
  expect(await vencimentoDaReserva(cliente.sessaoId)).toEqual([
    new Date("2026-10-12T15:00:00.000Z"),
  ]);
});

it("RN06 Pix pendente depois da reserva vencida não ressuscita a reserva e fica no log", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const obra = await cenario.fabrica.obraPublicada("t7-pix-tarde", "4.800,00", 2);
  const cliente = await cenario.fabrica.novoCliente("pixtarde@pbi28.test");
  await cenario.fabrica.pedidoDeTeste(cliente, {
    numero: "20261011-PIXTA1",
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: "2026-10-11T14:59:00.000Z",
  });
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeTeste({
    "700032": pagamentoMp("700032", "20261011-PIXTA1", PIX_PENDENTE),
  });

  expect(
    await processarNotificacao(notificacao("700032"), { gateway, segredo: SEGREDO, agora: AGORA }),
  ).toEqual({ status: 200 });

  expect(await vencimentoDaReserva(cliente.sessaoId)).toEqual([
    new Date("2026-10-11T14:59:00.000Z"),
  ]);
  expect(log).toHaveBeenCalledWith(
    "Reserva não prorrogada para o pagamento pendente",
    "20261011-PIXTA1",
    "700032",
    "sem_reserva",
  );
});

it("RN06 Pix expirado cancela o pedido pendente e devolve as unidades", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra, cliente } = await pedidoPendente(
    "t7-expira",
    "20261011-EXPIR1",
    "expira@pbi28.test",
  );
  const gateway = gatewayDeTeste({
    "700033": pagamentoMp("700033", "20261011-EXPIR1", PIX_PENDENTE),
  });
  const opcoes = { gateway, segredo: SEGREDO, agora: AGORA };
  await processarNotificacao(notificacao("700033"), opcoes);
  gateway.trocar(
    "700033",
    pagamentoMp("700033", "20261011-EXPIR1", {
      ...PIX_PENDENTE,
      status: "cancelled",
      status_detail: "expired",
    }),
  );

  expect(
    await processarNotificacao(notificacao("700033"), {
      ...opcoes,
      agora: new Date("2026-10-12T15:01:00.000Z"),
    }),
  ).toEqual({ status: 200 });

  const final = await estado("20261011-EXPIR1", obra);
  expect(final).toMatchObject({ situacao: "CANCELADO", estoque: 2, reservas: 0 });
  expect(final.pagamentos).toMatchObject([{ id_externo: "700033", situacao: "RECUSADO" }]);
  expect(await vencimentoDaReserva(cliente.sessaoId)).toEqual([]);
});

it("RN05 cartão recusado deixa o pedido pendente, para o cliente tentar de novo", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("t7-recusa", "20261011-RECUS1", "recusa@pbi28.test");
  const gateway = gatewayDeTeste({
    "700034": pagamentoMp("700034", "20261011-RECUS1", {
      status: "rejected",
      status_detail: "cc_rejected_insufficient_amount",
      date_approved: null,
    }),
  });

  expect(
    await processarNotificacao(notificacao("700034"), { gateway, segredo: SEGREDO, agora: AGORA }),
  ).toEqual({ status: 200 });

  const final = await estado("20261011-RECUS1", obra);
  expect(final).toMatchObject({ situacao: "PENDENTE", estoque: 2, reservas: 1 });
  expect(final.pagamentos).toMatchObject([
    { id_externo: "700034", metodo: "CARTAO", situacao: "RECUSADO" },
  ]);
});

it("RNF11 aviso pendente que chega depois da aprovação não faz o pagamento voltar atrás", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("t7-ordem", "20261011-ORDEM1", "ordem@pbi28.test");
  const gateway = gatewayDeTeste({ "700035": pagamentoMp("700035", "20261011-ORDEM1") });
  const opcoes = { gateway, segredo: SEGREDO, agora: AGORA };
  await processarNotificacao(notificacao("700035"), opcoes);
  gateway.trocar("700035", pagamentoMp("700035", "20261011-ORDEM1", { status: "pending" }));

  expect(await processarNotificacao(notificacao("700035"), opcoes)).toEqual({ status: 200 });

  const final = await estado("20261011-ORDEM1", obra);
  expect(final).toMatchObject({ situacao: "PAGO", estoque: 0 });
  expect(final.pagamentos).toMatchObject([{ id_externo: "700035", situacao: "APROVADO" }]);
});

it("RN06 Pix pago depois dos 10 minutos usa a reserva prorrogada e confirma o pedido", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra, cliente } = await pedidoPendente(
    "t7-pix-pago",
    "20261011-PIXOK1",
    "pixok@pbi28.test",
  );
  const outro = await cenario.fabrica.novoCliente("concorrente@pbi28.test");
  const gateway = gatewayDeTeste({
    "700036": pagamentoMp("700036", "20261011-PIXOK1", PIX_PENDENTE),
  });
  const opcoes = { gateway, segredo: SEGREDO, agora: AGORA };
  await processarNotificacao(notificacao("700036"), opcoes);
  const umaHoraDepois = new Date("2026-10-11T16:00:00.000Z");
  const { reservarItens } = await import("../../src/modules/orders");
  expect(
    await reservarItens(outro.sessaoId, [{ obraId: obra, quantidade: 1 }], umaHoraDepois),
  ).toMatchObject({ ok: false, erro: "indisponivel" });
  gateway.trocar(
    "700036",
    pagamentoMp("700036", "20261011-PIXOK1", {
      payment_type_id: "bank_transfer",
      payment_method_id: "pix",
    }),
  );

  expect(
    await processarNotificacao(notificacao("700036"), { ...opcoes, agora: umaHoraDepois }),
  ).toEqual({ status: 200 });

  const final = await estado("20261011-PIXOK1", obra);
  expect(final).toMatchObject({ situacao: "PAGO", pagoEm: umaHoraDepois, estoque: 0, reservas: 0 });
  expect(final.pagamentos).toMatchObject([{ metodo: "PIX", situacao: "APROVADO" }]);
  expect(await vencimentoDaReserva(cliente.sessaoId)).toEqual([]);
});
