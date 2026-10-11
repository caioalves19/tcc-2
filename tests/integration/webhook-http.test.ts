import { expect, it, vi } from "vitest";
import {
  cenarioWebhook,
  AGORA,
  SEGREDO,
  notificacao,
  pagamentoMp,
  gatewayDeTeste,
} from "./webhook-de-teste";

// PBI-28: borda HTTP — assinatura, IPN, tipos de aviso e falhas da API.
const cenario = cenarioWebhook("kolo_pbi28_http_test");
const { estado, pedidoPendente } = cenario;

it("RNF11 notificação com assinatura inválida responde 401 e não consulta nem grava nada", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("t8-forjada", "20261011-FORJA1", "forjada@pbi28.test");
  const gateway = gatewayDeTeste({ "700041": pagamentoMp("700041", "20261011-FORJA1") });
  const forjada = notificacao("700041");
  forjada.cabecalhos.set("x-signature", "ts=1760194800,v1=" + "0".repeat(64));

  expect(await processarNotificacao(forjada, { gateway, segredo: SEGREDO, agora: AGORA })).toEqual({
    status: 401,
  });
  expect(
    await processarNotificacao(notificacao("700041"), {
      gateway,
      segredo: "outro-segredo",
      agora: AGORA,
    }),
  ).toEqual({ status: 401 });

  expect(gateway.consultados).toEqual([]);
  const final = await estado("20261011-FORJA1", obra);
  expect(final).toMatchObject({ situacao: "PENDENTE", estoque: 2, pagamentos: [] });
});

it("RF14 aviso que não é de pagamento responde 200 sem consultar a API", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const gateway = gatewayDeTeste({});
  const aviso = notificacao("123456789");
  aviso.url = aviso.url.replace("type=payment", "type=merchant_order");
  aviso.corpo = { ...aviso.corpo, type: "merchant_order", action: "merchant_order.updated" };

  expect(await processarNotificacao(aviso, { gateway, segredo: SEGREDO, agora: AGORA })).toEqual({
    status: 200,
  });
  expect(gateway.consultados).toEqual([]);
});

it("RNF11 avisos sem id no corpo não se confundem: cada requisição é um evento", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const a = await pedidoPendente("t8-sem-id-a", "20261011-SEMID1", "semida@pbi28.test");
  const b = await pedidoPendente("t8-sem-id-b", "20261011-SEMID2", "semidb@pbi28.test");
  const gateway = gatewayDeTeste({
    "700042": pagamentoMp("700042", "20261011-SEMID1"),
    "700043": pagamentoMp("700043", "20261011-SEMID2"),
  });
  const semId = (idPagamento: string) => {
    const aviso = notificacao(idPagamento);
    aviso.corpo = { type: "payment", data: { id: idPagamento } } as typeof aviso.corpo;
    return aviso;
  };
  const opcoes = { gateway, segredo: SEGREDO, agora: AGORA };

  await processarNotificacao(semId("700042"), opcoes);
  await processarNotificacao(semId("700043"), opcoes);

  expect((await estado("20261011-SEMID1", a.obra)).situacao).toBe("PAGO");
  expect((await estado("20261011-SEMID2", b.obra)).situacao).toBe("PAGO");
});

it("RNF11 com a API do Mercado Pago fora, responde 500 para reenviar e não grava nada", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("t8-api-fora", "20261011-APIFO1", "apifora@pbi28.test");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const fora = {
    async consultarPagamento(): Promise<unknown> {
      throw Object.assign(new Error("Service Unavailable: dados da conta"), { status: 503 });
    },
  };
  const aviso = notificacao("700044", "aviso-700044");

  expect(
    await processarNotificacao(aviso, { gateway: fora, segredo: SEGREDO, agora: AGORA }),
  ).toEqual({ status: 500 });

  expect(await estado("20261011-APIFO1", obra)).toMatchObject({
    situacao: "PENDENTE",
    pagamentos: [],
  });
  const eventos = await cenario.db.query(
    "SELECT 1 FROM webhook_event WHERE id_evento = 'mercado_pago:aviso-700044'",
  );
  expect(eventos.rowCount).toBe(0);
  // Só o tipo e o status HTTP: a mensagem do provedor pode trazer dados da conta.
  expect(log).toHaveBeenCalledWith("Falha ao processar o aviso do Mercado Pago", "Error", 503);
  const gateway = gatewayDeTeste({ "700044": pagamentoMp("700044", "20261011-APIFO1") });
  expect(await processarNotificacao(aviso, { gateway, segredo: SEGREDO, agora: AGORA })).toEqual({
    status: 200,
  });
  expect((await estado("20261011-APIFO1", obra)).situacao).toBe("PAGO");
});

it("RF13 meio de pagamento desconhecido responde 500 e fica no log, sem gravar como outro", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("t8-meio", "20261011-MEIO01", "meio@pbi28.test");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeTeste({
    "700045": pagamentoMp("700045", "20261011-MEIO01", { payment_type_id: "digital_currency" }),
  });

  expect(
    await processarNotificacao(notificacao("700045"), { gateway, segredo: SEGREDO, agora: AGORA }),
  ).toEqual({ status: 500 });

  expect(await estado("20261011-MEIO01", obra)).toMatchObject({
    situacao: "PENDENTE",
    pagamentos: [],
  });
  expect(log).toHaveBeenCalledWith(
    "Pagamento com meio que o Kolô não conhece",
    "700045",
    "digital_currency",
  );
});

it("RN05 disputa aberta no Mercado Pago responde 200 sem mexer no pedido", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const { obra } = await pedidoPendente("t8-disputa", "20261011-DISPU1", "disputa@pbi28.test");
  vi.spyOn(console, "error").mockImplementation(() => {});
  const gateway = gatewayDeTeste({
    "700046": pagamentoMp("700046", "20261011-DISPU1", { status: "in_mediation" }),
  });

  expect(
    await processarNotificacao(notificacao("700046"), { gateway, segredo: SEGREDO, agora: AGORA }),
  ).toEqual({ status: 200 });
  expect(await estado("20261011-DISPU1", obra)).toMatchObject({
    situacao: "PENDENTE",
    pagamentos: [],
  });
});

it("RF14 pagamento que a API não encontra responde 200 com log, sem reenvio sem fim", async () => {
  const { processarNotificacao } = await import("../../src/modules/payments");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const inexistente = { consultarPagamento: async () => null };

  expect(
    await processarNotificacao(notificacao("123456"), {
      gateway: inexistente,
      segredo: SEGREDO,
      agora: AGORA,
    }),
  ).toEqual({ status: 200 });
  expect(log).toHaveBeenCalledWith("Pagamento inexistente na API do Mercado Pago", "123456");
});

it.each(["payment", "merchant_order"])(
  "RF14 aviso no formato IPN (topic=%s) responde 200 sem consultar nem gravar: só o assinado muda o pedido",
  async (topico) => {
    const { processarNotificacao } = await import("../../src/modules/payments");
    const gateway = gatewayDeTeste({});
    const ipn = {
      url: `https://kolo.test/api/webhooks/mercadopago?id=183623486996&topic=${topico}`,
      cabecalhos: new Headers(),
      corpo: { resource: "183623486996", topic: topico },
    };

    expect(await processarNotificacao(ipn, { gateway, segredo: SEGREDO, agora: AGORA })).toEqual({
      status: 200,
    });
    expect(gateway.consultados).toEqual([]);
  },
);
