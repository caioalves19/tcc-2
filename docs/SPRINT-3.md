# Kolô — Sprint 3: Pós-entrega da monografia

**Ponto de partida:** [Sprint 2](Sprint-2.md) concluída e monografia entregue (`docs/tcc-2.pdf`).
**Fontes:** [Escopo e Stack v2.2](ESCOPO-E-STACK.md) · [DER](DER.md) · [Preparação da banca](PREPARACAO-BANCA.md).
**DoD (vale para todo card):** `npm run lint` + `npm run typecheck` + `npm test` verdes; PR aprovado por outro integrante.

Os números continuam a Sprint 2.

## Visão geral

| PBI | Título                                | Prioridade      | Deps                     |
| --- | ------------------------------------- | --------------- | ------------------------ |
| 49  | Dados e imagens de demonstração no repositório | P0 (banca 24/11) | PBI-17, PBI-18, PBI-35   |

---

### PBI-49 — Dados e imagens de demonstração no repositório

**Objetivo:** qualquer integrante clona o repositório, roda os comandos documentados e vê o
catálogo e o portfólio com obras e tatuagens de demonstração, com imagem. O mesmo vale para o
ambiente publicado que a banca vai usar. Hoje isso só funciona na máquina de quem gerou as imagens.

**O que já existe (só local, fora do git em 21/10/2026):**

| Caminho                          | Conteúdo                                                                                                         | Aproveitar?                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `prisma/imagens-demo/catalogo.ts`  | Lista das 8 obras (slug, texto alternativo, prompt) e das 9 tatuagens (id fixo, artista, estilo, título, região, duração) | Sim, versionar                                                                                    |
| `prisma/imagens-demo/gerar.ts`     | Gera as imagens com IA (Pollinations.ai, sem chave), corta a faixa do logo e cria a miniatura de 400 px            | Sim, versionar (só roda de novo se quiser trocar imagens)                                         |
| `prisma/imagens-demo/popular.ts`   | Envia as imagens ao R2 (ou a `public/<pasta>` quando `R2_PUBLIC_URL` começa com `/`) e grava `artwork_image` e `portfolio_item`; pode rodar de novo sem duplicar | Sim, versionar                                                                                    |
| `prisma/imagens-demo/imagens/`     | 34 arquivos WebP (17 imagens + miniaturas), ~900 KB no total                                                   | Sim, versionar: é a fonte das imagens e evita depender da IA de novo                              |
| `public/seed/`                     | Cópia das mesmas imagens organizada por id de artista (`obras/<uuid>/…`, `portfolio/<uuid>/…`)                 | **Não versionar.** Os UUIDs são do banco local; é saída do `popular.ts`, regenerável. Adicionar ao `.gitignore` |

**Lacunas encontradas:**

1. **Os registros de demonstração não estão em nenhum seed versionado.** O `popular.ts` procura as
   obras `demo-*` (8), o artista `demo-marina-duarte` e os estilos `demo-traco-fino`,
   `demo-aquarela` e `demo-blackwork`, mas só o `artista-exemplo` vem do `prisma/seed.ts`. Num
   banco novo o script pula quase tudo (“não cadastrada, pulando”).
2. **`R2_PUBLIC_URL` relativa (`/seed`) quebra o app.** `next.config.ts` e `src/lib/seguranca.ts`
   fazem `new URL(R2_PUBLIC_URL)`, que lança erro com caminho relativo. As alterações locais que
   tratavam disso nesses dois arquivos e em `tests/unit/seguranca.test.ts` foram descartadas
   com `git restore` em 21/10/2026 e precisam ser refeitas.
3. **Licença das imagens.** Confirmar e registrar no README da pasta os termos de uso das imagens
   geradas pela Pollinations.ai e deixar claro, no texto alternativo ou na página, que são
   ilustrativas (não são obras do acervo real).

**Critérios de aceite:**

- [x] Versionar `prisma/imagens-demo/` (scripts + `imagens/`) e ignorar `public/seed/` (21/10/2026)
- [ ] Criar o seed de demonstração dos registros que faltam (artista `demo-marina-duarte`, os 3
      estilos e as 8 obras `demo-*`, com preço, situação e dimensões coerentes com as RN), idempotente
      como o `prisma/seed.ts`. Decidir se entra no `db:seed` ou num script separado (`db:seed:demo`),
      para não poluir o banco de produção do cliente sem querer
- [ ] Refazer, com teste (TDD), o suporte a `R2_PUBLIC_URL` relativa em `next.config.ts` (sem
      `remotePatterns`) e em `src/lib/seguranca.ts` (`img-src 'self'` basta)
- [ ] Rodar `popular.ts` contra o R2 do ambiente publicado e conferir as imagens no catálogo, na
      página da obra, na home e no portfólio pela URL pública
- [ ] Documentar no README os comandos em ordem (`db:migrate` → `db:seed` → seed de demo →
      `popular.ts`) e as duas formas de rodar: local com `R2_PUBLIC_URL=/seed` e com R2
- [ ] Registrar o README de `prisma/imagens-demo/` com origem, licença e como regenerar

**Fora:** gerar imagens novas, upload pela tela (já coberto no PBI-18/35), dados de pedidos ou
agenda de demonstração.

**Gate:** num clone limpo com banco vazio, os comandos do README terminam sem erro e
`npm run test:e2e` passa; capturas do catálogo e do portfólio com imagem anexadas ao PR.
