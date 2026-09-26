# Kolô — Sprint 1 (semana 1): Fundação + Autenticação

**Meta da sprint:** spec v2.2 aprovada pelos 5, DER redesenhado, e qualquer integrante clona, sobe o ambiente, cadastra e entra.
**Fonte:** `ORDEM-DE-EXECUCAO.md` (Fase 0) · `ESCOPO-E-STACK.md` v2.2 · `DER.md`.
**DoD (vale para todo card):** `npm run lint` + `npm run typecheck` + `npm test` verdes; PR aprovado.

## Visão geral

| PBI | Título                             | Resp.     | Deps   |
| --- | ---------------------------------- | --------- | ------ |
| 01  | Revisão e aprovação dos requisitos | Todos     | —      |
| 02  | Redesenho do DER                   | Gustavo   | 01     |
| 03  | Repositório e proteções            | Caio S.   | —      |
| 04  | App Next.js base                   | Caio S.   | 03     |
| 05  | Docker Compose + Postgres          | Caio S.   | 04     |
| 06  | schema.prisma a partir do DER      | Guilherme | 02, 05 |
| 07  | Revisão humana do modelo           | Guilherme | 06     |
| 08  | Migração inicial + seed            | Gustavo   | 07     |
| 09  | Identidade visual e tokens         | Robert    | —      |
| 10  | Layout base + design system        | Robert    | 04, 09 |
| 11  | Better Auth + papéis               | Caio V.   | 06     |
| 12  | Cadastro de cliente                | Caio V.   | 11     |
| 13  | Login/logout com sessão revogável  | Caio V.   | 11     |
| 14  | Recuperação de senha               | Robert    | 12     |
| 15  | Edição de perfil                   | Guilherme | 12     |

Login com Google saiu na v2.2 (adiado, seção 14 do ESCOPO). Não há PBI-16 nesta sprint.

Blocos de dependência (dentro de cada bloco, a ordem importa; entre blocos, dá para paralelizar):

- **A — Spec (gate):** 01 → 02 — trava o bloco C
- **B — Repo:** 03 → 04 → 05
- **C — Dados:** 06 → 07 → 08 (começa quando 02 e 05 fecham)
- **D — Marca e UI:** 09 → 10 (10 também precisa de 04)
- **E — Auth:** 11 → 12 → 13 → {14, 15} (começa quando 06 fecha)

---

## Bloco A — Spec (gate)

### PBI-01 — Revisão e aprovação dos requisitos

**Resp:** os 5 integrantes
Leitura crítica do `ESCOPO-E-STACK.md` v2.2 inteiro (RF, RNF, RN, fora de escopo) antes de qualquer código. A v2.2 enxugou agendamento, 3D e IDs — ninguém coda em cima da v2.1.

- [x] Cada integrante revisou individualmente e registrou divergências (comentário/issue) — ciclo v2.1
- [ ] Ajustes da v2.2 (wizard → WhatsApp, cortes listados na seção 14) revisados pelos 5
- [ ] Versão 2.2 aprovada por unanimidade — gate para o PBI-02

### PBI-02 — Redesenho do DER

**Resp:** Gustavo · **Deps:** PBI-01
`DER.md` validado contra o `ESCOPO-E-STACK.md` v2.2 (seção 10 + RF/RN/RNF). Sem `health_form`, slots (`availability_rule`, `time_block`), referências de agendamento, 3D, cupom, sinal, `audit_log` nem demais itens da seção 14.

- [ ] Toda entidade tem RF/RN que a justifica; nada fora de escopo presente
- [ ] Restrições (RN02, RN08, RN09, RN12) mapeadas na tabela de restrições
- [ ] Revisão por ao menos 1 integrante ≠ autor; mermaid renderiza sem erro

---

## Bloco B — Repositório

### PBI-03 — Repositório e proteções

**Resp:** Caio S.
Repo no GitHub com regras de colaboração da equipe.

- [x] `main` protegida: push direto bloqueado, PR obrigatório
- [x] Conventional commits documentado no README
- [x] 5 integrantes com acesso de escrita

### PBI-04 — App Next.js base

**Resp:** Caio S. · **Deps:** PBI-03
`create-next-app` na raiz do repo: Next 16 (App Router), TypeScript strict, Tailwind 4.

- [x] `npm run dev` sobe a home padrão
- [x] `engines` (Node 24) no `package.json` + `.nvmrc`
- [x] ESLint 9 + Prettier configurados (`npm run lint`, `format`)

### PBI-05 — Docker Compose + Postgres

**Resp:** Caio S. · **Deps:** PBI-04
Compose com PostgreSQL 17 para dev local (Postgres só no Docker, nunca instalado na máquina).

- [x] `docker compose up` sobe o Postgres com volume persistente
- [x] `.env.example` com `DATABASE_URL` documentada
- [x] README: um comando do clone ao banco de pé

---

## Bloco C — Dados

### PBI-06 — schema.prisma a partir do DER

**Resp:** Guilherme · **Deps:** PBI-02, PBI-05
Modelo completo conforme o `DER.md` v2.2 (auth, acervo com estoque, pedido, agenda manual). Sem `health_form`, `availability_rule`, `time_block`, `appointment_reference` nem `modelo_3d_url`.

- [X] Todas as entidades do DER; sem itens da seção 14
- [X] Convenções: UUID, dinheiro em centavos (`int`), datas UTC
- [X] Constraint de agenda sem sobreposição (RN08) na migração SQL
- [X] `appointment.user_id` opcional; estoque e quantidade no carrinho/pedido/reserva

### PBI-07 — Revisão humana do modelo

**Resp:** Gustavo (não pode ser o autor do PBI-06) · **Deps:** PBI-06
Revisão do schema contra a spec antes de virar migração.

- [ ] Checklist assinado: papéis, RN02, RN08, RN09, anonimização LGPD (RN12)
- [ ] Divergências registradas e corrigidas no PR

### PBI-08 — Migração inicial + seed

**Resp:** Gustavo · **Deps:** PBI-07
Primeira migração aplicada e dados mínimos de trabalho.

- [X] `migrate` roda limpo do zero
- [X] Seed cria 1 `ADMIN`, 1 `CLIENTE`, 1 `ARTISTA` (artista com perfil vinculado)
- [X] Cadastro público sempre nasce `CLIENTE`; primeiro `ADMIN` só via seed

---

## Bloco D — Marca e UI

### PBI-09 — Identidade visual e tokens

**Resp:** Robert
Definição mínima de marca antes de qualquer tela: paleta, tipografia, logo e tom. Sem este card, o design system nasce sem identidade.

- [X] Paleta (claro/escuro), tipografia e espaçamentos registrados como tokens (CSS variables / tema Tailwind)
- [ ] Logo/ícone e uso básico definidos — regras de uso escritas; **falta o SVG do logo e do mascote das duas marcas**
- [X] Contraste AA verificado nos pares principais (RNF21) — teste automático em `tests/unit/identidade-visual.test.ts`

### PBI-10 — Layout base + design system

**Resp:** Robert · **Deps:** PBI-04, PBI-09
shadcn/ui instalado sobre os tokens da marca e casca visual da aplicação.

- [X] Tema do shadcn/ui consome os tokens do PBI-09 (nada de tema padrão)
- [X] Layout com header/nav responsivo (320 px a 1920 px, sem rolagem horizontal)
- [X] Home placeholder renderizando com o layout

---

## Bloco E — Autenticação

### PBI-11 — Better Auth + papéis

**Resp:** Caio V. · **Deps:** PBI-06
Better Auth configurado com sessão no banco e controle por papel (RF06).

- [ ] Sessão persistida no Postgres e revogável
- [ ] Papel `CLIENTE`/`ARTISTA`/`ADMIN` no usuário
- [ ] Guarda de rota: `/admin` só ADMIN; área do cliente exige login

### PBI-12 — Cadastro de cliente

**Resp:** Caio V. · **Deps:** PBI-11
Cadastro público com nome, e-mail, telefone e senha (RF01).

- [ ] Validação com Zod (e-mail válido, senha mínima, telefone)
- [ ] Senha salva só como hash; e-mail duplicado dá erro amigável
- [ ] Cadastro cria usuário `CLIENTE` e inicia sessão

### PBI-13 — Login/logout com sessão revogável

**Resp:** Caio V. · **Deps:** PBI-11
Login por e-mail e senha (RF02).

- [ ] Login cria sessão no banco; cookie `HttpOnly`/`Secure`/`SameSite`
- [ ] Logout revoga a sessão (nova requisição não autentica)
- [ ] Rate limit na rota de login (RNF08)

### PBI-14 — Recuperação de senha

**Resp:** Robert · **Deps:** PBI-12
Fluxo de "esqueci a senha" por e-mail (RF03).

- [ ] Token de uso único com expiração, enviado via Resend (sandbox)
- [ ] Token inválido/expirado/reusado é rejeitado
- [ ] Ao trocar a senha, sessões antigas são revogadas

### PBI-15 — Edição de perfil

**Resp:** Guilherme · **Deps:** PBI-12
Cliente edita nome, telefone e senha (RF04).

- [ ] Nome e telefone editáveis com validação
- [ ] Troca de senha exige senha atual
- [ ] Feedback de sucesso/erro visível
