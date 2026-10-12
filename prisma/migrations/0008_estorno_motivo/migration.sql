-- PBI-43: por que um pagamento aprovado precisa ser estornado pelo admin. O webhook grava o
-- motivo quando a aprovação não paga o pedido (ou paga sem unidade livre); nulo é pagamento normal.
CREATE TYPE "RefundReason" AS ENUM ('PEDIDO_NAO_PENDENTE', 'VALOR_DIVERGENTE', 'SEM_ESTOQUE');

ALTER TABLE "payment" ADD COLUMN "estornar_motivo" "RefundReason";
