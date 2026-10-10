import { beforeEach, expect, it, vi } from "vitest";

// Fronteira externa: o SDK é substituído para ver o que o adaptador manda e o que devolve.
const sdk = vi.hoisted(() => ({
  configs: [] as unknown[],
  criadas: [] as unknown[],
  resposta: {} as Record<string, unknown>,
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
