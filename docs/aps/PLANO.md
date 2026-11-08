# APS — Avaliação e Melhoria da Qualidade (Kolô)

> Disciplina: Avaliação e Melhoria da Qualidade em Sistemas de Software (APS 7º/8º sem., 2026/2).
> Entrega: **12/11/2026**, só documento escrito (sem apresentação oral). Grupo: o mesmo do TCC.
> Decisões fechadas em sessão de perguntas em 06/11/2026. Sem responsável fixo por seção.

## Pedido (4 blocos)

1. **O que quero** — avaliar a qualidade do Kolô com um plano ISO/IEC 25010 + GQM, medir contra metas definidas
   antes da medição, implementar 2–3 melhorias de baixo risco com antes/depois e entregar o documento ABNT/UNIP.
2. **Como** — visão geral do repo inteiro (CI, cobertura, complexidade, audit) e aprofundamento em três fluxos:
   catálogo/ficha da obra, carrinho → checkout → webhook, wizard de agendamento. Tudo local, sem deploy.
3. **O que não quero** — mexer em comportamento do sistema às vésperas da banca (melhorias = testes novos ou
   refatoração coberta pela suíte); texto copiado da monografia (dados entram como tabela com fonte); k6 na CI;
   medições que exigem deploy (SSL Labs, securityheaders) — viram limitação/proposta.
4. **Pronto** — `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration` verdes no branch
   `aps/qualidade`; evidências brutas em `docs/aps/evidencias/`; `docs/aps/APS.md` convertido para `.docx` com
   `pandoc --reference-doc=docs/TCC2_Grupo_19_Monografia.docx`.

## Decisões

| # | Tema | Decisão |
|---|------|---------|
| 1 | Prazo/equipe | 12/11, mesmo grupo de 5 |
| 2 | Medição nova | Cobertura + complexidade + `npm audit` + k6 local |
| 3 | Melhorias | Implementar 2–3 (testes/refatoração coberta) com antes/depois; casos do TCC (LCP, `ESTORNO_PENDENTE`) como complemento |
| 4 | Texto | Dados da monografia como tabelas com fonte; prosa nova; descrição do sistema curta e referenciada |
| 5 | Modelo | ISO/IEC 25010:2011 + GQM (nota sobre a revisão 2023) |
| 6 | Metas | Tabela abaixo, fixada antes de medir |
| 7 | k6 | ~20 VUs em catálogo, ficha e checkout + rajada concorrente numa obra de estoque 1 |
| 8 | Código | Um PR para `main`: cobertura, testes das melhorias, scripts k6, evidências; k6 fora da CI; `test:coverage` no AGENTS.md |
| 9 | Testes funcionais | Reexecutar suítes (números do runner) + 8–12 casos formalizados (ISO/IEC/IEEE 29119-3, partição de equivalência, valor-limite) |
| 10 | Usabilidade | Só o existente (axe, Lighthouse, responsivo, retorno da cliente), reenquadrado na 25010 |
| 11 | Segurança | `npm audit` + testes existentes + OWASP ZAP baseline contra o app local, com análise dos alertas |
| 12 | Divisão | Sem responsável; fichas refletem o que cada um fez |
| 13 | Documento | `docs/aps/APS.md` no repo → pandoc → `.docx`, acabamento ABNT no Word |
| 14 | Código no texto | Link do repo + hash do commit; código da APS na íntegra em apêndice; trechos do sistema no corpo |
| 15 | Suíte de testes | Subseção de Manutenibilidade (pirâmide, tempo, smells); remoção só se justificada |
| 16 | Execução | Agente roda medições e melhorias (TDD); grupo revisa o PR e escreve o texto |

## Metas (definidas antes da medição)

| Característica 25010 | Métrica | Meta |
|---|---|---|
| Manutenibilidade | Cobertura de linhas (unit + integração) | ≥ 80% global |
| Manutenibilidade | Cobertura de ramos | ≥ 70% global; ≥ 90% em `orders`, `payments`, `scheduling` |
| Manutenibilidade | Complexidade ciclomática por função | ≤ 10 (McCabe) |
| Manutenibilidade | Tamanho de arquivo | ≤ 500 linhas |
| Eficiência | k6 catálogo e ficha | p95 < 500 ms, erro < 1% |
| Eficiência / Confiabilidade | k6 checkout (reserva) | p95 < 1 s, erro < 1%, zero venda acima do estoque |
| Segurança | `npm audit` | 0 alta/crítica |
| Segurança | ZAP baseline | 0 alerta High; Medium analisado um a um |
| Eficiência | Lighthouse (já medido, PBI-45) | LCP < 2,5 s, score ≥ 90 |
| Usabilidade | axe-core (já medido) | 0 violação crítica |

## Cronograma

| Dia | Atividade |
|---|---|
| 06–07/11 | Branch, config de cobertura e complexidade, baseline de tudo em `evidencias/` |
| 08/11 | Análise do baseline contra as metas; grupo escolhe as 2–3 melhorias |
| 09–10/11 | Melhorias + nova medição; PR com CI verde |
| 10–12/11 | Texto, pandoc, ABNT, fichas, entrega |

## Achados prévios (auditoria da suíte, 06/11)

- Todos os RF P0 têm teste; sem `skip`/`only`; sem duplicação real entre camadas.
- Remoção defensável: `tests/unit/harness.test.ts`; caso "RF31 sem nada salvo…" em `tests/integration/configuracao-site.test.ts`; opcional um caso de `tests/unit/identidade-seed.test.ts`.
- Candidatas a melhoria: `sleep` de 5,5 s em `tests/integration/exclusao-conta.test.ts:417`; relógio real nos testes de expiração de checkout/reserva; três testes RF08 copiados em `tests/unit/paginas-politicas.test.tsx`; `checkout.test.ts` (658 linhas) e `reserva.test.ts` (555) acima de 500.
- Contagem no código (~433 unit, ~278 integração, 9 casos E2E) diverge do Cap. 5 (532/276/43) por `it.each` e loops; usar o relatório do runner.
