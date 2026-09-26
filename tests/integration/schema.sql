-- Execute after 0001_init in an empty, disposable PostgreSQL database:
-- psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f prisma/migrations/0001_init/migration.sql
-- psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/integration/schema.sql
-- This SQL suite is independent of Vitest; all fixtures are rolled back.
BEGIN;

DO $$
DECLARE
  entity text;
BEGIN
  FOREACH entity IN ARRAY ARRAY[
    'user', 'session', 'account', 'verification', 'address', 'artist',
    'artist_style', 'artwork', 'artwork_image', 'tag', 'artwork_tag',
    'cart', 'cart_item', 'order', 'order_item', 'payment', 'webhook_event',
    'artwork_reservation', 'tattoo_style', 'portfolio_item',
    'portfolio_item_style', 'size_tier', 'appointment', 'site_setting',
    'contact_message', 'email_log'
  ] LOOP
    IF to_regclass(format('public.%I', entity)) IS NULL THEN
      RAISE EXCEPTION 'DER entity missing: %', entity;
    END IF;
  END LOOP;
END $$;

INSERT INTO "user" (id, papel, nome, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ARTISTA', 'Artista A', 'a@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'ARTISTA', 'Artista B', 'b@example.test');

INSERT INTO artist (id, user_id, slug) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'artista-a'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'artista-b');

-- Manual appointments do not require a customer account, style or size tier.
INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, inicia_em, termina_em)
VALUES (gen_random_uuid(), 'BASE', 'Contato', '11999999999',
  '00000000-0000-0000-0000-000000000011', '2026-09-22 10:00+00', '2026-09-22 11:00+00');

DO $$
DECLARE
  rejected_by text;
BEGIN
  BEGIN
    INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, inicia_em, termina_em)
    VALUES (gen_random_uuid(), 'OVERLAP', 'Contato', '11999999999',
      '00000000-0000-0000-0000-000000000011', '2026-09-22 10:30+00', '2026-09-22 11:30+00');
    RAISE EXCEPTION 'RN08: overlapping appointments must be rejected';
  EXCEPTION WHEN exclusion_violation THEN
    GET STACKED DIAGNOSTICS rejected_by = CONSTRAINT_NAME;
    IF rejected_by <> 'appointment_no_overlap' THEN
      RAISE EXCEPTION 'Unexpected exclusion constraint: %', rejected_by;
    END IF;
  END;

  BEGIN
    INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, inicia_em, termina_em)
    VALUES (gen_random_uuid(), 'EMPTY', 'Contato', '11999999999',
      '00000000-0000-0000-0000-000000000011', '2026-09-22 12:00+00', '2026-09-22 12:00+00');
    RAISE EXCEPTION 'Empty appointment intervals must be rejected';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS rejected_by = CONSTRAINT_NAME;
    IF rejected_by <> 'appointment_valid_interval' THEN
      RAISE EXCEPTION 'Unexpected check constraint: %', rejected_by;
    END IF;
  END;
END $$;

-- Adjacent times and simultaneous appointments for different artists are valid.
INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, inicia_em, termina_em) VALUES
  (gen_random_uuid(), 'ADJACENT', 'Contato', '11999999999',
    '00000000-0000-0000-0000-000000000011', '2026-09-22 11:00+00', '2026-09-22 12:00+00'),
  (gen_random_uuid(), 'OTHER_ARTIST', 'Contato', '11999999999',
    '00000000-0000-0000-0000-000000000012', '2026-09-22 10:00+00', '2026-09-22 11:00+00');

-- Preserve the existing policy: cancelled / soft-deleted appointments free the slot.
INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, inicia_em, termina_em, situacao, excluido_em) VALUES
  (gen_random_uuid(), 'CANCELLED', 'Contato', '11999999999',
    '00000000-0000-0000-0000-000000000011', '2026-09-22 10:00+00', '2026-09-22 11:00+00', 'CANCELADO', NULL),
  (gen_random_uuid(), 'DELETED', 'Contato', '11999999999',
    '00000000-0000-0000-0000-000000000011', '2026-09-22 10:00+00', '2026-09-22 11:00+00', 'AGENDADO', now());

DO $$
BEGIN
  BEGIN
    UPDATE appointment SET situacao = 'AGENDADO' WHERE codigo = 'CANCELLED';
    RAISE EXCEPTION 'RN08: reactivating an overlapping appointment must be rejected';
  EXCEPTION WHEN exclusion_violation THEN
    NULL;
  END;
END $$;

ROLLBACK;
\echo 'PASS: DER entities, optional customer and RN08 constraints'
