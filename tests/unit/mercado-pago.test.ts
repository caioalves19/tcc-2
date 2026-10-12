import { beforeEach, expect, it, vi } from "vitest";

// Fronteira externa: o SDK é substituído para ver o que o adaptador manda e o que devolve.
const sdk = vi.hoisted(() => ({
  configs: [] as unknown[],
  criadas: [] as unknown[],
  resposta: {} as Record<string, unknown>,
  consultas: [] as unknown[],
  pagamento: {} as Record<string, unknown>,
  falha: null as Error | null,
  estornos: [] as unknown[],
  cancelamentos: [] as unknown[],
}));
vi.mock("mercadopago", () => ({
  MercadoPagoConfig: class {
    constructor(config: unknown) {
      sdk.configs.push(config);
    }
  },
  Preference: class {
    async create(dados: unknown) {
      sdk.criadas.push(dados);
      return sdk.resposta;
    }
  },
  Payment: class {
    async get(dados: unknown) {
      sdk.consultas.push(dados);
      if (sdk.falha) throw sdk.falha;
      return sdk.pagamento;
    }
    async cancel(dados: unknown) {
      sdk.cancelamentos.push(dados);
      if (sdk.falha) throw sdk.falha;
      return { id: 1, status: "cancelled" };
    }
  },
  PaymentRefund: class {
    async total(dados: unknown) {
      sdk.estornos.push(dados);
      if (sdk.falha) throw sdk.falha;
      return { id: 99, status: "approved" };
    }
  },
}));

import { gatewayMercadoPago, type CorpoPreferencia } from "../../src/modules/payments";

const CORPO: CorpoPreferencia = {
  items: [{ id: "obra-1", title: "Gravura", quantity: 1, unit_price: 99.9, currency_id: "BRL" }],
  external_reference: "20261010-ABC234",
  back_urls: {
    success: "https://kolo.com.br/checkout/20261010-ABC234?retorno=mercadopago",
    pending: "https://kolo.com.br/checkout/20261010-ABC234?retorno=mercadopago",
    failure: "https://kolo.com.br/checkout/20261010-ABC234?retorno=mercadopago",
  },
  expires: true,
  expiration_date_to: "2026-10-10T15:10:00.000Z",
};

beforeEach(() => {
  sdk.configs.length = 0;
  sdk.criadas.length = 0;
  sdk.consultas.length = 0;
  sdk.estornos.length = 0;
  sdk.cancelamentos.length = 0;
  sdk.falha = null;
  sdk.resposta = {
    id: "pref-1",
    init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
  };
});

it("RF13 cria a preferência com o token do ambiente e devolve a URL do checkout hospedado", async () => {
  const gateway = gatewayMercadoPago("APP_USR-teste");

  expect(await gateway.criarPreferencia(CORPO)).toEqual({
    url: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
  });
  expect(sdk.configs).toEqual([expect.objectContaining({ accessToken: "APP_USR-teste" })]);
  expect(sdk.criadas).toEqual([{ body: CORPO, requestOptions: expect.any(Object) }]);
});

it("RNF12 sem MP_ACCESS_TOKEN o adaptador não chama o Mercado Pago e lança erro de configuração", async () => {
  await expect(gatewayMercadoPago("").criarPreferencia(CORPO)).rejects.toThrow("MP_ACCESS_TOKEN");
  expect(sdk.criadas).toEqual([]);
});

it("RF13 resposta sem init_point vira erro, nunca um redirecionamento vazio", async () => {
  sdk.resposta = { id: "pref-1" };
  await expect(gatewayMercadoPago("APP_USR-teste").criarPreferencia(CORPO)).rejects.toThrow(
    "init_point",
  );
});

it("RF13 só redireciona para o checkout do próprio Mercado Pago, em https", async () => {
  const gateway = gatewayMercadoPago("APP_USR-teste");
  for (const init_point of [
    "https://evil.example/checkout",
    "http://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
    "https://mercadopago.com.br.evil.example/x",
    "javascript:alert(1)",
  ]) {
    sdk.resposta = { id: "pref-1", init_point };
    await expect(gateway.criarPreferencia(CORPO)).rejects.toThrow("init_point");
  }
  sdk.resposta = {
    id: "pref-1",
    init_point: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
  };
  expect(await gateway.criarPreferencia(CORPO)).toEqual({
    url: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
  });
});

it("RF14 consulta o pagamento pelo id do aviso, com o token do ambiente e tempo limite", async () => {
  sdk.pagamento = { id: 182441100783, status: "approved" };

  expect(await gatewayMercadoPago("APP_USR-teste").consultarPagamento("182441100783")).toEqual({
    id: 182441100783,
    status: "approved",
  });
  expect(sdk.configs).toEqual([expect.objectContaining({ accessToken: "APP_USR-teste" })]);
  expect(sdk.consultas).toEqual([{ id: "182441100783", requestOptions: { timeout: 10_000 } }]);
});

it("RNF12 sem MP_ACCESS_TOKEN a consulta não chama o Mercado Pago e lança erro de configuração", async () => {
  await expect(gatewayMercadoPago("").consultarPagamento("1")).rejects.toThrow("MP_ACCESS_TOKEN");
  expect(sdk.consultas).toEqual([]);
});

it("RF14 pagamento que a API não encontra (404) volta null, não erro", async () => {
  sdk.falha = Object.assign(new Error("not_found"), { name: "MPNotFoundError", status: 404 });
  expect(await gatewayMercadoPago("APP_USR-teste").consultarPagamento("123456")).toBeNull();
});

it("RF14 outras falhas da API seguem como erro, para o webhook pedir reenvio", async () => {
  sdk.falha = Object.assign(new Error("server"), { name: "MPServerError", status: 503 });
  await expect(gatewayMercadoPago("APP_USR-teste").consultarPagamento("1")).rejects.toThrow(
    "server",
  );
});

it("PBI-43 estorna o valor total do pagamento com chave de idempotência e tempo limite", async () => {
  await gatewayMercadoPago("APP_USR-teste").estornarPagamento("182441100783", "estorno-abc");

  expect(sdk.configs).toEqual([expect.objectContaining({ accessToken: "APP_USR-teste" })]);
  expect(sdk.estornos).toEqual([
    {
      payment_id: "182441100783",
      requestOptions: { timeout: 10_000, idempotencyKey: "estorno-abc" },
    },
  ]);
});

it("PBI-43 cancela o Pix ou boleto em aberto pelo id, com tempo limite", async () => {
  await gatewayMercadoPago("APP_USR-teste").cancelarPagamento("182441100784");

  expect(sdk.cancelamentos).toEqual([{ id: "182441100784", requestOptions: { timeout: 10_000 } }]);
});

it("RNF12 sem MP_ACCESS_TOKEN estorno e cancelamento não chamam o Mercado Pago", async () => {
  const gateway = gatewayMercadoPago("");
  await expect(gateway.estornarPagamento("1", "chave")).rejects.toThrow("MP_ACCESS_TOKEN");
  await expect(gateway.cancelarPagamento("1")).rejects.toThrow("MP_ACCESS_TOKEN");
  expect(sdk.estornos).toEqual([]);
  expect(sdk.cancelamentos).toEqual([]);
});
