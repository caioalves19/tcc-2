#!/usr/bin/env bash
# Gate do PBI-46: confere a pilha de produção que já está de pé.
#   deploy/verificar.sh                 → contra https://localhost (simulação local)
#   deploy/verificar.sh meu.dominio     → contra o domínio publicado, rodando na VPS
#   deploy/verificar.sh meu.dominio antigo.dominio → também confere o endereço anterior
# Sai com código 0 só se todas as conferências passarem.
set -uo pipefail
cd "$(dirname "$0")/.."

DOMINIO="${1:-localhost}"
# Na simulação local o endereço anterior é antigo.localhost (padrão do docker-compose.prod.yml).
DOMINIO_ANTIGO="${2:-}"
[ "$DOMINIO" = "localhost" ] && DOMINIO_ANTIGO="${DOMINIO_ANTIGO:-antigo.localhost}"
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

if [ -n "$DOMINIO_ANTIGO" ]; then
  echo "== 3b. Endereço anterior leva ao domínio novo"
  # Redirecionamento temporário (302): se o domínio novo falhar, voltar para o anterior não fica
  # preso no cache do navegador.
  antigo=$("${CURL[@]}" -o /dev/null -D - "https://$DOMINIO_ANTIGO/obras?pagina=2" 2>&1)
  echo "$antigo" | head -1 | grep -q " 302" && echo "$antigo" | grep -qi "^location: https://$DOMINIO/obras?pagina=2" \
    && ok "https://$DOMINIO_ANTIGO/obras → https://$DOMINIO/obras (302)" \
    || falha "https://$DOMINIO_ANTIGO não redireciona para https://$DOMINIO: $(echo "$antigo" | head -1)"
  # O aviso de pagamento de um pedido criado antes da troca ainda vai para o endereço anterior.
  aviso=$("${CURL[@]}" -o /dev/null -w '%{http_code}' -X POST "https://$DOMINIO_ANTIGO/api/webhooks/mercadopago" 2>&1)
  case "$aviso" in
    3*|000|404) falha "webhook no endereço anterior não chega ao app (HTTP $aviso)" ;;
    *) ok "webhook no endereço anterior chega ao app (HTTP $aviso)" ;;
  esac
fi

echo "== 4. Banco e app fora da internet"
for servico in postgres app backup; do
  publicadas=$(docker port "$("${C[@]}" ps -q "$servico")" 2>/dev/null)
  [ -z "$publicadas" ] && ok "$servico sem porta publicada" || falha "$servico publica: $publicadas"
done

echo "== 4b. Cada contêiner só com os segredos que usa (RNF12)"
for variavel in R2_BACKUP_SECRET_ACCESS_KEY R2_BACKUP_ACCESS_KEY_ID POSTGRES_PASSWORD; do
  "${C[@]}" exec -T app printenv "$variavel" >/dev/null 2>&1 && falha "app recebe $variavel" || ok "app sem $variavel"
done
for variavel in BETTER_AUTH_SECRET MP_ACCESS_TOKEN R2_SECRET_ACCESS_KEY RESEND_API_KEY; do
  "${C[@]}" exec -T backup printenv "$variavel" >/dev/null 2>&1 && falha "backup recebe $variavel" || ok "backup sem $variavel"
done

echo "== 4c. Cache de imagens em volume (sobrevive ao deploy)"
destino=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/app/.next/cache/images"}}{{.Type}}{{end}}{{end}}' "$("${C[@]}" ps -q app)")
[ "$destino" = "volume" ] && ok "cache de imagens num volume" || falha "cache de imagens fora de volume ('${destino:-sem montagem}')"
"${C[@]}" exec -T app sh -c 'test -w .next/cache/images' && ok "app grava no cache de imagens" || falha "app não grava no cache de imagens"

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
