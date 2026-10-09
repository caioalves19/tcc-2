import { cn } from "cn";

import type { PedidoDetalhado } from "@/modules/orders";
import { rotuloSituacao, type SituacaoCliente } from "@/modules/orders/cliente";

type Modalidade = PedidoDetalhado["modalidade"];

const COR: Partial<Record<SituacaoCliente | "NAO_CONCLUIDO", string>> = {
  AGUARDANDO_PAGAMENTO: "bg-[var(--kolo-acao)] text-[var(--kolo-acao-texto)]",
  CANCELADO: "bg-[var(--kolo-erro-fundo)] text-[var(--kolo-erro-texto)]",
};

// Data do pedido no fuso de São Paulo (RN09), como no número do pedido.
export function dataDoPedido(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Etiqueta da situação, na conta do cliente (PBI-29) e no admin (PBI-30). O rótulo depende da
// modalidade: na retirada, ENVIADO é "Pronto para retirada".
export function EtiquetaSituacao({
  situacao,
  modalidade,
}: {
  situacao: SituacaoCliente | "NAO_CONCLUIDO";
  modalidade: Modalidade;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-campo border-2 border-neutro-grafite bg-[var(--kolo-superficie)] px-2 py-1 font-display text-etiqueta uppercase text-[var(--kolo-superficie-texto)]",
        COR[situacao],
      )}
    >
      {rotuloSituacao(situacao, modalidade)}
    </span>
  );
}
