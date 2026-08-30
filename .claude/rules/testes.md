---
description: Testes — seams públicos, sintético, Postgres real na escrita
paths:
  - "**/*.{test,spec}.{ts,tsx}"
---

# Testes

- Testar comportamento na API pública (seam), não internals.
- Valor esperado vem do ESCOPO/RN, não recalcular como o código.
- Dados sintéticos. Integração de reserva/agenda/webhook: Postgres real, sem mock de banco.
- Um teste por ciclo TDD (skill `tdd`).
