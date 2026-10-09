import { describe, expect, it } from "vitest";
import {
  proximasSituacoes,
  rotuloSituacao,
  transicaoPermitida,
} from "../../src/modules/orders/regras";
import { schemaRastreio } from "../../src/modules/orders/validacao";

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

describe("RF16/RF29: rótulo da situação, o mesmo para cliente e admin", () => {
  it("na retirada no ateliê não há envio: fica pronto e o cliente retira", () => {
    expect(rotuloSituacao("ENVIADO", "RETIRADA")).toBe("Pronto para retirada");
    expect(rotuloSituacao("ENTREGUE", "RETIRADA")).toBe("Retirado");
    expect(rotuloSituacao("AGUARDANDO_PAGAMENTO", "RETIRADA")).toBe("Aguardando pagamento");
    expect(rotuloSituacao("PAGO", "RETIRADA")).toBe("Pago");
    expect(rotuloSituacao("EM_PREPARACAO", "RETIRADA")).toBe("Em preparação");
    expect(rotuloSituacao("CANCELADO", "RETIRADA")).toBe("Cancelado");
    expect(rotuloSituacao("NAO_CONCLUIDO", "RETIRADA")).toBe("Não concluído");
  });
});

describe("RF29: código de rastreio", () => {
  it("normaliza para maiúsculas, sem espaços nas pontas; vazio limpa o código", () => {
    expect(schemaRastreio.parse({ numero: "20261008-ABC234", codigo: " br123456789sp " })).toEqual({
      numero: "20261008-ABC234",
      codigo: "BR123456789SP",
    });
    expect(schemaRastreio.parse({ numero: "20261008-ABC234", codigo: "jd-0001-xyz" }).codigo).toBe(
      "JD-0001-XYZ",
    );
    expect(schemaRastreio.parse({ numero: "20261008-ABC234", codigo: "  " }).codigo).toBeNull();
  });

  it("recusa código curto, longo ou com caracteres fora de letras, números e hífen", () => {
    for (const codigo of ["AB1", "BR 123 456", "BR123/456", "A".repeat(41), "ÇÃO12345"])
      expect(schemaRastreio.safeParse({ numero: "20261008-ABC234", codigo }).success, codigo).toBe(
        false,
      );
    expect(schemaRastreio.safeParse({ numero: "", codigo: "BR123456789SP" }).success).toBe(false);
  });
});
