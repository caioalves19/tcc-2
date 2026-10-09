import { describe, expect, it } from "vitest";
import { proximasSituacoes, transicaoPermitida } from "../../src/modules/orders/regras";

const SITUACOES = ["PENDENTE", "PAGO", "PROCESSANDO", "ENVIADO", "ENTREGUE", "CANCELADO"] as const;

describe("RF29: o admin muda só a situação operacional, para frente", () => {
  it("de pago em diante avança, podendo pular etapas, e nunca volta", () => {
    const permitidas = SITUACOES.flatMap((de) =>
      SITUACOES.filter((para) => transicaoPermitida(de, para)).map((para) => `${de}→${para}`),
    );
    expect(permitidas).toEqual([
      "PAGO→PROCESSANDO",
      "PAGO→ENVIADO",
      "PAGO→ENTREGUE",
      "PROCESSANDO→ENVIADO",
      "PROCESSANDO→ENTREGUE",
      "ENVIADO→ENTREGUE",
    ]);
  });

  it("RN05: nada leva a pago nem tira do pendente; cancelar fica fora desta tela", () => {
    for (const de of SITUACOES) {
      expect(transicaoPermitida(de, "PAGO"), `${de}→PAGO`).toBe(false);
      expect(transicaoPermitida(de, "CANCELADO"), `${de}→CANCELADO`).toBe(false);
      expect(transicaoPermitida("PENDENTE", de), `PENDENTE→${de}`).toBe(false);
    }
  });

  it("lista as próximas situações possíveis, na ordem do andamento", () => {
    expect(proximasSituacoes("PAGO")).toEqual(["PROCESSANDO", "ENVIADO", "ENTREGUE"]);
    expect(proximasSituacoes("ENVIADO")).toEqual(["ENTREGUE"]);
    expect(proximasSituacoes("ENTREGUE")).toEqual([]);
    expect(proximasSituacoes("PENDENTE")).toEqual([]);
    expect(proximasSituacoes("CANCELADO")).toEqual([]);
  });
});
