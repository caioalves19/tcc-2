# CAPÍTULO 3 — METODOLOGIA

O presente capítulo descreve os procedimentos metodológicos, os instrumentos técnicos e as práticas de Engenharia de Software adotadas para a concepção, o desenvolvimento e a avaliação da plataforma Kolô. 

A metodologia reflete fidedignamente o que foi efetivamente executado pela equipe de desenvolvimento, contextualizando o processo de pesquisa-ação, as rotinas de coleta junto aos coadministradores do estabelecimento parceiro, a dinâmica das sprints ágeis, a justificativa formal da reestruturação de escopo entre o TCC 1 e o TCC 2, e os ambientes computacionais empregados.

---

## 3.1 Caracterização da Pesquisa

A condução metodológica deste estudo classifica-se segundo quatro eixos fundamentais estabelecidos pela literatura científica (GIL, 2017; PRODANOV; FREITAS, 2013):

1. **Quanto à Natureza:** Trata-se de uma **pesquisa aplicada**, pois orienta-se à resolução de um problema prático e delimitado de engenharia de software — a superação dos controles manuais de vendas de arte e a estruturação do fluxo de agendamentos no Kolô Ateliê & Estúdio —, visando gerar um produto tecnológico funcional;
2. **Quanto à Abordagem do Problema:** Classifica-se como **qualitativa**. O foco primordial reside na compreensão dos processos internos de trabalho, na análise das necessidades dos atores envolvidos (clientes, tatuadores e gestores) e na avaliação funcional das interfaces desenvolvidas, prescindindo de amostragem estatística populacional;
3. **Quanto aos Objetivos:** Define-se como **pesquisa exploratória**, ao promover o mapeamento preliminar das rotinas operacionais do ateliê, o estudo comparativo de ferramentas correlatas e a investigação técnica de soluções computacionais contemporâneas (como o Next.js 16, transações pessimistas e contêineres Docker);
4. **Quanto aos Procedimentos Técnicos:** Adota o delineamento da **pesquisa-ação** (*action research*). Conforme conceituado por Gil (2017), a pesquisa-ação pressupõe a participação ativa e colaborativa dos pesquisadores na análise do problema diagnosticado, na concepção da solução e na intervenção direta sobre o ecossistema da organização parceira, integrando desenvolvimento técnico e avaliação participativa.

---

## 3.2 Procedimentos de Coleta de Dados e Diagnóstico

A etapa de levantamento e diagnóstico realizou-se em conjunto com os coadministradores do Kolô Ateliê & Estúdio, **Rafael Lotuffo** e **Melanie Schwark**, e com os tatuadores residentes, por meio de entrevistas semiestruturadas e observação das rotinas de atendimento.

O roteiro de coleta investigou as seguintes dimensões operacionais:
- **Fluxo de Comercialização de Obras:** Identificou-se que as fotografias das peças eram publicadas de forma isolada em redes sociais. Os interessados entravam em contato por mensagens diretas, nas quais o atendente verificava se a peça ainda estava fisicamente disponível no ateliê em Pinheiros, calculava o frete manualmente em sites de logística e repassava chaves Pix. Esse processo gerava demora no atendimento e risco de desencontros de disponibilidade no acervo físico;
- **Fluxo de Atendimento de Tatuagem:** Mapeou-se o tempo dedicado pelos artistas à triagem inicial de mensagens em aplicativos. Grande parte do diálogo envolvia responder repetidamente sobre dimensões mínimas, estilos dominados pelo profissional e orientações de maioridade e biossegurança;
- **Retirada Presencial e Localização:** Confirmou-se a manutenção do espaço físico no bairro de Pinheiros como polo de criação e atendimento presencial, estabelecendo-se a necessidade de prever tanto o envio postal com frete quanto a opção de retirada presencial sem custo no ateliê;
- **Conformidade Legal:** Averiguou-se a necessidade de resguardar o ateliê quanto à Lei Geral de Proteção de Dados (LGPD), determinando que prontuários de anamnese de saúde fossem tratados de forma exclusivamente presencial.

As informações colhidas nas entrevistas foram sistematizadas e convertidas na matriz inicial de requisitos e regras de negócio da aplicação.

---

## 3.3 Metodologia de Desenvolvimento Ágil (Scrum Adaptado)

O desenvolvimento do software estruturou-se sob os princípios do **Scrum** (SCHWABER; SUTHERLAND, 2020), ajustado ao ritmo da equipe multidisciplinar composta por cinco integrantes do curso de Ciência da Computação: Caio Scorsoni Martins Oliveira, Caio Vinicius Luiz Alves, Guilherme dos Santos Salustiano, Gustavo Henrique Rodrigues de Magalhães e Robert Estevan da Silva Junior.

A execução do projeto organizou-se em duas Sprints formais:

### 3.3.1 Sprint 1 — Fundação, Arquitetura e Cadastros Base (05/09 a 04/10/2026)

A Sprint 1 dedicou-se à estruturação dos alicerces técnicos do sistema, abrangendo:
- Configuração do ambiente de desenvolvimento em contêineres Docker (Next.js 16 e PostgreSQL 17);
- Modelagem e migrações iniciais no Prisma ORM;
- Implementação da autenticação com senhas derivadas em scrypt e sessões persistidas no banco via Better Auth (RF01 a RF04);
- Implementação do controle de permissões por papéis (RBAC — Cliente, Artista e Administrador, RF06);
- Módulo de gerenciamento de artistas residentes, estilos artísticos e tags de taxonomia (RF28).

### 3.3.2 Sprint 2 — E-commerce, Reservas, Wizard e Fechamento de Qualidade (05/10 a 18/10/2026)

A Sprint 2 implementou a totalidade dos fluxos transacionais e de valor da plataforma:
- **Acervo e Vitrine (PBIs 16 a 21):** Upload de mídias com geração de URLs pré-assinadas e miniaturas (PBI-17), CRUD de obras de arte (PBI-18), catálogo em grade 2D com ordenação e paginação (PBI-19), ficha detalhada da obra (PBI-20) e página inicial institucional (PBI-21);
- **Comércio e Checkout (PBIs 24 a 29 e PBI-42):** Carrinho persistente (PBI-24), algoritmo de reserva temporária de 10 minutos com bloqueio pessimista (PBI-25), checkout com opções de retirada presencial em Pinheiros ou entrega postal (PBI-26 e 42), integração com Mercado Pago Checkout Pro (PBI-27), confirmação de pagamentos via webhook idempotente com validação de assinatura (PBI-28) e painel de pedidos do cliente (PBI-29);
- **Tatuagem e Agendamento (PBIs 31 a 37):** Assistente público em 8 etapas com validação declarativa (PBI-31), caixas de conformidade presencial obrigatória (PBI-32), gerador de link estruturado para o WhatsApp (PBI-33), agenda interna de horários com restrição de não sobreposição (PBI-34) e galeria de portfólio com filtros (PBIs 35 a 37);
- **Conformidade e Retaguarda (PBIs 38 a 40):** Perfil administrativo de clientes (PBI-38), parametrização de configurações institucionais do estúdio (PBI-39) e rotina transacional de exclusão e anonimização de dados conforme a LGPD (PBI-40);
- **Fechamento de Qualidade (PBI-45):** Execução de testes automatizados, auditoria de acessibilidade via axe-core e medições do Google Lighthouse.

### 3.3.3 Práticas de Engenharia e Controle Colaborativo

O trabalho colaborativo pautou-se pelas seguintes práticas:
1. **Rastreabilidade por PBIs:** Toda funcionalidade correspondeu a um Item do Backlog do Produto formalizado na pasta `docs/features/PBI-*.md`, contendo seus contratos de interface, dependências e critérios de aceite;
2. **Segregação de Branches e Revisão por Pares (*Peer Review*):** Cada integrante trabalhou em branches temáticas. A aprovação de solicitações de integração (*Pull Requests*) exigiu a revisão de código por outro integrante da equipe;
3. **Portões de Qualidade na Esteira de CI (GitHub Actions):** O repositório foi configurado para validar a cada PR a checagem de tipos (`npm run typecheck`), a conformidade do linter (`npm run lint`), a formatação (`npm run format:check`) e a suíte de testes automatizados (`npm test`).

---

## 3.4 Registro e Justificativa da Mudança de Escopo (TCC 1 para TCC 2)

Em conformidade com as orientações pedagógicas da disciplina, este documento registra a evolução técnica entre a proposta preliminar do projeto (TCC 1) e a implementação definitiva (TCC 2 — versão 2.2). 

A Engenharia de Software preconiza que o refinamento de escopo é parte natural do ciclo de vida de projetos de software, permitindo que a equipe priorize a estabilidade, a segurança e a integridade de dados frente às restrições temporais de entrega. 

A Tabela 3.1 detalha as alterações estruturais deliberadas e seus fundamentos técnicos.

**Tabela 3.1 — Matriz Justificada de Mudança de Escopo entre TCC 1 e TCC 2.**
*Fonte: Elaborado pelos autores (2026).*

| Componente / Funcionalidade | Planejado no TCC 1 | Executado no TCC 2 (Versão 2.2) | Justificativa Técnica da Mudança |
| :--- | :--- | :--- | :--- |
| **Stack de Linguagem e Framework** | React (Front-end) + Laravel / PHP (Back-end) | Next.js 16 (App Router) + TypeScript Full-Stack | A unificação da stack em TypeScript em todas as camadas elimina a duplicidade de interfaces entre duas linguagens distintas. O TypeScript compartilha modelos de dados e esquemas Zod nativamente entre cliente e servidor, acelerando o ciclo de desenvolvimento e prevenindo inconsistências em tempo de execução. |
| **Banco de Dados Relacional** | MySQL | PostgreSQL 17 | O PostgreSQL fornece suporte nativo a restrições de exclusão temporal via índices GiST (`EXCLUDE USING GIST`), impedindo sobreposição de agendamentos no próprio motor do banco, além de suporte robusto a campos `JSONB` indexáveis para snapshots imutáveis de pedidos. |
| **Visualizador 3D Interativo** | Modelos 3D de obras via Three.js / React Three Fiber | Ficha detalhada com fotografias em alta resolução (WebP) | O acervo do Kolô é composto prioritariamente por pinturas, gravuras e técnicas mistas. Fotografias em alta resolução transmitem com fidelidade as texturas e cores reais das peças. A renderização tridimensional aumentava o tempo de carregamento em redes móveis (LCP). Funcionalidade postergada para trabalhos futuros, focando em esculturas. |
| **Integração com Google Calendar** | Sincronização automatizada bidirecional via API Google | Agenda interna manual na plataforma + direcionamento WhatsApp | A sincronização direta via API exigiria processos adicionais de homologação de autorizações institucionais OAuth e acesso a calendários pessoais dos tatuadores. Ademais, cada sessão de tatuagem exige alinhamento prévio de ideias e referências anatômicas, tornando o contato direto via WhatsApp mais adequado à rotina do estúdio. |
| **E-mails Transacionais Contínuos** | Disparo de e-mails em cada transição de pedido e agendamento | E-mail restrito à recuperação de senhas; pedidos acompanhados no painel | O estúdio estabeleceu como diretriz operacional a comunicação direta via WhatsApp para tratativas imediatas com clientes. O acompanhamento formal de pedidos foi centralizado no painel da conta do cliente (`Meus Pedidos`), evitando sobrecarga com serviços externos de mensageria. |
| **Modelo de Atendimento e Entrega** | Foco restrito a vendas e agendamentos presenciais | Modelo integrado: e-commerce com retirada no ateliê em Pinheiros ou entrega postal, e triagem de agendamentos | O Kolô manteve seu espaço físico em Pinheiros para atendimento e produção artística, incorporando a plataforma web como canal assíncrono oficial de vendas e triagem de agendamentos. |

---

## 3.5 Ambiente, Instrumentos e Uso de Ferramentas de Inteligência Artificial

O ecossistema computacional utilizado durante o desenvolvimento abrangeu:

1. **Linguagens e Runtimes:** Node.js versão 24 LTS, TypeScript versão 5.8 em modo estrito, SQL padrão ANSI / PostgreSQL;
2. **Ambiente de Orquestração:** Docker Engine e Docker Compose executando os contêineres da aplicação web Next.js e do banco relacional PostgreSQL 17;
3. **Ferramental de Desenvolvimento e Depuração:** Editores Visual Studio Code e Cursor IDE, cliente de banco de dados Beekeeper Studio e terminal de comandos;
4. **Ferramentas de Testes e Qualidade de Código:** Vitest, React Testing Library, Playwright, axe-core, ESLint e Prettier;
5. **Transparência no Uso de Assistentes de Inteligência Artificial:** Em conformidade com as diretrizes contemporâneas de integridade acadêmica, registra-se que a equipe utilizou ferramentas de IA generativa (Cursor, Claude Code e Google Antigravity). A atuação desses modelos restringiu-se ao apoio na codificação (*pair programming*): geração de código boilerplate, apoio na elaboração de testes automatizados para regras declaradas e identificação de inconsistências de tipagem. Toda a tomada de decisão arquitetural, a modelagem conceitual do banco de dados, a definição de requisitos e a validação do software foram concebidas, supervisionadas e homologadas criticamente pelos acadêmicos integrantes do grupo.

---

## 3.6 Critérios de Validação e Homologação do Sistema

Para atestar o funcionamento da implementação e subsidiar a discussão de resultados, o projeto adotou critérios objetivos de validação técnica:
- **Critério 1 (Cobertura Funcional):** Mapeamento e aprovação de 100% dos requisitos funcionais categorizados como prioridade P0 na suíte de testes automatizados;
- **Critério 2 (Isolamento de Concorrência):** Evidência empírica de que requisições concorrentes disparadas simultaneamente para a mesma obra de arte física unitária não resultam em venda duplicada (*overselling*);
- **Critério 3 (Desempenho e Carregamento):** Atingimento de índice igual ou superior a 90 pontos no Google Lighthouse com tempo de LCP inferior a 2,5 segundos sob emulação de rede móvel (RNF13);
- **Critério 4 (Acessibilidade Digital):** Zero inconformidades críticas ou sérias reportadas pelo motor axe-core segundo o padrão internacional WCAG 2.1 nível AA (RNF21);
- **Critério 5 (Aceite do Usuário):** Condução de sessão assistida de homologação preliminar com a administradora e tatuadora Melanie Schwark do Kolô Ateliê & Estúdio (avaliando versão preliminar anterior ao ciclo de refinamentos de 12 a 18/10, tendo o coadministrador Rafael Lotuffo participado do levantamento inicial de requisitos), coletando retorno qualitativo sobre a operação do sistema e os fluxos implementados.
