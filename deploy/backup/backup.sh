#!/bin/sh
# Um backup do banco agora (RNF16): pg_dump no formato custom (já comprimido), 7 dias guardados
# na VPS e, com as variáveis R2_BACKUP_* preenchidas, uma cópia no bucket do R2. A regra de ciclo
# de vida do bucket apaga lá o que passa de 7 dias.
# Uso manual: docker compose --env-file .env.production -f docker-compose.prod.yml exec backup backup.sh
set -eu

PASTA=/backups
arquivo="$PASTA/kolo-$(date +%Y%m%d-%H%M%S).dump"

pg_dump --format=custom --no-owner --no-privileges --file="$arquivo.parcial"
mv "$arquivo.parcial" "$arquivo"
echo "backup: $(basename "$arquivo") ($(du -h "$arquivo" | cut -f1))"

find "$PASTA" -name 'kolo-*.dump' -mtime +7 -delete

if [ -n "${R2_BACKUP_BUCKET:-}" ] && [ -n "${R2_BACKUP_ACCESS_KEY_ID:-}" ] && [ -n "${R2_BACKUP_SECRET_ACCESS_KEY:-}" ] && [ -n "${R2_ACCOUNT_ID:-}" ]; then
  AWS_ACCESS_KEY_ID="$R2_BACKUP_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_BACKUP_SECRET_ACCESS_KEY" \
  AWS_DEFAULT_REGION=auto \
  AWS_REQUEST_CHECKSUM_CALCULATION=when_required \
  AWS_RESPONSE_CHECKSUM_VALIDATION=when_required \
    aws s3 cp "$arquivo" "s3://$R2_BACKUP_BUCKET/$(basename "$arquivo")" \
      --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" --only-show-errors
  echo "backup: copiado para r2://$R2_BACKUP_BUCKET"
else
  echo "backup: R2_BACKUP_* vazias; ficou só na VPS"
fi
