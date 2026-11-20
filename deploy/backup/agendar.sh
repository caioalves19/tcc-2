#!/bin/sh
# Roda o backup.sh todo dia no HORA_BACKUP (HH:MM, fuso do TZ). Laço simples no lugar do crond:
# o crond do Alpine não repassa as variáveis do contêiner para a tarefa.
set -eu
HORA="${HORA_BACKUP:-03:00}"
echo "backup: agendado para todo dia às $HORA ($TZ)"
while true; do
  agora=$(date +%s)
  alvo=$(date -d "today $HORA" +%s)
  [ "$alvo" -le "$agora" ] && alvo=$(date -d "tomorrow $HORA" +%s)
  sleep $((alvo - agora))
  backup.sh || echo "backup: falhou; tenta de novo amanhã às $HORA"
done
