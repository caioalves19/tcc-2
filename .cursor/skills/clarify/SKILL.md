---
name: clarify
description: >-
  Interviews the user with multiple-choice questions when a request is vague,
  then builds a ready-to-run 4-block prompt (want / how / not-want / done gate).
  Use before coding when the user has not filled the 4 blocks, says "faz X",
  "implementa", or any underspecified feature. Do not write code in this skill.
---

# Clarify → prompt nos 4 blocos

Você estrutura o pedido. O humano só escolhe. **Não escreva código** nesta skill.

## Quando disparar

Pedido sem os 4 blocos completos, ou vago (“faz o cadastro”, “implementa o carrinho”, “arruma a agenda”).

Se o usuário já trouxe os 4 blocos + gate testável → pule esta skill e vá para `feature-slice` / `tdd`.

## Passo 1 — Entrevista (máx. 5 perguntas)

Use o AskQuestion do Cursor quando disponível; senão, liste A/B/C no chat.

Pergunte só o que bloqueia. Cada pergunta = **alternativas**, não pergunta aberta.

Cobrir, se faltar:

1. **Escopo** — qual RF/RN ou comportamento único (citar IDs do ESCOPO/ORDEM se souber).
2. **Fora** — o que explicitamente não entra nesta fatia.
3. **Seam** — onde testa (ex.: `modules/customers` index, Server Action, função pura).
4. **Gate** — qual comando prova pronto (`npm run test:unit -- …` / `test:integration -- …`).
5. **Risco** — auth / pagamento / webhook / admin? (sim → security review no fim).

Inferir do ESCOPO o que for óbvio; só perguntar ambiguidade.

## Passo 2 — Montar o prompt

Depois das respostas, emitir **somente** isto (pronto para copiar / “pode executar”):

```markdown
## Pedido (4 blocos)

**O que quero:** <objetivo mensurável; RF/RN se houver>

**Como, em linhas gerais:** <stack do ESCOPO + caminho sugerido + seam público>

**O que não quero:** <anti-escopo; pressupostos negados>

**Como sei que está pronto:** <comando exato> — <asserção observável>

## Técnicas aplicadas
- Aceite testável (gate = runner, não “terminei”)
- Anti-escopo explícito
- Seam público (sem testar interno)
- Fatia vertical (um comportamento por ciclo TDD)
- <outras se couber: idempotência, Postgres real, papéis, etc.>

## Próximo
Aguardando “pode executar” → skill `feature-slice` → por task skill `tdd`.
```

## Passo 3 — Parar

Não implemente. Não rode `feature-slice` nem `tdd` até o usuário dizer **pode executar** (ou equivalente).

## Anti-padrões

- Mais de 5 perguntas ou perguntas abertas sem opções.
- Inventar RF fora do ESCOPO.
- Começar código “enquanto pergunta”.
- Gate vago (“testes passam”) sem comando.
