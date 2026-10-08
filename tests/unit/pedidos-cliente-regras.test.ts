import { describe, expect, it } from "vitest";
import { situacaoParaCliente } from "../../src/modules/orders/regras";

const pedido = (
  situacao: "PENDENTE" | "PAGO" | "PROCESSANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO",
  pagamentos: ("PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO")[] = [],
  reservaAtiva = false,
) => ({ situacao, pagamentos, reservaAtiva });

describe("RF16: situação do pedido para o cliente", () => {
  it("depois do pagamento, segue a situação operacional", () => {
    expect(situacaoParaCliente(pedido("PAGO", ["APROVADO"]))).toBe("PAGO");
    expect(situacaoParaCliente(pedido("PROCESSANDO", ["APROVADO"]))).toBe("EM_PREPARACAO");
    expect(situacaoParaCliente(pedido("ENVIADO", ["APROVADO"]))).toBe("ENVIADO");
    expect(situacaoParaCliente(pedido("ENTREGUE", ["APROVADO"]))).toBe("ENTREGUE");
  });

  it("RN06: pendente com Pix ou boleto em aberto, ou com a reserva ativa, aguarda pagamento", () => {
    expect(situacaoParaCliente(pedido("PENDENTE", ["PENDENTE"]))).toBe("AGUARDANDO_PAGAMENTO");
    expect(situacaoParaCliente(pedido("PENDENTE", ["RECUSADO", "PENDENTE"]))).toBe(
      "AGUARDANDO_PAGAMENTO",
    );
    expect(situacaoParaCliente(pedido("PENDENTE", [], true))).toBe("AGUARDANDO_PAGAMENTO");
  });

  it("checkout abandonado não aparece: pendente sem pagamento em aberto nem reserva", () => {
    expect(situacaoParaCliente(pedido("PENDENTE"))).toBeNull();
    expect(situacaoParaCliente(pedido("PENDENTE", ["RECUSADO"]))).toBeNull();
  });

  it("cancelado só aparece se houve pagamento; o cancelado por um novo checkout fica oculto", () => {
    expect(situacaoParaCliente(pedido("CANCELADO", ["RECUSADO"]))).toBe("CANCELADO");
    expect(situacaoParaCliente(pedido("CANCELADO", ["ESTORNADO"]))).toBe("CANCELADO");
    expect(situacaoParaCliente(pedido("CANCELADO"))).toBeNull();
  });
});
