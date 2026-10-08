import { cn } from "cn";

import type { SituacaoCliente } from "@/modules/orders";

export const ROTULO_SITUACAO: Record<SituacaoCliente, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_PREPARACAO: "Em preparação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const COR: Partial<Record<SituacaoCliente, string>> = {
  AGUARDANDO_PAGAMENTO: "bg-[var(--kolo-acao)] text-[var(--kolo-acao-texto)]",
  CANCELADO: "bg-[var(--kolo-erro-fundo)] text-[var(--kolo-erro-texto)]",
};

// Data do pedido no fuso de São Paulo (RN09), como no número do pedido.
export function dataDoPedido(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function EtiquetaSituacao({ situacao }: { situacao: SituacaoCliente }) {
  return (
    <span
      className={cn(
        "inline-block rounded-campo border-2 border-neutro-grafite bg-[var(--kolo-superficie)] px-2 py-1 font-display text-etiqueta uppercase text-[var(--kolo-superficie-texto)]",
        COR[situacao],
      )}
    >
      {ROTULO_SITUACAO[situacao]}
    </span>
  );
}
