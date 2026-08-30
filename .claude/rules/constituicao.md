---
description: Constituição — clarify se vago; 4 blocos antes de codar; TDD vertical
---

# Constituição

Antes de codar, o pedido precisa dos 4 blocos: (1) o que quero, (2) como, (3) o que não quero, (4) pronto = comando + output.

Se o humano não trouxe os 4 blocos: skill **`clarify`** (perguntas com alternativas → monta o prompt → espera “pode executar”). Não inventar escopo nem começar código.

Ciclo depois do ok: `feature-slice` → `tdd` (um vermelho → mínimo verde) → gate → `reviewing-code` no fim da feature.

Leia `AGENTS.md`. Spec sob demanda: `docs/ESCOPO-E-STACK.md`, `docs/DER.md`, `docs/ORDEM-DE-EXECUCAO.md`. Sem `health_form`. Push/produção exigem “sim” humano.
