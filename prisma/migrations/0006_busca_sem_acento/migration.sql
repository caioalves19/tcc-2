-- PBI-41: busca do catálogo tolerante a acentos. A configuração kolo_busca é a simple (minúsculas,
-- sem stemming) com o unaccent antes: "Metrópole" e "metropole" viram o mesmo termo, no índice e
-- na consulta. O unaccent é extensão confiável (trusted) desde o Postgres 13.
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TEXT SEARCH CONFIGURATION kolo_busca (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION kolo_busca
  ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
  WITH unaccent, simple;

-- O índice da migração inicial usava a simple, sem tirar acento, e não cobria a técnica.
-- A expressão abaixo precisa ser idêntica à da consulta em src/modules/catalog/publico.ts.
DROP INDEX IF EXISTS "artwork_search_idx";
CREATE INDEX "artwork_busca_idx" ON "artwork" USING GIN (
  to_tsvector('kolo_busca', coalesce("titulo", '') || ' ' || coalesce("descricao", '') || ' ' || coalesce("tecnica", ''))
);
