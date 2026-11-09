# Antes e depois das melhorias — 06–07/11/2026

Baseline: [`BASELINE.md`](BASELINE.md) (brutos em [`baseline/`](baseline/)). Depois: brutos em [`depois/`](depois/).
Mesma máquina, mesmos comandos, branch `aps/qualidade`. Metas em [`../PLANO.md`](../PLANO.md).

## Melhorias implementadas

| # | Ponto crítico (baseline) | Melhoria | Arquivos |
|---|---|---|---|
| M1 | Ramos de `payments` (88,5%) e `scheduling` (88,2%) abaixo de 90% | 9 testes de integração novos (Postgres real) para regras ainda não exercitadas: cartão em análise não prorroga reserva; Pix expirado com outro em aberto; Pix expirado depois do pedido pago; cancelar/estornar o que não existe; artista inativado; `?semana` repetido; admin edita sem trocar artista; limite do wizard na revisão | `tests/integration/{webhook-pendente,cancelamento,estorno,agenda,wizard-agendamento}.test.ts` |
| M2 | ZAP: formulários enviados antes da hidratação vão por GET, com senha e dados pessoais na URL | `method="post"` em 12 formulários (login, cadastro, recuperação, redefinição, troca de senha, exclusão de conta, perfil, endereço, contato, wizard, horário da agenda, formulário do admin) | `src/components/**`, `src/app/contato/formulario.tsx`; teste `tests/unit/formularios-post.test.tsx` |
| M3 | ZAP: CSP ausente em robots/sitemap/404, `X-Powered-By`, sem `Permissions-Policy`, sem `nosniff` nos estáticos | `Permissions-Policy`; `poweredByHeader: false`; cabeçalhos de arquivo (CSP sem execução) em todo caminho com ponto, que o `proxy` não cobre | `src/lib/seguranca.ts`, `next.config.ts`; testes `tests/unit/{seguranca,next-config}.test.ts` |

Cada melhoria seguiu TDD (teste vermelho → código → verde), exceto M1, que só acrescenta testes de comportamento já existente. Revisão
independente do diff (autor ≠ revisor) antes da medição final; os dois ajustes que ela pediu (wizard e formulários do admin sem `method`;
teste de semana dependente do relógio) entraram antes da nova medição.

## Métricas

| Métrica | Meta | Antes | Depois | Δ |
|---|---|---|---|---|
| Testes unitários | todos passam | 562 | **579** | +17 |
| Testes de integração | todos passam | 286 | **295** | +9 |
| Testes E2E | todos passam | 44 | **44** | — (nenhuma regressão de tela) |
| Cobertura de linhas | ≥ 80% | 92,46% | **92,51%** | +0,05 |
| Cobertura de ramos global | ≥ 70% | 87,39% | **87,89%** | +0,50 |
| Ramos `payments` | ≥ 90% | 88,5% (185/209) | **91,9%** (192/209) | **+3,4 → atende** |
| Ramos `scheduling` | ≥ 90% | 88,2% (135/153) | **91,5%** (140/153) | **+3,3 → atende** |
| Ramos `orders` | ≥ 90% | 90,3% | 90,3% | — |
| ZAP Medium | analisar | 1 (CSP ausente) | 1 (anti-CSRF, confiança baixa) | trocou; ver abaixo |
| ZAP Low | analisar | 8 | **5** | −3 |
| ZAP Info | — | 6 | 6 | — |
| `X-Powered-By` | ausente | presente | **ausente** | |
| k6 catálogo p95 | < 500 ms | 163 ms | 150 ms | sem regressão |
| k6 ficha p95 | < 500 ms | 212 ms | 200 ms | sem regressão |
| k6 checkout p95 | < 1 s | 446 ms | 378 ms | sem regressão |
| Rajada (30 × estoque 1) | 1 criado | 1 / 29 | 1 / 29 | — |
| Complexidade > 10 | 0 funções | 22 | 22 | não tratado (proposta) |
| `npm audit` alta/crítica | 0 | 2 + 2 | 2 + 2 | não tratado (proposta) |

As variações de k6 (−5% a −15%) estão dentro do ruído de uma máquina local; a leitura correta é "sem regressão", não "ficou mais rápido".

## ZAP: o que saiu, o que entrou

Saíram: **10038** CSP ausente (Medium), **10037** `X-Powered-By`, **10021** `X-Content-Type-Options` ausente, **10063**
`Permissions-Policy` ausente, **10024** informação sensível na URL (Info).

Entraram na segunda rodada e foram tratados ou analisados:

- **10055** CSP sem diretiva de fallback (Medium) em robots/sitemap: `form-action`, `base-uri` e `frame-ancestors` não herdam do
  `default-src`. Corrigido na hora (`form-action 'none'; base-uri 'none'`) e some na terceira rodada.
- **10202** Ausência de token anti-CSRF (Medium, confiança baixa): aparece porque os formulários passaram a ser POST e o ZAP começou a
  inspecioná-los. As Server Actions do Next recusam POST com `Origin` diferente do host e os cookies de sessão são `SameSite`
  (RNF06); não há formulário que aceite POST cruzado. Falso positivo analisado.

Seguem como Low/Info, analisados: COEP/COOP/CORP ausentes (isolamento entre origens; exigiria revisar o iframe do Turnstile),
`/_next/image` 500 (artefato do R2 falso), redirect de `/conta` com corpo RSC, atributo refletido em `?ordem=` (escapado pelo React).

## Limitações apontadas pela revisão

- Um caminho inexistente com ponto (`/obras/foo.bar`) recebe a CSP de arquivo e a página 404 aparece sem estilo. Nenhuma rota real
  tem ponto (o slug proíbe), então não afeta uso normal.
- `/_next/image` não tem ponto no caminho nem passa pelo `proxy`: continua sem os cabeçalhos de segurança.

## Propostas não implementadas (para o documento)

1. `npm audit fix` em `next` (RCE no Image Optimization com SVG; DoS em Server Actions), `better-auth` e `zod`: a correção mais
   importante, adiada por trocar framework e autenticação às vésperas da banca.
2. Quebrar os componentes com complexidade > 20 (`GestaoObras` 26, `WizardAgendamento` 23, `GestaoArtistas` 20) em subcomponentes.
3. Cabeçalhos em `/_next/image` e COOP/CORP.
4. Suíte: trocar o `sleep` de 5,5 s em `exclusao-conta.test.ts` e o relógio real dos testes de expiração por relógio fixo.
5. Medições que dependem do deploy (PBI-46): SSL Labs, securityheaders.com, disponibilidade e backup.
