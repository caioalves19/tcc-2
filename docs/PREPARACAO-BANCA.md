# Kolô — Preparação para a banca (TCC 2)

> **Data:** 24/11/2026, nos laboratórios, a partir das 19h10. **Sem apresentação em PowerPoint:** a avaliação é feita sobre o sistema funcionando.
>
> **Formato:** 10 critérios sobre o sistema, cada um valendo de 0 a 0,5 (total 5,0). Fonte: mensagem da coordenação com os critérios da banca, confirmada pelo grupo em 20/11 como a que vale.
>
> **Pré-requisito:** quem não entregar a monografia até 20/10 não apresenta (entregue: `docs/tcc-2.pdf`).
>
> **Endereço do sistema:** <https://koloatelie.duckdns.org>

---

## Panorama em 21/11

| #  | Critério                               | Evidência exigida pela banca                                   | Situação                                                                       | Nota estimada hoje |
| -- | -------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------ |
| 1  | Levantamento de requisitos             | Documento de requisitos **validado e assinado** pela empresa    | 🟡 documento pronto (`docs/banca/`), **falta a assinatura**                    | 0,3                |
| 2  | Modelagem do banco de dados            | DER e banco implementado                                       | ✅ DER, schema e 10 migrações                                                  | 0,5                |
| 3  | Implementação do back-end              | Demonstração e código-fonte                                    | ✅ forte; 625 testes unitários verdes em 21/11                                  | 0,5                |
| 4  | Implementação do front-end             | Demonstração das interfaces                                    | ✅ público e admin com o visual do site                                        | 0,5                |
| 5  | Integração front × back                | Operações completas pela interface                              | 🟡 coberto pelo E2E; falta uma compra no sandbox **em produção**               | 0,4–0,5            |
| 6  | Usabilidade e UX                       | Demonstração dos fluxos                                        | ✅ axe-core nas 35 telas, Lighthouse ≥ 97, E2E; teclado em aberto              | 0,45–0,5           |
| 7  | Autenticação e perfis                  | Acesso e funcionalidades de cada perfil                         | ✅ Cliente, Artista e Admin; falta testar as contas em produção                | 0,5                |
| 8  | Relatórios e consultas                 | Consultas e relatórios gerados pelo sistema                     | 🟡 painel e relatório implementados, **sem dados em produção**                 | 0,3                |
| 9  | Disponibilidade e acesso               | Sistema acessível, de preferência por endereço eletrônico       | ✅ no ar com HTTPS; PRs 116 e 117 ainda abertas                                | 0,5                |
| 10 | Validação com o cliente                | Documento de validação, aceite ou feedback da empresa           | 🟡 termo pronto (`docs/banca/`), **falta a sessão e a assinatura**             | 0                  |

**Estimativa hoje: cerca de 3,9 de 5,0.** Com os dois documentos assinados e pedidos reais no painel, chega perto de 5,0. O que falta é quase todo fora do código. É uma estimativa do grupo, não da banca.

---

## Por critério: pendências e sugestões

### 1. Levantamento de requisitos

Documento: [`docs/banca/Documento-de-Requisitos-Kolo.pdf`](banca/Documento-de-Requisitos-Kolo.pdf) (8 páginas, aceite na página 8).

- [ ] Assinatura da Melanie na página 8 (a assinatura digital pelo gov.br também serve). O repositório é público: a cópia assinada fica fora do git
- [ ] Saber explicar na banca por que 3D, Google Calendar e motor de horários foram adiados (`ESCOPO-E-STACK.md` §§2 e 14)

### 2. Modelagem do banco de dados

- [x] Exportar o DER como imagem: [`DER.png`](DER.png) e [`DER.svg`](DER.svg) (21/11). No dia, deixar o SVG aberto no navegador, que permite zoom sem perder nitidez
- [ ] Preparar exemplos de integridade garantida pelo banco: agenda sem sobreposição (RN08), um endereço por cliente, preços em centavos (RN07), pedido com cópia imutável do endereço
- [ ] Saber mostrar o banco implementado: tabelas no Postgres (Prisma Studio ou `psql`) e a pasta `prisma/migrations/`

### 3. Implementação do back-end

- [ ] Escolher 3 trechos de código para mostrar, se pedirem:
  - [ ] reserva transacional de estoque: `src/modules/orders/reserva.ts`
  - [ ] webhook com assinatura e idempotência: `src/modules/payments/webhook.ts` e `assinatura.ts`
  - [ ] validação por esquema (Zod): qualquer `validacao.ts` de `src/modules/`
- [ ] Mostrar a CI no GitHub Actions (lint, tipos, testes, build) e o número de testes
- [x] Integrar o PBI-40 (exclusão de conta): PR #69, integrado em 17/10
- [x] Integrar o PR 68 (atualização de situação no `Sprint-2.md`), integrado em 15/10
- [ ] Estabilizar `tests/unit/formulario-horario.test.tsx`: falhou uma vez na suíte completa e passa sozinho, provavelmente por tempo limite

### 4. Implementação do front-end

- [x] Melhorar o visual do admin: o menu são links sublinhados e a página inicial do `/admin` tem uma frase só. Resolvido junto com o critério 8: menu com o visual do site e o painel no `/admin` (PBI-48)
- [ ] Conferir todas as telas nos dados de demonstração (sem imagem quebrada nem texto de teste)
- [ ] Revisar os textos das políticas com a equipe (pendente no PBI-22)

### 5. Integração front-end × back-end

- [ ] Ensaiar as operações completas pela interface:
  - [ ] cadastro → login → carrinho → checkout → pagamento no sandbox → pedido pago → estoque baixado
  - [ ] admin muda a situação do pedido e registra o rastreio → cliente vê em `/conta/pedidos`
  - [ ] admin cadastra uma obra com imagens → ela aparece no catálogo
  - [ ] artista cadastra um horário → tentativa de sobreposição é recusada
- Riscos encontrados na revisão de 21/11, a resolver antes da sessão com a cliente:
  - [x] **Webhook (RF14):** conferido em 21/11 com o pedido `20261121-4HE7DN`, que passou sozinho para **pago** com o pagamento aprovado registrado. A URL do aviso vai em cada preferência (`APP_URL` + `/api/webhooks/mercadopago`), não sai do painel. O webhook do painel da conta real ainda aponta para um túnel antigo do PBI-28 (`trycloudflare.com`); só importa se a loja passar a vender de verdade
  - [ ] **Pagamento no sandbox (RF13):** janela anônima (InPrivate), opção "Com sua conta Mercado Pago" e login como **comprador de teste**; pagar com o **saldo em conta** ou com um cartão já salvo nessa conta. Cartão de teste digitado à mão em "Novo cartão" foi recusado em 21/11 ("A transação não aceita este meio de pagamento"), com e sem login
  - [ ] **Recuperação de senha (RF03):** o remetente padrão é `onboarding@resend.dev`, que só entrega ao dono da conta do Resend. Verificar um domínio no Resend ou testar em produção com um e-mail que não seja o do dono
  - [ ] **Frete (RF12):** os valores em `src/modules/orders/frete.ts` são de exemplo (R$ 30 na capital, R$ 45 no resto de SP, R$ 65 a R$ 85 em outros estados). Confirmar com a Melanie na sessão
  - [x] **Horários (RF31):** salvos em `/admin/configuracoes` em 21/11 (domingo a quinta, 10h às 22h; sexta e sábado, 10h à meia-noite) e conferidos no rodapé do site

### 6. Usabilidade e experiência do usuário

- [x] Rodar axe-core e conferir 320, 768, 1440 e 1920 px nas telas que ainda não têm registro (PBI-45): as 35 telas passam sem exceção; as capturas ficam no artefato da CI
- [x] Rodar o Lighthouse no catálogo e na ficha da obra (meta: ≥ 90 e LCP < 2,5 s, RNF13): catálogo 97 e 2,43 s, ficha 98 e 2,25 s (Sprint-2, PBI-45)
- [ ] Conferir navegação por teclado e foco visível nos fluxos principais (compra, wizard, login): o axe-core da varredura não verifica isso, e o item ficou em aberto no PBI-45
- [ ] Pedir a 2 ou 3 pessoas de fora do grupo que façam a compra e o agendamento sem ajuda e anotar onde travaram. Serve também para o Capítulo 5 da monografia
- [x] E2E com Playwright para compra e wizard: `npm run test:e2e` cobre wizard, compra com webhook assinado, gestão e restrições de papel, e a varredura das telas (PBI-45)

### 7. Autenticação e perfis de usuário

- [ ] Criar uma conta de demonstração para cada perfil (Cliente, Artista e Admin) e anotar os e-mails fora do repositório
- [ ] Roteiro de restrições para mostrar:
  - [ ] visitante navega, mas precisa entrar para comprar
  - [ ] cliente não acessa `/admin` nem `/agenda`
  - [ ] artista edita só o próprio portfólio e a própria agenda (RN10)
  - [ ] admin acessa tudo
  - [ ] sessão revogada e recuperação de senha por e-mail
- [ ] Saber explicar que a checagem de papel está nos módulos do servidor, não só no menu

### 8. Relatórios e consultas

**É o critério mais fácil de subir.** O escopo decidiu "sem dashboard", mas a banca pede "relatórios, indicadores".

- [x] Trocar a página inicial do `/admin` por um painel de indicadores (PBI-48):
  - [x] faturamento pago no período
  - [x] número de pedidos pagos e ticket médio
  - [x] pedidos por situação, com link para `/admin/pedidos?filtro=...`
  - [x] obras disponíveis, esgotadas e em rascunho
  - [x] agendamentos dos próximos 7 dias
- [x] Relatório de vendas por período (este mês, últimos 30 dias, intervalo escolhido) com obras mais vendidas e faturamento por artista: `/admin/relatorio` (PBI-48)
- [x] Registrar a decisão num PBI novo, justificada pelo critério da banca: PBI-48 (RF32), em 18/10
- [ ] Gerar pedidos e agenda reais pelo site: o seed de demonstração não cria pedidos nem horários, e sem eles o painel e o relatório aparecem zerados. Fazer de 3 a 5 compras no sandbox em produção (obras e artistas diferentes), marcar uma como enviada com código de rastreio e cadastrar alguns horários na agenda
- [ ] No dia, mostrar também as consultas que já existem: filtros e busca de pedidos e clientes, busca no catálogo tolerante a acento, filtros e busca no portfólio, perfil do cliente com total gasto, agenda semanal
- [x] Opcional: exportar o relatório (CSV ou impressão em PDF). Decidido no PBI-48: versão para impressão (o navegador salva em PDF); CSV continua fora (§14 do escopo)

### 9. Disponibilidade e acesso ao sistema

No ar em <https://koloatelie.duckdns.org>, conferido em 21/11 (PBI-46). Guia: [`DEPLOY.md`](DEPLOY.md).

- [x] VPS e domínio (`koloatelie.duckdns.org`)
- [x] Dockerfile, `docker-compose.prod.yml` (app, Postgres sem porta exposta, Caddy, backup) e Caddyfile com HTTPS automático
- [x] Cabeçalhos de segurança (RNF07): HSTS, CSP com nonce, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`, conferidos no site publicado em 21/11
- [x] Seed do primeiro ADMIN e dados de demonstração carregados
- [x] Backup diário no R2 e prova de restauração (RNF16)
- [x] Webhook do Mercado Pago chegando no domínio: pedido pago em 21/11 (ver critério 5)
- [ ] Domínio verificado no Resend para a recuperação de senha (ver critério 5)
- [ ] Integrar na `main` as PRs 116 (deploy) e 117 (artistas reais): hoje o site publicado roda a partir da branch
- O alerta do GitGuardian na PR 116 é **falso positivo**: ele marcou `${POSTGRES_PASSWORD:?...}` no `docker-compose.prod.yml`, que só referencia a variável; nenhuma senha está no arquivo. Marcar como ignorado no painel do GitGuardian
- [ ] **Plano B para o dia:** ambiente local pronto em um notebook (Docker, banco e seed) e um vídeo curto das operações completas, caso a rede do laboratório falhe

Uma hospedagem que mantenha o processo Node rodando (VPS, como previsto) é a mais adequada. O worker do pg-boss que libera reservas sobe junto com o servidor (`src/instrumentation.ts`).

### 10. Validação e atendimento às necessidades do cliente

- [ ] Agendar uma sessão com o responsável pelo Kolô **depois do deploy**, usando o endereço público
- [ ] Roteiro assistido: as 8 tarefas da seção 2 do [termo](banca/Termo-de-Validacao-e-Aceite-Kolo.pdf), na ordem do termo. A tarefa 3 (compra) gera o pedido que as tarefas 6 (situação e rastreio) e 7 (painel e relatório) usam: não pular a 3
- [ ] Deixar pronto antes de ela sentar:
  - [ ] conta de admin para ela usar nas tarefas 5 a 7
  - [ ] o login de artista dela funcionando, para a tarefa 8
  - [ ] o login do comprador de teste do Mercado Pago, para a tarefa 3 (pagar com o saldo em conta; ver critério 5)
  - [ ] algumas compras já feitas, para o painel não mostrar um pedido só (critério 8)
  - [ ] o endereço `https://koloatelie.duckdns.org` escrito no campo "Endereço do sistema" do termo
- [ ] Registrar o feedback: o que atende, o que não atende, sugestões
- [ ] Corrigir o que for rápido e registrar o restante como trabalho futuro
- [ ] Termo de validação e aceite assinado: lista dos RFs com "atende / atende parcialmente / não atende", comentários, nome, cargo, data e assinatura
- [ ] Levar o termo impresso e citar a validação no Capítulo 5 da monografia

---

## Dados e roteiro da demonstração

- [x] Seed de demonstração (`npm run db:seed:demo`): os artistas reais do Kolô, com estilos, obras e tatuagens com fotos, já estão no site publicado (PR 117)
- [ ] Pedidos e horários: o seed não cria; gerar pelo site (ver critério 8)
- [ ] Roteiro de 10 a 15 minutos, cobrindo os 10 critérios em ordem:
  1. Requisitos assinados e DER (1, 2)
  2. Visitante: home, catálogo, ficha da obra, portfólio, wizard até o WhatsApp (4, 6)
  3. Cliente: cadastro, carrinho, checkout e pagamento no sandbox; pedido confirmado; acompanhamento (5, 7)
  4. Artista: portfólio e agenda; acesso negado ao admin (7)
  5. Admin: obras, pedidos e rastreio, clientes, painel de indicadores e relatório (3, 8)
  6. Endereço público e termo de aceite do cliente (9, 10)
- [ ] Dividir o roteiro entre os 5 integrantes, e cada um saber explicar qualquer parte
- [ ] Ensaiar pelo menos duas vezes com cronômetro, uma delas no laboratório ou numa rede diferente
- [ ] Preparar respostas para perguntas prováveis: por que monolito; por que Next.js e não o React + Laravel do TCC1; como evitam vender a mesma obra duas vezes; por que o pedido só é pago pelo webhook; o que fazem com dados de saúde (nada, RNF18); o que ficou fora e por quê

## Cronograma até 24/11

| Dia   | Foco                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------ |
| 22/11 | Riscos do critério 5 resolvidos; compras de teste (8); sessão com a cliente e assinaturas (1 e 10)     |
| 23/11 | Integrar as PRs 116 e 117; ensaios do roteiro com cronômetro; plano B pronto; documentos impressos     |
| 24/11 | Banca, a partir das 19h10                                                                              |

## Checklist do dia

- [ ] Sistema no ar pelo endereço público, conferido no mesmo dia
- [ ] Cache de imagens aquecido: abrir a home, `/obras`, `/tatuagens` e algumas fichas de obra antes de começar (`DEPLOY.md`)
- [ ] Contas de demonstração dos três perfis funcionando
- [ ] Pagamento sandbox testado no dia, com os cartões de teste do Mercado Pago à mão
- [ ] Notebook com o ambiente local e o vídeo do plano B
- [ ] Documento de requisitos e termo de aceite **assinados** e impressos
- [ ] DER e diagrama de arquitetura abertos para mostrar
