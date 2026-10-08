-- PBI-26: retirada no ateliê, sem custo, é a modalidade mínima; o PBI-42 acrescenta as demais.
CREATE TYPE "DeliveryMethod" AS ENUM ('RETIRADA');

-- O default só preenche pedidos já existentes; daqui em diante o checkout grava a modalidade.
ALTER TABLE "order" ADD COLUMN "modalidade_entrega" "DeliveryMethod" NOT NULL DEFAULT 'RETIRADA',
ADD COLUMN "session_id" UUID;
ALTER TABLE "order" ALTER COLUMN "modalidade_entrega" DROP DEFAULT;

-- Sessão que reservou as unidades (PBI-25); o webhook (PBI-28) a passa para a baixa do estoque.
-- Logout apaga a sessão e a reserva; o pedido fica, sem a sessão.
CREATE INDEX "order_session_id_idx" ON "order"("session_id");
ALTER TABLE "order" ADD CONSTRAINT "order_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
