# Kolô

## Banco local

Postgres sobe no Docker. A migração inicial e o seed (um `ADMIN`, um `CLIENTE`, um `ARTISTA`) usam a URL de `.env` ou, se ela não existir, `postgresql://kolo_user:kolo_password@localhost:5432/kolo_db`.

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:seed
```

O cadastro público, quando existir, nasce `CLIENTE`. O primeiro `ADMIN` só entra por este seed.

## 📌 Padronização de Commits

Este projeto utiliza o padrão [Conventional Commits](https://www.conventionalcommits.org/).

### Formato do Commit
`<tipo>(<escopo opcional>): <descrição curta>`

### Tipos permitidos:
- `feat`: Adição de nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Formatação, ponto e vírgula, sem alteração de código
- `refactor`: Refatoração de código sem alterar funcionalidade ou corrigir bug
- `test`: Adição ou ajuste de testes
- `chore`: Atualizações de tarefas de build, pacotes, configurações etc.

### Exemplos:
- `feat(auth): adiciona fluxo de login`
- `docs: adiciona padrao de commits ao readme`

## Administração do acervo — PBI-16

As telas `/admin/artistas`, `/admin/estilos` e `/admin/tags` exigem uma sessão ADMIN ativa. Após entrar, o cabeçalho oferece o link **Administração**.

Para o primeiro acesso em desenvolvimento, defina `SEED_ADMIN_PASSWORD` no seu `.env` local (8 a 128 caracteres) e execute `npm run db:seed`. Entre com `admin@kolo.test` e a senha escolhida. A senha é salva em hash compatível com Better Auth; rodar o seed novamente não redefine uma credencial existente. Nunca versione o `.env` ou a senha.

O cadastro de artista permite criar uma nova conta com senha inicial ou vincular uma conta CLIENTE/ARTISTA ativa que ainda não tenha perfil. Uma conta CLIENTE vinculada passa a ARTISTA. O cadastro preserva a sessão do administrador e grava conta, credencial, perfil e estilos em uma transação. E-mail e vínculo da conta permanecem fixos na edição do perfil; nome, telefone, slug, biografia, avatar por URL HTTPS, Instagram e estilos podem ser editados. Upload de arquivos pertence ao PBI-17.

Não é possível excluir um artista com obras, portfólio ou agenda, um estilo associado a artista/portfólio/agenda, nem uma tag associada a obra. Ao excluir um perfil de artista livre, a conta é preservada; se o papel era ARTISTA, ele passa a CLIENTE e as sessões são revogadas.

Verificações específicas:

```bash
npm run test:unit -- artistas-validacao gestao-artistas gestao-taxonomias admin-layout cabecalho
npm run test:integration -- artistas seed-fundacao
```

Os testes de integração criam bancos descartáveis próprios no PostgreSQL local e não usam o banco de desenvolvimento para os cadastros testados.

## Upload de imagens — PBI-17

As imagens de obras e do portfólio vão do navegador direto para o Cloudflare R2, por URL assinada de 5 minutos. O servidor valida tipo e tamanho **antes** de assinar, gera a chave do objeto e guarda só essa chave. Formatos aceitos: JPEG, PNG e WebP, até 5 MB; SVG não é aceito. Depois do envio, o servidor gera uma miniatura WebP de até 400 px ao lado do original (`<chave sem extensão>_thumb.webp`) e rejeita, apagando o original, qualquer arquivo que não seja de fato JPEG, PNG ou WebP. ADMIN envia para qualquer artista e destino; ARTISTA só para o próprio portfólio.

**Dois buckets, nunca o de produção em desenvolvimento.** Desde 11/10/2026 (PBI-28):

| Bucket | Uso | Token de API |
| --- | --- | --- |
| `kolo-imagens` | só produção | só nas variáveis da hospedagem; nunca num `.env` local |
| `kolo-imagens-teste` | desenvolvimento local, testes manuais e sandbox | só leitura e escrita nesse bucket |

Um `.env` local com o token de produção daria a qualquer teste local (enviar, remover imagem) poder de apagar imagens reais.

Configuração (variáveis no `.env` local, nunca versionadas; modelo em `.env.example`):

| Variável | O que é |
| --- | --- |
| `R2_ACCOUNT_ID` | Account ID do Cloudflare (painel → R2 → Overview) |
| `R2_BUCKET` | Nome do bucket (`kolo-imagens-teste` no `.env` local) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Token de API do R2 com leitura e escrita **só nesse bucket** (R2 → Manage API Tokens) |
| `R2_PUBLIC_URL` | URL pública do bucket; também libera o host no `next/image` |

Para configurar do zero:

1. No painel Cloudflare, abra **Storage & databases → R2 → Overview** e ative o R2, caso ainda não esteja ativo. Essa ativação é feita pelo dono da conta.
2. Em **Create bucket**, crie `kolo-imagens-teste`, sem selecionar uma jurisdição específica: o app usa o endpoint global do R2.
3. No bucket, em **Settings → Public Development URL / R2.dev subdomain**, habilite o endereço público de desenvolvimento. Copie o endereço `https://pub-....r2.dev` para `R2_PUBLIC_URL`.
4. Em **R2 → Manage API Tokens**, crie um token **Object Read & Write**, limitado a `kolo-imagens-teste`. Preencha `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` com os valores exibidos; o Secret Access Key só aparece nessa etapa. O `R2_ACCOUNT_ID` vem do Overview, e `R2_BUCKET` deve ser `kolo-imagens-teste`.
5. Preencha este bloco no `.env` local com os valores da sua conta (sem `NEXT_PUBLIC_`):

```dotenv
R2_ACCOUNT_ID="preencha-o-account-id"
R2_BUCKET="kolo-imagens-teste"
R2_ACCESS_KEY_ID="preencha-o-access-key-id"
R2_SECRET_ACCESS_KEY="preencha-o-secret-access-key"
R2_PUBLIC_URL="https://pub-preencha.r2.dev"
```

As etapas seguem a documentação oficial de [início do R2](https://developers.cloudflare.com/r2/get-started/), [credenciais](https://developers.cloudflare.com/r2/api/tokens/) e [bucket público](https://developers.cloudflare.com/r2/buckets/public-buckets/).

No bucket, configure o **CORS** para o navegador conseguir o `PUT` direto (Settings → CORS Policy). Em desenvolvimento:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3100"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

A origem deve ser exatamente a usada no navegador, incluindo a porta e sem caminho: se abrir pelo IP da máquina, acrescente aquela origem. Consulte a [configuração de CORS do R2](https://developers.cloudflare.com/r2/buckets/cors/).

Depois de preencher o `.env`, reinicie `npm run dev`. Em `/portfolio/gestao`, selecione um artista, envie uma imagem JPEG/PNG/WebP de até 5 MB e aguarde “Imagem enviada com sucesso”. Salve o trabalho e recarregue: a miniatura precisa continuar visível. No bucket devem existir o original e o arquivo `_thumb.webp`.

Sem as credenciais, o formulário informa “O envio de imagens ainda não está configurado”. Se estiverem preenchidas e o envio falhar, confira o CORS e o escopo do token.

Em produção, troque a origem pelo domínio do site e use um domínio próprio no bucket: a URL `r2.dev` tem limite de requisições e não é recomendada para produção. A mudança de `R2_PUBLIC_URL` exige reiniciar o servidor: o `next start` lê o `next.config.ts` na subida e é dali que sai o host liberado para o `next/image`. Se o deploy passar a usar `output: "standalone"`, a configuração é congelada no build, e então a variável precisa existir também durante o `npm run build`.

Verificações:

```bash
npm run test:unit -- media upload-imagem
npm run test:integration -- media
```

Esses testes usam um armazenamento em memória no lugar do R2. O envio real ao bucket é conferido à mão, com as credenciais configuradas.
