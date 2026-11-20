#!/bin/sh
# Prova de restauração (RNF16): restaura um dump num banco descartável e compara a contagem de
# linhas das tabelas principais com o banco de produção. Não toca no banco de produção.
#   restaurar.sh                      → o dump mais recente de /backups
#   restaurar.sh kolo-AAAAMMDD-HHMMSS.dump
# Restauração de verdade, depois de uma perda: ver docs/DEPLOY.md, "Restaurar a produção".
set -eu

PASTA=/backups
if [ $# -gt 0 ]; then
  arquivo="$PASTA/$(basename "$1")"
else
  arquivo=$(ls -1t "$PASTA"/kolo-*.dump 2>/dev/null | head -1)
fi
[ -n "$arquivo" ] && [ -f "$arquivo" ] || { echo "restaurar: nenhum dump encontrado em $PASTA"; exit 1; }

TESTE=kolo_restauracao
psql -q -d postgres -c "DROP DATABASE IF EXISTS $TESTE" -c "CREATE DATABASE $TESTE"
trap 'psql -q -d postgres -c "DROP DATABASE IF EXISTS $TESTE"' EXIT

pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TESTE" "$arquivo"
echo "restaurar: $(basename "$arquivo") restaurado em $TESTE"

contar() { psql -tA -d "$1" -c "SELECT count(*) FROM \"$2\""; }
diferentes=0
for tabela in user artwork artist "order" portfolio_item; do
  producao=$(contar "$PGDATABASE" "$tabela")
  restaurado=$(contar "$TESTE" "$tabela")
  echo "restaurar: $tabela produção=$producao restaurado=$restaurado"
  [ "$producao" = "$restaurado" ] || diferentes=$((diferentes + 1))
done

if [ "$diferentes" -eq 0 ]; then
  echo "restaurar: conferido, as contagens batem"
else
  echo "restaurar: $diferentes tabela(s) com contagem diferente (dados mudaram depois do dump?)"
  exit 1
fi
