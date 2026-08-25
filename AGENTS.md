# Kolô — AGENTS.md

Constituição para agentes de IA neste repositório. Spec canônica: `docs/ESCOPO-E-STACK.md`, `docs/DER.md`, `docs/ORDEM-DE-EXECUCAO.md`, `docs/BRIEFING.md`.

## Pedido (4 blocos) — quem preenche

Os 4 blocos são obrigatórios **antes de codar**. Quem digita pode ser o humano **ou** o agente.

1. **O que quero** — objetivo mensurável.
2. **Como, em linhas gerais** — stack já decidida no ESCOPO; espaço para sugerir o caminho.
3. **O que não quero** — pressuposto não dito vira bug.
4. **Como sei que está pronto** — comando + saída (não “terminei”).

**Pedido vago** (“faz X”, sem gate): skill `clarify` — entrevista com alternativas → monta o prompt nos 4 blocos → **para**. Só executa depois de “pode executar”.

**Pedido já completo** (4 blocos + gate): pular `clarify` → `feature-slice` → `tdd`.

## Ciclo de trabalho (obrigatório)

```
[clarify se preciso] → feature-slice → tdd (vermelho → verde) → npm test → reviewing-code
```

- Um comportamento por ciclo. Proibido escrever a suíte inteira e depois o código (horizontal slicing).
- Skills: `clarify` (entrevista); `feature-slice` (tamanho); `tdd` (loop); `reviewing-code` no fim (author ≠ verifier).
- “Pronto” = `npm run lint` + `npm run typecheck` + `npm test` (ou o gate da task) **já executados**, com output.

## Scripts (só estes)

| Script | Uso |
|--------|-----|
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | unit + integração (CI) |
| `npm run test:unit` | Vitest sem Postgres |
| `npm run test:integration` | Vitest + Postgres (quando existir) |
| `npm run test:e2e` | Playwright |
| `npm run build` | build de produção |

## Domínio (ouro)

- Regras (RN) e invariantes: código testável ou constraint no banco. Postgres **real** na escrita transacional (reserva, agenda, webhook) — não mockar.
- Esperado do teste vem do ESCOPO/RN (literal / exemplo), não da implementação.
- Módulos só pela API pública (`src/modules/*/index.ts`) quando a árvore existir.
- **Proibido:** dado de saúde / `health_form`; split de pagamento; API oficial WhatsApp; inventar RF fora do ESCOPO.

## Estilo

- TypeScript strict; sem `any`.
- Arquivos greppáveis, preferir &lt; ~500 linhas.
- Commits pequenos, uma task. `git push` / produção / force-push: só com “sim” humano.
