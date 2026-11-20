#!/usr/bin/env bash
# Gate do PBI-46: confere a pilha de produção que já está de pé.
#   deploy/verificar.sh                 → contra https://localhost (simulação local)
#   deploy/verificar.sh meu.dominio     → contra o domínio publicado, rodando na VPS
# Sai com código 0 só se todas as conferências passarem.
set -uo pipefail
cd "$(dirname "$0")/.."

DOMINIO="${1:-localhost}"
C=(docker compose --env-file .env.production -f docker-compose.prod.yml)
falhas=0
ok() { echo "ok     $1"; }
falha() { echo "FALHA  $1"; falhas=$((falhas + 1)); }

# Em localhost o Caddy usa a própria autoridade local; no domínio o certificado tem de ser válido.
CURL=(curl -sS --max-time 15)
[ "$DOMINIO" = "localhost" ] && CURL+=(-k)

echo "== 1. Contêineres de pé (RNF15)"
for servico in caddy app postgres backup; do
  estado=$("${C[@]}" ps --format '{{.State}}' "$servico" 2>/dev/null)
  [ "$estado" = "running" ] && ok "$servico running" || falha "$servico está '${estado:-ausente}'"
done

echo "== 2. HTTPS e cabeçalhos (RNF01, RNF07)"
cabecalhos=$("${CURL[@]}" -o /dev/null -D - "https://$DOMINIO/" 2>&1)
echo "$cabecalhos" | head -1 | grep -q " 200" && ok "https://$DOMINIO/ responde 200" || falha "https://$DOMINIO/ não respondeu 200: $(echo "$cabecalhos" | head -1)"
for cabecalho in strict-transport-security content-security-policy x-content-type-options referrer-policy; do
  echo "$cabecalhos" | grep -qi "^$cabecalho:" && ok "cabeçalho $cabecalho" || falha "falta o cabeçalho $cabecalho"
done
echo "$cabecalhos" | grep -qi "^server:" && falha "a resposta anuncia o servidor (Server)" || ok "sem cabeçalho Server"

echo "== 3. HTTP redireciona para HTTPS (RNF01)"
redirecionamento=$(curl -sS --max-time 15 -o /dev/null -D - "http://$DOMINIO/" 2>&1)
echo "$redirecionamento" | head -1 | grep -Eq " 30[18]" && echo "$redirecionamento" | grep -qi "^location: https://" \
  && ok "http → https" || falha "http não redireciona para https: $(echo "$redirecionamento" | head -1)"

echo "== 4. Banco e app fora da internet"
for servico in postgres app backup; do
  publicadas=$(docker port "$("${C[@]}" ps -q "$servico")" 2>/dev/null)
  [ -z "$publicadas" ] && ok "$servico sem porta publicada" || falha "$servico publica: $publicadas"
done

echo "== 5. Backup e restauração (RNF16)"
if "${C[@]}" exec -T backup backup.sh; then
  ok "backup gerado"
  if "${C[@]}" exec -T backup restaurar.sh; then ok "restauração conferida"; else falha "restauração não conferiu"; fi
else
  falha "backup falhou"
fi

echo "== 6. Reinício automático do app (RNF15)"
# Mata o Node por dentro, como numa queda de verdade. `docker kill`/`stop` contam como parada
# manual, e aí o Docker (corretamente) não reinicia o contêiner.
reinicios_antes=$(docker inspect --format '{{.RestartCount}}' "$("${C[@]}" ps -q app)")
"${C[@]}" exec -T app sh -c 'kill -9 $(cat /proc/1/task/1/children)' >/dev/null 2>&1
sleep 3
voltou=0
for _ in $(seq 1 45); do
  sleep 2
  if "${CURL[@]}" -o /dev/null -w '%{http_code}' "https://$DOMINIO/" 2>/dev/null | grep -q 200; then
    voltou=1
    break
  fi
done
reinicios_depois=$(docker inspect --format '{{.RestartCount}}' "$("${C[@]}" ps -q app)")
if [ "$voltou" = 1 ] && [ "$reinicios_depois" -gt "$reinicios_antes" ]; then
  ok "app caiu e voltou sozinho (reinícios: $reinicios_antes → $reinicios_depois)"
else
  falha "app não voltou sozinho (reinícios: $reinicios_antes → $reinicios_depois)"
fi

echo
if [ "$falhas" -eq 0 ]; then
  echo "Gate do deploy: tudo certo."
else
  echo "Gate do deploy: $falhas falha(s)."
fi
exit "$falhas"
