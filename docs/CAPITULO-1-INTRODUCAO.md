# CAPÍTULO 1 — INTRODUÇÃO

## 1.1 Contextualização

O setor de artes plásticas e os serviços corporais de tatuagem compõem segmentos expressivos da economia criativa contemporânea no Brasil. Tradicionalmente fundamentados na interação física, no atendimento presencial e na circulação territorial em polos culturais urbanos, esses modelos de negócio vêm passando por transformações impulsionadas pela digitalização dos hábitos de consumo e pela expansão dos canais digitais de divulgação (CGI.br, 2023).

O Kolô Ateliê & Estúdio localiza-se no tradicional bairro de Pinheiros, polo cultural da capital paulista, combinando sob uma mesma identidade curatorial a produção, exposição e comercialização de obras físicas de arte autoral (pinturas, gravuras, esculturas e técnicas mistas) e a prestação de serviços personalizados de tatuagem artística.

Impulsionado pela divulgação de seu processo criativo por meio de plataformas como o Instagram, o Kolô experimentou um crescimento substancial em sua visibilidade e na procura por seus trabalhos. O ateliê mantém seu espaço físico ativo em Pinheiros como ambiente de produção e atendimento presencial. Contudo, para expandir sua atuação comercial para além da limitação geográfica do bairro e profissionalizar os fluxos de venda e de contato, a estruturação de uma plataforma web dedicada tornou-se indispensável.

Conforme apontam Laudon e Traver (2021), a evolução do comércio eletrônico exige que pequenas e médias empresas desenvolvam ecossistemas digitais próprios, capazes de assegurar a integridade de transações comerciais, a autonomia na apresentação do acervo e a comunicação assíncrona com consumidores, integrando os canais físicos e digitais do negócio.

## 1.2 Problema de Pesquisa

A despeito da demanda gerada pela divulgação virtual, o diagnóstico dos processos operacionais do Kolô revelou limitações tecnológicas nos controles internos:

1. **Gestão Manual de Vendas e Acervo:** O controle do catálogo de obras e as vendas eram realizados de forma predominantemente manual, dependendo de trocas individuais de mensagens em redes sociais e registros descentralizados. Esse modelo gerava retrabalho na conferência de disponibilidade de peças físicas e atrasos no fechamento de pedidos;
2. **Ausência de Catálogo Digital Centralizado:** Interessados na aquisição de obras dependiam do envio avulso de fotos e informações por aplicativos de mensagens, sem um ambiente unificado para consulta de dados catalográficos, dimensões, técnicas de produção e certificados de autenticidade;
3. **Complexidade no Atendimento Inicial de Tatuagem:** O processo de agendamento de sessões exigia diálogos longos e repetitivos para triagem preliminar de ideias, estilos artísticos, regiões corporais, dimensões aproximadas e esclarecimento de normas de biossegurança e conformidade legal (como a maioridade civil e a realização presencial da anamnese clínica);
4. **Governança de Dados e Conformidade:** O trânsito de dados pessoais por múltiplos canais informais de mensagens exigia a estruturação de um ambiente formalizado em conformidade com as diretrizes da Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018), resguardando o estabelecimento quanto à não retenção digital de dados clínicos sensíveis.

Diante desse cenário, formula-se o seguinte **problema de pesquisa**:

> *Como o desenvolvimento e a implementação de uma plataforma web integrada sob arquitetura de monólito modular podem solucionar os gargalos operacionais de controle manual de vendas de obras de arte e estruturar a triagem preliminar de agendamentos de tatuagens do Kolô Ateliê & Estúdio, assegurando integridade transacional de estoque e conformidade com a legislação de proteção de dados?*

## 1.3 Hipótese de Pesquisa

Para orientar a investigação, formulou-se a seguinte **hipótese**:

> *A centralização do catálogo de acervo artístico em uma plataforma web dedicada, aliada ao processamento automatizado de pedidos com reserva temporária de estoque e a um assistente determinístico em etapas para triagem e qualificação de agendamentos via WhatsApp, elimina os controles manuais de comercialização identificados no diagnóstico, previne vendas duplicadas de peças exclusivas e qualifica o atendimento inicial no Kolô Ateliê & Estúdio.*

A hipótese fundamenta-se na capacidade da Engenharia de Software em substituir controles informais por processos digitais consistentes, ancorados em transações atômicas de banco de dados e regras de negócio determinísticas.

## 1.4 Objetivo Geral

O objetivo geral desta pesquisa consiste em **projetar, desenvolver e testar um sistema web integrado sob arquitetura de monólito modular para o Kolô Ateliê & Estúdio**, provendo comércio eletrônico de obras de arte com controle transacional de estoque e um assistente determinístico de triagem de tatuagens direcionado ao WhatsApp, em conformidade com diretrizes de usabilidade, segurança da informação e privacidade da LGPD.

## 1.5 Objetivos Específicos

Para a consecução do objetivo geral, definiram-se os seguintes objetivos específicos:

1. **Levantar e refinar os requisitos de engenharia de software:** Conduzir entrevistas técnicas com os coadministradores e artistas residentes do ateliê para formalizar os requisitos funcionais (RF01 a RF31), não funcionais (RNF01 a RNF24) e regras de negócio (RN01 a RN12) da versão final da aplicação (v2.2);
2. **Projetar a arquitetura e a modelagem relacional:** Estruturar a aplicação segundo o padrão monolítico modular cliente-servidor em contêineres Docker (Next.js 16 e PostgreSQL 17), modelando o Diagrama Entidade-Relacionamento em 3ª Forma Normal com restrições temporais de exclusão (extensão `btree_gist`), projetando a camada de proxy reverso e TLS para a fase de implantação em produção;
3. **Desenvolver o módulo de comércio eletrônico assíncrono:** Implementar a vitrine de obras com carregamento otimizado de imagens (Next.js Image / WebP), carrinho persistente, checkout com opções de retirada presencial no ateliê em Pinheiros ou entrega postal com frete, integrando o processamento de pagamentos ao Mercado Pago Checkout Pro;
4. **Implementar o algoritmo transacional de controle de concorrência:** Projetar o mecanismo de bloqueio pessimista ordenado (`SELECT ... FOR UPDATE`) com reserva temporária de estoque por dez minutos e worker de expiração (`pg-boss`), prevenindo a venda duplicada (*overselling*) de obras exclusivas;
5. **Desenvolver o assistente determinístico de agendamento:** Criar um formulário em 8 etapas lineares no cliente que colete preferências estéticas e exija o aceite mandatório de alertas presenciais (anamnese clínica e consentimento informado), formatando o deep link direto para o WhatsApp comercial do estúdio (`wa.me`) sem retenção de dados sensíveis de saúde, em atendimento ao Artigo 11 da LGPD;
6. **Construir os módulos de retaguarda e conformidade:** Implementar o painel administrativo de gestão de acervo, despacho postal com código de rastreamento, agenda interna de horários de tatuagem e rotina transacional de anonimização de cadastro de clientes (Artigos 16 e 18 da LGPD);
7. **Verificar e validar a solução computacional:** Executar suítes de testes unitários e de integração com banco relacional real, realizar auditorias de desempenho (Google Lighthouse) e acessibilidade (axe-core / WCAG 2.1 AA), realizando sessão de validação assistida com os coadministradores do ateliê.

## 1.6 Justificativa

A justificativa do trabalho apoia-se em três pilares:

- **Dimensão Prática e Econômica:** Do ponto de vista da gestão de pequenos empreendimentos da economia criativa, a implantação de uma plataforma própria reduz a dependência de plataformas terceirizadas generalistas, que impõem taxas de intermediação recorrentes e padrões rígidos de layout que descaracterizam a proposta artística. A automação reduz falhas de controle de peças físicas exclusivas, amplia as oportunidades de venda para além do público local e agiliza a triagem dos atendimentos de tatuagem;
- **Dimensão Técnica e Acadêmica:** No âmbito do Bacharelado em Ciência da Computação, o projeto aplica de forma integrada conceitos fundamentais de Engenharia de Software: arquitetura de software monolítica modular, controle de concorrência e transações ACID em bancos de dados relacionais, autenticação de webhooks via HMAC-SHA256, acessibilidade digital (WCAG 2.1) e esteiras de integração contínua (CI) com testes automatizados;
- **Dimensão Social e Regulatória:** Socialmente, o projeto apoia a divulgação de artistas plásticos e tatuadores independentes atuantes em São Paulo. Sob o prisma regulatório, o trabalho demonstra como uma aplicação de médio porte pode ser concebida em conformidade com a LGPD, implementando o princípio do *Privacy by Design* ao evitar a guarda digital desnecessária de dados sensíveis de saúde.

## 1.7 Estrutura do Trabalho

O trabalho organiza-se nos seguintes capítulos:

- **Capítulo 1 — Introdução:** Contextualiza o ateliê Kolô, delimita o problema de pesquisa, apresenta a hipótese, formula os objetivos, justificativas e a estrutura do texto;
- **Capítulo 2 — Fundamentação Teórica:** Apresenta a base conceitual sobre comércio eletrônico na economia criativa, análise comparativa de soluções de mercado, controle de concorrência e transações, segurança em aplicações web (OWASP Top 10), LGPD, usabilidade, acessibilidade e estilos arquiteturais;
- **Capítulo 3 — Metodologia:** Detalha a classificação da pesquisa, os procedimentos de coleta, o ciclo Scrum em duas sprints, a estratégia de testes e a justificativa formal da reestruturação de escopo da versão preliminar para a v2.2;
- **Capítulo 4 — Desenvolvimento do Sistema:** Apresenta os requisitos funcionais, não funcionais e regras de negócio, a arquitetura de software, a modelagem de dados (DER), os algoritmos centrais e as interfaces da aplicação;
- **Capítulo 5 — Resultados e Discussão:** Documenta os resultados dos testes automatizados unitários, de integração e ponta a ponta, os experimentos de concorrência, as métricas do Google Lighthouse e axe-core, a sessão de validação com os coadministradores do Kolô e a discussão de limitações;
- **Capítulo 6 — Conclusão:** Avalia o grau de atendimento dos objetivos, discute a sustentação da hipótese, sintetiza as contribuições acadêmicas e práticas e aponta os direcionamentos para trabalhos futuros.
