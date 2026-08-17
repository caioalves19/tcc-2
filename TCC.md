





## UNIVERSIDADE PAULISTA – UNIP
## BACHARELADO EM CIÊNCIA DA COMPUTAÇÃO







## CAIO SCORSONI MARTINS OLIVEIRA
## CAIO VINICIUS LUIZ ALVES
## GUILHERME DOS SANTOS SALUSTIANO
## GUSTAVO HENRIQUE RODRIGUES DE MAGALHÃES
## ROBERT ESTEVAN DA SILVA JUNIOR






## SISTEMA WEB PARA ATELIÊ E ESTÚDIO DE TATUAGEM










## CAMPINAS – SP
## 2026





## CAIO SCORSONI MARTINS OLIVEIRA - F346EH2
## CAIO VINICIUS LUIZ ALVES - F351041
## GUILHERME DOS SANTOS SALUSTIANO - G7661F0
## GUSTAVO HENRIQUE RODRIGUES DE MAGALHÃES - F354776
## ROBERT ESTEVAN DA SILVA JUNIOR - N8794F6






## SISTEMA WEB PARA ATELIÊ E ESTÚDIO DE TATUAGEM


Trabalho  de conclusão  de curso  apresentado à
Universidade   Paulista como   requisito   para o
recebimento do Bacharel     em     Ciência     da
## Computação.

## Orientador(a): Prof. Elisa Botta














## CAMPINAS - SP
## 2026





## DEDICATÓRIA

Dedicamos  este  trabalho  aos  nossos  familiares,  colegas  de  turma,  aos
professores e a todas as pessoas que nos apoiaram durante todo o curso.


































## AGRADECIMENTOS

Primeiramente,  agradecemos  a  Deus,  que  nos  deu  forças  para  continuar
mesmo nos momentos mais difíceis. Também gostaríamos de agradecer nossos pais,
que  nos  apoiaram  e  forneceram  as  condições  necessárias  para  estarmos  aqui.
Agradecemos também aos nossos colegas do curso de Ciência da Computação que
nos proporcionaram momentos de alegria.








## RESUMO


O presente Trabalho de Conclusão de Curso (TCC) visa solucionar os gargalos
operacionais do Kolô Ateliê & Estúdio, um estabelecimento em Pinheiros, São Paulo,
que integra estúdio de tatuagem e galeria de arte. Apesar do crescimento exponencial
impulsionado pela presença virtual, o diagnóstico revelou que o controle de vendas é
exclusivamente manual e há ausência de uma plataforma unificada para consulta de
catálogos e agendamentos, limitando a capacidade de expansão do negócio. Diante
disso, este trabalho propõe o desenvolvimento e a implementação de um sistema web
robusto, integrado e monolítico, utilizando React no front-end e Laravel no back-end
com  MySQL,  para  simplificar  os  processos  administrativos  e  oferecer  um  ambiente
seguro  para  o  consumo  de  arte. A  hipótese  central  é  que  a  centralização  de  um
catálogo digital, aliada à integração de um sistema de gerenciamento de pedidos via
API de gateway de pagamento (Mercado Pago), aumentará as vendas assíncronas.
Adicionalmente, a unificação a um módulo de agendamentos automatizado, integrado
ao Google Calendar e ao WhatsApp, elevará a eficiência operacional do estúdio de
tatuagem. Os objetivos específicos incluem o levantamento de requisitos, o projeto de
interfaces  UI/UX,  a  modelagem  de  dados  e  a  validação  por testes  funcionais,
consolidando  competências  de  Engenharia  de  Software  para  fomentar  a  economia
criativa local. Palavras-chave: Sistema Web. Ateliê de Tatuagem. E-commerce. React.
## Laravel.







## ABSTRACT


This Final Project (TCC) aims to solve the operational bottlenecks of Kolô Ateliê
& Estúdio, an establishment in Pinheiros, São Paulo, which integrates a tattoo studio
and an art gallery. Despite exponential growth driven by virtual presence, the diagnosis
revealed that sales control is exclusively manual and there is an absence of a unified
platform for consulting catalogs and scheduling appointments, limiting the business's
capacity   for   expansion.   Therefore,   this   work   proposes   the   development   and
implementation of a robust, integrated, and monolithic web system, using React for the
front-end  and  Laravel  with  MySQL  for  the  back-end,  to  simplify  administrative
processes and offer a safe environment for art consumption. The central hypothesis is
that  the  centralization  of  a  digital  catalog,  combined  with  the  integration  of  an  order
management  system  via  a  payment  gateway  API  (Mercado  Pago),  will  increase
asynchronous  sales.  Additionally,  the  unification  with  an  automated  scheduling
module,  integrated  with  Google  Calendar  and  WhatsApp,  will  raise  the  operational
efficiency of the tattoo studio. The specific objectives include requirements gathering,
UI/UX  interface  design,  data  modeling,  and  validation  through  functional  tests,
consolidating Software Engineering competencies to foster the local creative economy.


## Key-words: Web System. Tattoo Studio. E-commerce. React. Laravel







## Sumário
- INTRODUÇÃO ............................................................................................................... 8
- REFERENCIAL TEÓRICO ........................................................................................... 11
2.1. Sistemas Web e E-commerce .............................................................................. 11
2.2. Interface do Usuário (UI) e Experiência do Usuário (UX) em Ambientes Imersivos
## 11
2.3. Integração de Sistemas e Web APIs .................................................................... 12
2.4. Gateways de Pagamento Online .......................................................................... 13
2.5. React e o Desenvolvimento de Interfaces Web Modernas ................................... 13
- METODOLOGIA .......................................................................................................... 15
3.1. Definição da Metodologia ..................................................................................... 15
3.2. Procedimento de Coletas de Dados ..................................................................... 15
3.3. Definição de Requisito .......................................................................................... 16
3.4. Definição de Requisito .......................................................................................... 17
3.5. Modelagem e Planejamento do Sistema .............................................................. 17
3.6. Estratégia de Testes e Validação ......................................................................... 17
3.7. Procedimentos de Implementação ....................................................................... 18
- REQUISITOS E ESTUDOS DE TECNOLOGIAS ......................................................... 19
4.1. Definição de Requisitos do Sistema ..................................................................... 19
4.2. Requisitos Funcionais .......................................................................................... 19
4.3. Requisitos Não Funcionais ................................................................................... 20
4.4. Regras de Negócio ............................................................................................... 21
4.5. Tecnologias Escolhidas ........................................................................................ 21
4.6. Arquitetura do Sistema ......................................................................................... 22
- MODELAGEM E ARQUITETURA DO SISTEMA ......................................................... 23
5.1. Arquitetura do Sistema ......................................................................................... 23
5.2. Diagrama de Casos de Uso .................................................................................. 23
5.3. Modelagem de Dados .......................................................................................... 24
5.4. Fluxos de Processos ............................................................................................ 25
- CRONOGRAMA........................................................................................................... 28
- REFERÊNCIAS BIBLIOGRÁFICAS ............................................................................. 30



## 8



## 1. INTRODUÇÃO

O Kolô é um Ateliê e Estúdio de Tatuagem com uma proposta inovadora
de integração entre artistas plásticos, tatuadores residentes e a comunidade artística
de Pinheiros, região central do cenário cultural da capital paulista. O estabelecimento
promove  eventos  de  integração  que  atraem  centenas  de  apreciadores  para  seus
corredores e salas, criando um modelo de negócio que permite a imersão contínua na
arte e a capitalização de diferentes produtos e serviços em um único espaço físico.
Impulsionado   pela   produção de   conteúdo   audiovisual   no   Instagram,   o   Kolô
experimentou um crescimento substancial em sua presença virtual, resultando em um
aumento  considerável  na  demanda  por  agendamentos  de  tatuagens  e  venda  de
obras. De acordo com Laudon e Traver (2021), o comércio eletrônico contemporâneo
redefine a relação entre pequenas empresas e consumidores, exigindo ecossistemas
digitais próprios que garantam a confiabilidade das transações, a personalização de
serviços e a presença assíncrona no mercado.
Entretanto,  o  diagnóstico  realizado  junto  à  gerência  do  estabelecimento
constatou   que   os   processos   tecnológicos   internos   não   acompanharam   essa
expansão, gerando um severo gargalo operacional. Atualmente, o controle de vendas
é  feito  de  forma  exclusivamente manual,  não  há  uma  plataforma  para  consulta  de
catálogos  e  informações  cruciais  sobre  o  perfil  dos  clientes  não  são  devidamente
armazenadas,  limitando  a  capacidade  de  expansão  do  negócio.  Sob  a  ótica  da
investigação  metódica,  Prodanov  e  Freitas  (2013)  esclarecem  que  a  pesquisa
científica opera essencialmente como uma atividade humana direcionada a conhecer,
explicar  e  resolver  problemas  reais  da  sociedade.  Diante  desse  cenário  e  da
necessidade  latente  de  modernização  tecnológica,  o  presente  trabalho  levanta  o
seguinte  problema  de  pesquisa:  Como  o  desenvolvimento  de  uma  plataforma  web
dedicada  e  integrada  pode  solucionar  os  gargalos  de  gestão  manual  e  otimizar  os
fluxos  de  agendamento  e  e-commerce  do  Kolô  Ateliê  &  Estúdio?  Como  hipótese,
acredita-se  que  a  centralização  de  um  catálogo  digital  aliado  a  um  sistema  de
gerenciamento de pedidos via API de gateway aumentará as vendas assíncronas de
obras,  otimizando  o  desempenho  comercial  sem  demandar  novas  contratações
operacionais. Adicionalmente, presume-se que a unificação deste ecossistema a um

## 9



módulo  de   agendamentos   automatizado,  integrado  ao   Google   Calendar   e   ao
WhatsApp,  aumentará  a  eficiência  operacional  do  estúdio  de  tatuagem.  A  partir  do
histórico de dados gerado, a plataforma viabilizará a oferta inteligente de cupons de
desconto  e  recomendações  personalizadas,  estimulando  o  consumo  de  ambos  os
serviços de maneira orgânica.
O objetivo geral deste projeto consiste em desenvolver e implementar uma
aplicação web robusta e integrada, simplificando os processos administrativos do Kolô
e  oferecendo  um  ambiente  seguro  para  que  os  potenciais  clientes  consumam  arte.
Para alcançar este propósito, definem-se os seguintes objetivos específicos: realizar
o  levantamento  detalhado  de  requisitos  com  os  artistas  e  gestores,  etapa  que,
segundo Pressman e Maxim (2021), estabelece as bases lógicas de comunicação e
as  restrições  que  guiarão  o  sucesso  e  a  estabilidade  da  engenharia  do  software;
projetar  as  interfaces com  foco  em  usabilidade  (UI/UX);  modelar  o  banco de  dados
relacional  e  a  arquitetura  cliente-servidor  em  ambiente  monolítico — estrutura  que,
conforme  ressaltado  por  Sommerville  (2019), oferece  vantagens  significativas  de
coesão,  simplicidade  de  implantação  e  facilidade  de  manutenção  para  sistemas
integrados  de  médio  porte;  desenvolver  o  front-end  em  React  e  o  back-end  em
Laravel;  integrar  APIs  externas  para  automação  de  rotinas  (Google Calendar  e
WhatsApp)  e  processamento  de  checkout  de  pagamentos;  e  validar  o  software  por
meio de testes funcionais.
A   justificativa   do   projeto   reside   no   seu   valor   prático   e   técnico:
comercialmente,  elimina  processos  manuais  e  abre  canais  assíncronos  de  receita;
academicamente, consolida competências essenciais de Engenharia de Software no
curso de Ciência da Computação; e socialmente, fomenta a economia criativa local de
pequenos empreendedores na cidade de São Paulo.
Para   orientar   o   leitor,   este   trabalho   está   estruturado   em   capítulos
subsequentes:  o  Capítulo  2  apresenta  o  Referencial  Teórico,  fundamentando  as
tecnologias e conceitos que embasam a solução; o Capítulo 3 detalha a Metodologia
de pesquisa e desenvolvimento adotada pela equipe; os Capítulos 4 e 5 abordam a
Engenharia  de  Software  do  projeto,  detalhando  a  Análise  de  Requisitos  e  a
Modelagem   do   Sistema,   respectivamente,   por   meio   de   diagramas   lógicos   e

## 10



estruturais; e, por fim, o Capítulo 6 organiza o Cronograma de atividades previsto para
a execução prática do sistema no próximo semestre.

## 11



## 2. REFERENCIAL TEÓRICO
O  presente  capítulo  fundamenta  teoricamente  o  desenvolvimento  do
sistema web para o Kolô — estabelecimento que integra ateliê de arte e estúdio de
tatuagem.  São  abordados  os  conceitos  de  sistemas  web  e  comércio  eletrônico,  os
princípios de Interface e Experiência do Usuário em ambientes imersivos, a integração
de  sistemas  via  Web  APIs,  e  os  mecanismos  de  gateways  de  pagamento  online,
demonstrando como cada tema se aplica diretamente ao projeto.
2.1. Sistemas Web e E-commerce
Os sistemas de informação são definidos por Laudon e Laudon (2014, p.
15)  como  conjuntos  inter-relacionados  de  componentes  que  coletam,  processam,
armazenam  e  distribuem  informações  para  apoiar  a  tomada  de  decisões  nas
organizações.  Com  a  consolidação  da  internet,  essa  categoria  evoluiu  para  os
sistemas de informação web — aplicações acessíveis via navegador que exploram o
protocolo    HTTP    e    a    arquitetura    cliente-servidor    para    atender    usuários
geograficamente dispersos (TANENBAUM; WETHERALL, 2011).
No  âmbito  do  comércio  eletrônico,  Turban  et  al.  (2015,  p.  8)  definem  e-
commerce como o processo de compra, venda ou troca de produtos e serviços por
meio   de   redes   de   computadores.   A   modalidade   marketplace   reúne   múltiplos
vendedores em uma única plataforma, reduzindo custos de transação e ampliando o
alcance de mercado por meio do chamado efeito de rede (EVANS; SCHMALENSEE,
2016).  Para  negócios  locais,  a  digitalização  das  vendas  revela-se  estratégica:
pesquisa do CGI.br (2023) aponta que a presença digital amplia o alcance comercial
independentemente   do   porte   do   estabelecimento.   No   sistema   do   Kolô,   esse
paradigma   se   traduz   em  um   marketplace   especializado   em  obras   de   arte   e
experiências artísticas, superando as limitações geográficas do espaço físico.
2.2. Interface  do  Usuário  (UI)  e  Experiência  do  Usuário  (UX)  em  Ambientes
## Imersivos


## 12



A  incorporação  de  elementos  tridimensionais  em  ambientes  web  amplia
esse  paradigma.  Pesquisas  em  psicologia  ambiental  demonstram  que  experiências
espacialmente  ricas  intensificam  o  engajamento  emocional  e  a  memorabilidade
(BITNER, 1992). Jiang e Benbasat (2007) verificaram que a visualização interativa em
3D  aumenta  a  intenção  de  compra  e  reduz  a  incerteza  perceptual — efeito
especialmente  relevante  para  obras  de  arte  de  alto  valor  estético.  Tours  virtuais
baseados  em  fotografia  panorâmica  de  360  graus  também  demonstram  ampliar  o
tempo  de  permanência  do  usuário  na  plataforma  e  reforçar  a  percepção  de
credibilidade do estabelecimento (JUNG; TOM DIECK, 2017). No sistema do Kolô, a
galeria  3D  e  o  tour  virtual  pelo  ateliê  respondem  diretamente  a  essas  evidências,
diferenciando a plataforma de e-commerces convencionais.
2.3. Integração de Sistemas e Web APIs
A Application Programming Interface (API) constitui o contrato formal que
define   como   diferentes   módulos   de   software   trocam   informações   e   invocam
funcionalidades  uns  dos  outros  (FOWLER,  2002).  No  ambiente  web,  o  estilo
arquitetural  REST,  proposto  por  Fielding  (2000),  define  restrições  para  serviços
escaláveis e de fácil manutenção — entre elas: interface uniforme, ausência de estado
no  servidor  (statelessness),  cacheabilidade  e  arquitetura  cliente-servidor.  Serviços
que  aderem  a  essas  restrições  são  denominados  RESTful  e  utilizam  tipicamente
HTTP com JSON para serialização de dados (RICHARDSON; RUBY, 2007).
APIs  RESTful  viabilizam  a  integração  de  sistemas  heterogêneos  sem
acoplamento  rígido,  permitindo  que  cada  serviço  seja  desenvolvido,  implantado  e
escalado de forma independente (NEWMAN, 2015). No sistema do Kolô, esse modelo
se  manifesta  na  comunicação  entre  front-end  e  back-end,  na  integração  com
gateways de pagamento, em serviços de notificação (WhatsApp Business API, Google
Calendar  API)  e  no  armazenamento  de  mídias.  Do  ponto  de  vista  da  segurança,  o
padrão OAuth 2.0 (IETF, 2012) delega autorização sem expor credenciais, enquanto
JSON  Web  Tokens  permitem  gerenciar  sessões  de  forma  stateless  (JONES  et  al.,
## 2015).


## 13



2.4. Gateways de Pagamento Online
O  gateway  de  pagamento  é  o  componente  tecnológico  que  intermedia
transações  financeiras  entre  comprador,  sistema  de  e-commerce  e  instituições
financeiras — adquirentes, bandeiras e bancos emissores (TURBAN et al., 2015). O
fluxo  de  uma  transação  eletrônica envolve:  (1)  captura  dos  dados  pelo  sistema  do
comerciante;  (2)  encriptação  e  encaminhamento  à  adquirente  pelo  gateway;  (3)
consulta à bandeira; (4) autorização pelo banco emissor — todo o processo ocorrendo
em segundos (PCI SECURITY STANDARDS COUNCIL, 2022).
A   segurança   das   transações   é   garantida   pelo   protocolo   TLS,   que
criptografa  o  canal  de  comunicação  (RESCORLA,  2018),  e  pela  tokenização —
processo  no  qual  dados  sensíveis  do  cartão  são  substituídos  por  um  identificador
único  e  não  reversível,  impedindo  que o  número  real  trafegue  pelos  servidores  do
comerciante (ANDERSON, 2020). Esses requisitos são formalizados pelo padrão PCI
DSS,  ao  qual  todos  os  participantes  do  ecossistema  de  pagamentos  devem  aderir
## (PCI SECURITY STANDARDS COUNCIL, 2022).
O Mercado Pago, solução amplamente adotada no Brasil, disponibiliza uma
API RESTful que integra cartão de crédito/débito, Pix, boleto e carteira digital sem que
dados  sensíveis  trafeguem  pelos  servidores  do  comerciante  (MERCADO  PAGO,
2024). A tokenização ocorre no lado do cliente (browser), gerando um token de uso
único enviado ao back-end. Webhooks notificam o sistema sobre eventos assíncronos
— como confirmação de Pix — disparando automaticamente a liberação do conteúdo
adquirido. A escolha de um processador certificado PCI DSS nível 1 reduz o escopo
de auditoria e o risco regulatório do sistema (ANDERSON, 2020).
2.5. React e o Desenvolvimento de Interfaces Web Modernas
O  React  é  uma  biblioteca  JavaScript  de  código  aberto,  criada  e  mantida
pelo Facebook (atual Meta) desde 2013, voltada à construção de interfaces de usuário
por  meio  de  componentes  reutilizáveis  e  declarativos  (FACEBOOK,  2024).  Sua
premissa  central  é  a  decomposição  da  interface  em  unidades  independentes — os
componentes —,  cada  qual  responsável  por  sua  própria  lógica  de  renderização  e

## 14



estado, favorecendo a coesão e a manutenibilidade do código (BANKS; PORCELLO,
## 2020).
O mecanismo central que confere performance ao React é o Virtual DOM:
uma representação leve da árvore de elementos em memória que é comparada com
o  DOM  real  a  cada  atualização  de  estado.  O  algoritmo  de  reconciliação  (diffing)
identifica apenas os nós alterados e aplica cirurgicamente as mudanças no DOM do
navegador, evitando re-renderizações desnecessárias e garantindo fluidez mesmo em
interfaces  complexas  (STEFANOV,  2016).  Esse  comportamento  é  especialmente
relevante para o sistema do Kolô, cuja galeria tridimensional e tour virtual demandam
atualizações frequentes de estado sem comprometer a responsividade da página.
A  escolha  do  React  para  o  front-end  do  sistema  Kolô  justifica-se  pela
maturidade  do  ecossistema,  pelo  amplo  suporte  comunitário,  pela  compatibilidade
nativa com bibliotecas de renderização 3D como Three.js — integrada via React Three
Fiber  (POIMANDRES,  2024) — e  pela  possibilidade  de  evolução  futura  para
aplicações  móveis  por  meio  do  React  Native,  reutilizando  grande  parte  da  base  de
código já desenvolvida (EISENMAN, 2015).

## 15



## 3. METODOLOGIA

3.1. Definição da Metodologia
A metodologia é a seção do TCC que descreve o processo de realização
da pesquisa. Nela, o autor explica as trajetórias escolhidas para atingir as metas do
trabalho. Esta seção deve apresentar o tipo de pesquisa, as técnicas empregadas, os
instrumentos de coleta de dados e o método de análise das informações.
Geralmente, a metodologia descreve a natureza do estudo (se é qualitativo,
quantitativo  ou  misto),  o  propósito  (se  é  exploratório,  descritivo  ou  explicativo),  os
métodos técnicos (como pesquisa bibliográfica, documental, estudo de caso, pesquisa
de  campo  etc.)  e  o  universo  ou  amostra,  caso  existam  participantes.  Também  é
relevante explicar como os dados serão estruturados e analisados.
A  metodologia  utilizada  neste  trabalho  tem  como  seu  objetivo  principal
desenvolver um sistema web para o Kalo Ateliê e Estúdio de Tatuagem, garantindo
que  todas  as  necessidades  principais  do  estabelecimento  sejam  identificadas,
analisadas e transformadas em uma solução funcional na qual sejam atendidos todos
os requisitos desejados pelo cliente. A pesquisa é de natureza aplicada, uma vez que
procura resolver um problema concreto que o ateliê enfrenta, empregando conceitos
e práticas da Engenharia de Software e Desenvolvimento Web.
Ademais,  o  estudo  pode  ser  considerado  qualitativo  e  exploratório,  pois
envolverá  análises  do  funcionamento  atual  do estabelecimento,  identificação  de
necessidades e pesquisa das tecnologias mais apropriadas para a implementação do
sistema. O projeto também adotará os princípios da pesquisa-ação, uma vez que os
membros   estarão   diretamente   envolvidos   nas   etapas   de   coleta de   dados,
desenvolvimento e validação da solução em parceria com o cliente.
3.2. Procedimento de Coletas de Dados
A  coleta  de  dados  e  informações  será  realizada  diretamente  com  os
responsáveis  pelo  Kolô  Ateliê,  utilizando  entrevistas,  visitas  ao  local  do  estúdio  e

## 16



observações do funcionamento atual do estabelecimento.O foco e principal objetivo
dessa etapa é compreender os processos internos relacionados aos responsáveis do
local e ao gerenciamento de obras de arte, agendamento de tatuagens, divulgação de
portfólios e controle de clientes.
Durante  as  entrevistas,  serão  coletadas  informações  sobre  os  principais
desafios enfrentados pelo estabelecimento, como a gestão manual das vendas, falta
de   integração   entre   os   serviços   prestados,   problemas   na   organização   das
informações dos clientes e restrições no processo de agendamento. Também serão
avaliadas  as  demandas  particulares  dos  tatuadores  e  artistas  residentes,  com  o
objetivo de entender como o sistema pode contribuir tanto para a gestão administrativa
quanto para a promoção dos trabalhos executados.
Serão  feitas  observações  dos  processos  em  uso  no  ateliê,  além  das
entrevistas,  para  identificar  gargalos  operacionais  e  oportunidades  de  melhoria.  As
informações coletadas serão registradas e usadas como referência para estabelecer
os requisitos do sistema e para a criação da solução sugerida.
Com   base   nessa   análise,   será   viável   converter   as   necessidades
identificadas  em  funcionalidades  práticas, assegurando  que o  sistema  criado  esteja
em sintonia com as demandas reais do estabelecimento e de seus clientes.
3.3. Definição de Requisito
Depois  da  fase  de  coleta  de  dados,  procederemos  com  a  identificação  e
definição dos requisitos do sistema. Essa fase é crucial para assegurar que o software
atenda de maneira adequada às demandas do Kolô Ateliê.
A definição dos requisitos será fundamentada nas informações obtidas do
cliente e registradas em documentos de maneira estruturada, funcionando como um
guia para as etapas seguintes do desenvolvimento.
Assim, será possível minimizar problemas de comunicação e assegurar um
melhor alinhamento entre a equipe de desenvolvimento e as expectativas do ateliê.

## 17



3.4. Definição de Requisito
O   sistema   será   desenvolvido   com   base   em   uma   metodologia   ágil,
empregando  os  princípios  do  Scrum,  o  que  possibilitará  entregas  incrementais  e
ajustes  contínuos  de  acordo  com  as  demandas  identificadas  em  parceria  com  o
cliente. O projeto será dividido em etapas menores, conhecidas como sprints, durante
as quais funcionalidades específicas serão planejadas, desenvolvidas e testadas.
O  uso  de  práticas  ágeis  proporcionará  mais  flexibilidade  durante  o
desenvolvimento,   tornando   mais   fácil   fazer   correções   e   ajustes   durante   a
implementação  do  sistema.  Ademais,  serão  realizadas  reuniões  regulares  entre  a
equipe e os responsáveis pelo Kolô Ateliê para monitorar o progresso e garantir que
os requisitos estabelecidos estejam alinhados.
3.5. Modelagem e Planejamento do Sistema
Depois  de  coletar  os  requisitos,  criaremos  diagramas  e  modelos  para
ilustrar  a  organização lógica  e  funcional  do sistema.  Estarão  incluídos  os  seguintes
modelos:
- Diagrama de Casos de Uso;
- Diagrama de Entidade-Relacionamento (DER);
- Diagramas de fluxo;
- Protótipos de interface (wireframes).
O  objetivo  desses  modelos  é  ajudar  na  visualização  da  estrutura  do
sistema, na organização das funcionalidades e na comunicação entre os membros da
equipe e clientes.
A  modelagem  será  realizada  com  o uso de ferramentas  específicas  para
documentação e prototipação, o que proporcionará mais clareza na organização do
projeto.
3.6. Estratégia de Testes e Validação

## 18



Após o desenvolvimento das funcionalidades, serão realizados testes para
verificar  o  correto  funcionamento  do  sistema.  O  objetivo  dos  testes  serão  detectar
erros, confirmar requisitos e assegurar a estabilidade da aplicação. Serão utilizados:
- Testes de funcionalidade.
- Testes de integração.
- Testes de facilidade de uso.
- Testes de responsividade em dispositivos móveis e desktops.
Além disso, o sistema será validado com os responsáveis pelo Kolô Ateliê,
o  que  permitirá  verificar  se  a  solução  atende  às  demandas  identificadas  durante  o
levantamento de requisitos.
O  feedback  recebido  durante  essa  fase  será  empregado  para  fazer  os
ajustes e melhorias finais antes da entrega do projeto.
3.7. Procedimentos de Implementação
A  implementação  será  realizada  de  forma  incremental,  iniciando  pelas
funcionalidades  essenciais  do  sistema,  como  cadastro  de  obras,  gerenciamento  de
portfólio e sistema de agendamento.
Posteriormente, serão integradas funcionalidades complementares, como
integração com APIs externas, notificações automatizadas e sistema de pagamentos.
O  desenvolvimento  seguirá  boas  práticas  de  Engenharia  de  Software,
priorizando  organização  do  código,  reutilização  de  componentes,  segurança  da
informação e facilidade de manutenção futura.


## 19



## 4. REQUISITOS E ESTUDOS DE TECNOLOGIAS

4.1. Definição de Requisitos do Sistema
Segundo HOUAISS (2015, p. 819), a palavra Requisito significa “condição
necessária para alcançar certo fim; quesito”. Na Engenharia de Software, os requisitos
de um sistema funcionam como “objetivos” a serem alcançados, indicando que um
software  deve  atender  a  certos  quesitos  para  que  possa  cumprir  sua  função.  Os
requisitos de software descrevem de forma detalhada funcionalidades e restrições que
um  sistema  deve  possuir,  servindo  de  base  para  o  desenvolvimento,  validação  e
manutenção  do sistema. Dentre  esses  requisitos,  estão  os  funcionais  e  os  não
funcionais. Os requisitos funcionais (RF) definem o que o sistema deve fazer, e os não
funcionais (RNF) definem como o sistema deve performar (GeekForGeeks, 2026).
## 4.2. Requisitos Funcionais
Os  Requisitos  Funcionais  são  aqueles  que  definem  as  funcionalidades  e
operações  que  o  software  deve  ter.  Quem  define  os  RFs  é  o  cliente,  e  deve  ser
levantado por quem desenvolverá o sistema. Com isso, os Requisitos Funcionais são:
RF01 - O sistema deve ter uma funcionalidade para visualizar obras de arte.
RF02 - O  sistema  deve  permitir  ao  usuário  administrador  adicionar  ou
remover itens da galeria.
RF03 - O sistema deve exibir e permitir a busca de trabalhos realizados na
área da tatuagem.
RF04 - O  sistema deve  permitir  ao  usuário  administrador  adicionar  ou
remover fotos do portfólio.
RF05 - O  sistema  deve  permitir  a  definição  de  horários  e  regras  para
agendamentos.

## 20



RF06 - O  sistema  deve  possuir  integração  com  WhatsApp  e  Google
## Calendar.
RF07 - O sistema deve possuir um assistente automatizado para auxiliar
no processo de agendamento.
## 4.3. Requisitos Não Funcionais
Os Requisitos Não Funcionais são aqueles que definem o comportamento
de  um  software,  e  incluem  tópicos  sobre  desempenho,  segurança,  escalabilidade,
disponibilidade,   usabilidade,   manutenção   e   portabilidade.   A  própria   equipe   de
desenvolvimento  define  os  RNFs.  Seguindo  tais  definições,  os  Requisitos  Não
Funcionais são:
RNF01 - O  sistema  deve  possuir  certificado  SSL  para  o  site  rodar  em
## HTTPS.
RNF02 - O  sistema  deve  utilizar  uma  versão  de  PHP  que  receba
atualizações de segurança.
RNF03 - O  sistema  deve  ser  responsivo  e  se  adaptar  ao  layout  de
dispositivos móveis e desktops.
RNF04 - O sistema deve estar disponível no mínimo durante o horário de
funcionamento do estabelecimento.
RNF05 - O sistema deve garantir autenticação segura utilizando criptografia
de senhas.
RNF06 - O sistema deve seguir boas práticas de segurança contra ataques
comuns (XSS, SQL Injection).


## 21



4.4. Regras de Negócio
Regras  de  Negócio  tratam  sobre  instruções,  restrições  e  políticas  que
definem como o sistema deve operar. As Regras de Negócio são:
RN01 - Um   usuário   não   pode   acessar   funcionalidades   sem   estar
autenticado.
RN02 - Um  usuário  não  pode  comprar  obras  de  arte  sem  ter  meios  de
pagamento cadastrados.
## 4.5. Tecnologias Escolhidas
Por se tratar de uma aplicação web, a escolha das tecnologias adequadas
é essencial para um projeto bem-feito.
No  frontend,  uma  solução  seria  utilizar  HTML,  CSS  e  Javascript  com  a
biblioteca  JQuery.  No  entanto,  o  React  permite  criar  uma  interface  mais  avançada,
com  maior  interatividade  e  maior  facilidade  para  manutenção  de  código, sendo,
portanto, essa a melhor escolha para o frontend.
No   backend,   a   linguagem   utilizada   é   o   PHP,   que   possui   maior
confiabilidade e simplicidade no código. Mas utilizá-lo puro neste projeto juntamente
com React é bastante trabalhoso, e por isso se utilizará o framework Laravel.
O banco de dados é o MySQL, conhecido por sua confiabilidade e rapidez
em atender volumes de dados comuns a aplicações como essa.
O  servidor  web  utilizado  é  o  Nginx,  ferramenta  poderosa  que  permite
gerenciamento de portas e segurança contra-ataques de XSS e SQL Injection através
da configuração manual de um único arquivo.


## 22



4.6. Arquitetura do Sistema
O sistema será desenvolvido seguindo a arquitetura cliente-servidor, com
uma divisão clara entre front-end e back-end. A interface disponível ao usuário envia
requisições  ao  servidor  responsável  pelas  regras  de  negócio,  que  por  sua  vez  se
comunica  com  o  banco  de  dados  para  armazenamento,  realização  de  consultas  e
manipulação de dados.
Além  dessa  divisão,  a  aplicação  também  haverá  integração  a  serviços
externos como WhatsApp e Google Calendar, dos quais serão integrados por APIs.
Também  terá  a  estrutura  monolítica,  pois  o  sistema  será  único  e  reunirá
apresentação,   lógica,   regras   de   negócio,   persistência   de   dados   localmente   e
integração  com  serviços  externos,  trazendo  mais  simplicidade  e  facilidade  de
manutenção do projeto (SOMMERVILLE, 2019).


## 23



## 5. MODELAGEM E ARQUITETURA DO SISTEMA

Esta  seção  descreve  a  estrutura  técnica  do  Sistema  Web  para  Ateliê  e
Estúdio  de  Tatuagem,  detalhando  as  escolhas  arquiteturais  e  a  organização  lógica
dos  dados.  Conforme  estabelecido  por  Pressman  e  Maxim  (2021),  a  modelagem
técnica  é  um  passo  fundamental  para  garantir  a  viabilidade  e  a  qualidade  de  um
projeto de software antes de sua implementação final.
5.1. Arquitetura do Sistema
O sistema adota uma arquitetura monolítica cliente-servidor. Esta escolha
justifica-se pela necessidade de manter a lógica de negócio, a persistência de dados
e a integração com serviços externos (WhatsApp e Google Calendar) em um ambiente
coeso, facilitando a manutenção e o desenvolvimento ágil no TCC2.
5.2. Diagrama de Casos de Uso
O escopo funcional é delimitado pelo Diagrama de Casos de Uso (Figura
1), que mapeia a interação dos atores (Cliente, Administrador e Tatuador/Artista) com
as funcionalidades do sistema, estabelecendo os limites de permissão de acesso.

## 24




Figura 1 – Diagrama de Casos de Uso do sistema. Fonte: Elaborado pelos
autores (2026).
5.3. Modelagem de Dados
A organização lógica dos dados segue o modelo relacional. O Modelo de
Entidade-Relacionamento (DER) apresentado na Figura 2 demonstra a normalização

## 25



das entidades, garantindo a integridade referencial e separando a logística de serviços
(agendamentos) da logística de e-commerce (pedidos de obras).

Figura 2 – Modelo de Entidade-Relacionamento (DER). Fonte: Elaborado
pelos autores (2026).
5.4. Fluxos de Processos
Para garantir uma experiência intuitiva, foram mapeados os fluxos lógicos
de agendamento e compra. O fluxo de agendamento (Figura 3) detalha a jornada do
cliente até a integração com o Google Calendar, enquanto o fluxo de compra (Figura
4) descreve o processo de checkout e integração com o gateway de pagamento.

## 26



Figura  3 – Fluxo  lógico  de  Agendamento  de  Tatuagem. Fonte:  Elaborado  pelos
autores (2026).

## 27




Figura  4 – Fluxo  lógico  de  Compra  de  Obras  de  Arte. Fonte:  Elaborado
pelos autores (2026).

## 28



## 6. CRONOGRAMA
O cronograma é uma das principais partes do TCC na qual  apresenta o
planejamento  das  etapas  de  realização  do  projeto  dando  tempo  e  determinando
períodos de entrega e tempo para garantir que todas etapas sejam feitas em um prazo
previamente estabelecido para o  que o grupo possa se organizar e realizar todas as
tarefas em um tempo designado.
Para o cronograma deste projeto, o planejamento das tarefas programadas
para  a  criação  do  Sistema  Web  para  o  Kolô  Ateliê  &  Estúdio.  As  etapas  foram
dispostas de forma sequencial, o que possibilitou o acompanhamento do avanço do
projeto ao longo dos períodos de TCC I e TCC II. O planejamento abrange desde a
pesquisa  bibliográfica  e  definição  dos  requisitos  até  a  criação,  testes,  validação  e
apresentação final do sistema.
Primeiramente, será feita a definição do tema e a revisão da literatura, uma
etapa essencial para estabelecer a base teórica do estudo e entender os conceitos
fundamentais  ligados  a  sistemas  web,  comércio  eletrônico,  integração  de  APIs  e
Engenharia  de  Software.  Simultaneamente,  entrevistas  e  observações  com  os
responsáveis pelo Kolô Ateliê serão realizadas, possibilitando a coleta detalhada dos
requisitos funcionais e não funcionais do sistema.
Em  seguida,  será  realizada  a  fase  de  modelagem  e  planejamento  do
software,  que  envolve  a  definição  da  arquitetura  cliente-servidor,  a  modelagem  do
banco de dados relacional, a criação dos diagramas de casos de uso e fluxos lógicos,
além  da  prototipação  das interfaces  gráficas.  Essa  etapa  funciona  como  alicerce
estrutural para o progresso do aplicativo.
Depois    da    fase    de    planejamento,    começaremos    as    etapas    de
desenvolvimento do front-end com React e do back-end com Laravel e MySQL. Além
disso,  serão  feitas  as  integrações  com  serviços  externos,  como  WhatsApp,  Google
Calendar  e  gateway  de  pagamento  Mercado Pago,  permitindo  a  automação  dos
processos de agendamento e vendas online.

## 29



Em seguida, o sistema passará por testes funcionais, testes de integração,
validações de responsividade e verificações de usabilidade, assegurando que esteja
estável,  seguro  e  em  conformidade  com  os  requisitos  estabelecidos  anteriormente.
Com  base  no  feedback  recebido  durante  a  validação  com  os  responsáveis  pelo
estabelecimento, serão realizados os ajustes e correções finais na aplicação.
Por  último,  será  realizada  a  conclusão  da  documentação  do  TCC  II,  que
incluirá   uma   descrição   minuciosa   do   desenvolvimento   do   sistema,   resultados
alcançados, conclusões do projeto e preparação para a apresentação final diante da
banca examinadora.


## 30



## 7. REFERÊNCIAS BIBLIOGRÁFICAS

ANDERSON,  R.  Security  Engineering:  A  Guide  to  Building  Dependable
Distributed Systems. 3. ed. Hoboken: Wiley, 2020.
BANKS,   A.;   PORCELLO,   E.   Learning   React:   Modern   Patterns   for
Developing React Apps. 2. ed. Sebastopol: O'Reilly Media, 2020.
BITNER,  M.  J.  Servicescapes:  The  impact  of  physical  surroundings  on
customers and employees. Journal of Marketing, Chicago, v. 56, n. 2, p. 57-71, abr.
## 1992.
CGI.br — COMITÊ  GESTOR  DA  INTERNET  NO  BRASIL. Pesquisa  TIC
Domicílios  2023.  São  Paulo:  CGI.br,  2023. Disponível  em:  https://cgi.br/pesquisas/.
Acesso em: 20 maio 2026.
EISENMAN,  B.  Learning  React  Native:  Building  Native  Mobile  Apps  with
JavaScript. Sebastopol: O'Reilly Media, 2015.
EVANS, D. S.; SCHMALENSEE, R. Matchmakers: The New Economics of
## Multisided Platforms. Boston: Harvard Business Review Press, 2016.
FACEBOOK.  React – A  JavaScript  Library  for  Building  User  Interfaces.
Meta Open Source, 2024. Disponível em: https://react.dev. Acesso em: 10 abr. 2026.
FIELDING,  R.  T.  Architectural  Styles  and  the  Design  of  Network-based
Software  Architectures. 2000.  Tese  (Doutorado  em  Ciência  da  Computação) —
University of California, Irvine, 2000. Disponível em:
https://ics.uci.edu/~fielding/pubs/dissertation/top.htm. Acesso em: 10 abr. 2026.
GEEKFORGEEKS. Functional and Non Functional Requirements. [S. l.], 11
abr. 2026. Disponível em: https://www.geeksforgeeks.org/software-
engineering/functional-vs-non-functional-requirements/. Acesso em: 21 abr. 2026.

## 31




HOUAISS.   Requisito. In:   PEQUENO   Dicionário   Houaiss   da   Língua
Portuguesa. São Paulo: Moderna, 2015. p. 819. ISBN 978-85-16-10147-3.
IETF — INTERNET ENGINEERING TASK FORCE. RFC 6749: The OAuth
2.0    Authorization    Framework. Fremont:    IETF,    out.    2012.    Disponível    em:
https://datatracker.ietf.org/doc/html/rfc6749. Acesso em: 15 mar. 2026.
JIANG,  Z.;  BENBASAT,  I.  Investigating  the  influence  of  the  functional
mechanisms   of   online   product   presentations.   Information   Systems   Research,
Catonsville, v. 18, n. 4, p. 454-470, dez. 2007.
JONES, M. B.; BRADLEY, J.; SAKIMURA, N. RFC 7519: JSON Web Token
(JWT). Fremont: IETF, maio 2015. Disponível em:
https://datatracker.ietf.org/doc/html/rfc7519. Acesso em: 10 abr. 2026.
JUNG,  T.;  TOM  DIECK,  M.  C.  Augmented  reality,  virtual  reality  and  3D
technologies as tools to advance tourism marketing. Tourism Planning & Development,
Abingdon, v. 14, n. 1, p. 1-15, jan. 2017.
LAUDON,  K.  C.;  LAUDON,  J.  P.  Management  Information  Systems:
Managing the Digital Firm. 13. ed. New York: Pearson, 2014.
MERCADO PAGO. Documentação da API do Mercado Pago. São Paulo:
Mercado Livre, 2024. Disponível em:
https://www.mercadopago.com.br/developers/pt/docs. Acesso em: 5 maio 2026.
NEWMAN,  S.  Building  Microservices:  Designing  Fine-Grained  Systems.
Sebastopol: O'Reilly Media, 2015.
PCI SECURITY STANDARDS COUNCIL. PCI DSS v. 4.0. Wakefield: PCI
SSC, mar. 2022. Disponível em: https://www.pcisecuritystandards.org. Acesso em: 12
abr. 2026.

## 32



POIMANDRES.  React  Three  Fiber: A  React  Renderer  for  Three.js.  2024.
Disponível em: https://docs.pmnd.rs/react-three-fiber. Acesso em: 12 abr. 2026.
PRESSMAN,  Roger  S.;  MAXIM,  Bruce  R.  Engenharia  de  Software:  uma
abordagem profissional. 9. ed. Porto Alegre: AMGH, 2021.
PRODANOV, Cleber Cristiano; FREITAS, Ernani Cesar de. Metodologia do
Trabalho Científico: métodos e técnicas da pesquisa e do trabalho acadêmico.
- ed. Novo Hamburgo: Feevale, 2013.
RESCORLA,  E.  RFC  8446:  The  Transport  Layer  Security  (TLS)  Protocol
Version 1.3. Fremont: IETF, ago. 2018. Disponível em:
https://datatracker.ietf.org/doc/html/rfc8446. Acesso em: 10 mar. 2026.
RICHARDSON, L.; RUBY, S. RESTful Web Services. Sebastopol: O'Reilly
## Media, 2007.
STEFANOV, S. React: Up & Running. Sebastopol: O'Reilly Media, 2016.
TANENBAUM, A. S.; WETHERALL, D. J. Computer Networks. 5. ed. Upper
## Saddle River: Prentice Hall, 2011.
TURBAN, E. et al. Electronic Commerce: A Managerial and Social Networks
Perspective. 8. ed. New York: Springer, 2015.
LAUDON,  Kenneth  C.;  TRAVER,  Carol  Guercio.  E-commerce:  business,
technology, society. 16. ed. Boston: Pearson, 2021.

PRESSMAN,  Roger  S.;  MAXIM,  Bruce  R.  Engenharia  de  Software:  uma
abordagem profissional. 9. ed. Porto Alegre: AMGH, 2021.

## 33




SOMMERVILLE, Ian. Engenharia de Software. 10. ed. São Paulo: Pearson
Education do Brasil, 2019.