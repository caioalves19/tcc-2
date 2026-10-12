import { z } from "zod";

export type SituacaoPagamento = "PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO";
export type MeioPagamento = "PIX" | "CARTAO" | "BOLETO" | "SALDO_MERCADO_PAGO";

// Só o que o Kolô usa ou precisa para conferir depois; nada do pagador (e-mail, documento,
// cartão), que fica no Mercado Pago.
const schemaPagamento = z.object({
  id: z.union([z.number(), z.string()]),
  status: z.string(),
  status_detail: z.string().nullish(),
  payment_type_id: z.string(),
  payment_method_id: z.string().nullish(),
  transaction_amount: z.number(),
  currency_id: z.string(),
  external_reference: z.string().nullish(),
  date_created: z.string().nullish(),
  date_approved: z.string().nullish(),
  date_of_expiration: z.string().nullish(),
});

export type RegistroPagamento = z.infer<typeof schemaPagamento>;

export type PagamentoLido = {
  idExterno: string;
  numeroPedido: string | null;
  situacao: SituacaoPagamento;
  meio: MeioPagamento;
  valorCentavos: number;
  moeda: string;
  venceEm: Date | null;
  registro: RegistroPagamento;
};

export type ResultadoLeitura =
  | { ok: true; dados: PagamentoLido }
  | { ok: false; erro: "invalido" | "situacao_ignorada" }
  | { ok: false; erro: "meio_desconhecido"; tipo: string };

// Situações do Mercado Pago. Disputa aberta (in_mediation) e qualquer outra não muda o pedido:
// o estorno é do PBI-43.
const SITUACOES: Record<string, SituacaoPagamento> = {
  approved: "APROVADO",
  pending: "PENDENTE",
  in_process: "PENDENTE",
  authorized: "PENDENTE",
  rejected: "RECUSADO",
  cancelled: "RECUSADO",
  refunded: "ESTORNADO",
  charged_back: "ESTORNADO",
};

// Tipos que o Checkout Pro oferece no Brasil. O saldo da conta Mercado Pago não pode ser
// excluído da preferência, então tem meio próprio em vez de virar cartão.
const MEIOS: Record<string, MeioPagamento> = {
  credit_card: "CARTAO",
  debit_card: "CARTAO",
  prepaid_card: "CARTAO",
  bank_transfer: "PIX",
  ticket: "BOLETO",
  account_money: "SALDO_MERCADO_PAGO",
};

// RN05: traduz a resposta da API de pagamentos (a fonte da verdade, nunca a URL de retorno).
export function lerPagamento(resposta: unknown): ResultadoLeitura {
  const lido = schemaPagamento.safeParse(resposta);
  if (!lido.success) return { ok: false, erro: "invalido" };
  const registro = lido.data;
  const situacao = SITUACOES[registro.status];
  if (!situacao) return { ok: false, erro: "situacao_ignorada" };
  const meio = MEIOS[registro.payment_type_id];
  if (!meio) return { ok: false, erro: "meio_desconhecido", tipo: registro.payment_type_id };
  // RN06: até quando o Pix ou o boleto pode ser pago; data ilegível fica sem prorrogação.
  const vence = registro.date_of_expiration ? new Date(registro.date_of_expiration) : null;
  return {
    ok: true,
    dados: {
      idExterno: String(registro.id),
      numeroPedido: registro.external_reference ?? null,
      situacao,
      meio,
      valorCentavos: Math.round(registro.transaction_amount * 100),
      moeda: registro.currency_id,
      venceEm: vence && !Number.isNaN(vence.getTime()) ? vence : null,
      registro,
    },
  };
}
