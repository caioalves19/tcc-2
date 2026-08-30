---
name: feature-slice
description: >-
  Sizes a feature into Small/Medium/Large work and produces a short task list
  with Tests + Gate per task. Use when starting a new RF/feature after the
  4-block prompt exists (from the user or skill clarify), or when the user
  says "pode executar". Do not use for pure architecture redesign (use
  plan-mode) or for vague requests (use clarify first).
---

# Feature slice

Dimensiona a fatia. **Não** cria árvore `.specs/` nem EARS em toda task. Spec canônica continua em `docs/ESCOPO-E-STACK.md` / ORDEM. Para Medium/Large, opcional: `docs/features/<slug>.md` só se ajudar o handoff.

## Pré-requisito

Pedido com 4 blocos + gate. Se faltar → skill `clarify` primeiro; não dimensionar no escuro.

## Auto-size

| Escopo | Critério | O que fazer |
|--------|----------|-------------|
| **Small** | ≤3 arquivos, uma frase | 4 blocos já ok → Execute com skill `tdd` |
| **Medium** | Feature clara, &lt;10 tasks | Spec curta (objetivo + aceite testável) → tasks implícitas ou lista curta → `tdd` |
| **Large** | Multi-módulo / pagamentos / wizard | Lista de tasks atômicas; cada uma com `Tests` + `Gate` (`npm run test:unit -- …`) → aprovar com o usuário → `tdd` por task |

Specify e Execute sempre. Design/Tasks formais só se Large ou ambíguo.

## Saída de uma task (Large)

```markdown
- [ ] T1: <comportamento>
  - Tests: <o que o teste afirma, do RF/RN>
  - Gate: npm run test:unit -- <filtro>
```

Uma task = um commit quando verde. Não batchar.

## Depois da última task

Invocar skill `reviewing-code` (contexto novo / read-only). Security review se tocou auth, Server Action, webhook ou secrets.

## Não fazer

- Scaffold vazio de spec/design/tasks.
- Instalar TLC completo ou awesome-skills inteiro.
- Detalhar todas as 68 RFs — só a fatia pedida.
- Começar sem os 4 blocos (use `clarify`).
