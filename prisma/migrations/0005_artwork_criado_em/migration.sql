-- PBI-19: data de cadastro da obra, para o catálogo ordenar por "mais recentes".
-- As obras que já existem recebem a data desta migração.
ALTER TABLE "artwork" ADD COLUMN "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
