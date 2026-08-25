---
name: tdd
description: >-
  Vertical-slice TDD (Matt Pocock): one failing test, minimal code, repeat.
  Use when building or fixing a behaviour test-first, when the user mentions
  TDD, red-green, or asks to implement a task with a test gate.
---

# TDD (vertical slice)

Loop: **red → green**. Refactor fica para a skill `reviewing-code`, não neste ciclo.

## Antes de qualquer teste

Escreva os **seams** (API pública sob teste) e confirme com o usuário. Sem seam confirmado, não escreva teste.

Neste repo: preferir `src/modules/*/index.ts`, Server Actions ou funções puras exportadas. Esperado vem de `docs/ESCOPO-E-STACK.md` (RN/RF), não da implementação.

## Anti-padrões

- **Acoplado à implementação** — mocka interno / testa privado; quebra em refactor sem mudar comportamento.
- **Tautológico** — `expect(add(a,b)).toBe(a+b)`; esperado deve ser literal ou exemplo do spec.
- **Horizontal slicing** — todos os testes depois todo o código. Proibido.

## Regras do loop

1. **Red before green** — um teste que falha; rode `npm run test:unit -- <filtro>` (ou o gate da task) e mostre a falha.
2. **Código mínimo** — só o bastante para verde. Nada especulativo.
3. **Um slice por ciclo** — um seam, um teste, uma implementação; depois o próximo.
4. **Evidência** — não declare pronto sem output do runner.

## Comandos

```bash
npm run test:unit -- <filtro>
npm run test:integration -- <filtro>   # Postgres real; nunca mockar reserva/agenda/webhook
npm test                               # o que a CI roda
```
