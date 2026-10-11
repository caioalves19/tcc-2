-- PBI-28: o saldo da conta Mercado Pago aparece no Checkout Pro e não pode ser excluído da
-- preferência; o pagamento é gravado com o meio certo, não como cartão.
ALTER TYPE "PaymentMethod" ADD VALUE 'SALDO_MERCADO_PAGO';

-- RNF11: notificações repetidas do mesmo pagamento atualizam uma linha só. id_externo nulo
-- (pagamento ainda sem id do provedor) não conflita.
CREATE UNIQUE INDEX "payment_provedor_id_externo_key" ON "payment"("provedor", "id_externo");
