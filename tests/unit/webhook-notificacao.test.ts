import { expect, it } from "vitest";
import { lerPagamento } from "../../src/modules/payments";

// Recorte do GET /v1/payments/{id}, com os dados do pagador que o Kolô não deve guardar.
const APROVADO = {
  id: 182441100783,
  status: "approved",
  status_detail: "accredited",
  payment_type_id: "credit_card",
  payment_method_id: "visa",
  transaction_amount: 150,
  currency_id: "BRL",
  external_reference: "20261010-6XV73U",
  date_created: "2026-10-10T11:58:12.000-04:00",
  date_approved: "2026-10-10T11:58:14.000-04:00",
  date_of_expiration: null,
  payer: { email: "comprador@teste.com", identification: { type: "CPF", number: "12345678909" } },
  card: { first_six_digits: "423564", last_four_digits: "5682", cardholder: { name: "APRO" } },
};

const com = (troca: Record<string, unknown>) => ({ ...APROVADO, ...troca });

it("RN05 lê o cartão aprovado e guarda só os campos do pagamento, sem dados do pagador", () => {
  expect(lerPagamento(APROVADO)).toEqual({
    ok: true,
    dados: {
      idExterno: "182441100783",
      numeroPedido: "20261010-6XV73U",
      situacao: "APROVADO",
      meio: "CARTAO",
      valorCentavos: 15000,
      moeda: "BRL",
      venceEm: null,
      registro: {
        id: 182441100783,
        status: "approved",
        status_detail: "accredited",
        payment_type_id: "credit_card",
        payment_method_id: "visa",
        transaction_amount: 150,
        currency_id: "BRL",
        external_reference: "20261010-6XV73U",
        date_created: "2026-10-10T11:58:12.000-04:00",
        date_approved: "2026-10-10T11:58:14.000-04:00",
        date_of_expiration: null,
      },
    },
  });
});

it("RN07 converte o valor para centavos inteiros, sem erro de ponto flutuante", () => {
  const lido = lerPagamento(com({ transaction_amount: 4800.1 }));
  expect(lido.ok && lido.dados.valorCentavos).toBe(480010);
});

it.each([
  ["approved", "APROVADO"],
  ["pending", "PENDENTE"],
  ["in_process", "PENDENTE"],
  ["authorized", "PENDENTE"],
  ["rejected", "RECUSADO"],
  ["cancelled", "RECUSADO"],
  ["refunded", "ESTORNADO"],
  ["charged_back", "ESTORNADO"],
])("RN05 a situação %s do Mercado Pago vira %s", (status, situacao) => {
  const lido = lerPagamento(com({ status }));
  expect(lido.ok && lido.dados.situacao).toBe(situacao);
});

it("RN05 situação sem efeito no pedido (disputa aberta) é ignorada, sem virar outra", () => {
  expect(lerPagamento(com({ status: "in_mediation" }))).toEqual({
    ok: false,
    erro: "situacao_ignorada",
  });
});

it.each([
  ["credit_card", "visa", "CARTAO"],
  ["debit_card", "debelo", "CARTAO"],
  ["prepaid_card", "master", "CARTAO"],
  ["bank_transfer", "pix", "PIX"],
  ["ticket", "bolbradesco", "BOLETO"],
  ["account_money", "account_money", "SALDO_MERCADO_PAGO"],
])("RF13 o tipo %s (%s) vira o meio %s", (tipo, metodo, meio) => {
  const lido = lerPagamento(com({ payment_type_id: tipo, payment_method_id: metodo }));
  expect(lido.ok && lido.dados.meio).toBe(meio);
});

it("RF13 meio que o Kolô não conhece volta com o tipo, para não ser gravado como outro", () => {
  expect(lerPagamento(com({ payment_type_id: "digital_currency" }))).toEqual({
    ok: false,
    erro: "meio_desconhecido",
    tipo: "digital_currency",
  });
});

it("RN06 o Pix pendente traz o vencimento do meio de pagamento", () => {
  const lido = lerPagamento(
    com({
      status: "pending",
      payment_type_id: "bank_transfer",
      payment_method_id: "pix",
      date_of_expiration: "2026-10-11T11:58:12.000-04:00",
    }),
  );
  expect(lido.ok && lido.dados.venceEm).toEqual(new Date("2026-10-11T15:58:12.000Z"));
});

it("RN06 vencimento ilegível fica sem data, em vez de virar uma data inválida", () => {
  const lido = lerPagamento(com({ status: "pending", date_of_expiration: "amanhã" }));
  expect(lido.ok && lido.dados.venceEm).toBeNull();
});

it.each([
  ["nada", null],
  ["sem id", { ...APROVADO, id: undefined }],
  ["valor em texto", com({ transaction_amount: "150" })],
  ["sem moeda", { ...APROVADO, currency_id: undefined }],
])("RN05 resposta da API com %s é inválida", (_caso, resposta) => {
  expect(lerPagamento(resposta)).toEqual({ ok: false, erro: "invalido" });
});
