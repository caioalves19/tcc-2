# Baseline de qualidade — 06/11/2026

Commit avaliado: `b3587b3` (main) + configuração da APS no branch `aps/qualidade`. Máquina local (Windows 11,
Node 24.20, Postgres 17 em Docker). Metas fixadas antes da medição em [`../PLANO.md`](../PLANO.md).
Arquivos brutos em [`baseline/`](baseline/).

## Resumo contra as metas

| Característica (25010) | Métrica | Meta | Medido | Situação |
|---|---|---|---|---|
| Manutenibilidade | Cobertura de linhas (unit + integração) | ≥ 80% | **92,46%** (2849/3081) | Atende |
| Manutenibilidade | Cobertura de ramos global | ≥ 70% | **87,39%** (2115/2420) | Atende |
| Manutenibilidade | Ramos em `orders` | ≥ 90% | **90,3%** (316/350) | Atende (margem 0,3) |
| Manutenibilidade | Ramos em `payments` | ≥ 90% | **88,5%** (185/209) | **Não atende** |
| Manutenibilidade | Ramos em `scheduling` | ≥ 90% | **88,2%** (135/153) | **Não atende** |
| Manutenibilidade | Complexidade ciclomática ≤ 10 | todas as funções | **97,8%** (967/989); 22 acima, máx. 26 | **Não atende** |
| Manutenibilidade | Arquivo ≤ 500 linhas (`src/`) | todos | 0 acima (224 arquivos, 17 058 linhas) | Atende |
| Eficiência | k6 catálogo p95 | < 500 ms | **163 ms** | Atende |
| Eficiência | k6 ficha da obra p95 | < 500 ms | **212 ms** | Atende |
| Eficiência | k6 checkout p95 | < 1 s | **446 ms** | Atende |
| Confiabilidade | k6 erro (leitura) / checks do checkout | < 1% / > 99% | **0%** / **100%** (9 504 req.) | Atende |
| Confiabilidade | Rajada: 30 clientes, obra de estoque 1 | 1 criado, 29 recusados | **1 / 29**; 1 item no banco | Atende |
| Segurança | `npm audit` alta/crítica | 0 | **2 críticas, 2 altas** (17 no total) | **Não atende** |
| Segurança | ZAP baseline High | 0 | **0 High**, 1 Medium, 8 Low, 6 Info | Atende; Medium/Low analisados abaixo |

## Suítes (reexecução)

| Camada | Arquivos | Testes | Aprovados | Tempo |
|---|---|---|---|---|
| Unitário | 122 | 562 | 562 | 93,8 s |
| Integração (Postgres real) | 42 | 286 | 286 | 142,4 s |
| Cobertura (unit + integração juntos) | 164 | 848 | 848 | 265,8 s |
| E2E (Playwright, build de produção) | 7 specs | 44 | 44 (0 flaky) | 121,8 s |

`npm run lint` e `npm run typecheck`: exit 0.

## Cobertura por módulo

Ver [`baseline/cobertura-por-modulo.txt`](baseline/cobertura-por-modulo.txt). O ponto mais baixo é `src/app`
(68,8% linhas, 72,5% ramos): páginas e server actions, exercitadas sobretudo pelo E2E, que não entra na cobertura.

## Complexidade (ESLint `complexity`, limiar McCabe 10)

989 funções; média 2,53; mediana 1. Faixas: 1–5: 876 · 6–10: 91 · 11–20: 20 · > 20: 2.

| Complexidade | Função | Arquivo |
|---|---|---|
| 26 | `GestaoObras` | `src/components/admin/gestao-obras.tsx` |
| 23 | `WizardAgendamento` | `src/components/scheduling/wizard-agendamento.tsx` |
| 20 | `GestaoArtistas` | `src/components/admin/gestao-artistas.tsx` |
| 18 | arrow em `agenda-leitura.ts` | `src/modules/scheduling/agenda-leitura.ts` |
| 16 | `processarNotificacao` | `src/modules/payments/webhook.ts` |
| 16 | `iniciarPagamento` | `src/modules/payments/pagamento.ts` |
| 15 | `FormularioTrabalho`, `AgendaSemana` | `src/components/…` |
| 13 | `finalizarCompra`, `autorizarUpload`, … | |

Concentração em componentes de tela grandes (estado de formulário) e em dois pontos críticos de pagamento.

## `npm audit`

| Pacote | Severidade | Direto | Correção |
|---|---|---|---|
| `next` | crítica | sim | disponível (RCE no Image Optimization com SVG; DoS em Server Actions) |
| `better-auth` | crítica | sim | disponível (via `@better-auth/drizzle-adapter`, rate limit sob concorrência) |
| `zod` | alta | sim | disponível (memória em coleções grandes) |
| `undici` | alta | não | disponível |
| `typescript-eslint` e deps | moderada | dev | troca de versão |
| `fast-uri`, `react-email`, `deepmerge` | moderada/baixa | | |

As versões fixadas no TCC ficaram vulneráveis depois do fechamento da Sprint 2 (avisos publicados depois).

## OWASP ZAP baseline (app local, http)

| Risco | Alerta | Onde | Leitura |
|---|---|---|---|
| Medium | CSP ausente | `/robots.txt`, `/sitemap.xml`, 404 | O `matcher` do `src/proxy.ts` ignora caminhos com ponto; essas respostas saem sem os cabeçalhos de segurança |
| Low | `X-Powered-By: Next.js` | todas as páginas | `poweredByHeader` não desligado em `next.config.ts` |
| Low | `X-Content-Type-Options` ausente | `/_next/static/*` | o `matcher` exclui estáticos |
| Low | `Permissions-Policy` ausente | todas | cabeçalho não definido em `src/lib/seguranca.ts` |
| Low | COEP/COOP/CORP ausentes | páginas e estáticos | isolamento entre origens não configurado |
| Low | Application Error Disclosure | `/_next/image` | artefato do ambiente: o R2 falso aponta para host `.invalid` (500) |
| Low | Big Redirect | `/conta` | redirect para login com corpo RSC; sem dado sensível |
| Info | Informação sensível na URL | `/login`, `/cadastro`, `/contato`, `/esqueci-senha` | o spider sem JavaScript submete os formulários por GET (senha na query string); o formulário depende de hidratação |
| Info | Atributo controlado pelo usuário | `/obras?ordem=`, `/tatuagens?…` | valor refletido em atributo; escapado pelo React, falso positivo provável |

HSTS e `upgrade-insecure-requests` só fazem efeito sob HTTPS (deploy, PBI-46).

## Pontos críticos (insumo para a escolha das melhorias)

1. `npm audit`: 2 críticas e 2 altas em dependências diretas (`next`, `better-auth`, `zod`).
2. Cobertura de ramos abaixo de 90% em `payments` e `scheduling`.
3. 22 funções acima de complexidade 10, duas acima de 20.
4. Cabeçalhos de segurança faltando fora do `matcher` (robots/sitemap/404/estáticos), `X-Powered-By`, `Permissions-Policy`.
5. Formulários de login/cadastro sem `method="post"`: antes da hidratação, a senha pode ir na URL.
6. Suíte: `sleep` de 5,5 s em `exclusao-conta.test.ts`, relógio real nos testes de expiração (auditoria de 06/11).

## Como reproduzir

```bash
docker compose up -d
npm run test:coverage
npx eslint src --rule '{"complexity":["warn",10]}' -f json -o complexidade.json
npm audit --json
npm run build && npx tsx tests/carga/servidor.ts   # em outro terminal
docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run carga.js
docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run -e N=30 -e DISPARO=$(( $(date +%s) * 1000 + 60000 )) rajada.js
docker run --rm -v "$PWD/zap:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:3100 -m 3 -J zap-baseline.json -r zap-baseline.html -I
```

A rajada consome a obra de estoque 1: suba o servidor de novo (banco recriado) antes de repetir.
