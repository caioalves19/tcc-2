import { expect, it } from "vitest";
import { montarPreferencia } from "../../src/modules/payments";

const EXPIRA = new Date("2026-10-10T15:10:00.000Z");

const pedido = (extra: Record<string, unknown> = {}) => ({
  numero: "20261010-ABC234",
  situacao: "PENDENTE" as const,
  modalidade: "RETIRADA" as const,
  criadoEm: new Date("2026-10-10T15:00:00.000Z"),
  reservaExpiraEm: EXPIRA,
  itens: [
    { obraId: "obra-1", titulo: "Metrópole em chamas", precoCentavos: 285000, quantidade: 1 },
    { obraId: "obra-2", titulo: "Gravura azul", precoCentavos: 9990, quantidade: 2 },
  ],
  endereco: {
    destinatario: "Lucas Silveira",
    cep: "01327-000",
    logradouro: "Rua Treze de Maio",
    numero: "450",
    complemento: null,
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP" as const,
  },
  subtotalCentavos: 304980,
  freteCentavos: 0,
  totalCentavos: 304980,
  ...extra,
});

it("RF13 a preferência leva o número do pedido, os itens gravados em reais e vence com a reserva (RN03)", () => {
  expect(montarPreferencia(pedido(), "https://kolo.com.br/")).toEqual({
    ok: true,
    dados: {
      items: [
        {
          id: "obra-1",
          title: "Metrópole em chamas",
          quantity: 1,
          unit_price: 2850,
          currency_id: "BRL",
        },
        { id: "obra-2", title: "Gravura azul", quantity: 2, unit_price: 99.9, currency_id: "BRL" },
      ],
      external_reference: "20261010-ABC234",
      back_urls: {
        success: "https://kolo.com.br/checkout/20261010-ABC234?retorno=mercadopago",
        pending: "https://kolo.com.br/checkout/20261010-ABC234?retorno=mercadopago",
        failure: "https://kolo.com.br/checkout/20261010-ABC234?retorno=mercadopago",
      },
      auto_return: "approved",
      notification_url: "https://kolo.com.br/api/webhooks/mercadopago",
      expires: true,
      expiration_date_to: "2026-10-10T15:10:00.000Z",
    },
  });
});

it("RF13 fora de https (desenvolvimento local) a preferência não pede webhook nem retorno automático", () => {
  const resultado = montarPreferencia(pedido(), "http://localhost:3000");
  expect(resultado).toMatchObject({
    ok: true,
    dados: {
      back_urls: { success: "http://localhost:3000/checkout/20261010-ABC234?retorno=mercadopago" },
    },
  });
  expect(resultado.ok && resultado.dados).not.toHaveProperty("notification_url");
  expect(resultado.ok && resultado.dados).not.toHaveProperty("auto_return");
});

it("RF13/RN07 recusa montar a preferência sem reserva ativa ou com total que não fecha com os itens", () => {
  const recusa = { ok: false, erro: "invalido" };
  expect(montarPreferencia(pedido({ reservaExpiraEm: null }), "https://kolo.com.br")).toMatchObject(
    recusa,
  );
  // Frete ainda não vai para o Mercado Pago (PBI-42): cobrar menos que o total seria pior.
  expect(
    montarPreferencia(
      pedido({ freteCentavos: 1500, totalCentavos: 306480 }),
      "https://kolo.com.br",
    ),
  ).toMatchObject(recusa);
  expect(montarPreferencia(pedido({ totalCentavos: 304979 }), "https://kolo.com.br")).toMatchObject(
    recusa,
  );
});
