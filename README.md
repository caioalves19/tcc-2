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
