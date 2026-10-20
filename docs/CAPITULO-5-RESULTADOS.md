# CAPÍTULO 5 — RESULTADOS E DISCUSSÃO

## 5.1 Estratégia de Testes e Cobertura Automatizada

A validação da plataforma Kolô fundamentou-se em uma abordagem de testes automatizados em múltiplas camadas, alinhada aos preceitos do Desenvolvimento Orientado a Testes (*Test-Driven Development* — TDD) preconizados por Beck (2002) e Pressman e Maxim (2021). 

Em consonância com as orientações acadêmicas da disciplina, a discussão de resultados de um sistema de software exige a apresentação de evidências empíricas, métricas de confiabilidade e análise crítica sobre o comportamento da solução frente aos requisitos estipulados.

A estratégia contemplou três níveis complementares de verificação:

1. **Testes Unitários:** Executados com o framework Vitest e a biblioteca React Testing Library sobre ambiente Node.js. Validam regras de negócio isoladas, esquemas Zod, funções de precificação monetária, assinaturas criptográficas de webhooks e estados de interface;
2. **Testes de Integração com Banco de Dados Real:** Executados contra uma instância real do motor PostgreSQL 17 rodando em contêiner Docker. Permitem atestar transações ACID, bloqueios pessimistas (`SELECT ... FOR UPDATE`), integridade referencial em cascata e restrições de exclusão temporal GiST (`btree_gist`), sem o mascaramento comum de bancos em memória;
3. **Testes de Ponta a Ponta (E2E) e Inspeção Contínua (CI):** Executados com Playwright cobrindo os fluxos críticos de navegação, checkout, preenchimento do wizard e restrições de controle de acesso (RBAC), integrados ao GitHub Actions para validação a cada solicitação de integração (*Pull Request*).

A suíte completa de testes automatizados do projeto registrou:
- **532 testes unitários** aprovados, distribuídos em 114 arquivos de teste;
- **276 testes de integração** com PostgreSQL real aprovados sem falhas;
- **43 testes de ponta a ponta (E2E)** no Playwright aprovados cobrindo os fluxos do sistema;
- Esteira de CI com `lint`, `format:check`, `typecheck` e `npm audit` (zero vulnerabilidades de nível alto ou crítico) com código de saída 0.

---

## 5.2 Rastreabilidade e Cobertura de Requisitos

A Tabela 5.1 estabelece a matriz de rastreabilidade do projeto Kolô, correlacionando cada um dos trinta e um Requisitos Funcionais (RF01 a RF31) ao Item do Backlog do Produto (PBI) correspondente, às suítes de testes automatizados responsáveis pela sua homologação e à situação final de atendimento.

**Tabela 5.1 — Matriz de Rastreabilidade e Cobertura de Requisitos Funcionais.**
*Fonte: Elaborado pelos autores (2026).*

| Requisito Funcional | PBI de Entrega | Suíte de Testes Automatizados (Unitários e Integração) | Situação |
| :--- | :---: | :--- | :---: |
| **RF01** — Cadastro de clientes | Sprint 1 | `cadastro-schema.test.ts`, `cadastro-cliente.test.ts` | Concluído |
| **RF02** — Autenticação e sessão revogável | Sprint 1 | `formulario-login.test.tsx`, `sessao-better-auth.test.ts` | Concluído |
| **RF03** — Recuperação de senha por e-mail | Sprint 1 | `email-recuperacao.test.ts`, `recuperacao.test.ts` | Concluído |
| **RF04** — Edição de perfil cadastral | Sprint 1 | `perfil-schema.test.ts`, `perfil-cliente.test.ts` | Concluído |
| **RF05** — Endereço de entrega | PBI-23 | `endereco.test.ts`, `endereco.test.ts` (integração) | Concluído |
| **RF06** — Controle RBAC (Cliente/Artista/Admin)| Sprint 1 | `decidir-acesso.test.ts`, `admin-layout.test.tsx` | Concluído |
| **RF07** — Home com obras em destaque | PBI-21 | `pagina-home.test.tsx`, `vitrine-destaques.test.tsx` | Concluído |
| **RF08** — Páginas de políticas institucionais | PBI-22 | `documento-politica.test.tsx`, `rodape.test.tsx` | Concluído |
| **RF09** — Catálogo de obras em grade 2D | PBI-19 | `catalogo-regras.test.ts`, `pagina-catalogo.test.tsx` | Concluído |
| **RF10** — Ficha da obra e dados técnicos | PBI-20 | `detalhe-obra.test.tsx`, `pagina-obra.test.tsx` | Concluído |
| **RF11** — Carrinho de compras persistente | PBI-24 | `carrinho-regras.test.ts`, `carrinho.test.ts` (integração) | Concluído |
| **RF12** — Checkout e cálculo de entrega | PBI-26 | `checkout-regras.test.ts`, `checkout.test.ts` (integração) | Concluído |
| **RF13** — Pagamento Checkout Pro (Mercado Pago)| PBI-27 | `mercado-pago.test.ts`, `pagamento.test.ts` (integração) | Concluído |
| **RF14** — Confirmação automática via webhook | PBI-28 | `webhook-notificacao.test.ts`, `webhook-aprovacao.test.ts`| Concluído |
| **RF15** — Reserva de estoque temporária (10 min)| PBI-25 | `pedido-checkout.test.tsx`, `reserva.test.ts` (integração) | Concluído |
| **RF16** — Rastreio e histórico de pedidos | PBI-29 | `detalhe-pedido.test.tsx`, `pedidos-cliente.test.ts` | Concluído |
| **RF17** — Galeria de portfólio de tatuagens | PBI-36 | `pagina-galeria.test.tsx`, `galeria-publica.test.ts` | Concluído |
| **RF18** — Busca textual no portfólio | PBI-37 | `busca.test.ts`, `catalogo-busca.test.ts` (integração) | Concluído |
| **RF19** — Gestão de fotos de portfólio | PBI-35 | `portfolio-upload.test.tsx`, `portfolio.test.ts` | Concluído |
| **RF20** — Wizard de agendamento em etapas | PBI-31 | `wizard-validacao.test.ts`, `wizard-agendamento.test.tsx` | Concluído |
| **RF21** — Redirecionamento com link `wa.me` | PBI-33 | `link-whatsapp.test.ts`, `mensagem-agendamento.test.ts` | Concluído |
| **RF22** — Cadastro manual de horários na agenda | PBI-34 | `agenda-regras.test.ts`, `agenda.test.ts` (integração) | Concluído |
| **RF23** — Alerta obrigatório de anamnese | PBI-32 | `wizard-avisos.test.tsx` | Concluído |
| **RF24** — Alerta de termo de consentimento | PBI-32 | `wizard-avisos.test.tsx` | Concluído |
| **RF25** — Declaração obrigatória de maioridade | PBI-32 | `wizard-avisos.test.tsx` | Concluído |
| **RF26** — CRUD administrativo de obras de arte | PBI-18 | `gestao-obras.test.tsx`, `catalogo-obras.test.ts` | Concluído |
| **RF27** — Upload direto ao Cloudflare R2 | PBI-17 | `upload-imagem.test.tsx`, `media-assinatura.test.ts` | Concluído |
| **RF28** — Gestão de artistas, estilos e tags | PBI-16 | `gestao-artistas.test.tsx`, `artistas.test.ts` (integração) | Concluído |
| **RF29** — Painel de despacho e gestão de pedidos | PBI-30 | `pedido-admin.test.tsx`, `pedidos-admin.test.ts` | Concluído |
| **RF30** — Visualização administrativa de clientes | PBI-38 | `lista-clientes-admin.test.tsx`, `perfil-cliente.test.ts` | Concluído |
| **RF31** — Configuração institucional do site | PBI-39 | `configuracao-site.test.ts`, `configuracao-site.test.ts` | Concluído |

A totalidade dos 31 requisitos foi satisfeita por testes automatizados, demonstrando cobertura formal dos fluxos funcionais.

---

## 5.3 Avaliação Experimental de Concorrência e Integridade de Estoque

A verificação do requisito de concorrência transacional (**RN04**) constituiu um dos experimentos centrais da pesquisa. Tratando-se de um comércio especializado em peças exclusivas (cujo estoque disponível frequentemente equivale a $Q = 1$), uma falha no isolamento de transações resultaria em venda duplicada (*overselling*).

### 5.3.1 Desenho do Experimento

Para avaliar a resiliência do sistema sob requisições paralelas, estruturou-se um teste automatizado de integração multithread no arquivo `tests/integration/reserva.test.ts`.

- **Cenário:** Simulação de 8 sessões autenticadas simultâneas de clientes distintos ($S_1, S_2, \dots, S_8$), acessando a aplicação via requisições concorrentes disparadas através de `Promise.all`;
- **Objeto em Disputa:** Uma obra de arte recém-publicada com estoque unitário estrito ($Q_{\text{estoque}} = 1$);
- **Ação Concorrente:** As 8 sessões submetem a operação `reservarItens(sessao, [{ obraId, quantidade: 1 }])` exatamente no mesmo instante temporal $T_0$;
- **Repetições:** O teste executou 10 rodadas consecutivas de disputa com novas obras criadas dinamicamente, neutralizando variações aleatórias de latência do sistema operacional.

### 5.3.2 Análise dos Dados e Resultados Obtidos

Os dados observados nas 10 rodadas de disputa concorrente estão consolidados na Tabela 5.2.

**Tabela 5.2 — Resultados do Experimento de Concorrência de Reserva de Estoque.**
*Fonte: Dados obtidos da execução de `tests/integration/reserva.test.ts` (2026).*

| Rodada | Sessões em Concorrência | Quantidade em Estoque | Reservas Concedidas | Reservas Recusadas (`indisponivel`) | Total no Banco (`artwork_reservation`) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 8 | 1 | 1 | 7 | 1 |
| 2 | 8 | 1 | 1 | 7 | 1 |
| 3 | 8 | 1 | 1 | 7 | 1 |
| 4 | 8 | 1 | 1 | 7 | 1 |
| 5 | 8 | 1 | 1 | 7 | 1 |
| 6 | 8 | 1 | 1 | 7 | 1 |
| 7 | 8 | 1 | 1 | 7 | 1 |
| 8 | 8 | 1 | 1 | 7 | 1 |
| 9 | 8 | 1 | 1 | 7 | 1 |
| 10 | 8 | 1 | 1 | 7 | 1 |
| **Total** | **80 tentativas** | — | **10 aprovadas (12,5%)** | **70 recusadas (87,5%)** | **Exatamente 1 por obra** |

A assertiva formal do teste evidenciou:
1. `expect(resultados.filter((r) => r.ok)).toHaveLength(1)`: Em todas as 10 rodadas, exatamente **uma única sessão** obteve retorno `{ ok: true }` com prazo de expiração de 10 minutos. As outras 7 sessões receberam deterministicamente a resposta de erro `{ ok: false, erro: "indisponivel" }`;
2. `expect(rows[0].total).toBe(1)`: A consulta à tabela relacional `artwork_reservation` atestou que a soma das unidades bloqueadas no banco de dados jamais ultrapassou o teto físico unitário ($1$);
3. **Ausência de Deadlocks:** A ordenação prévia dos identificadores das obras (`ORDER BY id ASC`) assegurou que nenhum bloqueio mútuo fatal ocorresse durante a aquisição das travas no PostgreSQL.

O experimento fornece evidência experimental da eficácia do mecanismo de transação serializada contra condições de corrida (*race conditions*).

---

## 5.4 Métricas de Desempenho e Acessibilidade

O atendimento aos requisitos não funcionais de experiência do usuário e qualidade de software foi mensurado por meio de ferramentas de auditoria.

### 5.4.1 Auditoria de Desempenho Web (Google Lighthouse)

Em atendimento ao requisito **RNF13**, que estabelece que o catálogo de obras e a ficha técnica devem atingir o marco de *Largest Contentful Paint* (LCP) abaixo de 2,5 segundos sob condições simuladas de rede móvel (Lighthouse 12.8.2, perfil mobile com 4G simulado, mediana de 3 rodadas), foram apuradas as métricas oficiais registradas na Sprint 2 (PBI-45). 

A Tabela 5.3 apresenta as métricas apuradas.

**Tabela 5.3 — Métricas de Desempenho e Qualidade Web (Lighthouse 12.8.2, Mediana de 3 Rodadas).**
*Fonte: Dados consolidados no repositório (`docs/Sprint-2.md`, PBI-45).*

| Indicador Técnico | Meta Estabelecida | Catálogo de Obras | Ficha da Obra | Situação |
| :--- | :---: | :---: | :---: | :---: |
| **Desempenho Geral (Score)** | $\ge 90$ | **97** (rodadas: 98/94/97) | **98** (rodadas: 98/98/92) | Aprovado |
| **Largest Contentful Paint (LCP)** | $< 2,5 \text{ s}$ | **2,43 s** | **2,25 s** | Aprovado |
| **First Contentful Paint (FCP)** | $< 1,8 \text{ s}$ | **0,78 s** | **0,78 s** | Aprovado |
| **Total Blocking Time (TBT)** | $< 200 \text{ ms}$ | **73 ms** | **83 ms** | Aprovado |
| **Cumulative Layout Shift (CLS)** | $< 0,10$ | **0** | **0** | Aprovado |
| **Acessibilidade Geral (Score)** | $\ge 90$ | **98** | **100** | Aprovado |
| **Boas Práticas de Engenharia** | $\ge 90$ | **100** | **100** | Aprovado |
| **Search Engine Optimization (SEO)**| $\ge 90$ | **100** | **100** | Aprovado |

Observa-se que:
- O catálogo atendeu à meta de LCP com margem de 70 ms (2,43 s frente à meta de 2,5 s), decorrente da otimização que restringiu a prioridade de carregamento (`priority`) estritamente à primeira foto da grade, mantendo as demais sob carregamento diferido (*lazy loading*);
- A pontuação de acessibilidade de 98 no catálogo deve-se à ordem hierárquica de cabeçalhos (`heading-order`), regra de boas práticas que não impede a conformidade WCAG A/AA;
- O deslocamento de layout foi nulo (CLS = 0) pela reserva prévia de dimensões de imagem no CSS.

### 5.4.2 Avaliação de Acessibilidade Digital (WCAG 2.1 AA / axe-core)

A conformidade com as diretrizes de acessibilidade digital (WCAG 2.1 nível AA), exigida pelo requisito **RNF21**, foi verificada por meio do motor `axe-core` em 35 telas da aplicação:
1. **Contraste Cromático Aprovado:** A paleta de cores atende à razão mínima de contraste de $4,5:1$ para textos normais e $3:1$ para elementos de controle;
2. **Navegação por Teclado e Foco Visível:** Elementos operáveis respondem ao foco visual (`focus-visible`) e comandos de teclado;
3. **Árvore de Acessibilidade:** Imagens implementam textos alternativos (`alt`), e botões iconográficos possuem atributos `aria-label`, sem ocorrência de violações críticas reportadas pelo motor de varredura.

---

## 5.5 Validação Qualitativa com o Estabelecimento Parceiro

A etapa de avaliação qualitativa com o Kolô Ateliê & Estúdio realizou-se em **10 de outubro de 2026**, contando com a participação da administradora e tatuadora do estabelecimento, **Melanie Schwark** (tendo o coadministrador Rafael Lotuffo participado das etapas iniciais de levantamento de requisitos e diagnóstico), juntamente com a equipe de desenvolvimento. Ressalta-se que a sessão avaliou uma versão intermediária da plataforma, anterior ao ciclo de estabilização, ajustes finos de acessibilidade e tipagem realizado entre 12 e 18 de outubro de 2026 (PBI-43 e PBI-45).

Durante a sessão assistida, a administradora executou as tarefas centrais do sistema em ambiente local homologado:
1. Navegação no catálogo de obras e verificação da ficha técnica;
2. Simulação de compra no checkout com teste das modalidades de retirada presencial no ateliê em Pinheiros e entrega postal com frete, utilizando o ambiente de sandbox do Mercado Pago;
3. Preenchimento do assistente de agendamento de tatuagem em etapas, confirmando os alertas obrigatórios de anamnese e consentimento informado até a geração do link direcionado para o WhatsApp;
4. Inclusão manual de horário na agenda interna do artista residente, verificando a recusa em caso de horários concorrentes.

### 5.5.1 Síntese do Retorno da Cliente

A administradora Melanie Schwark expressou satisfação com a concepção visual da plataforma, elogiando o design, a coerência com a identidade estética do ateliê e a fluidez da navegação entre as seções da loja e do portfólio.

Como principais oportunidades de aprimoramento, sugeriu ajustes pontuais nos textos descritivos das obras de arte e no detalhamento das orientações institucionais (em especial sobre prazos e instruções de retirada presencial no ateliê e frete). As sugestões foram registradas e incorporadas pela equipe nos arquivos de configuração do módulo `settings` e nas políticas do sistema.

Ademais, a administradora avaliou muito positivamente o modelo do assistente de agendamento que direciona o contato formatado ao WhatsApp sem reter prontuários médicos no sistema, considerando-o adequado à rotina do estúdio e protetivo quanto às exigências da LGPD.

---

## 5.6 Discussão dos Resultados, Dificuldades e Limitações

A análise científica dos resultados permite confrontar a hipótese levantada com os dados obtidos.

### 5.6.1 Validação da Hipótese de Pesquisa

A hipótese formulada estabeleceu que a centralização de catálogo, aliada a pagamentos automatizados com reserva temporária e triagem determinística via WhatsApp, eliminaria os controles manuais de comercialização, preveniria vendas duplicadas de peças exclusivas e qualificaria o atendimento inicial no Kolô.

Os resultados obtidos **sustentam parcialmente a hipótese**:
- O controle de acervo e a prevenção de vendas duplicadas foram evidenciados experimentalmente pela transação pessimista com reserva temporária, garantindo consistência no estoque;
- A substituição de controles informais por um catálogo digital com checkout estruturado atendeu à necessidade de centralização diagnosticada;
- A qualificação do atendimento inicial de tatuagem foi corroborada qualitativamente pela administradora e tatuadora Melanie Schwark, embora a mensuração formal de redução de tempo em produção demande acompanhamento de série histórica pós-implantação.

### 5.6.2 Dificuldades Técnicas Vivenciadas

Ao longo do desenvolvimento, a equipe enfrentou os seguintes desafios:

1. **Simulação e Testes de Webhooks:** A validação de webhooks do gateway em ambiente de desenvolvimento local exigiu o uso de túneis reversos e a geração de assinaturas compatíveis com o validador oficial do SDK do Mercado Pago;
2. **Políticas de CORS no Upload Direto ao R2:** A realização de uploads diretos do navegador para o Cloudflare R2 via URLs pré-assinadas demandou a harmonização das regras de CORS do bucket com as origens locais de teste;
3. **Casos de Borda em Pagamentos (PBI-43):** Identificou-se a necessidade de tratar o cenário no qual um pedido gera um pagamento Pix e, posteriormente, uma tentativa de quitação concorrente. A solução implementada registra a situação como `ESTORNO_PENDENTE`, resguardando o controle financeiro.

### 5.6.3 Limitações do Estudo

Em observância ao rigor acadêmico, apontam-se as seguintes limitações do trabalho:

- **Validação Financeira em Sandbox:** As transações financeiras foram processadas sobre o ambiente de testes (sandbox) do Mercado Pago com compradores simulados, haja vista que a ativação de credenciais finais de produção depende de trâmites bancários de pessoa jurídica do ateliê;
- **Ambiente de Testes Pré-Deploy:** As métricas de desempenho e acessibilidade foram coletadas localmente sobre o build de produção (`next start`) em contêineres Docker, estando o deploy público na VPS (PBI-46) e a homologação com cartões reais (PBI-47) programados para a etapa subsequente que antecede a banca examinadora;
- **Escopo Deliberadamente Postergado (v2.2):** Funcionalidades acessórias — como o visualizador 3D para esculturas e a integração bidirecional com a API do Google Calendar — foram conscientemente postergadas para trabalhos futuros, priorizando a estabilidade do fluxo de compras e a conformidade legal.
