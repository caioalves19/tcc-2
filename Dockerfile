# syntax=docker/dockerfile:1
# Imagem de produção do Kolô (PBI-46). Roda `next start`; o worker do pg-boss sobe junto pelo
# src/instrumentation.ts. Migrações e seeds rodam com `docker compose run --rm app …` (deploy/).

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependências: só o que o `npm ci` precisa, para o cache sobreviver a mudanças de código.
# O postinstall roda `prisma generate`, que lê prisma.config.ts → src/lib/database-url.ts.
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY src/lib/database-url.ts ./src/lib/database-url.ts
RUN npm ci

FROM base AS build
# Não são segredos: o NEXT_PUBLIC_* vai embutido no JavaScript do navegador, e o host do R2
# precisa existir no build para o next/image (ver README, Upload de imagens).
ARG R2_PUBLIC_URL=""
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ENV R2_PUBLIC_URL=$R2_PUBLIC_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY . .
RUN npm run build

# Execução: mantém as devDependencies (tsx) para os seeds rodarem dentro do contêiner.
FROM base AS app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Sem o npm no meio: o Next recebe os sinais direto (o compose usa `init: true` como PID 1).
CMD ["node_modules/.bin/next", "start"]
