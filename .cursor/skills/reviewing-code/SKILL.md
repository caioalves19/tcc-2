---
name: reviewing-code
description: >-
  Read-only code review after a feature slice is green. Checks correctness,
  tests vs spec, module boundaries, and risky surfaces (auth, payments).
  Use at the end of a feature, never mid 1+1 TDD cycle. Author must not be
  the same agent that wrote the code when possible.
---

# Reviewing code

Passe **read-only**. Não implementar correções nesta invocação — listar achados ranqueados. Author ≠ verifier.

## Quando

Depois do verde da **última** task da feature. Não a cada ciclo TDD.

## Checklist

1. **Comportamento** — o que o código faz bate com RF/RN citados? Esperados dos testes vêm do spec?
2. **Testes** — há teste que falharia se o bug voltasse? Sem tautologia? Integração com Postgres onde RN04/RN10/webhook pedem?
3. **Fronteiras** — `app/` só consome `modules/*/index.ts`? Sem `any`? Arquivo monstro?
4. **Risco** — auth, sessão, Server Action, webhook, secrets, LGPD: validação no servidor, sem confiar no cliente.
5. **Escopo** — código morto / especulativo fora do pedido?

## Saída

```markdown
## Veredito: PASS | FAIL
## Achados (maior → menor)
- [ ] ...
## Evidência
- arquivo:linha ou gate de teste
```

FAIL → devolver tasks de correção (cada uma com Gate). Não enfraquecer testes para passar.
