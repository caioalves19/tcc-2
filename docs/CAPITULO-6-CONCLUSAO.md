# CAPÍTULO 6 — CONCLUSÃO

A conclusão deste Trabalho de Conclusão de Curso sintetiza as descobertas obtidas, confronta os resultados com os objetivos estabelecidos na introdução, avalia formalmente a sustentação da hipótese de pesquisa, sumariza as contribuições científicas e práticas geradas, reconhece as limitações do estudo e projeta os direcionamentos para trabalhos futuros.

---

## 6.1 Atendimento aos Objetivos da Pesquisa

O objetivo geral do trabalho — projetar, desenvolver e testar um sistema web integrado sob arquitetura de monólito modular para o Kolô Ateliê & Estúdio, unificando comércio eletrônico de obras de arte com controle transacional de estoque e um assistente determinístico de triagem de tatuagens em conformidade com a LGPD — foi substancialmente atendido.

A avaliação do atendimento dos objetivos específicos formulados no Capítulo 1 classifica-se da seguinte forma:

1. **Levantamento e Refinamento de Requisitos (Realizado):** A condução de entrevistas técnicas com os coadministradores e artistas residentes do Kolô permitiu a definição formal de trinta e um requisitos funcionais (RF01 a RF31), vinte e quatro requisitos não funcionais (RNF01 a RNF24) e doze regras de negócio (RN01 a RN12). Esse mapeamento estabeleceu as bases lógicas para o ciclo de desenvolvimento;
2. **Arquitetura e Modelagem Relacional (Parcialmente Realizado):** A aplicação foi estruturada segundo o padrão monolítico modular sobre Docker, integrando Next.js 16 e PostgreSQL 17 com normalização em 3ª Forma Normal, tipos de alcance temporal GiST e campos JSONB para snapshots contábeis. A configuração de proxy reverso com Caddy e emissão de TLS na VPS foi projetada formalmente, permanecendo como entrega da etapa de implantação em produção (PBI-46);
3. **Desenvolvimento do Comércio Eletrônico Assíncrono (Realizado):** A vitrine de obras foi desenvolvida com componentes de servidor (RSC), paginação, carrinho de compras persistente, checkout com opções de retirada presencial no ateliê em Pinheiros ou entrega postal com frete, integrando o processamento de pagamentos ao Mercado Pago Checkout Pro;
4. **Algoritmo Transacional de Concorrência de Estoque (Realizado):** Implementou-se o algoritmo de reserva temporária de dez minutos baseado em bloqueio pessimista ordenado (`SELECT ... FOR UPDATE`), garantindo consistência em nível de transação ACID. Os experimentos de concorrência com 8 sessões paralelas em 10 rodadas consecutivas evidenciaram a ausência de vendas duplicadas (*overselling*);
5. **Assistente Determinístico de Agendamento e Conformidade (Realizado):** Desenvolveu-se o formulário interativo de agendamento em oito etapas no cliente, exigindo aceites obrigatórios de anamnese presencial e consentimento informado antes de gerar o redirecionamento ao WhatsApp do estúdio (`wa.me`), preservando a empresa quanto à não retenção de dados sensíveis de saúde da LGPD (Artigo 11 da Lei 13.709/2018);
6. **Módulos de Retaguarda e Anonimização LGPD (Realizado):** Construíram-se as interfaces administrativas para controle de estoque, despacho postal com código de rastreamento, gestão de fotos do portfólio e a rotina transacional de exclusão de usuário com anonimização cadastral e preservação de registros contábeis (Artigos 16 e 18 da LGPD);
7. **Verificação e Homologação Computacional (Parcialmente Realizado):** O sistema foi submetido a baterias de testes automatizados (532 testes unitários, 276 testes de integração com PostgreSQL real e 43 testes ponta a ponta no Playwright), auditorias do Google Lighthouse (LCP de 2,43 s no catálogo e 2,25 s na obra) e acessibilidade com axe-core (WCAG 2.1 AA), realizando sessão de validação assistida em 10/10/2026 com a administradora e tatuadora Melanie Schwark (avaliando versão preliminar anterior ao ciclo de refinamentos de 12 a 18/10, tendo o coadministrador Rafael Lotuffo participado do levantamento inicial de requisitos). A homologação definitiva sobre ambiente de produção público e com cartões comerciais reais integra a fase preparatória para a banca examinadora.

---

## 6.2 Avaliação da Hipótese de Pesquisa

A hipótese que orientou a investigação afirmava que a centralização de acervo artístico em uma plataforma web dedicada, dotada de processamento automatizado de pagamentos com reserva temporária e triagem determinística via WhatsApp, seria capaz de eliminar os controles manuais, prevenir vendas duplicadas de peças exclusivas e qualificar o atendimento inicial no Kolô Ateliê & Estúdio.

Os dados obtidos e as evidências documentadas no Capítulo 5 **sustentam parcialmente a hipótese**:
- **Eliminação de Controles Manuais:** A centralização do acervo físico e dos pedidos em uma base de dados relacional com checkout estruturado substituiu os controles informais em redes sociais, atendendo à necessidade diagnosticada;
- **Prevenção Concreta de Overselling:** O bloqueio pessimista ordenado garantiu experimentalmente que apenas uma transação confirma a reserva de peças de tiragem unitária sob concorrência simultânea, mitigando o risco de venda duplicada;
- **Qualificação do Atendimento Inicial:** A sessão assistida com a administradora e tatuadora Melanie Schwark corroborou a adequação do assistente determinístico na coleta padronizada de informações e na proteção jurídica sobre dados de saúde. Contudo, a validação de redução de tempos de atendimento sob demanda comercial contínua permanece como aspecto a ser mensurado após a implantação em produção.

---

## 6.3 Contribuições do Trabalho

O desenvolvimento desta pesquisa proporcionou contribuições em duas vertentes:

### 6.3.1 Contribuições Práticas e Econômicas

Para o Kolô Ateliê & Estúdio, o sistema proporcionou:
- Estruturação de um canal de vendas assíncrono para o acervo físico de arte, complementando o atendimento presencial no ateliê em Pinheiros;
- Autonomia operacional frente a taxas de intermediação de plataformas generalistas de terceiros;
- Apresentação visual alinhada à identidade estética do estúdio;
- Governança preventiva quanto à LGPD no tratamento de dados cadastrais e de saúde.

### 6.3.2 Contribuições Técnicas e Acadêmicas

No âmbito da Engenharia de Software, o projeto demonstra:
- A viabilidade da arquitetura de **Monólito Modular** sobre Next.js 16 e Node.js 24 LTS, evidenciando tipagem estática compartilhada de ponta a ponta e transações ACID locais em um ambiente de manutenção acessível para pequenos negócios;
- A aplicação prática de **bloqueios pessimistas ordenados** para controle de estoque unitário ($Q=1$) em peças de arte física;
- A aplicação do conceito de **Privacy by Design**, evidenciando como a engenharia de requisitos pode evitar a coleta de dados de saúde mediante fluxos de triagem determinísticos direcionados a canais diretos;
- A consolidação de uma esteira de qualidade com expressiva cobertura de testes automatizados (532 unitários, 276 de integração com banco relacional real e 43 E2E).

---

## 6.4 Limitações do Estudo

Com transparência acadêmica, reconhecem-se as seguintes limitações do trabalho:
1. **Validação Financeira em Sandbox:** As transações financeiras foram validadas sob credenciais de teste do Mercado Pago Sandbox, aguardando a emissão de credenciais definitivas vinculadas à conta jurídica do ateliê;
2. **Ambiente de Medição Pré-Deploy:** As métricas de desempenho e acessibilidade foram obtidas em contêineres locais simulando o ambiente de produção, estando a publicação em VPS com domínio público programada para a etapa pré-banca;
3. **Escopo Deliberadamente Postergado:** Funcionalidades complementares da proposta preliminar — como o visualizador 3D para esculturas e a integração com a API do Google Calendar — foram postergadas na versão 2.2 para priorizar a estabilidade do fluxo comercial central e a aderência à LGPD.

---

## 6.5 Trabalhos Futuros

Como desdobramento da plataforma desenvolvida, propõem-se as seguintes frentes de aprimoramento tecnológico:

1. **Visualizador 3D Interativo para Esculturas:** Reintrodução da renderização 3D via Three.js / WebGL na ficha de produtos exclusivamente para obras tridimensionais (esculturas e cerâmicas), com modelos poligonais otimizados para não impactar o tempo de carregamento;
2. **Motor Algorítmico de Gestão de Slots de Agendamento:** Evolução da agenda interna com parametrização de intervalos de preparação entre sessões e sincronização opcional com calendários pessoais dos artistas via protocolos iCalendar / CalDAV;
3. **Módulo de Notificações Ativas via WhatsApp:** Avaliação da API Oficial da Meta (WhatsApp Business Cloud API) para disparo de lembretes prévios de sessão e código de rastreamento postal diretamente no aplicativo de mensagens;
4. **Painel de Indicadores e Relatórios:** Desenvolvimento de módulo analítico com gráficos consolidados de vendas por artista, pedidos por status e ticket médio para suporte à gestão financeira do ateliê;
5. **Autenticação Social Federada:** Inclusão de provedores de identidade externos (Google e Apple) integrados ao Better Auth para simplificação de cadastro.
