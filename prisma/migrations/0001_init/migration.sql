-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CLIENTE', 'ARTISTA', 'ADMIN');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "ArtworkStatus" AS ENUM ('RASCUNHO', 'DISPONIVEL', 'ESGOTADA');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDENTE', 'PAGO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARTAO', 'BOLETO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('AGENDADO', 'CANCELADO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHO');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "papel" "user_role" NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "situacao" "user_status" NOT NULL DEFAULT 'ATIVO',
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "excluido_em" TIMESTAMPTZ(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provedor" TEXT NOT NULL,
    "id_externo" TEXT NOT NULL,
    "senha_hash" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL,
    "identificador" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "destinatario" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "cep" TEXT NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "instagram" TEXT,

    CONSTRAINT "artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_style" (
    "artist_id" UUID NOT NULL,
    "tattoo_style_id" UUID NOT NULL,

    CONSTRAINT "artist_style_pkey" PRIMARY KEY ("artist_id","tattoo_style_id")
);

-- CreateTable
CREATE TABLE "artwork" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "tecnica" TEXT,
    "dimensoes" TEXT,
    "ano" INTEGER,
    "preco_centavos" INTEGER NOT NULL,
    "quantidade_estoque" INTEGER NOT NULL DEFAULT 1,
    "situacao" "ArtworkStatus" NOT NULL DEFAULT 'RASCUNHO',
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "excluido_em" TIMESTAMPTZ(3),

    CONSTRAINT "artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_image" (
    "id" UUID NOT NULL,
    "artwork_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "texto_alternativo" TEXT,

    CONSTRAINT "artwork_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_tag" (
    "artwork_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "artwork_tag_pkey" PRIMARY KEY ("artwork_id","tag_id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "cookie_token" TEXT,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "artwork_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "adicionado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "situacao" "OrderStatus" NOT NULL DEFAULT 'PENDENTE',
    "subtotal_centavos" INTEGER NOT NULL,
    "desconto_centavos" INTEGER NOT NULL DEFAULT 0,
    "frete_centavos" INTEGER NOT NULL DEFAULT 0,
    "total_centavos" INTEGER NOT NULL,
    "endereco_copia" JSONB NOT NULL,
    "codigo_rastreio" TEXT,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pago_em" TIMESTAMPTZ(3),
    "enviado_em" TIMESTAMPTZ(3),
    "excluido_em" TIMESTAMPTZ(3),

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "artwork_id" UUID NOT NULL,
    "titulo_copia" TEXT NOT NULL,
    "preco_centavos_copia" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provedor" TEXT NOT NULL,
    "id_externo" TEXT,
    "metodo" "PaymentMethod" NOT NULL,
    "situacao" "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "valor_centavos" INTEGER NOT NULL,
    "payload" JSONB,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" UUID NOT NULL,
    "id_evento" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processado_em" TIMESTAMPTZ(3),

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_reservation" (
    "id" UUID NOT NULL,
    "artwork_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "artwork_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tattoo_style" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "tattoo_style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_item" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "imagem_url" TEXT NOT NULL,
    "regiao_corpo" TEXT,
    "duracao_minutos" INTEGER,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "portfolio_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_item_style" (
    "portfolio_item_id" UUID NOT NULL,
    "tattoo_style_id" UUID NOT NULL,

    CONSTRAINT "portfolio_item_style_pkey" PRIMARY KEY ("portfolio_item_id","tattoo_style_id")
);

-- CreateTable
CREATE TABLE "size_tier" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "size_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "user_id" UUID,
    "nome_contato" TEXT NOT NULL,
    "telefone_contato" TEXT NOT NULL,
    "artist_id" UUID NOT NULL,
    "tattoo_style_id" UUID,
    "size_tier_id" UUID,
    "situacao" "AppointmentStatus" NOT NULL DEFAULT 'AGENDADO',
    "inicia_em" TIMESTAMPTZ(3) NOT NULL,
    "termina_em" TIMESTAMPTZ(3) NOT NULL,
    "regiao_corpo" TEXT,
    "descricao" TEXT,
    "excluido_em" TIMESTAMPTZ(3),

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_setting" (
    "id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,

    CONSTRAINT "site_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_message" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "destinatario" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "situacao" "EmailLogStatus" NOT NULL,
    "metadados" JSONB,
    "enviado_em" TIMESTAMPTZ(3),

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_provedor_id_externo_key" ON "account"("provedor", "id_externo");

-- CreateIndex
CREATE INDEX "verification_identificador_idx" ON "verification"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "address_user_id_key" ON "address"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_user_id_key" ON "artist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_slug_key" ON "artist"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "artwork_slug_key" ON "artwork"("slug");

-- CreateIndex
CREATE INDEX "artwork_artist_id_idx" ON "artwork"("artist_id");

-- CreateIndex
CREATE INDEX "artwork_image_artwork_id_idx" ON "artwork_image"("artwork_id");

-- CreateIndex
CREATE UNIQUE INDEX "artwork_image_artwork_id_ordem_key" ON "artwork_image"("artwork_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "tag_nome_key" ON "tag"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cart_cookie_token_key" ON "cart"("cookie_token");

-- CreateIndex
CREATE INDEX "cart_user_id_idx" ON "cart"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_cart_id_artwork_id_key" ON "cart_item"("cart_id", "artwork_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_numero_key" ON "order"("numero");

-- CreateIndex
CREATE INDEX "order_user_id_idx" ON "order"("user_id");

-- CreateIndex
CREATE INDEX "order_item_artwork_id_idx" ON "order_item"("artwork_id");

-- CreateIndex
CREATE INDEX "payment_order_id_idx" ON "payment"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_id_evento_key" ON "webhook_event"("id_evento");

-- CreateIndex
CREATE INDEX "artwork_reservation_artwork_id_expira_em_idx" ON "artwork_reservation"("artwork_id", "expira_em");

-- CreateIndex
CREATE INDEX "artwork_reservation_session_id_idx" ON "artwork_reservation"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "tattoo_style_nome_key" ON "tattoo_style"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tattoo_style_slug_key" ON "tattoo_style"("slug");

-- CreateIndex
CREATE INDEX "portfolio_item_artist_id_idx" ON "portfolio_item"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_codigo_key" ON "appointment"("codigo");

-- CreateIndex
CREATE INDEX "appointment_artist_id_inicia_em_idx" ON "appointment"("artist_id", "inicia_em");

-- CreateIndex
CREATE UNIQUE INDEX "site_setting_chave_key" ON "site_setting"("chave");

-- CreateIndex
CREATE INDEX "email_log_user_id_idx" ON "email_log"("user_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist" ADD CONSTRAINT "artist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_style" ADD CONSTRAINT "artist_style_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_style" ADD CONSTRAINT "artist_style_tattoo_style_id_fkey" FOREIGN KEY ("tattoo_style_id") REFERENCES "tattoo_style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork" ADD CONSTRAINT "artwork_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_image" ADD CONSTRAINT "artwork_image_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_tag" ADD CONSTRAINT "artwork_tag_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_tag" ADD CONSTRAINT "artwork_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_reservation" ADD CONSTRAINT "artwork_reservation_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_reservation" ADD CONSTRAINT "artwork_reservation_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_item" ADD CONSTRAINT "portfolio_item_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_item_style" ADD CONSTRAINT "portfolio_item_style_portfolio_item_id_fkey" FOREIGN KEY ("portfolio_item_id") REFERENCES "portfolio_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_item_style" ADD CONSTRAINT "portfolio_item_style_tattoo_style_id_fkey" FOREIGN KEY ("tattoo_style_id") REFERENCES "tattoo_style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_tattoo_style_id_fkey" FOREIGN KEY ("tattoo_style_id") REFERENCES "tattoo_style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_size_tier_id_fkey" FOREIGN KEY ("size_tier_id") REFERENCES "size_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Database invariants not expressible in the Prisma schema.

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