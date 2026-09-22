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
