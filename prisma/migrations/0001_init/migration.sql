CREATE EXTENSION IF NOT EXISTS btree_gist;

-- The tables and Prisma-generated constraints are created by the initial
-- migration before these database-level invariants are applied.

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_valid_interval"
  CHECK ("inicia_em" < "termina_em");

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "artist_id" WITH =,
    tstzrange("inicia_em", "termina_em", '[)') WITH &&
  )
  WHERE ("excluido_em" IS NULL AND "situacao" <> 'CANCELADO');

ALTER TABLE "artwork"
  ADD CONSTRAINT "artwork_non_negative_values"
  CHECK ("preco_centavos" >= 0 AND "quantidade_estoque" >= 0);

ALTER TABLE "cart_item"
  ADD CONSTRAINT "cart_item_positive_quantity"
  CHECK ("quantidade" >= 1);

ALTER TABLE "order_item"
  ADD CONSTRAINT "order_item_positive_quantity"
  CHECK ("quantidade" >= 1);

ALTER TABLE "artwork_reservation"
  ADD CONSTRAINT "artwork_reservation_positive_quantity"
  CHECK ("quantidade" >= 1);

ALTER TABLE "cart"
  ADD CONSTRAINT "cart_owner_or_cookie"
  CHECK ("user_id" IS NOT NULL OR "cookie_token" IS NOT NULL);

CREATE INDEX "artwork_search_idx"
  ON "artwork" USING GIN (to_tsvector('simple', coalesce("titulo", '') || ' ' || coalesce("descricao", '')));

CREATE INDEX "portfolio_item_search_idx"
  ON "portfolio_item" USING GIN (to_tsvector('simple', coalesce("titulo", '') || ' ' || coalesce("descricao", '')));