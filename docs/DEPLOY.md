# Kolô — Deploy na VPS (PBI-46)

Pilha de produção: `docker-compose.prod.yml` com quatro contêineres.

| Serviço    | O que faz                                                          | Exposto à internet |
| ---------- | ------------------------------------------------------------------ | ------------------ |
| `caddy`    | Proxy reverso, HTTPS automático (Let's Encrypt), HTTP → HTTPS      | 80 e 443           |
| `app`      | `next start` + worker do pg-boss (reservas vencidas)               | não                |
| `postgres` | PostgreSQL 17, volume `postgres_data`                              | não                |
| `backup`   | `pg_dump` diário às 03:00, 7 dias na VPS + cópia no R2 `kolo-backups` | não             |

O app guarda as imagens já otimizadas pelo `next/image` no volume `imagens_cache` (30 dias por
imagem): o cache sobrevive aos deploys, e a vitrine continua no ar se o R2 oscilar. Uma imagem que
nunca foi vista ainda depende do R2; antes de uma apresentação, abra a home, `/obras`,
`/tatuagens` e o portfólio uma vez.

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

Hoje: **`koloatelie.tech`**, com um registro `A` de `@` para o IP da VPS no registrador. O
endereço anterior, **`koloatelie.duckdns.org`** (conta DuckDNS do grupo), continua apontando para a
mesma VPS e redireciona para o domínio novo (`DOMINIO_ANTIGO`, seção 7). Confira:

```bash
nslookup koloatelie.tech          # tem de devolver o IP da VPS
nslookup koloatelie.duckdns.org   # idem
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

deploy/verificar.sh koloatelie.tech koloatelie.duckdns.org
```

> **`db:seed:demo` é para a primeira subida.** Ele reescreve as obras de demonstração com os
> valores de `prisma/imagens-demo/catalogo.ts` (preço, estoque, situação) e recria a que foi
> apagada no admin e continua no arquivo. Rodado depois de uma venda, a obra vendida volta a
> aparecer como disponível. Para tirar uma obra da demonstração, tire-a do `catalogo.ts` e ponha
> o slug em `OBRAS_RETIRADAS`. Faça backup antes de rodar de novo.

Depois do primeiro deploy, fora da VPS:

- **Mercado Pago (painel → Webhooks):** URL `https://koloatelie.tech/api/webhooks/mercadopago`,
  evento *Pagamentos*; a assinatura secreta vai em `MP_WEBHOOK_SECRET` (rode o deploy de novo).
- **R2 `kolo-imagens` → Settings → CORS:** `AllowedOrigins: ["https://koloatelie.tech", "https://koloatelie.duckdns.org"]`,
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

O endereço anterior continua no ar: o Caddy redireciona o navegador para o domínio novo (302,
temporário, para não ficar no cache se for preciso voltar) e deixa passar `/api/webhooks/*`, para
o aviso de pagamento de um pedido criado antes da troca ainda chegar ao app. O login só funciona no
`BETTER_AUTH_URL`, por isso o anterior não serve o site diretamente.

1. **DNS, no registrador:** registro `A` de `@` para o IP da VPS. Opcional: `CNAME` de `www` para o
   domínio (o Caddyfile não atende `www`; acrescente um bloco se criar o registro).
2. **Resend:** *Domains → Add* com o domínio novo; copiar os registros que ele mostra (MX e TXT em
   `send`, DKIM em `resend._domainkey`) para o DNS do registrador e clicar em *Verify*.
3. Esperar o `nslookup <domínio novo>` devolver o IP da VPS. Antes disso o certificado falha.
4. **Backup** (`$C exec -T backup backup.sh`) e, no `.env.production`:
   - `DOMINIO`, `BETTER_AUTH_URL` e `APP_URL` com o domínio novo;
   - `DOMINIO_ANTIGO` com o endereço anterior;
   - `EMAIL_REMETENTE` com um remetente do domínio novo, só depois do *Verify* do Resend.
5. `deploy/deploy.sh` (o Caddy pede os certificados sozinho) e
   `deploy/verificar.sh <domínio novo> <endereço anterior>`.
6. **Fora da VPS:** URL do webhook no painel do Mercado Pago (a assinatura secreta não muda), o
   domínio novo no CORS do `kolo-imagens` (mantendo o anterior) e, se o Turnstile usa uma chave
   real, o hostname novo no widget.
7. **Conferir pela tela:** entrar de novo com as contas (as sessões do endereço anterior não valem
   no novo), uma compra no sandbox até o pedido **pago**, uma obra cadastrada com imagem (CORS) e a
   recuperação de senha com um e-mail que não seja o do dono da conta do Resend.

Para voltar ao endereço anterior: trocar de novo os valores do passo 4 e rodar o deploy.

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

- [ ] VPS preparada (seção 1) e `koloatelie.tech` e `koloatelie.duckdns.org` apontando para ela
- [ ] `deploy/verificar.sh koloatelie.tech koloatelie.duckdns.org` sem falhas
- [ ] Nota A em <https://securityheaders.com> e certificado válido em <https://www.ssllabs.com/ssltest/>
- [ ] Webhook do Mercado Pago com a URL pública; compra no sandbox até o pedido **pago**
- [ ] Backup no R2 conferido no painel (`kolo-backups`) e `restaurar.sh` registrado
- [ ] Admin e dados de demonstração carregados
