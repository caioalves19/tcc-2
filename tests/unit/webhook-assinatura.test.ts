import { expect, it } from "vitest";
import { assinaturaValida } from "../../src/modules/payments";

// HMAC-SHA256 de "id:123456;request-id:bb56a2f1-...;ts:1742505638683;" com "segredo-de-teste",
// calculado fora do código (node:crypto) e colado aqui como literal.
const VALIDA = {
  assinatura:
    "ts=1742505638683,v1=5023cbe9cab59a771f066474fc4889f3def17cc04e05e8c531946c6b4d61cbe2",
  idRequisicao: "bb56a2f1-6aae-46ac-982e-9dcd3581d08e",
  idDado: "123456",
  segredo: "segredo-de-teste",
};

it("RNF11 aceita a notificação assinada pelo Mercado Pago com o segredo do Kolô", () => {
  expect(assinaturaValida(VALIDA)).toBe(true);
});

it.each([
  ["hash alterado", { assinatura: VALIDA.assinatura.replace("5023", "5024") }],
  ["segredo errado", { segredo: "outro-segredo" }],
  ["outro pagamento", { idDado: "654321" }],
  ["outra requisição", { idRequisicao: "00000000-6aae-46ac-982e-9dcd3581d08e" }],
  ["sem cabeçalho", { assinatura: null }],
  ["sem ts", { assinatura: "v1=5023cbe9cab59a771f066474fc4889f3def17cc04e05e8c531946c6b4d61cbe2" }],
  ["sem v1", { assinatura: "ts=1742505638683" }],
  ["cabeçalho malformado", { assinatura: "qualquer-coisa" }],
])("RNF11 recusa a notificação com %s", (_caso, troca) => {
  expect(assinaturaValida({ ...VALIDA, ...troca })).toBe(false);
});
