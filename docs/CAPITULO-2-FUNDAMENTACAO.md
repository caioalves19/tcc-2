# CAPÍTULO 2 — FUNDAMENTAÇÃO TEÓRICA

O presente capítulo estabelece as bases conceituais, científicas e tecnológicas que alicerçam a concepção e o desenvolvimento da plataforma Kolô. Abordam-se os sistemas web e o comércio eletrônico na economia criativa, a análise comparativa entre soluções existentes no mercado, os mecanismos de controle de concorrência e integridade transacional, os pilares de segurança na web e conformidade com a Lei Geral de Proteção de Dados (LGPD), as diretrizes de usabilidade e acessibilidade digital, e a discussão arquitetural entre monólitos modulares e microsserviços.

---

## 2.1 Sistemas Web e Comércio Eletrônico na Economia Criativa

Os sistemas de informação são conceituados por Laudon e Laudon (2014) como um conjunto integrado de componentes computacionais e humanos que coletam, armazenam, processam e distribuem dados com o intuito de subsidiar o planejamento, a tomada de decisões e o controle operacional nas organizações. Com a consolidação da infraestrutura global da internet e o aprimoramento dos protocolos de hipertexto, essa disciplina convergiu para os sistemas de informação web — aplicações distribuídas baseadas na arquitetura cliente-servidor que viabilizam o processamento remoto e a interação de usuários em tempo real por meio de navegadores universais (TANENBAUM; WETHERALL, 2011).

No contexto econômico, Turban et al. (2015) definem o comércio eletrônico (*e-commerce*) como a realização de transações comerciais, compra e venda de mercadorias e prestação de serviços mediadas por redes de computadores. Enquanto os grandes conglomerados varejistas exploram modelos de catálogo massificado de bens de consumo padronizados, a digitalização dos setores artesanais e autorais — englobados pelo conceito de economia criativa — impõe particularidades substantivas.

De acordo com pesquisas sobre o setor produtivo conduzidas pelo Comitê Gestor da Internet no Brasil (CGI.br, 2023), a adoção de canais próprios de comércio eletrônico por micro e pequenas empresas tem sido determinante para a manutenção da competitividade e para o relacionamento direto com consumidores. No caso específico de um ateliê de arte física e estúdio de tatuagem, o modelo de negócios transcende o varejo tradicional: cada obra física representa uma peça única e autoral, frequentemente de tiragem unitária e alto valor agregado estético, cuja venda exige transparência técnica (dimensões, pigmentos, suporte) e confiança transacional (LAUDON; TRAVER, 2021). 

Ademais, ao contrário de plataformas que operam como *marketplaces* multifacetados abertos a terceiros — que demandam esquemas complexos de divisão de repasses (*split payment*) e gestão de disputa entre múltiplos vendedores (EVANS; SCHMALENSEE, 2016) —, o Kolô adota o modelo de **loja autoral centralizada**. Nesse modelo, o ateliê gerencia o acervo físico de seus artistas residentes, necessitando de uma vitrine coesa que projete sua identidade e ofereça uma jornada de checkout sem etapas redundantes.

---

## 2.2 Trabalhos Relacionados e Comparação entre Soluções de Mercado

A modelagem de um sistema dedicado para o Kolô fundamenta-se na identificação das lacunas apresentadas pelas ferramentas comerciais atualmente disponíveis. A operação do ateliê é caracterizada pela convivência de duas frentes de receita: a comercialização assíncrona de bens físicos tangíveis (obras de arte) e a prestação personalizada de serviços corporais presenciais (sessões de tatuagem).

Para compreender o panorama das ferramentas disponíveis e justificar a construção de uma solução dedicada, realizou-se uma análise comparativa sistemática entre as principais categorias de plataformas do mercado, sintetizada na Tabela 2.1.

**Tabela 2.1 — Análise Comparativa entre Soluções de Mercado e a Plataforma Kolô.**
*Fonte: Elaborado pelos autores (2026), com base em documentações técnicas e portais oficiais.*

| Plataforma / Solução | Categoria de Mercado | Venda de Obras Físicas com Estoque Unitário | Reserva Temporária Transacional | Portfólio Artístico Segmentado | Triagem de Tatuagem via WhatsApp | Adequação LGPD Sem Guarda de Prontuário | Identidade Visual Autoral Integrada |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Shopify / Nuvemshop** (SHOPIFY, 2024; NUVEMSHOP, 2024) | E-commerce Genérico | Parcial (foco em tiragens amplas) | Não identificado nas fontes consultadas | Não suportado nativamente | Não suportado nativamente | Coleta de dados clínicos não recomendada nativamente | Dependente de templates de mercado |
| **Artsy / Saatchi Art** (ARTSY, 2024) | Marketplace Global de Arte | Suporte completo | Depende de confirmação da galeria | Não segmentado para tatuadores | Inexistente (foco exclusivo em obras) | Políticas corporativas globais | Identidade padronizada do marketplace |
| **Booksy / Fresha** (BOOKSY, 2024) | Agenda de Serviços Estéticos | Inexistente para obras físicas | Foco restrito a horários de serviço | Galeria simples de fotos | Pré-agendamento direto sem triagem prévia | Guarda prontuários e anamnese em nuvem | Interface padronizada |
| **Tattoodo** (TATTOODO, 2024) | Rede Social de Tatuagem | Inexistente | Inexistente | Suporte focado em artistas e estilos | Mensageria interna proprietária | Dados retidos no ecossistema da rede | Sem catálogo de produtos físicos |
| **Plataforma Kolô** | **Solução Dedicada Integrada** | **Suporte nativo com baixa atômica** | **Bloqueio de 10 min no PostgreSQL** | **Filtros por artista, estilo e região** | **Assistente com deep link estruturado** | **Conformidade estrita (sem dado clínico)** | **Design system e domínio unificados** |

A análise comparativa evidencia que:
1. As plataformas convencionais de comércio eletrônico foram concebidas para produtos manufaturados de grande tiragem. Não possuem mecanismos nativos de reserva temporária com bloqueio pessimista voltados a peças únicas ($Q=1$), o que impõe risco de vendas concorrentes simultâneas caso múltiplos compradores acessem o checkout no mesmo instante. Além disso, não contemplam fluxos de agendamento de serviços;
2. Os marketplaces consolidados de arte operam sob modelos de intermediação com comissões sobre vendas e não atendem à prestação de serviços de tatuagem;
3. As ferramentas de agendamento em massa atendem prioritariamente a serviços com tempos e procedimentos homogêneos (como salões de beleza). No segmento de tatuagem, cada projeto demanda alinhamento visual, referências anatômicas e validação de estilo. Forçar o agendamento de um horário antes da triagem técnica com o artista gera cancelamentos recorrentes. Ademais, esses sistemas costumam reter formulários de anamnese em servidores externos, gerando passivos regulatórios perante a LGPD.

Assim, a concepção do sistema Kolô justifica-se por unificar a comercialização de acervo físico e a triagem assistida de serviços corporais em um único ambiente sob controle do estabelecimento.

---

## 2.3 Controle de Concorrência e Integridade Transacional

A consistência de dados em aplicações de comércio eletrônico repousa sobre a correta implementação dos princípios ACID (Atomicidade, Consistência, Isolamento e Durabilidade), formalizados na teoria de bancos de dados relacionais (SILBERSCHATZ; KORTH; SUDARSHAN, 2020). 

Em sistemas web multiusuário, requisições HTTP paralelas são processadas de maneira concorrente pelo servidor. Quando múltiplos clientes tentam simultaneamente reservar ou adquirir o mesmo registro no banco de dados, podem manifestar-se anomalias de concorrência:
- **Atualização Perdida (*Lost Update*):** Ocorre quando duas transações leem o mesmo estado inicial de um registro e gravam alterações subsequentes com base nessa leitura, de modo que a segunda transação sobrescreve e anula os efeitos da primeira sem o conhecimento do sistema (KLEPPMANN, 2017);
- **Leitura Suja (*Dirty Read*):** Situação em que uma transação lê dados modificados por outra transação que ainda não realizou o commit formal e que pode vir a ser revertida (*rollback*);
- **Leitura Não Repetível (*Non-repeatable Read*) e Fantasmas (*Phantom Reads*):** Quando uma transação executa uma consulta agregada ou condicional repetidas vezes e encontra registros inseridos ou alterados por outras transações concorrentes já concluídas.

Para evitar que duas sessões concorrentes de checkout reservem a mesma obra física de estoque unitário ($Q=1$), a literatura estabelece duas abordagens preponderantes:

1. **Bloqueio Otimista (*Optimistic Concurrency Control*):** Assume que colisões são infrequentes. A transação realiza a leitura do registro, armazena um número de versão ou carimbo de data/hora e, no momento da gravação, verifica se a versão do registro permanece inalterada. Caso uma colisão seja detectada, a transação é abortada, cabendo ao cliente reiniciar o processo. Embora eficiente em cenários de baixa disputa, o bloqueio otimista pode gerar frustração ao consumidor em situações de alta concorrência por itens exclusivos, provocando rejeições no momento final da tentativa de compra (KLEPPMANN, 2017);
2. **Bloqueio Pessimista (*Pessimistic Concurrency Control*):** Assume que colisões podem ocorrer e protege a integridade dos dados bloqueando o registro diretamente no motor do banco de dados no momento da leitura, impedindo que outras transações modifiquem a linha até que a transação detentora da trava execute o `COMMIT` ou `ROLLBACK`.

Na plataforma Kolô, a integridade da regra de negócio **RN04** fundamenta-se no bloqueio pessimista executado através da cláusula relacional `SELECT ... FOR UPDATE` no PostgreSQL 17. Ao solicitar a reserva temporária, o sistema adquire a trava exclusiva das linhas correspondentes às obras disputadas dentro de um bloco transacional atômico. 

Para prevenir o risco de impasses mútuos (*deadlocks*) — cenário em que a Transação A bloqueia a Obra 1 e aguarda a Obra 2, enquanto a Transação B bloqueia a Obra 2 e aguarda a Obra 1 —, aplica-se a técnica de **ordenação prévia de recursos**: os identificadores (UUID) de todas as obras presentes no carrinho são ordenados em ordem lexicográfica ascendente antes da execução do bloqueio SQL. Dessa forma, todos os processos concorrentes adquirem as travas na mesma sequência estrita, eliminando ciclos de espera circular (SILBERSCHATZ; KORTH; SUDARSHAN, 2020).

---

## 2.4 Segurança da Informação em Aplicações Web (OWASP Top 10)

A segurança em sistemas web corporativos deve ser tratada como um requisito não funcional primário. O *Open Worldwide Application Security Project* (OWASP) cataloga periodicamente os riscos de segurança mais críticos para aplicações web (OWASP, 2021). A arquitetura do sistema Kolô incorporou defesas ativas contra as principais ameaças catalogadas:

### 2.4.1 Injeção de Código e Injeção de SQL (A03:2021 — Injection)

A Injeção de SQL (SQLi) ocorre quando entradas fornecidas por agentes maliciosos são concatenadas diretamente em comandos executados pelo interpretador de banco de dados, permitindo a leitura não autorizada de dados, manipulação de registros ou contorno de autenticação (ANDERSON, 2020). 

O sistema Kolô neutraliza essa vulnerabilidade na aplicação mediante o uso do Prisma ORM. O Prisma não realiza interpolação direta de texto; em vez disso, traduz todas as consultas em instruções preparadas (*Prepared Statements*) com parametrização tipada em nível de protocolo relacional. Adicionalmente, as entradas de busca no catálogo e no portfólio sofrem higienização semântica através de esquemas declarativos Zod, garantindo que nenhum caractere de controle relacional seja interpretado como código.

### 2.4.2 Cross-Site Scripting (A03:2021 — XSS) e Proteção de Borda

O Cross-Site Scripting manifesta-se quando dados não confiáveis são inseridos no documento HTML renderizado pelo navegador sem a devida sanitização, permitindo que scripts JavaScript arbitrários sejam executados no contexto da sessão da vítima (ANDERSON, 2020). 

A aplicação Kolô implementa defesas em duas camadas:
- Na camada de apresentação, o framework React 19 realiza o escape automático de entidades HTML por padrão em todas as variáveis interpoladas em componentes JSX/TSX (BANKS; PORCELLO, 2020; STEFANOV, 2016);
- Na camada de aplicação servidora (`src/proxy.ts` e `src/lib/seguranca.ts`), o sistema gera cabeçalhos de segurança dinâmicos, incluindo uma Content Security Policy (CSP) com *nonce* criptográfico individual por requisição, delimitando as origens autorizadas para carregamento de scripts e estilos.

### 2.4.3 Autenticação Segura com Hash scrypt (A07:2021 — Identification and Authentication Failures)

Senhas de acesso nunca são salvas em formato de texto claro. O módulo de autenticação utiliza o Better Auth, que processa senhas por meio do algoritmo de derivação de chaves **scrypt** com *salt* criptográfico individual por usuário. O scrypt foi concebido com alto custo de memória e processamento, dificultando ataques baseados em força bruta paralela ou dicionários pré-computados (*Rainbow Tables*).

As sessões autenticadas utilizam cookies protegidos com os atributos:
- `HttpOnly`: Impede que o token de sessão seja acessado via scripts no navegador (mitigando roubo de sessão via XSS);
- `Secure`: Garante que o cookie trafegue exclusivamente por conexões criptografadas HTTPS, ancoradas no protocolo TLS 1.3 especificado pela RFC 8446 (IETF, 2018);
- `SameSite=Lax`: Previne o envio involuntário do cookie em requisições forjadas originadas de domínios de terceiros, conferindo proteção nativa contra *Cross-Site Request Forgery* (CSRF).

### 2.4.4 Autenticidade e Idempotência de Webhooks Criptográficos (HMAC-SHA256)

A integração com sistemas financeiros externos exige mecanismos formais para assegurar que as notificações de pagamento recebidas pelo servidor sejam genuínas, íntegras e não tenham sido forjadas ou adulteradas por agentes maliciosos. A técnica de *Hash-based Message Authentication Code* (HMAC), formalizada pela RFC 2104 (KRAWCZYK; BELLARE; CANETTI, 1997), combina uma função de dispersão criptográfica (SHA-256) com uma chave secreta compartilhada entre o gateway de pagamentos e a aplicação receptora.

Ao receber um webhook do Mercado Pago no endpoint `/api/webhooks/mercadopago`, o sistema valida os cabeçalhos `x-signature` e `x-request-id` por meio do validador oficial `WebhookSignatureValidator` do SDK do Mercado Pago. O validador reconstrói a cadeia canônica contendo os dados do evento, o timestamp (`ts`) e a chave secreta, realizando a comparação do hash em tempo constante para mitigar ataques de temporização (*timing attacks*). Requisições com assinaturas inválidas ou defasadas temporalmente são rejeitadas com código HTTP 401.

---

## 2.5 Privacidade e Conformidade com a LGPD (Lei 13.709/2018)

A promulgação da Lei Geral de Proteção de Dados Pessoais (LGPD, Lei Federal nº 13.709/2018) estabeleceu diretrizes para a coleta, tratamento e retenção de dados de pessoas naturais.

### 2.5.1 Princípios de Minimização e Finalidade (Artigo 6º)

O princípio da necessidade (Art. 6º, III) estipula que o tratamento de dados deve se limitar ao mínimo indispensável para a realização de suas finalidades específicas. A arquitetura de dados do Kolô foi projetada sob o paradigma do *Privacy by Design*:
- O cadastro de clientes restringe-se estritamente aos dados exigidos para contato e despacho postal de encomendas: nome completo, e-mail, telefone e endereço de entrega;
- A conferência de documentos fiscais e dados de pagamento é delegada integralmente ao gateway bancário homologado PCI DSS (PCI SECURITY STANDARDS COUNCIL, 2022).

### 2.5.2 Tratamento de Dados Sensíveis de Saúde na Tatuagem (Artigo 11)

O Artigo 5º, inciso II, da LGPD qualifica informações referentes à saúde do indivíduo como **dados pessoais sensíveis**, cujo tratamento (Art. 11) exige salvaguardas adicionais de segurança jurídica e governança de TI. Na atividade profissional da tatuagem, é necessário colher informações clínicas prévias do cliente — tais como alergias, histórico de cicatrização, uso de medicamentos anticoagulantes e afecções dermatológicas (anamnese).

Armazenar prontuários médicos no banco de dados de uma aplicação web de comércio eletrônico representaria um passivo regulatório desnecessário para o ateliê, ampliando os riscos em eventual incidente de segurança.

Para atender à legislação sem inviabilizar a triagem, adotou-se a seguinte estratégia:
- O assistente de agendamento (wizard) opera de maneira pública e determinística, **sem persistir registros clínicos ou pessoais no servidor**;
- O sistema exige a confirmação explícita de caixas de seleção obrigatórias nas quais o usuário declara ciência de que a ficha médica de anamnese e o termo de consentimento livre e esclarecido serão preenchidos e assinados exclusivamente de forma presencial no ateliê, na data da sessão;
- O software atua como facilitador de contato, formatando uma mensagem padronizada direcionada ao WhatsApp comercial do artista, eliminando a retenção de dados clínicos em meio digital.

### 2.5.3 Direito à Eliminação do Titular versus Obrigações Fiscais (Artigos 16 e 18)

O Artigo 18, inciso VI, da LGPD confere ao titular o direito de requisitar a eliminação de seus dados pessoais. Em contrapartida, o Artigo 16, inciso I, autoriza a conservação desses dados para cumprimento de obrigação legal ou regulatória pelo controlador — exigência presente no Código Tributário Nacional e no Código de Defesa do Consumidor, que determinam a preservação de comprovantes de venda por prazos legais de guarda.

Para harmonizar esses dispositivos, a plataforma implementou o procedimento de **anonimização transacional**:
- Quando o titular requisita a exclusão de sua conta, seus dados pessoais identificáveis (nome, endereço e e-mail) são descaracterizados na tabela `user`, que recebe o marcador de exclusão lógica (`excluido_em`) e credenciais invalidadas;
- Os pedidos concluídos e seus valores faturados permanecem na tabela `order`, dissociados do perfil do usuário, assegurando a rastreabilidade contábil do ateliê sem violar a privacidade do titular.

---

## 2.6 Usabilidade e Acessibilidade Digital

A eficácia de um sistema web depende de sua capacidade de proporcionar uma interação humana fluida, intuitiva e acessível, independentemente do dispositivo ou das capacidades do usuário.

### 2.6.1 Heurísticas de Usabilidade de Nielsen

Dentre as dez heurísticas ergonômicas propostas por Nielsen (1994), destacam-se quatro que orientaram diretamente o projeto de interfaces do Kolô:
1. **Visibilidade do Estado do Sistema:** A interface comunica o andamento de operações assíncronas através de indicadores visuais claros, como o cronômetro regressivo de reserva no checkout e indicadores de etapa no wizard de agendamento;
2. **Correspondência entre o Sistema e o Mundo Real:** A terminologia empregada reflete o vocabulário de ateliês e estúdios de arte (ficha técnica, técnica mista, tiragem, blackwork), dispensando jargões computacionais desnecessários;
3. **Consistência e Padrões:** A disposição espacial de cabeçalhos, botões de ação e componentes de navegação segue padrões consistentes estabelecidos pelo design system em toda a aplicação;
4. **Prevenção de Erros:** O assistente de agendamento valida a coerência de datas e impede o envio de formulários incompletos, enquanto o checkout bloqueia pagamentos de itens com estoque esgotado antes da chamada ao gateway bancário.

### 2.6.2 Acessibilidade Digital e Diretrizes WCAG 2.1

A acessibilidade na web é normatizada pelo consórcio W3C através das *Web Content Accessibility Guidelines* (WCAG 2.1), estruturadas sobre quatro princípios fundamentais: Perceptível, Operável, Compreensível e Robusto (W3C, 2018).

Para assegurar conformidade com o nível AA:
- **Contraste de Cores:** Todos os textos sobrepostos à paleta da identidade visual respeitam a razão mínima de contraste de $4,5:1$ contra seus respectivos fundos cromáticos;
- **Navegação por Teclado e Foco Visível:** Todos os elementos operáveis (links, formulários, botões) possuem estados de foco evidentes (`focus-visible`), permitindo a navegação completa via teclado;
- **Semântica Estrutural e Textos Alternativos:** A interface utiliza elementos semânticos do HTML5 e provê descrições no atributo `alt` de fotografias de acervo e portfólio, garantindo leitura por tecnologias assistivas de leitores de tela.

---

## 2.7 Padrões Arquiteturais de Software: Monólito Modular versus Microsserviços

A escolha do padrão arquitetural constitui uma decisão relevante para a viabilidade, custo e manutenibilidade de uma aplicação web (SOMMERVILLE, 2019; PRESSMAN; MAXIM, 2021). A literatura recente discute a divisão entre microsserviços distribuídos e sistemas monolíticos (NEWMAN, 2015).

A arquitetura de microsserviços propõe a divisão da aplicação em serviços autônomos, cada qual com banco de dados próprio, comunicando-se através da rede. Conforme apontam Richards e Ford (2020), embora os microsserviços ofereçam escalabilidade independente para organizações com múltiplas equipes, introduzem complexidades adicionais:
- Latência cumulativa de rede e necessidade de gerenciar falhas parciais;
- Complexidade na coordenação de transações distribuídas entre bases de dados isoladas;
- Demanda por infraestrutura adicional para roteamento, observabilidade e orquestração de contêineres.

Em contrapartida, a **Arquitetura Monolítica Modular** reúne as camadas de negócio e apresentação em uma única base de código implantada como uma unidade executável, organizando internamente as responsabilidades através de fronteiras de módulos delimitadas e camadas de serviço coesas (FOWLER, 2002; SOMMERVILLE, 2019).

Para o escopo do Kolô, a arquitetura monolítica modular mostrou-se mais adequada pelas seguintes razões técnicas:
1. **Transações ACID Locais:** O controle de reserva temporária de obras ($Q=1$) exige atomicidade imediata entre o decremento de estoque e a gravação da reserva. No monólito sobre o PostgreSQL, a operação é resolvida dentro de uma transação serializada única, sem dependência de consistência eventual;
2. **Eliminação de Divergências de Contrato:** O uso do Next.js 16 com TypeScript em modo estrito compartilha modelos de dados e esquemas de validação Zod diretamente entre as Server Actions (servidor) e a interface reativa (cliente) (VERCEL, 2026; NODE.JS, 2026). Ademais, a comunicação entre o cliente e os pontos de extremidade da API fundamenta-se nos preceitos de serviços sem estado (*stateless*) e operações idempotentes do modelo REST (FIELDING, 2000);
3. **Custo Operacional e Simplicidade de Manutenção:** O sistema completo — abrangendo servidor web, banco relacional e fila de tarefas assíncronas — pode ser operado em uma única máquina virtual privada (VPS) conteinerizada, reduzindo a complexidade de manutenção.

Assim, o monólito modular consolidou-se como a abordagem arquitetural coerente com as dimensões e requisitos do projeto.
