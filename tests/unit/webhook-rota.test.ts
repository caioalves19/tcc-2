import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  processar: vi.fn(),
  gateway: { criarPreferencia: vi.fn(), consultarPagamento: vi.fn() },
}));
vi.mock("@/modules/payments", () => ({
  processarNotificacao: mocks.processar,
  gatewayMercadoPago: () => mocks.gateway,
}));

import { POST } from "@/app/api/webhooks/mercadopago/route";

const URL_AVISO = "https://kolo.com.br/api/webhooks/mercadopago?data.id=123&type=payment";

beforeEach(() => {
  vi.stubEnv("MP_WEBHOOK_SECRET", "segredo-do-webhook");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("RF14 repassa URL, cabeçalhos e corpo do aviso e responde com o status do processamento", async () => {
  mocks.processar.mockResolvedValue({ status: 200 });
  const corpo = { id: "aviso-1", type: "payment", data: { id: "123" } };

  const resposta = await POST(
    new Request(URL_AVISO, {
      method: "POST",
      headers: { "x-signature": "ts=1,v1=abc", "x-request-id": "req-1" },
      body: JSON.stringify(corpo),
    }),
  );

  expect(resposta.status).toBe(200);
  expect(mocks.processar).toHaveBeenCalledWith(
    { url: URL_AVISO, cabecalhos: expect.any(Headers), lerCorpo: expect.any(Function) },
    { gateway: mocks.gateway, segredo: "segredo-do-webhook" },
  );
  const [{ cabecalhos, lerCorpo }] = mocks.processar.mock.calls[0] as [
    { cabecalhos: Headers; lerCorpo: () => Promise<unknown> },
  ];
  expect(cabecalhos.get("x-signature")).toBe("ts=1,v1=abc");
  expect(await lerCorpo()).toEqual(corpo);
});

it("RNF11 o corpo só é lido por quem processa: recusado pela assinatura, nem é lido", async () => {
  mocks.processar.mockResolvedValue({ status: 401 });
  const anonimo = new Request(URL_AVISO, { method: "POST", body: "x".repeat(100_000) });

  await POST(anonimo);

  expect(anonimo.bodyUsed).toBe(false);
});

it.each([401, 500])("RNF11 devolve %i ao Mercado Pago quando o processamento pede", async (s) => {
  mocks.processar.mockResolvedValue({ status: s });
  const resposta = await POST(new Request(URL_AVISO, { method: "POST", body: "{}" }));
  expect(resposta.status).toBe(s);
});

it("RF14 corpo que não é JSON é lido como vazio", async () => {
  mocks.processar.mockResolvedValue({ status: 200 });
  await POST(new Request(URL_AVISO, { method: "POST", body: "não é json" }));
  const [{ lerCorpo }] = mocks.processar.mock.calls[0] as [{ lerCorpo: () => Promise<unknown> }];
  expect(await lerCorpo()).toBeNull();
});

it("RNF11 sem MP_WEBHOOK_SECRET responde 500 sem processar, para o Mercado Pago reenviar", async () => {
  vi.stubEnv("MP_WEBHOOK_SECRET", "");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});

  const resposta = await POST(new Request(URL_AVISO, { method: "POST", body: "{}" }));

  expect(resposta.status).toBe(500);
  expect(mocks.processar).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith("MP_WEBHOOK_SECRET não configurado");
});
