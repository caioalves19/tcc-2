#!/usr/bin/env bash
# Publica a versão do branch atual na VPS (PBI-46). Rodar na VPS, dentro do clone do repositório:
#   deploy/deploy.sh              → git pull, build, migrações e troca do app
#   deploy/deploy.sh --sem-pull   → mesmo fluxo com o código que já está na pasta
#   deploy/deploy.sh --voltar <tag>  → rollback: sobe de novo a imagem kolo-app:<tag>
# As tags são o commit curto de cada deploy (docker image ls kolo-app). O rollback não desfaz
# migrações: uma migração que remove coluna precisa de plano próprio antes do deploy.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.production ] || { echo "Falta o .env.production (modelo: .env.production.example)."; exit 1; }
C=(docker compose --env-file .env.production -f docker-compose.prod.yml)

if [ "${1:-}" = "--voltar" ]; then
  [ -n "${2:-}" ] || { echo "Uso: deploy/deploy.sh --voltar <tag>"; docker image ls kolo-app; exit 1; }
  export TAG="$2"
  docker image inspect "kolo-app:$TAG" >/dev/null
  "${C[@]}" up -d --no-build app
  # A latest passa a ser a versão do rollback: um `up` sem TAG depois não volta para a quebrada.
  docker tag "kolo-app:$TAG" kolo-app:latest
  echo "Rollback: app em kolo-app:$TAG (também marcada como latest)."
  exit 0
fi

[ "${1:-}" = "--sem-pull" ] || git pull --ff-only
TAG="$(git rev-parse --short HEAD)"
export TAG

echo "== Build kolo-app:$TAG"
"${C[@]}" build app backup

echo "== Banco e migrações"
"${C[@]}" up -d postgres
"${C[@]}" run --rm --no-deps app npx prisma migrate deploy

echo "== Subindo a pilha"
"${C[@]}" up -d
docker tag "kolo-app:$TAG" kolo-app:latest

echo "== Situação"
"${C[@]}" ps
echo "Publicado kolo-app:$TAG. Confira com: deploy/verificar.sh \$DOMINIO"
