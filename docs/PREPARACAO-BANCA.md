# Kolô — Preparação para a banca (TCC 2)

> **Data:** 24/11/2026, nos laboratórios, a partir das 19h10. **Sem apresentação em PowerPoint:** a avaliação é feita sobre o sistema funcionando.
>
> **Formato:** 10 critérios sobre o sistema, cada um valendo de 0 a 0,5 (total 5,0). Fonte: mensagem da coordenação com os critérios da banca.
>
> **Atenção:** o documento NORMAS DISCIPLINA TCC2 (04/08/2026) traz outros critérios (Apresentação, Complexidade, Técnica, Mercado e Domínio, 1,0 ponto cada). A mensagem da banca é mais nova; confirmar com a Profa. Elisa qual vale.
>
> **Pré-requisito:** quem não entregar a monografia até 20/10 não apresenta (ver `PREPARACAO-MONOGRAFIA.md`).

---

## Panorama em 16/10

| #  | Critério                               | Evidência exigida pela banca                                   | Situação                                             | Nota estimada hoje |
| -- | -------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- | ------------------ |
| 1  | Levantamento de requisitos             | Documento de requisitos **validado e assinado** pela empresa    | Documento pronto, **sem assinatura**                 | 0,3                |
| 2  | Modelagem do banco de dados            | DER e banco implementado                                       | ✅ DER, schema e 9 migrações                         | 0,5                |
| 3  | Implementação do back-end              | Demonstração e código-fonte                                    | ✅ forte                                             | 0,5                |
| 4  | Implementação do front-end             | Demonstração das interfaces                                    | ✅ público completo; admin visualmente cru           | 0,4–0,5            |
| 5  | Integração front × back                | Operações completas pela interface                              | ✅; webhook ao vivo depende de URL pública           | 0,5                |
| 6  | Usabilidade e UX                       | Demonstração dos fluxos                                        | 🟡 sem E2E nem revisão de acessibilidade final       | 0,35–0,4           |
| 7  | Autenticação e perfis                  | Acesso e funcionalidades de cada perfil                         | ✅ Cliente, Artista e Admin                          | 0,5                |
| 8  | Relatórios e consultas                 | Consultas e relatórios gerados pelo sistema                     | ❌ só filtros e buscas; **nenhum relatório**         | 0,2                |
| 9  | Disponibilidade e acesso               | Sistema acessível, de preferência por endereço eletrônico       | ❌ **sem deploy**                                    | 0–0,1              |
| 10 | Validação com o cliente                | Documento de validação, aceite ou feedback da empresa           | ❌ **nada registrado**                               | 0–0,1              |

**Estimativa hoje: 3,3 a 3,6 de 5,0.** As maiores perdas estão nos critérios 8, 9 e 10, que exigem pouco código. É uma estimativa do grupo, não da banca.

---

## Por critério: pendências e sugestões

### 1. Levantamento de requisitos

- [ ] Gerar um PDF "Documento de Requisitos" a partir de `ESCOPO-E-STACK.md` v2.2: identificação do cliente e da equipe, contexto, escopo, RF01–RF31, RNF01–RNF24, RN01–RN12, papéis e permissões, fora de escopo
- [ ] Campo final de aceite: nome, cargo, data e assinatura do responsável pelo Kolô. Uma assinatura digital (gov.br) também serve
- [ ] Imprimir uma cópia assinada para levar no dia
- [ ] Saber explicar na banca por que 3D, Google Calendar e motor de horários foram adiados (`ESCOPO-E-STACK.md` §§2 e 14)

### 2. Modelagem do banco de dados

- [ ] Exportar o DER de `docs/DER.md` como imagem e deixá-lo aberto na demonstração
- [ ] Preparar exemplos de integridade garantida pelo banco: agenda sem sobreposição (RN08), um endereço por cliente, preços em centavos (RN07), pedido com cópia imutável do endereço
- [ ] Saber mostrar o banco implementado: tabelas no Postgres (Prisma Studio ou `psql`) e a pasta `prisma/migrations/`

### 3. Implementação do back-end

- [ ] Escolher 3 trechos de código para mostrar, se pedirem:
  - [ ] reserva transacional de estoque: `src/modules/orders/reserva.ts`
  - [ ] webhook com assinatura e idempotência: `src/modules/payments/webhook.ts` e `assinatura.ts`
  - [ ] validação por esquema (Zod): qualquer `validacao.ts` de `src/modules/`
- [ ] Mostrar a CI no GitHub Actions (lint, tipos, testes, build) e o número de testes
- [ ] Integrar o PBI-40 (exclusão de conta): a branch `feat/pbi-40-exclusao-conta` tem 10 commits só locais, sem push e sem PR
- [ ] Integrar o PR 68 (atualização de situação no `Sprint-2.md`)
- [ ] Estabilizar `tests/unit/formulario-horario.test.tsx`: falhou uma vez na suíte completa e passa sozinho, provavelmente por tempo limite

### 4. Implementação do front-end

- [ ] Melhorar o visual do admin: o menu são links sublinhados e a página inicial do `/admin` tem uma frase só. Resolvido junto com o critério 8
- [ ] Conferir todas as telas nos dados de demonstração (sem imagem quebrada nem texto de teste)
- [ ] Revisar os textos das políticas com a equipe (pendente no PBI-22)

### 5. Integração front-end × back-end

- [ ] Ensaiar as operações completas pela interface:
  - [ ] cadastro → login → carrinho → checkout → pagamento no sandbox → pedido pago → estoque baixado
  - [ ] admin muda a situação do pedido e registra o rastreio → cliente vê em `/conta/pedidos`
  - [ ] admin cadastra uma obra com imagens → ela aparece no catálogo
  - [ ] artista cadastra um horário → tentativa de sobreposição é recusada
- [ ] Sem deploy, o webhook do Mercado Pago precisa de túnel https (como no PBI-28); com deploy, configurar a URL de produção no painel do Mercado Pago

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

- [ ] Trocar a página inicial do `/admin` por um painel de indicadores:
  - [ ] faturamento pago no período
  - [ ] número de pedidos pagos e ticket médio
  - [ ] pedidos por situação, com link para `/admin/pedidos?filtro=...`
  - [ ] obras disponíveis, esgotadas e em rascunho
  - [ ] agendamentos dos próximos 7 dias
- [ ] Relatório de vendas por período (este mês, últimos 30 dias, intervalo escolhido) com obras mais vendidas e faturamento por artista
- [ ] Registrar a decisão num PBI novo, justificada pelo critério da banca
- [ ] No dia, mostrar também as consultas que já existem: filtros e busca de pedidos e clientes, busca no catálogo tolerante a acento, filtros e busca no portfólio, perfil do cliente com total gasto, agenda semanal
- [ ] Opcional: exportar o relatório (CSV ou impressão em PDF). A seção 14 do escopo deixou CSV de fora; decidir em grupo

### 9. Disponibilidade e acesso ao sistema

**É a maior lacuna.** Sem endereço público a nota tende a zero, e os critérios 5 e 10 também sofrem.

- [ ] Contratar a VPS e o domínio (orçamento previsto: R$ 30 a 60 por mês, `ESCOPO-E-STACK.md` §2)
- [ ] Criar Dockerfile da aplicação, `docker-compose` de produção (app, Postgres sem porta exposta, Caddy, backup) e Caddyfile com HTTPS automático (PBI-46)
- [ ] Configurar cabeçalhos de segurança (RNF07), que hoje não existem
- [ ] Configurar as variáveis de produção: bucket R2 de produção, Mercado Pago (sandbox, ou produção se o cliente quiser vender), Resend, Turnstile
- [ ] Fazer o seed do primeiro ADMIN e carregar os dados de demonstração
- [ ] Backup diário e um teste de restauração documentado (RNF16)
- [ ] Atualizar a URL do webhook no Mercado Pago e o CORS do R2 para o domínio
- [ ] **Plano B para o dia:** ambiente local pronto em um notebook (Docker, banco e seed) e um vídeo curto das operações completas, caso a rede do laboratório falhe

Uma hospedagem que mantenha o processo Node rodando (VPS, como previsto) é a mais adequada. O worker do pg-boss que libera reservas sobe junto com o servidor (`src/instrumentation.ts`).

### 10. Validação e atendimento às necessidades do cliente

- [ ] Agendar uma sessão com o responsável pelo Kolô **depois do deploy**, usando o endereço público
- [ ] Roteiro assistido: o cliente executa as tarefas principais (cadastrar obra, ver o catálogo, acompanhar um pedido, cadastrar horário, ver o painel)
- [ ] Registrar o feedback: o que atende, o que não atende, sugestões
- [ ] Corrigir o que for rápido e registrar o restante como trabalho futuro
- [ ] Termo de validação e aceite assinado: lista dos RFs com "atende / atende parcialmente / não atende", comentários, nome, cargo, data e assinatura
- [ ] Levar o termo impresso e citar a validação no Capítulo 5 da monografia

---

## Dados e roteiro da demonstração

- [ ] Seed de demonstração. Hoje `prisma/seed.ts` cria só três usuários e as faixas de tamanho. Incluir artistas com estilos, obras com fotos (de preferência as reais do Kolô, com autorização), itens de portfólio, um pedido pago, um pendente e um enviado, e horários na agenda
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

## Cronograma sugerido até 24/11

| Semana       | Foco                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| até 20/10    | Monografia (prioridade total)                                                            |
| 21–27/10     | Deploy na VPS com HTTPS (critério 9); integrar o PBI-40 e o PR 68                        |
| 28/10–03/11  | Painel de indicadores e relatório (8); seed de demonstração; documento de requisitos para assinatura (1) |
| 04–10/11     | Sessão de validação com o cliente e termo de aceite (10); ajustes do feedback             |
| 11–17/11     | Qualidade: axe-core, Lighthouse, teste com usuários, E2E se der (6); melhorar o admin (4) |
| 18–23/11     | Código congelado; ensaios do roteiro; plano B pronto; documentos impressos               |
| 24/11        | Banca, a partir das 19h10                                                                |

## Checklist do dia

- [ ] Sistema no ar pelo endereço público, conferido no mesmo dia
- [ ] Contas de demonstração dos três perfis funcionando
- [ ] Pagamento sandbox testado no dia
- [ ] Notebook com o ambiente local e o vídeo do plano B
- [ ] Documento de requisitos assinado e termo de aceite impressos
- [ ] DER e diagrama de arquitetura abertos para mostrar
