# Kolô — Deploy na VPS (PBI-46)

Pilha de produção: `docker-compose.prod.yml` com quatro contêineres.

| Serviço    | O que faz                                                          | Exposto à internet |
| ---------- | ------------------------------------------------------------------ | ------------------ |
| `caddy`    | Proxy reverso, HTTPS automático (Let's Encrypt), HTTP → HTTPS      | 80 e 443           |
| `app`      | `next start` + worker do pg-boss (reservas vencidas)               | não                |
| `postgres` | PostgreSQL 17, volume `postgres_data`                              | não                |
| `backup`   | `pg_dump` diário às 03:00, 7 dias na VPS + cópia no R2 `kolo-backups` | não             |

Todos com `restart: unless-stopped` (RNF15). Os segredos ficam só no `.env.production` da VPS
(RNF12); o modelo comentado é o [`.env.production.example`](../.env.production.example). Cada
contêiner recebe só as variáveis que usa: o app não vê o token do backup nem a senha do Postgres,
e o backup não vê os segredos do app. **Variável nova do app** entra na lista `environment` do
serviço `app` no `docker-compose.prod.yml`, além do `.env.production.example`.

Atalho usado abaixo:

```bash
C="docker compose --env-file .env.production -f docker-compose.prod.yml"
```

## 1. Preparar a VPS (uma vez)

Requisito: Ubuntu 24.04, 2 vCPU, **4 GB de RAM** (o `next build` estoura com 2 GB), 40 GB de disco.

```bash
# como root, no primeiro acesso
adduser kolo && usermod -aG sudo kolo
mkdir -p /home/kolo/.ssh && cp ~/.ssh/authorized_keys /home/kolo/.ssh/ && chown -R kolo:kolo /home/kolo/.ssh

# SSH só por chave, sem root
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/; s/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# firewall: só 22, 80 e 443
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp && ufw --force enable

# fail2ban e atualizações de segurança automáticas
apt update && apt install -y fail2ban unattended-upgrades git
dpkg-reconfigure -f noninteractive unattended-upgrades

# Docker (script oficial)
curl -fsSL https://get.docker.com | sh
usermod -aG docker kolo
```

> O Docker publica portas por fora do `ufw`. Por isso o compose só publica 80/443 (Caddy) e
> nunca a 5432 do Postgres nem a 3000 do app.

## 2. Domínio

Hoje: **`koloatelie.duckdns.org`** (conta DuckDNS do grupo). Em <https://www.duckdns.org/domains>,
troque o IP de `koloatelie` pelo IP público da VPS e clique em *update ip*. Confira:

```bash
nslookup koloatelie.duckdns.org   # tem de devolver o IP da VPS
```

O Caddy só consegue o certificado depois que o nome aponta para a VPS e as portas 80/443 estão
abertas.

## 3. Primeira subida

```bash
# como kolo, na VPS
git clone https://github.com/caioalves19/tcc-2.git kolo && cd kolo
cp .env.production.example .env.production && chmod 600 .env.production
nano .env.production            # preencher; segredos com: openssl rand -hex 32
deploy/deploy.sh --sem-pull     # build, migrações e subida

# dados iniciais (admin) e de demonstração
$C run --rm app npm run db:seed
$C run --rm app npm run db:seed:demo
$C run --rm app npx tsx prisma/imagens-demo/popular.ts   # envia as imagens ao R2 de produção

deploy/verificar.sh koloatelie.duckdns.org
```

Depois do primeiro deploy, fora da VPS:

- **Mercado Pago (painel → Webhooks):** URL `https://koloatelie.duckdns.org/api/webhooks/mercadopago`,
  evento *Pagamentos*; a assinatura secreta vai em `MP_WEBHOOK_SECRET` (rode o deploy de novo).
- **R2 `kolo-imagens` → Settings → CORS:** `AllowedOrigins: ["https://koloatelie.duckdns.org"]`,
  métodos `GET, PUT, HEAD` (modelo no README, “Upload de imagens”).

## 4. Publicar uma versão nova

```bash
cd ~/kolo && deploy/deploy.sh
```

Faz `git pull --ff-only`, build da imagem `kolo-app:<commit>`, `prisma migrate deploy` e recria
o app. As imagens antigas ficam guardadas para o rollback.

### Rollback

```bash
docker image ls kolo-app          # tags = commits publicados
deploy/deploy.sh --voltar <tag>
```

O rollback troca só o código e marca a versão antiga como `latest`, para um `up` posterior não
voltar à versão com problema. Migrações já aplicadas continuam no banco.

## 5. Backup e restauração (RNF16)

- Automático: todo dia às `HORA_BACKUP` (03:00, fuso de São Paulo). Fica em `/backups` (volume
  `backups`, 7 dias) e no bucket R2 `kolo-backups`, que tem a regra `apagar-backups-7-dias`.
- Manual, agora: `$C exec backup backup.sh`
- **Prova de restauração** (não mexe na produção): `$C exec backup restaurar.sh` restaura o dump
  mais recente num banco descartável e compara as contagens de `user`, `artwork`, `artist`,
  `order` e `portfolio_item`. Registrar a saída como evidência.

### Restaurar a produção (depois de uma perda)

```bash
$C stop app
$C exec backup sh -c 'psql -d postgres -c "DROP DATABASE kolo WITH (FORCE)" -c "CREATE DATABASE kolo"'
$C exec backup sh -c 'pg_restore --no-owner --no-privileges --dbname=kolo /backups/<arquivo>.dump'
$C start app
```

Sem a VPS, baixe o dump do bucket `kolo-backups` e restaure do mesmo jeito em qualquer Postgres 17.

## 6. Operação

| Precisa de                  | Comando                                        |
| --------------------------- | ---------------------------------------------- |
| Ver se está tudo de pé      | `$C ps` ou `deploy/verificar.sh <domínio>`     |
| Logs do app (RNF24)         | `$C logs -f --tail=200 app`                    |
| Logs do Caddy (certificado) | `$C logs --tail=100 caddy`                     |
| Reiniciar só o app          | `$C restart app`                               |
| Abrir o banco               | `$C exec postgres psql -U kolo -d kolo`        |

Os logs ficam no Docker. Captura centralizada de exceções (Sentry ou similar) ficou fora desta
entrega.

## 7. Trocar o domínio (DuckDNS → domínio próprio)

1. No registrador, criar um registro `A` do domínio novo para o IP da VPS.
2. No `.env.production`: `DOMINIO`, `BETTER_AUTH_URL` e `APP_URL` com o domínio novo.
3. `deploy/deploy.sh --sem-pull` (o Caddy pede o certificado novo sozinho).
4. Atualizar a URL do webhook no Mercado Pago e o CORS do `kolo-imagens`.

## 8. Simular a produção na máquina local

```bash
cp .env.production.example .env.production   # DOMINIO="localhost", APP_URL e BETTER_AUTH_URL
                                              # "https://localhost"; segredos quaisquer
deploy/deploy.sh --sem-pull
$C run --rm app npm run db:seed && $C run --rm app npm run db:seed:demo
deploy/verificar.sh                            # gate do PBI-46 contra https://localhost
$C down                                        # -v apaga também os volumes
```

Com `localhost`, o Caddy usa um certificado da própria autoridade local (o navegador avisa).

## Checklist do PBI-46

- [ ] VPS preparada (seção 1) e `koloatelie.duckdns.org` apontando para ela
- [ ] `deploy/verificar.sh koloatelie.duckdns.org` sem falhas
- [ ] Nota A em <https://securityheaders.com> e certificado válido em <https://www.ssllabs.com/ssltest/>
- [ ] Webhook do Mercado Pago com a URL pública; compra no sandbox até o pedido **pago**
- [ ] Backup no R2 conferido no painel (`kolo-backups`) e `restaurar.sh` registrado
- [ ] Admin e dados de demonstração carregados
