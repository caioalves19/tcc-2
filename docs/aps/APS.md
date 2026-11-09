UNIVERSIDADE PAULISTA

BACHARELADO EM CIÊNCIA DA COMPUTAÇÃO

CAIO SCORSONI MARTINS OLIVEIRA

CAIO VINICIUS LUIZ ALVES

GUILHERME DOS SANTOS SALUSTIANO

GUSTAVO HENRIQUE RODRIGUES DE MAGALHÃES

ROBERT ESTEVAN DA SILVA JUNIOR

**AVALIAÇÃO E MELHORIA DA QUALIDADE DE SOFTWARE NA PLATAFORMA KOLÔ**

Atividades Práticas Supervisionadas

7º e 8º semestres

CAMPINAS

2026

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

CAIO SCORSONI MARTINS OLIVEIRA -- F346EH2 -- CC8Q12

CAIO VINICIUS LUIZ ALVES -- F351041 -- CC8P12

GUILHERME DOS SANTOS SALUSTIANO -- G7661F0 -- CC8P12

GUSTAVO HENRIQUE RODRIGUES DE MAGALHÃES -- F354776 -- CC8P12

ROBERT ESTEVAN DA SILVA JUNIOR -- N8794F6 -- CC8P12

**AVALIAÇÃO E MELHORIA DA QUALIDADE DE SOFTWARE NA PLATAFORMA KOLÔ**

> Trabalho apresentado às Atividades Práticas Supervisionadas do curso de Ciência da Computação da Universidade Paulista, referente ao segundo semestre de 2026, com aplicação ao projeto Kolô Ateliê & Estúdio.
>
> Orientadora do projeto de TCC: Prof.ª Dr.ª Elisa Botta.

CAMPINAS

2026

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

**RESUMO**

Este trabalho avalia a qualidade da plataforma web Kolô Ateliê & Estúdio, desenvolvida no Trabalho de Conclusão de Curso do grupo para a venda de obras de arte e o apoio ao agendamento de tatuagens, e propõe melhorias com base nos resultados. O objetivo é verificar em que medida testes e medições sustentam a confiabilidade, a eficiência, a manutenibilidade, a usabilidade e a segurança do sistema. O método classifica os 24 requisitos não funcionais do projeto na ISO/IEC 25010:2011, desdobra as características escolhidas em objetivos, perguntas e métricas pelo método GQM e fixa as metas antes da medição. Duas rodadas locais, com as mesmas ferramentas, mediram o sistema antes e depois das melhorias, por meio de testes unitários, de integração com PostgreSQL e de ponta a ponta, cobertura, complexidade ciclomática, carga, rajada concorrente, auditoria de dependências e varredura de segurança. Na linha de base, onze das quinze métricas medidas atenderam à meta: a rajada de 30 compras simultâneas da mesma peça criou um único pedido, e o percentil 95 dos tempos de resposta ficou abaixo da metade dos limites. Foram implementadas três melhorias de baixo risco: testes novos de pagamento e agenda, envio de formulários por POST e cabeçalhos de segurança nas respostas antes descobertas. Na segunda rodada, os 918 testes passaram, os ramos dos módulos de pagamento e de agenda superaram a meta de 90% e os alertas de baixo risco da varredura caíram de oito para cinco. Seguem fora da meta as 22 funções acima da complexidade 10 e os avisos críticos e altos das dependências, registrados como propostas com critério de aceite. Conclui-se que o Kolô atende à maior parte das metas nas condições locais avaliadas e que repetir a medição depois de cada correção torna a melhoria verificável. A comprovação em produção, a navegação por teclado e a restauração de *backup* permanecem pendentes.

Palavras-chave: Qualidade de software; Testes de software; Comércio eletrônico; Confiabilidade; Kolô.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

**SUMÁRIO**

```{=openxml}
<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve">TOC \o "1-3" \h \z \u</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Clique com o botão direito e escolha Atualizar campo para gerar o sumário.</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>
```

```{=openxml}
<w:p><w:pPr><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1134" w:bottom="1134" w:left="1701" w:header="1134" w:footer="720" w:gutter="0"/></w:sectPr></w:pPr></w:p>
```

# 1 INTRODUÇÃO

## 1.1 Contexto e escolha do sistema
Esta APS trata da avaliação e melhoria da qualidade de software na plataforma web Kolô. O Kolô Ateliê & Estúdio reúne comercialização de arte e atendimento para tatuagem em um mesmo empreendimento. A especificação registra um contexto de controle manual de vendas e negociações de agendamento por mensagens (Equipe Kolô, 2026a). O sistema foi desenvolvido no TCC para um cliente real, o próprio ateliê (Oliveira et al., 2026).

O sistema oferece catálogo de obras em duas dimensões, carrinho, checkout integrado ao Mercado Pago, portfólio de tatuagens e um assistente em etapas que prepara uma mensagem para o WhatsApp (Equipe Kolô, 2026a).

## 1.2 Problema de avaliação
A presença de funcionalidades e testes não demonstra, por si só, que os requisitos de qualidade foram atendidos na versão avaliada. É necessário relacionar cada requisito a um procedimento de verificação, a uma evidência e ao ambiente no qual o resultado foi obtido. Em que medida os testes e as medições sustentam a confiabilidade, a eficiência, a manutenibilidade, a usabilidade e a segurança do Kolô? Que melhorias e verificações ainda são necessárias?

## 1.3 Justificativa
O Kolô reúne riscos de comércio eletrônico e de atendimento em um mesmo sistema. A especificação adota estoque inicial de uma unidade por obra e permite ajustar a quantidade (Equipe Kolô, 2026a). Na venda de peças únicas, se dois pedidos disputarem a mesma unidade e ambos forem pagos, o ateliê pode ter de estornar um deles, o que compromete a confiança do cliente. No fluxo de pagamento, uma notificação processada duas vezes pode levar a uma baixa de estoque indevida. O sistema também trata dados pessoais, como telefone e endereço de entrega, o que torna relevante verificar a proteção das informações e as permissões de acesso. Uma barreira de interface pode impedir a conclusão de uma compra ou o contato com o estúdio (Equipe Kolô, 2026a).

A especificação já define critérios de verificação para requisitos não funcionais. O RNF02 prevê uma auditoria de dependências sem vulnerabilidades altas ou críticas, e o RNF13 estabelece limites de tempo de carregamento e de pontuação do Lighthouse para o catálogo e a ficha da obra. Esses critérios permitem comparar as evidências com as exigências do projeto (Equipe Kolô, 2026a).

## 1.4 Objetivos e escopo
### 1.4.1 Objetivo geral

Avaliar a qualidade da plataforma Kolô e propor melhorias em sua confiabilidade, eficiência, manutenibilidade e usabilidade por meio de práticas de qualidade, testes e métricas verificáveis.

### 1.4.2 Objetivos específicos

1. Caracterizar o sistema e justificar sua seleção a partir dos riscos da operação do ateliê.
2. Identificar e documentar requisitos de qualidade, associando-os a riscos e procedimentos de verificação.
3. Definir um plano de qualidade com procedimentos, métricas, ferramentas e critérios de aceite.
4. Executar testes funcionais e não funcionais nas condições definidas no plano de qualidade (Equipe Kolô, 2026g).
5. Registrar e analisar os resultados em relação às metas, identificando pontos críticos e oportunidades de melhoria com base na linha de base da APS (Equipe Kolô, 2026h).
6. Propor melhorias com base nas medições e verificar novamente as métricas afetadas pelas mudanças implementadas, com registro no comparativo das melhorias (Equipe Kolô, 2026f).
7. Documentar o processo e refletir sobre sua contribuição para a formação acadêmica e para a prática profissional.

### 1.4.3 Delimitação do estudo

A visão geral do repositório tcc-2 abrange as páginas e os módulos de negócio em `src/`, o esquema de dados em `prisma/`, as suítes em `tests/` e a integração contínua em `.github/workflows/`. A avaliação transversal considera cobertura de testes, complexidade e auditoria de dependências. A análise aprofunda três fluxos da plataforma.

- **Catálogo e ficha da obra.** O carregamento das imagens e a apresentação da obra em telas móveis influenciam o acesso ao acervo e o início da compra.
- **Carrinho, checkout e webhook.** A disputa pela última unidade em estoque e a repetição de notificações do Mercado Pago exercitam a consistência entre reserva, pagamento e baixa de estoque.
- **Assistente de agendamento.** Um link incorreto para o WhatsApp pode impedir que o cliente inicie o contato pelo assistente. Se a mensagem omitir ou alterar a preferência de data ou horário, o cliente pode precisar informá-la novamente na conversa.

A avaliação combina medições novas, executadas localmente em duas rodadas, com resultados históricos do TCC, atribuídos às respectivas fontes, entre elas a monografia (Oliveira et al., 2026). As medições abrangem testes unitários, de integração e de ponta a ponta, cobertura, complexidade, carga e segurança, e a seção 3.2 define como cada evidência é classificada.

As novas medições foram realizadas em ambiente local, com PostgreSQL em contêiner e serviços externos simulados nos ensaios de carga e na varredura de segurança. A avaliação em produção fica para depois da publicação. O catálogo apresenta as obras em duas dimensões. A integração com o WhatsApp se limita ao link direto com mensagem pré-preenchida. O artista ou administrador cadastra manualmente o horário combinado, e a coleta de dados de anamnese ocorre presencialmente no estúdio (Equipe Kolô, 2026a).

# 2 REVISÃO TEÓRICA

## 2.1 Qualidade como requisito verificável
Neste estudo, qualidade é tratada como o atendimento de critérios explícitos sob condições conhecidas. A especificação do Kolô transforma objetivos amplos em requisitos, como evitar estoque negativo, validar entradas no servidor, limitar o LCP das páginas e restringir operações por perfil. A análise utiliza esses contratos como referência de aceite, em vez de formular uma nota geral sem método (Equipe Kolô, 2026a).

A ISO/IEC 25010:2011 distingue qualidade do produto, observada nas propriedades do sistema, de qualidade em uso, observada nos resultados da interação em um contexto determinado. O modelo de produto agrupa essas propriedades nas características de adequação funcional, eficiência de desempenho, compatibilidade, usabilidade, confiabilidade, segurança, manutenibilidade e portabilidade. Os requisitos funcionais (RF) descrevem o que o sistema deve fazer, enquanto os requisitos não funcionais (RNF) explicitam atributos de qualidade ou restrições. As regras de negócio (RN) expressam condições que a operação deve respeitar, como o limite de estoque. Um requisito pode fornecer evidência para mais de uma característica quando verificado de maneiras diferentes (Equipe Kolô, 2026a; ISO; IEC, 2011).[^iso25010]

[^iso25010]: A ISO/IEC 25010:2023 substituiu a edição de 2011 e trata do modelo de qualidade do produto, agora com nove características. A qualidade em uso passou a ter norma própria, a ISO/IEC 25019:2023. Nesta APS, a classificação dos requisitos e a leitura das métricas seguem a edição de 2011 adotada no plano (ISO; IEC, 2023a, 2023b).

O método Goal–Question–Metric (GQM) parte de um objetivo de avaliação, formula perguntas que permitem julgar seu atendimento e escolhe métricas capazes de respondê-las. Para avaliar a eficiência do catálogo, por exemplo, a pergunta pode ser quanto demora a resposta sob a carga prevista. A métrica é a duração das requisições no percentil 95 e a meta é o limite com o qual esse valor será comparado (Basili; Caldiera; Rombach, 1994). No plano da APS, os limites foram estabelecidos antes da medição (Equipe Kolô, 2026g).

A confiabilidade é observada na preservação de invariantes do domínio e no tratamento de falhas e repetições. A eficiência é examinada pela duração das requisições sob carga e pelos indicadores de carregamento das páginas. A manutenibilidade envolve a facilidade de analisar, alterar e testar o produto. Na APS, a separação de módulos, a tipagem, as validações e os controles de integração ajudam a interpretar as medidas de cobertura e complexidade. A usabilidade exige fluxos compreensíveis e verificações de acessibilidade que vão além da inspeção visual.

## 2.2 Verificação e validação no projeto
A verificação compara a implementação com os contratos que restringem a administração de obras e limitam as reservas concorrentes ao estoque disponível. A validação examina se os fluxos resolvem as necessidades do ateliê. A monografia registra uma sessão com a administradora, realizada com uma versão anterior às correções finais (Oliveira et al., 2026).

Os testes funcionais verificam o comportamento especificado, como a recusa de uma operação sem permissão. Os não funcionais examinam propriedades como desempenho sob carga, segurança e acessibilidade. O teste de confirmação volta ao cenário que motivou uma correção para verificar se o problema foi resolvido. Já o teste de regressão procura efeitos indesejados da mudança em comportamentos que antes funcionavam (ISTQB, 2024).

Um teste demonstra uma propriedade nas condições do ensaio. O retorno de uma participante descreve sua experiência. Essas evidências se complementam, mas não comprovam, isoladamente, disponibilidade contínua ou melhoria operacional após a publicação.

## 2.3 Níveis de teste
A estratégia combina testes unitários, integração com PostgreSQL e testes de ponta a ponta. O teste unitário verifica uma unidade de código ou um componente em isolamento. O de integração exercita a comunicação entre partes, como o módulo de reservas e o banco de dados. O teste de ponta a ponta (E2E, de *end-to-end*) percorre um fluxo do ponto de vista do usuário, da ação no navegador até um resultado observável. O Kolô usa Vitest para as duas primeiras camadas e Playwright para a terceira. Reservas e agenda exigem banco real para avaliar concorrência. Os serviços simulados nos testes de interface limitam o alcance dos resultados às integrações presentes no ensaio (ISTQB, 2024; Microsoft, [202-]a; Vitest, [202-]a).

A pirâmide de testes organiza a automação com mais testes rápidos e focados na base e menos testes amplos no topo, onde há mais componentes envolvidos e maior custo de manutenção. A camada intermediária cobre as interações que um teste isolado deixaria de fora. A proporção entre camadas é uma orientação para distribuir custo e alcance. No Kolô, ela ajuda a decidir quais regras podem ser verificadas isoladamente, quais pedem integração com o banco e quais justificam um percurso completo no navegador (Cohn, 2010).

No desenvolvimento orientado por testes (TDD), primeiro se escreve um teste que falha pelo motivo esperado. Em seguida se faz a menor alteração que o leva a passar e, por fim, se melhora a estrutura do código mantendo os testes verdes. A sequência é conhecida como vermelho, verde e refatoração (Beck, 2003). Um teste que já passa pode ampliar a cobertura de um comportamento existente ao exercitar um caso ainda ausente da suíte. As correções que seguiram o ciclo de TDD e o acréscimo de casos de integração estão distinguidos no comparativo das melhorias (Equipe Kolô, 2026f).

A ISO/IEC/IEEE 29119-3:2021 apresenta modelos para a documentação de teste. O modelo adotado na APS prevê que o registro do caso reúna identificador, requisito, pré-condições, dados de entrada, passos e resultado esperado. O registro da execução deve acrescentar o resultado obtido, o status e a referência ao teste automatizado, quando aplicável. O resultado esperado vem do requisito e orienta a comparação com o que foi observado (ISO; IEC; IEEE, 2021a).

A partição de equivalência e a análise de valor-limite são técnicas de projeto de testes tratadas na ISO/IEC/IEEE 29119-4:2021. A primeira divide os dados em grupos para os quais se espera o mesmo comportamento e escolhe representantes de cada grupo pertinente. A segunda se concentra nos pontos de transição entre partições ordenadas e nos valores vizinhos. Por exemplo, ao pedir quantidade positiva de uma obra, pode-se separar quantidades que cabem no estoque disponível das que o excedem. Exercitar o estoque disponível e uma unidade a mais verifica a transição entre aceitar o pedido e recusá-lo (Equipe Kolô, 2026a; ISO; IEC; IEEE, 2021b; ISTQB, 2024).

## 2.4 Concorrência e idempotência

Há concorrência quando operações progridem no mesmo intervalo e podem disputar um recurso, como a última unidade de uma obra ou um horário na agenda. Um invariante é uma condição que deve continuar válida após as operações, como o limite de estoque. Uma operação atômica agrupa as alterações em uma transação que é confirmada por inteiro ou desfeita. Na agenda, uma restrição no banco impede a gravação de horários sobrepostos para o mesmo artista (Equipe Kolô, 2026a, 2026d).

A reserva de estoque é modelada como operação atômica. O código ordena identificadores e bloqueia os registros envolvidos antes de calcular a disponibilidade. O estoque livre considera a quantidade existente e as reservas ativas de outras sessões. O objetivo é evitar que duas compras se apoiem na mesma unidade disponível (Equipe Kolô, 2026d).

Um *webhook* é uma notificação HTTP que um serviço envia a outro em resposta a um evento. No recebimento de pagamentos, idempotência significa que repetir uma notificação não deve repetir o efeito de negócio. A implementação associa a verificação de assinatura à consulta do pagamento no gateway e ao registro de eventos. O resultado do navegador não é usado como prova de quitação. A análise considera a baixa única de estoque e a manutenção de transições válidas como propriedades verificáveis (Equipe Kolô, 2026a, 2026d).

## 2.5 Desempenho e acessibilidade

Um teste de carga mede o comportamento do sistema sob um volume de trabalho definido. No k6, cada usuário virtual (VU) executa o roteiro de requisições do cenário. O percentil 95 (p95) é a duração abaixo da qual, ou igual à qual, ficam aproximadamente 95% dos tempos medidos. A taxa de falha HTTP é a proporção de requisições que o k6 classifica como falhas. Já um *check* é uma verificação booleana definida no roteiro, como verificar se a resposta do checkout indica que o pedido foi criado (Grafana Labs, [202-]). O roteiro de carga avalia duração e taxa de falha nas páginas de leitura, e duração e proporção de *checks* bem-sucedidos na finalização do checkout. A rajada concentra tentativas em um intervalo curto. Na APS, ela força a disputa pela mesma unidade. O roteiro incrementa o contador de pedidos recusados sempre que falta o redirecionamento esperado para a página do pedido. Esse contador agrupa respostas de causas distintas. A recusa prevista por falta de estoque é um resultado válido da operação. A verificação da regra usa o item de pedido persistido no banco para conferir se a quantidade respeitou o estoque disponível. Os roteiros e resultados das duas rodadas estão descritos no registro da linha de base e no comparativo (Equipe Kolô, 2026f, 2026h).

O Lighthouse mede o desempenho da página no navegador e reúne os indicadores em uma pontuação ponderada. O *Largest Contentful Paint* (LCP) mede o tempo desde o início do carregamento até a renderização do maior conteúdo elegível visível na tela. O *First Contentful Paint* (FCP) mede quanto tempo decorre até aparecer o primeiro texto, imagem ou outro conteúdo da página. O *Total Blocking Time* (TBT) soma, no intervalo de medição, as parcelas das tarefas que excedem 50 ms na linha de execução principal. O *Cumulative Layout Shift* (CLS) mede a instabilidade visual causada por deslocamentos inesperados de elementos (Clark, 2020; Google, 2019a, 2019b).

O requisito RNF13 estabelece Lighthouse de pelo menos 90 pontos e LCP inferior a 2,5 segundos no catálogo e na ficha da obra. A comparação só é interpretável quando as condições do ensaio são registradas. O projeto informa mediana de três rodadas em simulação móvel de rede 4G (Equipe Kolô, 2026b).

Responsividade é a adaptação da interface a diferentes larguras de tela. Os testes de largura identificam transbordamento horizontal. Acessibilidade diz respeito à possibilidade de perceber e operar a interface com diferentes capacidades e formas de interação. A varredura com axe-core cobre verificações automatizáveis, como a presença de nome acessível em controles (Deque Systems, [202-]). O próprio código filtra impactos críticos e sérios e deixa resultados inconclusivos fora desse gate. Por isso, ausência de falhas nesse conjunto não equivale à conformidade integral de acessibilidade. Teclado, foco e avaliação com pessoas permanecem necessários.

## 2.6 Rastreabilidade e melhoria contínua

Rastreabilidade liga requisito, teste, execução e evidência. A integração contínua (CI) automatiza verificações como análise estática, checagem de tipos e testes a partir de mudanças no repositório. Taxa de aprovação é a proporção de casos executados que passaram. Cobertura de linhas é a proporção de linhas executáveis percorridas. Cobertura de ramos é a proporção de alternativas do fluxo de controle exercitadas, como os dois resultados de uma condição. Uma suíte pode executar muitas vezes os mesmos caminhos. Assim, contagem, aprovação e cobertura respondem a perguntas diferentes, e cobertura alta ainda depende da qualidade das verificações. Na APS, o relatório de cobertura do Vitest reúne as execuções de testes unitários e de integração (ISTQB, 2024; Vitest, [202-]a).

A complexidade ciclomática de McCabe mede o número de caminhos linearmente independentes no grafo de fluxo de controle. Uma função de fluxo linear começa com complexidade um. Em estruturas simples, uma decisão binária acrescenta um caminho independente. O ESLint operacionaliza essa medida com a regra `complexity`, que conta também construções da linguagem capazes de desviar o fluxo. A complexidade sinaliza quanto esforço pode ser necessário para entender ou exercitar uma função. O tamanho do arquivo, medido em linhas, é um indicador separado (ESLint, [202-]; McCabe, 1976).

Uma suíte também pode apresentar sinais de manutenção difícil, como testes duplicados ou dependentes do relógio real. Um teste instável (*flaky*) alterna entre aprovação e falha sem mudança correspondente no código avaliado (Microsoft, [202-]b). Controlar o relógio permite reproduzir o limite de expiração com o mesmo instante em todas as execuções (Vitest, [202-]b).

O ciclo de melhoria adotado consiste em identificar o risco, definir um critério, aplicar a mudança e repetir a medição nas mesmas condições. A linha de base (*baseline*) é a rodada inicial, usada como ponto de comparação. A rodada posterior verifica se a métrica atingiu a meta e se o comportamento antes aprovado continua funcionando. A revisão avaliada, o ambiente e os relatórios de cada rodada permitem interpretar diferenças e separar uma mudança observada de variações do ensaio, como registrado na linha de base e no comparativo (Equipe Kolô, 2026f, 2026h).

## 2.7 Segurança de aplicações web

O *Open Worldwide Application Security Project* (OWASP) publica o OWASP Top 10 para orientar a atenção aos riscos mais relevantes em aplicações web, como falhas de controle de acesso e de configuração (OWASP, 2025). Autenticação verifica a identidade de quem solicita uma operação. Autorização verifica se essa identidade pode realizá-la, inclusive sobre o recurso específico. Em um ataque de falsificação de requisição entre sites (*Cross-Site Request Forgery*, CSRF), o navegador de uma pessoa autenticada é induzido a enviar uma ação que ela não solicitou (OWASP, [202-]).

Cabeçalhos de resposta HTTP comunicam políticas ao navegador. A *Content Security Policy* (CSP) define quais recursos o navegador pode carregar ou executar. Um *nonce* de uso único em uma resposta pode autorizar os scripts marcados com esse valor (W3C, 2026). `Permissions-Policy` restringe recursos do navegador, como a câmera, e `X-Content-Type-Options: nosniff` impede que ele tente deduzir outro tipo de conteúdo em contextos como scripts e folhas de estilo. O cabeçalho `X-Powered-By` identifica a tecnologia do servidor (MDN Web Docs, 2026a). Nos formulários, o envio por GET inclui os campos na URL e pode expô-los no histórico ou em registros. O envio por POST coloca esses campos no corpo da requisição (MDN Web Docs, 2026b).

O Zed Attack Proxy (ZAP) inspeciona o tráfego de aplicações web. A varredura passiva do modo *Baseline Scan* usa um rastreador para descobrir páginas e examina as mensagens HTTP observadas, sem executar ataques ativos. Cada alerta indica um problema potencial e informa o risco e a confiança da detecção. Um alerta é classificado como falso positivo quando a análise demonstra que o problema apontado não se aplica à resposta ou ao fluxo avaliado. Um alerta inconclusivo permanece pendente de validação. As conclusões valem para as rotas e condições alcançadas pelo rastreador (ZAP, [202-]a, [202-]b).

A auditoria com `npm audit` compara as dependências do projeto com avisos de segurança conhecidos no registro consultado (npm, 2026). Ela inclui dependências diretas, declaradas pelo projeto, e transitivas, trazidas por outros pacotes. A severidade do aviso orienta a análise, que ainda precisa verificar se o caminho afetado é alcançável no Kolô. Os relatórios de dependências e os alertas do ZAP são evidências complementares, reunidas no registro da linha de base e no comparativo das melhorias (Equipe Kolô, 2026f, 2026h).

# 3 METODOLOGIA

## 3.1 Procedimento e materiais
A avaliação combina dois procedimentos. O primeiro é a análise documental. O enunciado da APS define a estrutura e os objetivos acadêmicos. O escopo versão 2.2 fornece os requisitos, e o DER e o esquema Prisma descrevem os dados. O código e os testes indicam os mecanismos implementados, enquanto os registros da Sprint 2 e a monografia trazem os resultados históricos. A Sprint 3 contextualiza as pendências posteriores à entrega da monografia. Nessa análise foram identificados os fluxos de maior risco e os requisitos associados. Também se conferiu a presença de implementação e testes, e os resultados foram transcritos com atribuição à fonte. Divergências entre documentos foram preservadas como limitações de rastreabilidade.

O segundo procedimento é a medição local, em duas rodadas e com as mesmas ferramentas e comandos. A linha de base mede a revisão `b3587b3`, de 19 de outubro, a última da `main` que alterou o código do sistema antes da APS, acrescida apenas da configuração de medição. Depois dela, a `main` só recebeu documentação, ajustes da CI e imagens de demonstração. A nova medição mede a revisão `51bb1b8`, que contém as três melhorias. As duas rodadas foram executadas em 6 e 7 de novembro de 2026 na mesma máquina, e as saídas brutas ficaram em `docs/aps/evidencias/baseline/` e `docs/aps/evidencias/depois/` (Equipe Kolô, 2026f, 2026h).

::: {custom-style="Legenda"}
Quadro 1 Fontes e função na avaliação
:::

| **Fonte local**          | **Uso**                                                    |
|--------------------------|------------------------------------------------------------|
| 2026_2\_CC_SI_8.md       | Estrutura e tema da APS                                    |
| docs/ESCOPO-E-STACK.md   | RF01 a RF32, RNF01 a RNF24 e regras RN01 a RN12            |
| docs/tcc-2.docx          | Contexto, autoria e resultados consolidados na monografia  |
| docs/Sprint-2.md         | Resultados históricos de testes, Lighthouse e dependências |
| docs/SPRINT-3.md         | Pendências de reprodução dos dados de demonstração         |
| src/ e tests/            | Inspeção de mecanismos e casos de teste presentes          |
| docs/aps/PLANO.md        | Metas e decisões fixadas antes da medição                  |
| tests/carga/             | Roteiros de carga e rajada e servidor de medição           |
| docs/aps/evidencias/     | Saídas brutas da linha de base e da nova medição           |

::: {custom-style="Legenda"}
Fonte Elaborado a partir dos arquivos locais do projeto em 26 out. e 8 nov. 2026.
:::

O Quadro 2 lista as ferramentas, as versões usadas nas duas rodadas e as métricas do plano que cada uma produz. As versões dos pacotes são as instaladas pelo `package-lock.json` do repositório. As das imagens de contêiner vêm do comando executado ou do próprio relatório.

::: {custom-style="Legenda"}
Quadro 2 Ferramentas, versões e métricas produzidas
:::

| **Ferramenta**                      | **Versão**                  | **Uso na avaliação**                                            | **Métrica** |
|----------------------------------|----------------------------|-------------------------------------------------------------|-----------------|
| Vitest e `@vitest/coverage-v8`      | 4.1.12                      | Testes unitários e de integração; cobertura de linhas e ramos   | G1          |
| Playwright (`@playwright/test`)     | 1.64.1                      | Testes E2E contra o *build* de produção, de 320 a 1920 px        | RNF20       |
| axe-core (`@axe-core/playwright`)   | 4.14                        | Varredura de acessibilidade dentro do E2E, em 320 e 1440 px     | G6          |
| ESLint, regra `complexity`          | 9.39.5                      | Complexidade ciclomática por função, limiar 10                  | G2          |
| `wc -l`                             | —                           | Linhas por arquivo `.ts` e `.tsx` em `src/`                     | G2          |
| k6 (imagem `grafana/k6`)            | 1.3.0                       | Carga com usuários virtuais e rajada concorrente                | G3, G4      |
| OWASP ZAP (imagem `zaproxy:stable`) | 2.17.0                      | Varredura passiva *baseline* contra o app local                 | G5          |
| `npm audit`                         | npm 11.19.0                 | Vulnerabilidades conhecidas nas dependências                    | G5          |
| Lighthouse                          | 12.8.2                      | Medição do TCC, não repetida (mediana de três rodadas)          | G6          |
| TypeScript (`tsc --noEmit`)         | 5.9.3                       | Checagem de tipos, condição para comparar rodadas               | —           |
| Next.js, Node.js e PostgreSQL       | 16.3.8; 24.20.0; 17         | Sistema avaliado, ambiente de execução e banco                  | —           |

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir de `package-lock.json`, dos comandos e dos relatórios em `docs/aps/evidencias/` e de Equipe Kolô (2026b).
:::

## 3.2 Critérios de classificação
Cada evidência citada recebe uma de quatro classificações. É **medida nesta APS** quando há arquivo correspondente em `docs/aps/evidencias/`, na linha de base, na nova medição ou em ambas. É **resultado histórico** quando vem da monografia ou dos registros das sprints, citada com a fonte e sem presumir que descreva a revisão atual. É **mecanismo inspecionado** quando o código ou a configuração foi lido, sem execução da ferramenta correspondente. Por fim, fica **fora do escopo** quando depende do ambiente publicado e por isso não pode ser medida localmente. Propostas aparecem sempre como ação futura. Na coluna de tratamento do Quadro 3, "Medido" e "Suíte" correspondem a medida nesta APS, porque as suítes foram reexecutadas nas duas rodadas. "Evidência do TCC" corresponde a resultado histórico ou mecanismo inspecionado, e "Parcial" indica que só parte do critério do requisito foi verificada.

Três regras orientam a comparação. Nenhum número entra no documento sem arquivo de evidência ou fonte citada. Uma rodada só é comparada com outra quando *lint*, checagem de tipos e todas as suítes passaram nela. As medidas de tempo são comparadas apenas entre rodadas feitas na mesma máquina e com o mesmo roteiro. Não se atribuem aprovação do cliente nem resultados de produção ausentes nas fontes.

## 3.3 Plano de qualidade e métricas
O plano de qualidade tem três partes: a classificação dos requisitos não funcionais nas características da ISO/IEC 25010:2011, o desdobramento das características escolhidas em objetivos, perguntas e métricas pelo método GQM e o processo que liga a medição às melhorias. Segundo o plano da APS, as metas foram fixadas na sessão de decisões de 6 de novembro de 2026, antes da primeira rodada de medição, para que o resultado não influenciasse o limite com o qual seria comparado (Basili; Caldiera; Rombach, 1994; Equipe Kolô, 2026g; ISO; IEC, 2011).

### 3.3.1 Requisitos de qualidade
O escopo do Kolô define 24 requisitos não funcionais, cada um com um critério de verificação. O Quadro 3 classifica cada RNF por característica e subcaracterística da ISO/IEC 25010:2011 e indica como ele é tratado nesta APS. Um requisito pode ser medido nesta avaliação, apoiar-se em evidência registrada no TCC ou ficar fora do escopo por depender do ambiente publicado. Quando o requisito sustenta mais de uma característica, a principal aparece primeiro.

::: {custom-style="Legenda"}
Quadro 3 Requisitos não funcionais do Kolô na ISO/IEC 25010:2011
:::

| **RNF** | **Requisito (resumo)**                                  | **Característica e subcaracterística**                    | **Tratamento nesta APS**                              |
|--------------|------------------------------------------|-------------------------------------------|----------------------------------------|
| RNF01   | Tráfego em HTTPS com certificado válido                 | Segurança: confidencialidade, integridade                 | Fora do escopo: depende do deploy                     |
| RNF02   | Dependências com suporte de segurança                   | Segurança: integridade                                    | Medido: `npm audit` (G5)                              |
| RNF03   | Senha só como *hash* com derivação lenta e *salt*       | Segurança: confidencialidade                              | Evidência do TCC: inspeção do banco                   |
| RNF04   | Consultas parametrizadas pelo ORM                       | Segurança: integridade                                    | Evidência do TCC: revisão de código e teste           |
| RNF05   | Escape na renderização e CSP restritiva                 | Segurança: integridade                                    | Medido: ZAP *baseline* (G5)                           |
| RNF06   | Proteção CSRF e cookies `HttpOnly`, `Secure`, `SameSite` | Segurança: autenticidade                                  | Medido: ZAP *baseline* com análise dos alertas (G5)   |
| RNF07   | Cabeçalhos de segurança                                 | Segurança: confidencialidade, integridade                 | Medido: ZAP *baseline* (G5); nota externa após deploy |
| RNF08   | Limitação de taxa nos formulários públicos              | Segurança: autenticidade; Confiabilidade: disponibilidade | Suíte de integração                                   |
| RNF09   | Validação de toda entrada no servidor                   | Segurança: integridade                                    | Suíte de integração                                   |
| RNF10   | Nenhum dado de cartão no sistema                        | Segurança: confidencialidade                              | Evidência do TCC: revisão de arquitetura              |
| RNF11   | Webhook com assinatura e tratamento idempotente         | Segurança: autenticidade; Confiabilidade: tolerância a falhas | Suíte de integração; ramos de `payments` (G1)     |
| RNF12   | Segredos só em variáveis de ambiente                    | Segurança: confidencialidade                              | Evidência do TCC: inspeção do repositório             |
| RNF13   | LCP abaixo de 2,5 s no catálogo e na obra               | Eficiência de desempenho: comportamento temporal          | Evidência do TCC: Lighthouse (G6)                     |
| RNF14   | Imagens em formato moderno e responsivas                | Eficiência de desempenho: utilização de recursos          | Evidência do TCC: auditoria de rede                   |
| RNF15   | Disponibilidade 24/7 com reinício automático            | Confiabilidade: disponibilidade                           | Fora do escopo: depende do deploy                     |
| RNF16   | *Backup* diário com restauração testada                 | Confiabilidade: recuperabilidade                          | Fora do escopo: depende do deploy                     |
| RNF17   | Coleta mínima com finalidade declarada                  | Segurança: confidencialidade                              | Evidência do TCC: inventário de dados                 |
| RNF18   | Nenhuma resposta clínica persistida                     | Segurança: confidencialidade                              | Evidência do TCC: inspeção do esquema                 |
| RNF19   | Exclusão de conta anonimiza e preserva os pedidos       | Segurança: confidencialidade; Adequação funcional: correção | Suíte de integração                                 |
| RNF20   | Interface de 320 a 1920 px sem rolagem horizontal       | Portabilidade: adaptabilidade; Usabilidade: operabilidade | Suíte E2E (Playwright)                                |
| RNF21   | Teclado, foco, contraste e texto alternativo            | Usabilidade: acessibilidade                               | Medido: axe-core na suíte E2E (G6); teclado e foco pendentes |
| RNF22   | Tipagem estrita, *lint* e CI que barra o *merge*        | Manutenibilidade: analisabilidade, modificabilidade       | Medido: *lint*, tipos, cobertura e complexidade (G1, G2) |
| RNF23   | Ambiente local por um comando, com dados de exemplo     | Portabilidade: instalabilidade                            | Parcial: banco local por `docker compose`; validação por membro novo não registrada |
| RNF24   | *Logs* estruturados e captura de exceções               | Manutenibilidade: analisabilidade                         | Fora do escopo: depende do ambiente de produção       |

::: {custom-style="Legenda"}
Fonte Requisitos de Equipe Kolô (2026a). Classificação elaborada para esta avaliação segundo ISO e IEC (2011).
:::

As regras de negócio completam o quadro na confiabilidade. O limite de estoque (RN02 a RN04) e a confirmação do pedido só com pagamento aprovado (RN05) correspondem à maturidade e à correção funcional. Por isso a rajada concorrente sobre uma obra de estoque unitário aparece no plano como métrica de confiabilidade, e não de desempenho. A restrição de operações por perfil e por proprietário (RF06 e RN10) corresponde à autenticidade e à responsabilização da segurança. Ela é verificada pelas suítes de integração e E2E e reexecutada no caso CT12 da seção 3.4 (Equipe Kolô, 2026a).

A ISO/IEC 25010:2011 não tem característica própria de privacidade. Os requisitos de coleta mínima, ausência de dado clínico e anonimização (RNF17 a RNF19) foram classificados em confidencialidade. Compatibilidade não recebeu requisito no escopo; a única integração crítica, o *gateway* de pagamento, é tratada pelo RNF11 (ISO; IEC, 2011).

### 3.3.2 Objetivos, perguntas e métricas
O Quadro 4 apresenta os objetivos e as perguntas do plano. As características escolhidas cobrem os três fluxos aprofundados e os requisitos que podem ser medidos sem o ambiente publicado. O Quadro 5 traz as métricas, as ferramentas e as metas de cada pergunta, com os mesmos limites usados na linha de base e na nova medição (Equipe Kolô, 2026f, 2026g, 2026h).

::: {custom-style="Legenda"}
Quadro 4 Objetivos e perguntas do plano GQM
:::

| **ID** | **Característica**                  | **Objetivo**                                                                           | **Pergunta**                                                                                           |
|---------|----------------------------------|---------------------------------------------|----------------------------------------------------|
| G1     | Manutenibilidade: testabilidade     | Avaliar quanto do código a suíte automatizada exercita                                 | Que parte das linhas e dos ramos é percorrida pelos testes, sobretudo em pedidos, pagamentos e agenda? |
| G2     | Manutenibilidade: analisabilidade   | Avaliar se as unidades de código são pequenas o bastante para entender e alterar       | Quais funções e arquivos excedem os limites de complexidade e de tamanho?                              |
| G3     | Eficiência: comportamento temporal  | Avaliar o tempo de resposta dos fluxos de compra sob carga simultânea                  | Catálogo, ficha da obra e reserva do *checkout* respondem dentro do limite com cerca de 20 usuários virtuais? |
| G4     | Confiabilidade: maturidade          | Verificar a invariante de estoque sob disputa concorrente                              | Pedidos simultâneos pela mesma obra de estoque unitário produzem venda acima do estoque?              |
| G5     | Segurança                           | Avaliar a exposição a vulnerabilidades conhecidas e a configuração das respostas HTTP  | Há vulnerabilidade alta ou crítica nas dependências ou alerta de risco nas respostas do servidor?      |
| G6     | Eficiência e usabilidade            | Situar o carregamento medido no TCC e repetir a varredura automática de acessibilidade | As páginas principais carregam no limite do projeto e passam na varredura automática de acessibilidade? |

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir de Equipe Kolô (2026g), segundo Basili, Caldiera e Rombach (1994).
:::

::: {custom-style="Legenda"}
Quadro 5 Métricas, ferramentas e metas
:::

| **ID** | **Métrica**                                                     | **Ferramenta**                                  | **Meta**                                                  |
|---------|-------------------------------------------------|-------------------------------------|---------------------------------------------|
| G1     | Cobertura de linhas, testes unitários e de integração juntos    | Vitest com cobertura v8                         | ≥ 80% global                                              |
| G1     | Cobertura de ramos                                              | Vitest com cobertura v8                         | ≥ 70% global; ≥ 90% em `orders`, `payments` e `scheduling` |
| G2     | Complexidade ciclomática por função                             | ESLint, regra `complexity`                      | ≤ 10                                                      |
| G2     | Tamanho de arquivo em `src/`                                    | Contagem de linhas                              | ≤ 500 linhas                                              |
| G3     | Duração das requisições no percentil 95 e taxa de erro, catálogo e ficha | k6 contra o *build* local                 | p95 \< 500 ms; erro \< 1%                                 |
| G3     | Duração no percentil 95 e taxa de erro (verificações reprovadas), reserva do *checkout* | k6 contra o *build* local                       | p95 \< 1 s; erro \< 1%                                    |
| G4     | Vendas acima do estoque em rajada concorrente sobre obra de estoque 1 | k6 e consulta ao banco                    | Zero                                                      |
| G5     | Vulnerabilidades de severidade alta e crítica                   | `npm audit`                                     | Zero                                                      |
| G5     | Alertas por nível de risco                                      | OWASP ZAP *baseline* contra o app local         | Zero *High*; cada *Medium* analisado                      |
| G6     | LCP e pontuação de desempenho                                   | Lighthouse (medição do TCC)                     | LCP \< 2,5 s; pontuação ≥ 90                              |
| G6     | Violações críticas de acessibilidade                            | axe-core na suíte E2E (Playwright)              | Zero                                                      |

::: {custom-style="Legenda"}
Fonte Metas de Equipe Kolô (2026g), fixadas antes da medição. Ferramentas: Deque Systems ([202-]), ESLint ([202-]), Google (2019a), Grafana Labs ([202-]), npm (2026), Vitest ([202-]a) e ZAP ([202-]b).
:::

As metas de G6 vêm do escopo do projeto (RNF13 e RNF21). O Lighthouse não foi executado de novo nesta APS e entra como evidência do TCC, com a revisão e a data da medição original. A varredura axe-core faz parte da suíte E2E e por isso foi repetida em cada rodada, nas larguras de 320 e 1440 px. As demais metas foram definidas para esta avaliação. O limite de complexidade 10 segue a sugestão original de McCabe (1976). O de 500 linhas repete a convenção de estilo do repositório. A meta de 90% de ramos nos três módulos de domínio é mais alta que a global, porque ali estão o estoque, o dinheiro e a agenda. Aprovação de todas as suítes, *lint* e checagem de tipos são condição para medir, e não meta do plano: uma rodada com falha não é comparada.

### 3.3.3 Processo de qualidade
A avaliação seguiu um ciclo de cinco etapas, com o registro de cada uma em `docs/aps/evidencias/`:

1. **Plano.** Requisitos classificados, perguntas e metas registrados no plano da APS (Equipe Kolô, 2026g) antes de qualquer medição.
2. **Linha de base.** Todas as métricas do Quadro 5, exceto o Lighthouse, medidas numa mesma revisão do código, na mesma máquina, com os comandos e as saídas brutas guardados no registro da linha de base (Equipe Kolô, 2026h).
3. **Pontos críticos.** Cada métrica fora da meta e cada alerta de segurança a analisar viram um ponto crítico. A lista resultante é o insumo da escolha das melhorias.
4. **Melhoria.** Os pontos críticos foram ordenados por risco de mudança às vésperas da banca do TCC. O plano previa apenas testes novos ou refatoração coberta pela suíte. Dois pontos de segurança apontados pelo ZAP foram aceitos como exceção, por serem mudanças pequenas de configuração cobertas por testes unitários e pela suíte E2E. Os pontos escolhidos foram implementados por TDD: um teste que falha pelo motivo esperado, a menor alteração que o faz passar e a repetição até cobrir o comportamento. Quando a melhoria só acrescenta testes a comportamento já existente, não há etapa vermelha. Antes da nova medição, um revisor que não escreveu o código analisou o *diff*, e os ajustes que ele pediu entraram na mesma rodada.
5. **Nova medição.** Os mesmos comandos, na mesma máquina, sobre a revisão com as melhorias. O comparativo das melhorias (Equipe Kolô, 2026f) põe antes e depois lado a lado na mesma métrica. Nas medidas de tempo, uma variação pequena é lida como ausência de regressão, não como ganho, porque o ensaio local tem ruído.

Pontos críticos não tratados ficam como propostas, com a justificativa de por que ficaram fora (seção 4.6). Uma rodada seguinte repetiria o ciclo a partir da etapa 2, sobre as métricas afetadas pelas mudanças (Beck, 2003; Equipe Kolô, 2026f, 2026h).

Cada rodada registra a revisão do código, a data, o ambiente, o comando, o resultado e o arquivo da evidência. Esse registro permite comparar rodadas e evita a combinação de números de versões diferentes, como a contagem de testes da monografia, anterior à linha de base desta APS.

## 3.4 Roteiro de testes funcionais e não funcionais
Os testes funcionais foram avaliados em duas camadas. A primeira é a reexecução das suítes automatizadas inteiras, unitária, de integração e E2E, nas duas rodadas. As contagens, os tempos e a aprovação vêm do relatório de cada executor, e não de contagem manual no código. Casos parametrizados (`it.each`) contam um teste por linha de dados. Por isso o número do relatório é maior que o de chamadas `it` nos arquivos.

A segunda camada são doze casos de teste formalizados segundo a estrutura de especificação de casos da ISO/IEC/IEEE 29119-3: identificador, requisito, pré-condição, passos, entrada, resultado esperado, resultado obtido e situação. Os casos foram escolhidos pelo risco nos três fluxos aprofundados, mais quatro controles transversais: limite de taxa, recuperação de senha, exclusão de conta e isolamento entre perfis. As entradas foram derivadas por partição de equivalência, em que cada classe de entrada válida ou inválida recebe um representante, e por análise de valor-limite, em que se testam os valores imediatamente abaixo e acima de cada fronteira (ISO; IEC; IEEE, 2021a, 2021b). O Quadro 6 resume o roteiro. A especificação completa e os resultados estão na seção 4.3.

::: {custom-style="Legenda"}
Quadro 6 Casos de teste formalizados por fluxo e técnica
:::

| **ID** | **Requisito**  | **Fluxo**              | **Técnica e classes ou limites**                                                  |
|------------|---------------------|------------------------|-----------------------------------------------------------------------------------|
| CT01   | RN02, RN03     | Compra                 | Valor-limite: pedido igual e acima do estoque livre                               |
| CT02   | RN04           | Compra                 | Partição: disputa simultânea por peça única                                       |
| CT03   | RN03           | Compra                 | Valor-limite: 10 min da reserva, 1 ms antes e 1 ms depois                         |
| CT04   | RNF11          | Webhook                | Partição: assinatura válida e oito formas de assinatura inválida                  |
| CT05   | RNF11          | Webhook                | Partição: primeiro aviso e reenvio do mesmo aviso                                 |
| CT06   | RN05, RN07     | Webhook                | Partição: valor pago igual, menor e diferente do total                            |
| CT07   | RN08           | Agenda                 | Valor-limite: horário sobreposto, encostado e de outro artista                    |
| CT08   | RF23 a RF25    | Assistente             | Partição: três aceites, aceite ausente, falso, de outro tipo e campo extra        |
| CT09   | RNF08          | Transversal            | Valor-limite: 5ª e 6ª tentativa na janela e primeira após a janela                |
| CT10   | RF03           | Transversal            | Partição: código válido, expirado, inventado, vazio e reutilizado                 |
| CT11   | RN12, RNF19    | Transversal            | Partição: situação do pedido no momento da exclusão                               |
| CT12   | RN10           | Transversal            | Partição: dono do registro, outro artista e administração                         |

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir de Equipe Kolô (2026a), segundo ISO, IEC e IEEE (2021a, 2021b).
:::

Cada caso aponta para um teste automatizado que já existia antes desta APS, e o caso é executado por esse teste. Assim, o resultado obtido de cada caso vem da mesma execução registrada nas evidências. O roteiro manual de teclado e foco (RNF21) não entra nos casos funcionais: é uma verificação de usabilidade pendente, tratada na seção 4.5. Os testes não funcionais seguem as métricas do Quadro 5, com o procedimento do Quadro 7.

## 3.5 Repetibilidade

### 3.5.1 Ambiente de medição
As duas rodadas foram executadas no mesmo *notebook* com Windows 11, com processador Intel Core i7-1165G7 e 16 GB de memória. O registro da linha de base anota o sistema operacional e as versões, e o processador e a memória foram confirmados pelo grupo. O ambiente usava Node.js 24.20.0 e Docker 29.8.2, com o PostgreSQL 17 no contêiner definido em `docker-compose.yml`. As suítes de integração e a cobertura usam esse banco real, sem simulação da camada de dados, porque reserva, agenda e *webhook* dependem de transações e restrições do PostgreSQL.

O k6 e o ZAP medem o *build* de produção (`next build`), servido pelo roteiro `tests/carga/servidor.ts` na porta 3100. O roteiro recria a cada subida um banco descartável, com o mesmo preparo do E2E e duas obras próprias da carga, uma delas de estoque unitário para a rajada. Os serviços externos são substituídos por dublês carregados no processo do servidor: o Mercado Pago responde localmente, e o armazenamento de imagens R2 grava numa pasta temporária. Os segredos são gerados aleatoriamente a cada subida. Em nenhum momento as medições apontam para o banco de desenvolvimento ou para serviços reais. O k6 e o ZAP rodam em contêineres na mesma máquina e acessam o servidor pelo endereço do *host*.

O ambiente tem limitações que restringem a leitura dos resultados:

- Gerador de carga e servidor dividem o mesmo processador. O p95 mede o sistema nessa condição, não num servidor dedicado, e por isso diferenças pequenas entre rodadas são tratadas como ruído.
- Cada métrica de carga foi medida uma vez por rodada, sem repetição para estimar variância.
- O banco de medição tem só os dados mínimos do E2E. O catálogo é muito menor que o de uso real.
- O servidor responde em HTTP, sem TLS. Cabeçalhos que só valem sob HTTPS, como o HSTS, não são avaliados.
- Os dublês não reproduzem a latência do *gateway* de pagamento. O R2 falso aponta para um endereço inexistente, o que faz `/_next/image` responder com erro.
- O Lighthouse do TCC foi medido em outro ambiente, contra o banco de desenvolvimento e as fotos reais do armazenamento de teste (Equipe Kolô, 2026b).

### 3.5.2 Procedimento de reprodução
O Quadro 7 associa cada medição à sua pré-condição, ao comando e ao arquivo de saída. Os comandos rodam na raiz do repositório, num terminal POSIX. No Git Bash do Windows, os comandos `docker run` precisam do prefixo `MSYS_NO_PATHCONV=1`, para que os caminhos do contêiner não sejam convertidos em caminhos do Windows. O ZAP grava o relatório em `zap/`, na raiz, e o arquivo é copiado depois para a pasta da rodada em `docs/aps/evidencias/`. Nenhum segredo ou arquivo de ambiente foi incorporado a este documento nem às evidências.

::: {custom-style="Legenda"}
Quadro 7 Procedimento de reprodução por medição
:::

| **Medição**                   | **Pré-condição**                                | **Comando**                                           | **Saída em `evidencias/`**              |
|--------------------------|------------------------------------|-----------------------------------------|--------------------------------------|
| *Lint* e tipos                | Dependências instaladas                         | `npm run lint`; `npm run typecheck`                   | `lint.txt`, `typecheck.txt`             |
| Testes unitários              | —                                               | `npm run test:unit`                                   | `unit.json`, `unit.txt`                 |
| Testes de integração          | `docker compose up -d`                          | `npm run test:integration`                            | `integracao.json`, `integracao.txt`     |
| Cobertura (G1)                | `docker compose up -d`                          | `npm run test:coverage`                               | `coverage-summary.json`, `cobertura-por-modulo.txt` |
| E2E e axe-core (G6)           | `docker compose up -d`; `npm run build`         | `npm run test:e2e`                                    | `e2e.json`, `e2e-resumo.json`           |
| Complexidade (G2)             | —                                               | ESLint com a regra `complexity` (comando 1)           | `complexidade.json`                     |
| Tamanho de arquivo (G2)       | —                                               | Contagem de linhas (comando 2)                        | `BASELINE.md`                           |
| Dependências (G5)             | —                                               | `npm audit --json`                                    | `npm-audit.json`, `npm-audit.txt`       |
| Carga (G3)                    | Servidor de medição no ar (comando 3)           | k6 com `carga.js` (comando 4)                         | `k6-carga.json`, `k6-carga.txt`         |
| Rajada (G4)                   | Servidor recém-subido, banco recriado           | k6 com `rajada.js` (comando 5)                        | `k6-rajada.json`, `k6-rajada.txt`       |
| ZAP (G5)                      | Servidor de medição no ar                       | ZAP *baseline* (comando 6)                            | `zap/`                                  |
| Lighthouse (G6)               | Não repetido nesta APS                          | Procedimento registrado na Sprint 2                   | Equipe Kolô (2026b)                     |

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir de Equipe Kolô (2026h) e dos roteiros em `tests/carga/`.
:::

Os comandos numerados no Quadro 7 são os seguintes:

```bash
# 1. complexidade por função (limiar 10)
npx eslint src --rule '{"complexity":["warn",10]}' -f json -o complexidade.json
# 2. linhas por arquivo de código em src/
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs wc -l
# 3. build de produção e servidor de medição (banco descartável e dublês)
npm run build && npx tsx tests/carga/servidor.ts
# 4. carga: 20 usuários virtuais na leitura e 5 no checkout, 3 min em regime
docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run carga.js
# 5. rajada: 30 clientes finalizam a compra da mesma obra de estoque 1 no mesmo instante
docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run \
  -e N=30 -e DISPARO=$(( $(date +%s) * 1000 + 60000 )) rajada.js
# 6. varredura passiva do ZAP contra o servidor de medição
docker run --rm -v "$PWD/zap:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3100 -m 3 -J zap-baseline.json -r zap-baseline.html -I
```

O roteiro de carga sobe até 20 usuários virtuais em catálogo e ficha da obra e até 5 no *checkout*. Ele leva 30 s para subir, mantém 3 min em regime e leva 15 s para descer. A rajada consome a única unidade da obra disputada. Para repeti-la, é preciso subir o servidor de novo, o que recria o banco. Em cada rodada, o resultado de `npm run lint`, `npm run typecheck` e das suítes é registrado em `_execucao.txt`. Assim fica visível que a rodada atende à condição de comparação da seção 3.2.

# 4 DESENVOLVIMENTO

## 4.1 Sistema e arquitetura observados
O Kolô atende três perfis. O cliente compra obras e prepara o pedido de tatuagem. O artista mantém o próprio portfólio e a agenda. A administração do ateliê gerencia obras, pedidos, artistas e relatórios. A especificação completa e a modelagem estão na monografia. Esta seção resume só o necessário para ler a avaliação (Equipe Kolô, 2026a; Oliveira et al., 2026).

A implementação é um monólito modular em Next.js 16, React 19 e TypeScript em modo estrito (Figura 1). O código de domínio fica em treze módulos em `src/modules/`, cada um com uma API pública em `index.ts`. As páginas e as ações do servidor chamam só essa API. Regras de negócio, validação de entrada com Zod e transações ficam nos módulos, e não nas telas. O PostgreSQL 17, acessado pelo Prisma 7, guarda os dados e também executa parte das regras: as travas de linha da reserva, a restrição que impede horários sobrepostos, a fila de tarefas do pg-boss e o contador do limite de taxa. Os serviços externos são o Mercado Pago (Checkout Pro), o Cloudflare R2 para imagens e o Resend para e-mails de conta. As fotos sobem do navegador direto para o R2, por um endereço assinado de curta duração que o servidor emite depois de conferir tipo e tamanho. Antes de qualquer página, o `proxy.ts` gera o *nonce* da CSP e aplica os cabeçalhos de segurança. Essa estrutura é observável no repositório. A infraestrutura pública descrita no escopo continua planejada enquanto não houver comprovação de implantação (Equipe Kolô, 2026a, 2026d).

::: {custom-style="Legenda"}
Figura 1 Arquitetura do Kolô avaliada
:::

![](midia/diagramas/arquitetura.png){width="6.3in"}

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir do código (Equipe Kolô, 2026d). O diagrama não comprova implantação pública.
:::

### 4.1.1 Fluxos críticos
Os três fluxos aprofundados concentram os riscos apontados na justificativa: a vitrine pública, o dinheiro e o estoque e o contato com o estúdio.

**Catálogo e ficha da obra.** A página é montada no servidor (Figura 2). No catálogo, ela lê da URL os filtros, a ordem e a página, e o módulo `catalog` valida essa entrada com Zod antes de consultar o banco. A ficha é localizada pelo identificador da obra na URL. O catálogo mostra apenas obras fora de rascunho. Uma obra aparece como disponível quando está à venda e tem estoque. As imagens passam pelo otimizador do Next.js, que as entrega no tamanho da tela e em formato moderno. Só a primeira foto é carregada com prioridade, decisão tomada no TCC para cumprir o limite de LCP do RNF13. Esse é o fluxo medido pela carga de leitura do k6 (Equipe Kolô, 2026b).

::: {custom-style="Legenda"}
Figura 2 Fluxo do catálogo e da ficha da obra
:::

![](midia/diagramas/fluxo-catalogo.png){width="6.3in"}

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir do código (Equipe Kolô, 2026d) e de Equipe Kolô (2026b).
:::

**Carrinho, *checkout* e *webhook*.** Finalizar a compra abre uma transação que trava as linhas das obras e confere o estoque descontado das reservas ativas (Figura 3). Havendo unidade livre, reserva os itens por dez minutos e cria o pedido pendente. Sem unidade livre, nada é gravado. O pagamento acontece no Checkout Pro, fora do Kolô, e o pedido só muda pelo aviso do Mercado Pago. O *webhook* recusa a assinatura inválida antes de ler o corpo e não confia no conteúdo do aviso: ele consulta a situação do pagamento na API. Em seguida, registra o evento com identificador único, e um reenvio do mesmo aviso não tem efeito. Se o pagamento aprovado cobre exatamente o total, o pedido passa a pago e o estoque baixa na mesma transação. O pagamento de valor divergente, de pedido que não aguardava pagamento ou sem unidade livre fica marcado para estorno. Esse fluxo é exercitado pela carga do *checkout* e pela rajada concorrente (Equipe Kolô, 2026a).

::: {custom-style="Legenda"}
Figura 3 Sequência da compra, do pagamento e da confirmação
:::

![](midia/diagramas/fluxo-compra.png){width="6.3in"}

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir do código (Equipe Kolô, 2026d) e das regras RN02 a RN07 e RNF11 (Equipe Kolô, 2026a).
:::

O Código 1 mostra a trava da reserva. As linhas das obras são travadas sempre na mesma ordem, pelo identificador, para que dois carrinhos com as mesmas obras em ordem diferente não se bloqueiem. Só depois da trava o estoque livre é calculado. O Código 2 mostra o início do tratamento do aviso: o evento é gravado com identificador único, e um aviso já visto termina ali, sem efeito.

::: {custom-style="Legenda"}
Código 1 Trava das obras e contagem das reservas ativas
:::

```ts
// RN04: trava as linhas das obras, sempre na mesma ordem (id), para não haver deadlock, e conta
// as unidades presas em reservas ativas de outras sessões (todas, se a sessão não existe mais).
async function travarObras(tx: Tx, ids: string[], sessaoId: string | null, agora: Date) {
  await tx.$queryRaw`SELECT id FROM artwork WHERE id = ANY(${ids}::uuid[]) ORDER BY id FOR UPDATE`;
  const obras = await tx.artwork.findMany({ where: { id: { in: ids } } });
  const reservadas = await tx.artworkReservation.groupBy({
    by: ["artworkId"],
    where: {
      artworkId: { in: ids },
      expiresAt: { gt: agora },
      ...(sessaoId ? { sessionId: { not: sessaoId } } : {}),
    },
    _sum: { quantity: true },
  });
  const ocupadas = (id: string) => reservadas.find((r) => r.artworkId === id)?._sum.quantity ?? 0;
  return { obras, ocupadas };
```

::: {custom-style="Legenda"}
Fonte `src/modules/orders/reserva.ts`, linhas 41 a 56, na revisão `51bb1b8` (Equipe Kolô, 2026d).
:::

::: {custom-style="Legenda"}
Código 2 Registro idempotente do aviso de pagamento
:::

```ts
async function aplicar(
  tx: Tx,
  pagamento: PagamentoLido,
  dono: Dono,
  idEvento: string,
  agora: Date,
) {
  // RNF11: aviso já visto não faz nada. Um reenvio simultâneo espera aqui o primeiro terminar a
  // transação; se o primeiro foi desfeito, este processa no lugar dele.
  const { count } = await tx.webhookEvent.createMany({
    data: { eventId: idEvento, source: PROVEDOR, payload: pagamento.registro, processedAt: agora },
    skipDuplicates: true,
  });
  if (count === 0) return;
  // Mesma ordem de travas do checkout (usuário → pedido → sessão → obras): avisos do mesmo
  // pedido, e um checkout da mesma conta, se enfileiram aqui.
  await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${dono.userId}::uuid FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "order" WHERE id = ${dono.id}::uuid FOR UPDATE`;
```

::: {custom-style="Legenda"}
Fonte `src/modules/payments/webhook.ts`, linhas 140 a 157, na revisão `51bb1b8` (Equipe Kolô, 2026d).
:::

**Assistente de agendamento e agenda.** O assistente público percorre sete etapas, do nome aos três avisos obrigatórios: anamnese e termo de consentimento presenciais e declaração de maioridade (Figura 4). Na revisão, o servidor aplica o limite de taxa por IP e valida a preferência. A saída é um *link* `wa.me` com a mensagem pronta, que o próprio cliente envia. Nada do assistente é gravado. O horário só passa a existir quando o artista ou a administração o cadastra na agenda interna. Nesse cadastro, o banco recusa, por uma restrição de exclusão, dois horários sobrepostos do mesmo artista (Equipe Kolô, 2026a).

::: {custom-style="Legenda"}
Figura 4 Fluxo do assistente de agendamento e da agenda interna
:::

![](midia/diagramas/fluxo-agendamento.png){width="6.3in"}

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir do código (Equipe Kolô, 2026d) e de RF20 a RF25 (Equipe Kolô, 2026a).
:::

A restrição da agenda fica no banco, e não só na aplicação (Código 3). O intervalo é fechado no início e aberto no fim, por isso um horário que termina às 17h e outro que começa às 17h não se sobrepõem. Horários excluídos ou cancelados não ocupam a agenda.

::: {custom-style="Legenda"}
Código 3 Restrição que impede horários sobrepostos do mesmo artista
:::

```sql
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "artist_id" WITH =,
    tstzrange("inicia_em", "termina_em", '[)') WITH &&
  )
  WHERE ("excluido_em" IS NULL AND "situacao" <> 'CANCELADO');
```

::: {custom-style="Legenda"}
Fonte `prisma/migrations/0001_init/migration.sql`, linhas 528 a 534, na revisão `51bb1b8` (Equipe Kolô, 2026d).
:::

### 4.1.2 Ciclo de qualidade aplicado
A Figura 5 mostra o processo da seção 3.3.3 como foi executado nesta APS. A linha de base mediu a revisão `b3587b3`. Os pontos críticos que ela revelou foram separados em melhorias de baixo risco e propostas. A nova medição repetiu os mesmos comandos sobre a revisão `51bb1b8`. Os resultados de cada etapa estão nas seções 4.3 a 4.7 (Equipe Kolô, 2026f, 2026g, 2026h).

::: {custom-style="Legenda"}
Figura 5 Ciclo de qualidade aplicado na avaliação
:::

![](midia/diagramas/ciclo-qualidade.png){width="6.3in"}

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir de Equipe Kolô (2026f, 2026g, 2026h).
:::

## 4.2 Modelo de dados e invariantes
No comércio, artwork se relaciona a artwork_reservation, cart_item e order_item; order reúne itens e pagamentos. Na agenda, appointment vincula artista, intervalo e contato. As contas e sessões sustentam a identificação e o controle de acesso. O modelo utiliza valores monetários inteiros em centavos e datas armazenadas em UTC. O DER completo e o esquema estão identificados no Apêndice A (Equipe Kolô, 2026e).

## 4.3 Resultados de confiabilidade e testes

### 4.3.1 Suítes automatizadas
A Tabela 1 traz as três suítes nas duas rodadas, com os números dos relatórios do Vitest e do Playwright. Todos os testes passaram nas duas rodadas, sem teste ignorado, e o E2E não teve teste instável. Os 17 testes unitários e 9 de integração a mais na nova medição são os testes acrescentados com as melhorias M1 a M3 (seção 4.7). O tempo é a duração total de cada executor na máquina descrita na seção 3.5.1 (Equipe Kolô, 2026f, 2026h).

::: {custom-style="Legenda"}
Tabela 1 Suítes automatizadas na linha de base e na nova medição
:::

| **Camada**                  | **Arquivos** | **Testes (antes → depois)** | **Aprovação** | **Tempo (antes → depois)** |
|----------------------------------|-------------------|----------------------------------|---------------------|---------------------------------|
| Unitária (Vitest)           | 122 → 124    | 562 → 579                   | 100% nas duas | 93,8 s → 89,3 s            |
| Integração (Vitest, Postgres real) | 42 → 42 | 286 → 295                 | 100% nas duas | 142,4 s → 136,0 s          |
| E2E (Playwright, *build* de produção) | 7 → 7 | 44 → 44                 | 100% nas duas | 121,8 s → 124,9 s          |
| Total                       | 171 → 173    | 892 → 918                   | 100% nas duas | —                          |

::: {custom-style="Legenda"}
Fonte Relatórios `unit.txt`, `integracao.txt` e `e2e-resumo.json` em `docs/aps/evidencias/baseline/` e `docs/aps/evidencias/depois/`.
:::

A suíte segue a forma de pirâmide: 63% dos testes são unitários, 32% de integração e 5% E2E. As regras com transação e concorrência, como reserva, agenda e *webhook*, são verificadas na camada de integração contra o PostgreSQL real. O E2E cobre só os percursos completos de compra, assistente e gestão, além das larguras de tela e da varredura de acessibilidade.

As contagens da monografia são de momentos anteriores e não foram somadas às desta APS. A monografia informa 562 testes unitários, 276 de integração e 43 E2E e registra que as contagens de integração e E2E antecedem o relatório de vendas. A Sprint 2 registra 532 unitários, 276 de integração e 43 E2E no fechamento da qualidade integrada. A linha de base desta APS confirma os 562 unitários. Ela tem 10 testes de integração e 1 E2E a mais, o que é coerente com a observação da própria monografia sobre o relatório de vendas (Equipe Kolô, 2026b; Oliveira et al., 2026).

### 4.3.2 Casos de teste formalizados
O Quadro 8 especifica os doze casos do roteiro da seção 3.4. O Quadro 9 registra o resultado obtido de cada um na nova medição, na revisão `51bb1b8`, e o teste automatizado que o executa. Os casos existentes antes das melhorias também passaram na linha de base.

::: {custom-style="Legenda"}
Quadro 8 Especificação dos casos de teste
:::

| **ID** | **Pré-condição**                                          | **Passos e entrada**                                                                                   | **Resultado esperado**                                                        |
|------------|-------------------------------|-------------------------------------------------------|------------------------------------------|
| CT01   | Obra com estoque 3; outra sessão reservou 2               | Segunda sessão reserva 2 unidades; depois, 1 unidade                                                   | 2 recusado como indisponível; 1 aceito; estoque continua 3 até o pagamento    |
| CT02   | Obra de estoque 1 no carrinho de dois clientes            | Os dois finalizam a compra ao mesmo tempo                                                              | Um pedido pendente criado; o outro recusado como indisponível                 |
| CT03   | Sessão A reservou a obra de estoque 1 no instante T0      | Sessão B reserva em T0 + 10 min − 1 ms e em T0 + 10 min + 1 ms                                         | Recusada antes do vencimento; aceita depois                                   |
| CT04   | Segredo do *webhook* configurado                          | Aviso com assinatura válida; aviso com *hash* alterado, segredo errado, outro pagamento, outra requisição, sem cabeçalho, sem `ts`, sem `v1` ou malformado | Válida aceita; as oito inválidas recusadas; na rota, 401 sem consultar a API nem gravar |
| CT05   | Pedido pendente com reserva ativa; pagamento aprovado     | O mesmo aviso de pagamento é enviado duas vezes                                                        | Pedido pago e estoque baixado uma vez; o reenvio não tem efeito               |
| CT06   | Pedido pendente com reserva ativa                         | Aprovação com valor igual ao total; com valor menor; com valor diferente                               | Igual: pedido pago; menor: pedido não pago; diferente: pagamento marcado para estorno |
| CT07   | Horário da artista Ana das 14h às 17h                     | Novo horário da Ana das 16h às 18h; da Ana das 17h às 18h; de outro artista das 14h às 17h             | Sobreposto recusado pelo banco; encostado e de outro artista aceitos          |
| CT08   | Assistente preenchido até a etapa de avisos               | Envio com os três aceites; sem cada um deles; com um falso; com texto no lugar de verdadeiro; com campo extra | Só os três aceites verdadeiros, sem campo extra, chegam à revisão      |
| CT09   | Regra de 5 tentativas por janela                          | Seis tentativas na mesma janela; uma tentativa depois de a janela acabar                               | 5 liberadas; a 6ª bloqueada até o fim da janela; a contagem reinicia          |
| CT10   | Código de recuperação de senha emitido                    | Troca com código válido; reuso do mesmo código; código vencido há 1 min; inventado; vazio              | Só o válido troca a senha, uma vez; nos demais a senha antiga continua valendo |
| CT11   | Cliente com pedido em cada situação                       | Excluir a conta com pedido pago, em processamento ou enviado e ainda não entregue; com pedido já entregue | Não entregue: exclusão recusada; entregue: conta anônima e pedido com os mesmos valores |
| CT12   | Horário e trabalho de portfólio da artista Ana            | Outro artista tenta alterar o horário e remover o trabalho; a administração altera o horário           | Outro artista recusado, sem descobrir o horário; administração aceita         |

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir dos testes automatizados do repositório (Equipe Kolô, 2026d) e de Equipe Kolô (2026a).
:::

::: {custom-style="Legenda"}
Quadro 9 Resultado obtido e teste automatizado de cada caso
:::

| **ID** | **Resultado obtido**                           | **Situação** | **Teste automatizado (arquivo em `tests/`)**                                            |
|------------|--------------------------------------|-------------------|-----------------------------------------------------------------------|
| CT01   | Conforme o esperado                            | Aprovado     | `integration/reserva.test.ts`: reserva até o estoque livre                              |
| CT02   | Conforme o esperado                            | Aprovado     | `integration/checkout.test.ts`: cliques simultâneos e peça única                        |
| CT03   | Conforme o esperado                            | Aprovado     | `integration/reserva.test.ts`: a reserva vence em 10 minutos                            |
| CT04   | Conforme o esperado nas nove entradas          | Aprovado     | `unit/webhook-assinatura.test.ts`; `integration/webhook-http.test.ts`: assinatura inválida responde 401 |
| CT05   | Conforme o esperado                            | Aprovado     | `integration/webhook-aprovacao.test.ts`: o mesmo aviso reenviado é processado uma vez    |
| CT06   | Conforme o esperado nas três classes           | Aprovado     | `integration/webhook-aprovacao.test.ts`: aprovação confirma e valor menor; `integration/webhook-estorno.test.ts`: valor diferente |
| CT07   | Conforme o esperado                            | Aprovado     | `integration/agenda.test.ts`: sobreposto recusado, encostado e de outro artista passam  |
| CT08   | Conforme o esperado em todas as entradas       | Aprovado     | `unit/wizard-validacao.test.ts`; `unit/wizard-avisos.test.tsx`                          |
| CT09   | Conforme o esperado                            | Aprovado     | `integration/rate-limit.test.ts`: 5 liberadas, 6ª bloqueada e reinício da janela         |
| CT10   | Conforme o esperado                            | Aprovado     | `integration/recuperacao.test.ts`: token válido não reusa; expirado ou inventado recusado |
| CT11   | Conforme o esperado nas quatro situações       | Aprovado     | `integration/exclusao-conta.test.ts`: casos RN12 de pedido não entregue e conta anônima |
| CT12   | Conforme o esperado                            | Aprovado     | `integration/agenda.test.ts` e `integration/portfolio.test.ts`: casos RN10              |

::: {custom-style="Legenda"}
Fonte Relatórios `unit.json` e `integracao.json` em `docs/aps/evidencias/depois/`.
:::

### 4.3.3 Concorrência
A monografia registra um experimento com dez rodadas de oito sessões concorrentes, cada rodada disputando uma obra de estoque unitário. Em cada rodada, uma reserva foi concedida e sete foram recusadas. O total foi de 80 tentativas, com dez reservas concedidas para dez disputas independentes. O resultado sustenta a propriedade de não exceder o estoque nesse cenário, mas não mede latência e não exercita carrinhos com várias obras (Oliveira et al., 2026). Nesta APS, a mesma propriedade foi verificada de novo pelo caso CT02 e, sob carga HTTP contra o *build* de produção, pela rajada de 30 clientes da seção 4.4.

::: {custom-style="Legenda"}
Tabela 2 Síntese do experimento de concorrência registrado
:::

| **Condição**                   | **Resultado documentado**       |
|--------------------------------|---------------------------------|
| Rodadas e sessões              | 10 rodadas × 8 sessões          |
| Estoque em cada disputa        | 1 unidade                       |
| Reservas concedidas por rodada | 1                               |
| Reservas recusadas por rodada  | 7                               |
| Total de tentativas            | 80                              |
| Violação do limite de estoque  | Nenhuma no experimento descrito |

::: {custom-style="Legenda"}
Fonte Oliveira et al. (2026), seção 5.3. Experimento histórico, sem nova execução nesta análise.
:::

### 4.3.4 Manutenibilidade medida
A cobertura da linha de base reúne os testes unitários e de integração numa só execução, com 848 testes aprovados. A cobertura de linhas foi de 92,46% (2849 de 3081) e a de ramos, de 87,39% (2115 de 2420), as duas acima das metas globais. Por módulo, a Tabela 3 mostra os três módulos de domínio que têm meta própria e os pontos mais baixos. Dois deles ficaram abaixo da meta de 90% de ramos: `payments`, com 88,5%, e `scheduling`, com 88,2%. O módulo `orders` atendeu com margem de 0,3 ponto. O ponto mais baixo é `src/app`, com 72,5% dos ramos. São as páginas e as ações do servidor, exercitadas sobretudo pelo E2E, que não entra na medição de cobertura (Equipe Kolô, 2026h).

::: {custom-style="Legenda"}
Tabela 3 Cobertura por módulo na linha de base
:::

| **Módulo**           | **Linhas** | **Ramos (cobertos/total)** | **Meta de ramos** | **Situação**     |
|----------------------|------------|----------------------------|-------------------|------------------|
| `modules/orders`     | 98,2%      | 90,3% (316/350)            | ≥ 90%             | Atende           |
| `modules/payments`   | 97,0%      | 88,5% (185/209)            | ≥ 90%             | Não atende       |
| `modules/scheduling` | 97,1%      | 88,2% (135/153)            | ≥ 90%             | Não atende       |
| `modules/portfolio`  | 94,8%      | 84,9% (73/86)              | ≥ 70% (global)    | Atende           |
| `lib`                | 92,9%      | 85,2% (144/169)            | ≥ 70% (global)    | Atende           |
| `app`                | 68,8%      | 72,5% (145/200)            | ≥ 70% (global)    | Atende           |
| Global               | 92,46%     | 87,39% (2115/2420)         | ≥ 70%             | Atende           |

::: {custom-style="Legenda"}
Fonte `cobertura-por-modulo.txt` e `coverage-summary.json` em `docs/aps/evidencias/baseline/`.
:::

A complexidade ciclomática foi medida em 989 funções de `src/`. A média foi de 2,53 e a mediana, de 1. Das funções, 876 ficaram entre 1 e 5 e 91 entre 6 e 10, ou seja, 97,8% dentro do limite. Outras 20 ficaram entre 11 e 20 e duas passaram de 20, o que deixa a meta sem atendimento. As mais complexas são componentes de tela que concentram o estado de formulários grandes: `GestaoObras`, com 26, `WizardAgendamento`, com 23, e `GestaoArtistas`, com 20. Entre as funções de domínio, as maiores são a leitura da agenda (18) e duas funções críticas de pagamento, `processarNotificacao` e `iniciarPagamento`, com 16 cada. Nenhum dos 224 arquivos de código de `src/` passou de 500 linhas, e o maior tem 437 (`complexidade.json` e `complexidade-distribuicao.json`; Equipe Kolô, 2026h).

A própria suíte também foi examinada como código a manter, numa auditoria feita em 6 de novembro, antes das melhorias. Todos os requisitos funcionais P0 têm teste, não há teste ignorado nem focado, e não há duplicação real entre camadas. O Quadro 10 registra os sinais de manutenção difícil encontrados (Equipe Kolô, 2026g).

::: {custom-style="Legenda"}
Quadro 10 Sinais de manutenção difícil na suíte de testes
:::

| **Sinal**                     | **Onde**                                                      | **Efeito**                                                                     |
|-------------------------------|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| Espera fixa de 5,5 s          | `exclusao-conta.test.ts`, linha 417                           | Espera o tempo-limite de 5 s da transação; custa 5,5 s em toda execução        |
| Relógio real                  | Testes de expiração do *checkout* e da reserva                | O instante muda a cada execução; risco de resultado instável perto do limite   |
| Teste copiado                 | Três casos RF08 iguais em `paginas-politicas.test.tsx`        | Uma mudança de regra exige três edições                                        |
| Arquivo de teste grande       | `checkout.test.ts` (658 linhas) e `reserva.test.ts` (555)     | Mais difícil de navegar; a meta de 500 linhas vale só para `src/`              |
| Arquivo lento                 | `seed-fundacao.test.ts` (20,9 s) e `wizard-agendamento.test.ts` (17,9 s) | Concentram o tempo da integração, que roda os arquivos em paralelo   |

::: {custom-style="Legenda"}
Fonte Auditoria da suíte registrada em Equipe Kolô (2026g) e tempos de `integracao.json` em `docs/aps/evidencias/baseline/`.
:::

Nenhum desses sinais causou falha nas rodadas medidas. Eles aparecem como pontos críticos de baixa prioridade na seção 4.6.1. A remoção de testes só seria defensável em um caso de infraestrutura e num caso redundante de configuração, o que não muda a leitura da suíte, que é enxuta.

## 4.4 Desempenho e melhorias já registradas
A Tabela 4 confronta a linha de base com cada meta do plano (Quadro 5). Das quinze métricas medidas, onze atenderam à meta e quatro não: os ramos de `payments` e `scheduling`, a complexidade por função e o `npm audit`. O Lighthouse entra como evidência do TCC. As medidas de desempenho e de confiabilidade sob carga atenderam com folga. As seções seguintes detalham cada grupo, e os pontos que não atenderam viram pontos críticos na seção 4.6.1 (Equipe Kolô, 2026h).

::: {custom-style="Legenda"}
Tabela 4 Linha de base contra as metas do plano
:::

| **ID** | **Métrica**                                     | **Meta**                       | **Linha de base**                       | **Situação**    |
|---------|---------------------------------------------|-----------------------------|-------------------------------------|---------------------|
| G1     | Cobertura de linhas                             | ≥ 80%                          | 92,46%                                  | Atende          |
| G1     | Cobertura de ramos global                       | ≥ 70%                          | 87,39%                                  | Atende          |
| G1     | Ramos em `orders`                               | ≥ 90%                          | 90,3%                                   | Atende          |
| G1     | Ramos em `payments`                             | ≥ 90%                          | 88,5%                                   | Não atende      |
| G1     | Ramos em `scheduling`                           | ≥ 90%                          | 88,2%                                   | Não atende      |
| G2     | Complexidade por função                         | ≤ 10 em todas                  | 22 funções acima; máximo 26             | Não atende      |
| G2     | Tamanho de arquivo em `src/`                    | ≤ 500 linhas                   | Nenhum acima; máximo 437                | Atende          |
| G3     | p95 do catálogo                                 | \< 500 ms                      | 163 ms                                  | Atende          |
| G3     | p95 da ficha da obra                            | \< 500 ms                      | 212 ms                                  | Atende          |
| G3     | p95 da reserva do *checkout*                    | \< 1 s                         | 446 ms                                  | Atende          |
| G3     | Taxa de erro                                    | \< 1%                          | 0% em 9504 requisições                  | Atende          |
| G4     | Vendas acima do estoque na rajada               | Zero                           | Zero: 1 pedido criado e 29 recusados    | Atende          |
| G5     | `npm audit` alta e crítica                      | Zero                           | 2 críticas e 2 altas                    | Não atende      |
| G5     | ZAP *High*                                      | Zero; *Medium* analisado       | Zero *High*; 1 *Medium* analisado       | Atende          |
| G6     | axe-core, violações críticas                    | Zero                           | Zero, no E2E em 320 e 1440 px           | Atende          |
| G6     | Lighthouse, LCP e pontuação                     | \< 2,5 s; ≥ 90                 | Não medido; TCC: 2,43 s e 97 no catálogo | Evidência do TCC |

::: {custom-style="Legenda"}
Fonte Equipe Kolô (2026h), com as saídas brutas em `docs/aps/evidencias/baseline/`; Lighthouse de Equipe Kolô (2026b).
:::

O teste de carga manteve 20 usuários virtuais na leitura e 5 no *checkout* durante 3 min, com 9504 requisições e nenhuma falha. Todas as 8856 verificações de resposta passaram, entre elas a criação do pedido em cada iteração do *checkout*. A Tabela 5 mostra a distribuição dos tempos. O p95 ficou abaixo da metade do limite nos três grupos. O p99, que não tem meta, também ficou abaixo dos limites do p95. A reserva é a operação mais lenta, como esperado: abre uma transação, trava as linhas das obras e grava reserva e pedido (`k6-carga.txt`; Equipe Kolô, 2026h).

::: {custom-style="Legenda"}
Tabela 5 Tempos de resposta sob carga na linha de base
:::

| **Grupo de requisições**  | **Mediana** | **p90**  | **p95**  | **p99**  | **Máximo** | **Meta do p95** |
|---------------------------|-------------|----------|----------|----------|------------|-----------------|
| Catálogo                  | 72 ms       | 145 ms   | 163 ms   | 221 ms   | 385 ms     | \< 500 ms       |
| Ficha da obra             | 91 ms       | 182 ms   | 212 ms   | 281 ms   | 498 ms     | \< 500 ms       |
| Reserva do *checkout*     | 156 ms      | 387 ms   | 446 ms   | 532 ms   | 615 ms     | \< 1 s          |

::: {custom-style="Legenda"}
Fonte `k6-carga.txt` em `docs/aps/evidencias/baseline/`. Uma execução, *build* de produção local.
:::

Na rajada, 30 clientes já cadastrados, com a mesma obra de estoque 1 no carrinho, finalizaram a compra no mesmo instante. Exatamente um pedido foi criado e 29 foram recusados como indisponíveis. O banco ficou com um único item de pedido para a obra, e as 120 requisições não tiveram falha HTTP. As 120 requisições da rajada, que incluem cadastro e carrinho, levaram de 0,3 s a 1,7 s (p95 de 1,5 s). A rajada não tem meta de tempo, e esses números servem só de referência, porque concentram 30 finalizações no mesmo instante, todas disputando a mesma trava. Esse resultado repete, por HTTP e contra o *build* de produção, a propriedade verificada no caso CT02 e no experimento da monografia (`k6-rajada.txt`; Equipe Kolô, 2026h).

O Lighthouse não foi executado de novo nesta APS. O resultado do TCC continua como referência para o RNF13. O catálogo não atingia inicialmente o requisito: o registro informa 88 pontos e LCP de 3,92 s. A equipe identificou que as imagens da primeira linha, carregadas antecipadamente, disputavam a banda. A correção manteve a prioridade elevada só na primeira imagem. Depois da alteração, a mediana de três rodadas foi de 97 pontos e LCP de 2,43 s (Equipe Kolô, 2026b).

::: {custom-style="Legenda"}
Tabela 6 Comparação de desempenho documentada
:::

| **Indicador**         | **Catálogo antes** | **Catálogo depois** | **Ficha da obra** |
|-----------------------|--------------------|---------------------|-------------------|
| Lighthouse desempenho | 88                 | 97                  | 98                |
| LCP                   | 3,92 s             | 2,43 s              | 2,25 s            |
| FCP                   | 0,77 s             | 0,78 s              | 0,78 s            |
| TBT                   | 116 ms             | 73 ms               | 83 ms             |
| CLS                   | 0                  | 0                   | 0                 |

::: {custom-style="Legenda"}
Fonte Equipe Kolô (2026b), PBI 45. Medianas de três rodadas, móvel e 4G simulado.
:::

A redução calculada de LCP no catálogo é de aproximadamente 38,0%, obtida pela diferença entre 3,92 e 2,43 dividida por 3,92. O aumento foi de nove pontos na pontuação de desempenho. Esse cálculo descreve a comparação registrada e não uma nova medição.

A margem até o limite de 2,5 s é de apenas 0,07 s no catálogo. Assim, o atendimento local do requisito não garante o mesmo resultado na VPS ou sob outra rede. Recomenda-se repetir as rodadas após a publicação e conservar os relatórios originais. A pontuação da ficha da obra demonstra uma segunda página avaliada, mas não fornece uma comparação antes e depois para ela.

### 4.4.1 Interface observada
O catálogo é um dos pontos de entrada do fluxo de compra e uma das páginas avaliadas pelo requisito RNF13. A imagem documenta a organização visual da interface disponível nos arquivos do projeto. Sua presença não representa uma execução de teste.

::: {custom-style="Legenda"}
Figura 6 Catálogo de obras do projeto
:::

![](midia/media/image2.png){width="6.299212598425197in" height="4.921259842519685in"}

::: {custom-style="Legenda"}
Fonte Captura já disponível em docs/telas/atelie. Imagem ilustrativa da interface, sem nova auditoria.
:::

## 4.5 Acessibilidade e segurança
A Sprint 2 registra varredura de 35 telas nas larguras de 320, 768, 1440 e 1920 px. O axe-core é executado em 320 e 1440 px. A documentação descreve correções em nomes acessíveis de botões de ordenação no portfólio e quebra de texto em ações do pedido administrativo. O fechamento informa lista de exceções vazia no conjunto verificado. A revisão também identificou alvo de toque de 44 px, corrigido para pelo menos 48 px e acompanhado de teste (Equipe Kolô, 2026b).

Nesta APS, a mesma varredura rodou dentro do E2E nas duas rodadas e passou em ambas. O *gate* falha diante de qualquer violação de impacto crítico ou sério nas regras WCAG 2.0 e 2.1, níveis A e AA (`e2e-resumo.json`). O resultado é parcial em relação ao RNF21: teclado e foco permaneceram pendentes. A varredura verifica regras automáticas e os impactos selecionados, sem garantir a experiência de usuários com deficiência. A inspeção do teste confirma que resultados inconclusivos não entram no *gate*. Esse limite deve acompanhar qualquer afirmação sobre acessibilidade.

### 4.5.1 Dependências
A auditoria da linha de base encontrou 17 avisos: 2 críticos, 2 altos, 8 moderados e 5 baixos. O Quadro 11 mostra os que pesam na meta e os que afetam dependências declaradas pelo projeto.

::: {custom-style="Legenda"}
Quadro 11 Avisos do npm audit na linha de base
:::

| **Pacote**                   | **Severidade** | **Dependência**           | **Problema registrado**                                    | **Correção**                  |
|----------------------------|----------------------|-------------------------------|------------------------------------|----------------------|
| `next`                       | Crítica        | Direta, produção          | Execução remota no otimizador de imagens com SVG; negação de serviço em Server Actions | Versão nova disponível |
| `better-auth`                | Crítica        | Direta, produção          | Limite de taxa contornável sob concorrência, via adaptador | Versão nova disponível        |
| `zod`                        | Alta           | Direta, produção          | Consumo de memória em coleções grandes                     | Versão nova disponível        |
| `undici`                     | Alta           | Transitiva                | Aviso no cliente HTTP do Node.js                           | Versão nova disponível        |
| `typescript-eslint` e pacotes | Moderada      | Direta, desenvolvimento   | Avisos em pacotes de análise estática                      | Troca de versão principal     |
| `fast-uri`, `react-email`, `deepmerge` e outros | Moderada e baixa | Transitivas e uma direta | Avisos menores                      | Parcial                       |

::: {custom-style="Legenda"}
Fonte `npm-audit.json` e `npm-audit.txt` em `docs/aps/evidencias/baseline/`; Equipe Kolô (2026h).
:::

O dado mais relevante é a mudança no tempo. No fechamento da Sprint 2, em 18 de outubro, a mesma auditoria tinha zero avisos. As versões não mudaram desde então, mas avisos novos foram publicados para elas. O RNF02 é, portanto, um requisito que perde a validade sozinho: atendido numa data, deixa de ser atendido sem nenhuma alteração no código. Isso justifica repetir a auditoria em cada entrega e automatizá-la na CI (npm, 2026; Equipe Kolô, 2026b). Os três pacotes diretos de produção têm correção disponível. A atualização foi deixada como proposta, e não implementada, porque troca o *framework* e a biblioteca de autenticação às vésperas da banca do TCC (seção 4.6.2).

### 4.5.2 Varredura do ZAP
A varredura passiva contra o *build* local avaliou 68 regras. Nenhuma falhou, 56 passaram sem alerta e 12 emitiram alerta, que o ZAP classifica por risco e por confiança. Não houve alerta *High*. O Quadro 12 lê cada alerta de risco *Medium* e *Low* e os informativos com consequência prática, separando o problema real, o artefato do ambiente de teste e o falso positivo (ZAP, [202-]a, [202-]b).

::: {custom-style="Legenda"}
Quadro 12 Leitura crítica dos alertas do ZAP na linha de base
:::

| **Risco** | **Alerta (regra)**                        | **Onde**                                  | **Leitura**                                                                                              | **Classificação** |
|---------------|-----------------------------------|------------------------|--------------------------------------|----------------------------|
| *Medium*  | CSP ausente (10038)                       | `/robots.txt`, `/sitemap.xml`, página 404 | O filtro do `proxy.ts` ignora caminhos com ponto, e essas respostas saem sem nenhum cabeçalho de segurança | Problema real    |
| *Low*     | `X-Content-Type-Options` ausente (10021)  | Arquivos estáticos de `/_next/static/`    | Mesma causa: os estáticos ficam fora do `proxy.ts`                                                       | Problema real     |
| *Low*     | `X-Powered-By` exposto (10037)            | Todas as respostas                        | O Next.js anuncia o *framework*; a opção que desliga o cabeçalho não estava ativa                        | Problema real     |
| *Low*     | `Permissions-Policy` ausente (10063)      | Todas as páginas                          | Cabeçalho não definido; sem ele, recursos como câmera e geolocalização não ficam explicitamente negados  | Problema real     |
| *Low*     | COEP, COOP e CORP ausentes (90004)        | Páginas e estáticos                       | Isolamento entre origens não configurado; ativá-lo exige revisar o *iframe* do Turnstile                 | Melhoria possível |
| *Low*     | Divulgação de erro da aplicação (90022)   | `/_next/image`                            | Resposta 500 porque o R2 falso aponta para um endereço inexistente                                       | Artefato do ambiente |
| *Low*     | Redirecionamento grande (10044)           | `/conta` sem sessão                       | O redirecionamento para o *login* leva o corpo da página no formato do React, sem dado da conta         | Falso positivo    |
| Info      | Informação sensível na URL (10024)        | `/login`, `/cadastro`, `/contato`, `/esqueci-senha` | O rastreador sem JavaScript envia os formulários antes da hidratação, por GET, com a senha na URL | Problema real |
| Info      | Atributo controlado pelo usuário (10031)  | `?ordem=` no catálogo e filtros da galeria | O valor aparece num atributo, mas o React o escapa                                                      | Falso positivo provável |

::: {custom-style="Legenda"}
Fonte `zap/zap-baseline.json` e `zap/zap-baseline.txt` em `docs/aps/evidencias/baseline/`; leitura elaborada pelos autores a partir do código.
:::

O único *Medium* e três dos *Low* têm a mesma causa. O `proxy.ts` aplica os cabeçalhos só às rotas de página, e o que não passa por ele sai sem proteção. Por isso o achado foi tratado na causa, e não alerta por alerta. O alerta informativo sobre a URL é o mais sério na prática, embora o ZAP o classifique como informativo. Um usuário que envie o formulário antes de o JavaScript carregar, numa conexão lenta, expõe a senha no histórico do navegador e nos *logs* de servidores intermediários. Esses dois achados deram origem às melhorias M2 e M3. O HSTS e o `upgrade-insecure-requests` não foram avaliados, porque só têm efeito sob HTTPS (seção 3.5.1).

As evidências históricas de segurança registradas na Sprint 2 continuam válidas no que mostram, com os limites do Quadro 13.

::: {custom-style="Legenda"}
Quadro 13 Evidências históricas de segurança e seus limites
:::

| **Controle**          | **Evidência registrada**                               | **Limite**                                           |
|--------------------------|----------------------------------------------------------|--------------------------------------------------------|
| Assinatura de webhook | Aviso sem assinatura recebe HTTP 401                   | Revalidar com o gateway pelo endereço publicado      |
| Permissões            | Ação administrativa repetida por cliente foi recusada  | Não substitui revisão de todas as operações          |
| CSRF e entradas       | Origem externa recusada; entrada inválida rejeitada    | Roteiro aplicado ao ambiente local de testes         |
| Dependências          | Audit com zero vulnerabilidades no fechamento de 18/10 | Superado: a linha de base de 6/11 encontrou 2 críticas e 2 altas |
| Cabeçalhos e CSP      | Nonce por requisição e cabeçalhos inspecionados        | Nota pública e HTTPS dependem da implantação         |

::: {custom-style="Legenda"}
Fonte Equipe Kolô (2026b), PBI 45. As varreduras desta APS estão nos Quadros 11 e 12.
:::

A ausência de anamnese no esquema é coerente com o escopo de minimização de dados do projeto. Isso não é apresentado como certificação de conformidade jurídica. A análise limita-se aos contratos e à estrutura de dados inspecionados.

## 4.6 Análise crítica e plano de melhoria
### 4.6.1 Pontos críticos da linha de base
Cada métrica fora da meta e cada alerta classificado como problema real virou um ponto crítico. A lista abaixo está em ordem de gravidade e indica a evidência bruta de cada ponto, em `docs/aps/evidencias/baseline/`.

1. **PC1 — Dependências vulneráveis.** Duas críticas e duas altas, três delas em dependências diretas de produção: `next`, `better-auth` e `zod` (`npm-audit.json`; seção 4.5.1).
2. **PC2 — Senha na URL antes da hidratação.** Os formulários de *login*, cadastro, recuperação e contato não declaram método e, sem JavaScript, enviam por GET (`zap/zap-baseline.json`, regra 10024; seção 4.5.2).
3. **PC3 — Respostas sem cabeçalhos de segurança.** `robots.txt`, `sitemap.xml`, a página 404 e os estáticos ficam fora do `proxy.ts`. Há ainda `X-Powered-By` exposto e `Permissions-Policy` ausente (`zap/zap-baseline.json`, regras 10038, 10021, 10037 e 10063; seção 4.5.2).
4. **PC4 — Ramos não exercitados em pagamento e agenda.** `payments` tem 88,5% e `scheduling` tem 88,2%, abaixo da meta de 90% (`cobertura-por-modulo.txt`; seção 4.3.4).
5. **PC5 — Funções acima da complexidade 10.** São 22, duas delas acima de 20, concentradas em componentes de formulário e em dois pontos do pagamento (`complexidade.json`; seção 4.3.4).
6. **PC6 — Manutenção da suíte.** Há uma espera fixa de 5,5 s, relógio real nos testes de expiração e testes copiados (Quadro 10; seção 4.3.4).

O isolamento entre origens (COEP, COOP e CORP) e os cabeçalhos de `/_next/image` ficaram fora da lista. Eles são melhorias possíveis, e não falhas contra uma meta do plano.

### 4.6.2 Plano de melhoria
Os pontos críticos foram ordenados pelo risco de mudar o sistema a poucos dias da banca do TCC. Três deles podiam ser tratados com mudança pequena, coberta pela suíte e verificável na mesma métrica que os revelou, e viraram as melhorias M1 a M3. Os outros três exigem trocar dependências centrais, reestruturar telas grandes ou mudar a suíte inteira, e viraram propostas. O Quadro 14 registra a decisão para cada ponto (Equipe Kolô, 2026f, 2026g).

::: {custom-style="Legenda"}
Quadro 14 Decisão sobre cada ponto crítico
:::

| **Ponto crítico**                      | **Decisão**        | **Justificativa**                                                                            |
|------------------------------------|-------------------|-------------------------------------------------------------------------------------|
| PC1 Dependências vulneráveis           | Proposta P1        | A correção troca a versão do Next.js e da biblioteca de autenticação; o risco de regressão às vésperas da banca supera o ganho local |
| PC2 Senha na URL antes da hidratação   | Melhoria M2        | Um atributo por formulário, coberto por teste; não muda o envio depois da hidratação        |
| PC3 Respostas sem cabeçalhos           | Melhoria M3        | Configuração do servidor, coberta por teste; não altera nenhuma página                       |
| PC4 Ramos de pagamento e agenda        | Melhoria M1        | Só acrescenta testes de comportamento já existente; não toca o código do sistema             |
| PC5 Funções acima da complexidade 10   | Proposta P2        | Quebrar as telas de gestão e o assistente exige refatoração ampla da interface               |
| PC6 Manutenção da suíte                | Proposta P4        | Trocar o relógio real por relógio fixo mexe em muitos testes de expiração de uma vez         |

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir de Equipe Kolô (2026f, 2026g).
:::

O plano previa apenas testes novos ou refatoração coberta pela suíte. M2 e M3 mudam o comportamento do servidor e foram aceitas como exceção, com a justificativa da seção 3.3.3: são mudanças de configuração, pequenas e cobertas por testes unitários e pelo E2E, que não teve regressão. As propostas não implementadas estão no Quadro 15, cada uma com o motivo e o próximo passo. A P5 decorre da regressão do `npm audit` (seção 4.5.1). As de P6 em diante vêm de pendências anteriores a esta APS, registradas nas Sprints 2 e 3 e na monografia, e continuam válidas.

::: {custom-style="Legenda"}
Quadro 15 Propostas não implementadas
:::

| **Proposta**                                    | **Motivo de não implementar agora**                                   | **Próximo passo e critério de aceite**                                                                  |
|-------------------------------|--------------------------------------------|-----------------------------------------------------------------|
| P1 Atualizar `next`, `better-auth` e `zod`      | Troca de *framework* e de autenticação antes da banca                 | Atualizar logo após a banca; `npm audit` sem alta nem crítica, com lint, tipos e as três suítes verdes  |
| P2 Quebrar `GestaoObras`, `WizardAgendamento` e `GestaoArtistas` | Refatoração ampla da interface, com risco de regressão visual | Extrair subcomponentes por etapa ou seção; nenhuma função acima de 20, e o E2E sem regressão           |
| P3 Cabeçalhos em `/_next/image`; COOP e CORP    | O otimizador não passa pelo `proxy.ts`; COEP exige revisar o Turnstile | Cabeçalhos aplicados na configuração do Next.js; ZAP sem os alertas 90004 e o Turnstile funcionando    |
| P4 Relógio fixo e fim da espera de 5,5 s na suíte | Mexe em muitos testes de expiração de uma vez                       | Relógio controlado nos testes de expiração; suíte de integração mais curta e sem relógio real          |
| P5 Auditoria de dependências na CI              | Fora do escopo das melhorias desta APS                                | Passo da CI que falha com aviso alto ou crítico, para que o RNF02 não volte a falhar sem ninguém ver    |
| P6 Teclado e foco                               | Exige roteiro manual por tarefa                                       | Compra, *login*, assistente e administração percorridos sem *mouse*, com foco e ordem documentados       |
| P7 Medições após a publicação                   | Dependem do ambiente publicado                                        | SSL Labs e securityheaders.com com nota A; Lighthouse em três rodadas na VPS; compra no *sandbox* pela URL pública |
| P8 Disponibilidade e *backup*                   | Dependem do ambiente publicado                                        | Reinício automático verificado; *dump* restaurado em ambiente isolado, com integridade e tempo registrados |
| P9 Dados de demonstração reproduzíveis          | Pendência da Sprint 3 na revisão avaliada; o PBI 49 entrou na `main` depois dela | Clone limpo executa migração e povoamento e mostra catálogo e portfólio com imagens                     |

::: {custom-style="Legenda"}
Fonte Elaborado pelos autores a partir de Equipe Kolô (2026b, 2026c, 2026f) e de Oliveira et al. (2026).
:::

## 4.7 Registro e acompanhamento das melhorias

### 4.7.1 Melhorias implementadas
Cada melhoria seguiu o ciclo da seção 3.3.3. M2 e M3 foram feitas por TDD: primeiro um teste que falha pelo motivo esperado, depois a menor mudança que o faz passar. M1 só acrescenta testes a comportamento existente e, por isso, não teve etapa vermelha.

- **M1, testes de pagamento e agenda.** Nove casos de integração, contra o PostgreSQL real, para regras que a suíte não exercitava. Entre elas: o cartão em análise não prorroga a reserva; o Pix expirado com outro ainda em aberto; o Pix expirado depois de o pedido já estar pago; cancelar ou estornar o que não existe; artista inativado; semana repetida na URL da agenda; a administração edita sem trocar o artista; e o limite de taxa do assistente na revisão.
- **M2, formulários por POST.** O atributo `method="post"` em doze formulários: *login*, cadastro, recuperação e redefinição de senha, troca de senha, exclusão de conta, perfil, endereço, contato, assistente, horário da agenda e formulário da administração. Um teste novo confirma o método em cada um. Depois da hidratação, o envio continua pelas ações do servidor. A mudança só impede que um envio antes do JavaScript leve os dados na URL.
- **M3, cabeçalhos de segurança.** A `Permissions-Policy` nega câmera, microfone, geolocalização, pagamento e USB. O `X-Powered-By` foi desligado. Todo caminho com ponto, que o `proxy.ts` não cobre, passou a receber cabeçalhos próprios de arquivo: CSP sem execução de *script*, `nosniff`, `Referrer-Policy` e `X-Frame-Options`.

Antes da nova medição, um revisor que não escreveu o código analisou o *diff* completo. Ele pediu dois ajustes, que entraram antes da medição: dois formulários que tinham ficado sem método (o assistente e o formulário da administração) e um teste de semana que dependia do relógio real. A Tabela 7 compara as duas rodadas nas mesmas métricas (Equipe Kolô, 2026f).

::: {custom-style="Legenda"}
Tabela 7 Antes e depois das melhorias
:::

| **Métrica**                     | **Meta**            | **Antes**             | **Depois**            | **Variação**              |
|---------------------------------|---------------------|-----------------------|-----------------------|---------------------------|
| Testes unitários                | Todos passam        | 562                   | 579                   | +17                       |
| Testes de integração            | Todos passam        | 286                   | 295                   | +9                        |
| Testes E2E                      | Todos passam        | 44                    | 44                    | Sem regressão             |
| Cobertura de linhas             | ≥ 80%               | 92,46%                | 92,51%                | +0,05 ponto               |
| Cobertura de ramos global       | ≥ 70%               | 87,39%                | 87,89%                | +0,50 ponto               |
| Ramos em `payments`             | ≥ 90%               | 88,5% (185/209)       | 91,9% (192/209)       | +3,4 pontos; passa a atender |
| Ramos em `scheduling`           | ≥ 90%               | 88,2% (135/153)       | 91,5% (140/153)       | +3,3 pontos; passa a atender |
| Ramos em `orders`               | ≥ 90%               | 90,3%                 | 90,3%                 | Sem mudança               |
| ZAP *Medium*                    | Analisado           | 1 (CSP ausente)       | 1 (token anti-CSRF, confiança baixa) | Trocou; ver 4.7.2 |
| ZAP *Low*                       | Analisado           | 8                     | 5                     | −3                        |
| `X-Powered-By`                  | Ausente             | Presente              | Ausente               | Atende                    |
| p95 do catálogo (k6)            | \< 500 ms           | 163 ms                | 150 ms                | Sem regressão             |
| p95 da ficha (k6)               | \< 500 ms           | 212 ms                | 200 ms                | Sem regressão             |
| p95 do *checkout* (k6)          | \< 1 s              | 446 ms                | 378 ms                | Sem regressão             |
| Rajada (30 clientes, estoque 1) | 1 criado            | 1 criado, 29 recusados | 1 criado, 29 recusados | Sem mudança             |
| Funções acima da complexidade 10 | Zero               | 22                    | 22                    | Não tratado (P2)          |
| `npm audit` alta e crítica      | Zero                | 2 + 2                 | 2 + 2                 | Não tratado (P1)          |

::: {custom-style="Legenda"}
Fonte Equipe Kolô (2026f), com as saídas brutas em `docs/aps/evidencias/baseline/` e `docs/aps/evidencias/depois/`.
:::

A melhoria M1 levou os dois módulos que não atendiam à meta de ramos para cima de 90%, com 7 ramos novos em `payments` e 5 em `scheduling`. As três suítes continuaram passando por inteiro. As variações do k6, de 5% a 15% para baixo, estão dentro do ruído de uma única execução numa máquina local. A leitura correta é que não houve regressão, e não que o sistema ficou mais rápido: nenhuma das melhorias mexe no caminho medido.

### 4.7.2 Mudança nos alertas do ZAP
Cinco alertas saíram na nova medição: a CSP ausente (10038, *Medium*), o `X-Powered-By` (10037), o `X-Content-Type-Options` ausente (10021), a `Permissions-Policy` ausente (10063) e a informação sensível na URL (10024). Os quatro primeiros saíram com M3 e o último com M2.

Dois alertas novos apareceram nas rodadas seguintes. Os dois foram analisados.

- **CSP sem diretiva de recurso alternativo (10055, *Medium*)** em `robots.txt` e `sitemap.xml`. As diretivas `form-action`, `base-uri` e `frame-ancestors` não herdam o valor de `default-src`. A primeira versão da CSP de arquivo declarava só `default-src 'none'` e `frame-ancestors`. A correção acrescentou `form-action 'none'` e `base-uri 'none'`, e a regra passou na rodada seguinte.
- **Ausência de token anti-CSRF (10202, *Medium*, confiança baixa).** O alerta aparece porque os formulários passaram a declarar POST, e o ZAP começou a examiná-los. É um falso positivo para o Kolô. As ações do servidor do Next.js recusam POST cuja origem difere do *host*, e os *cookies* de sessão usam `SameSite` (RNF06). Nenhum formulário aceita POST de outra origem (OWASP, [202-]).

Na nova medição, a varredura passou em 60 regras e emitiu alerta em 8, sem falha. Continuam, já analisados, o isolamento entre origens (P3), o erro de `/_next/image` causado pelo R2 falso, o redirecionamento de `/conta` e o atributo refletido em `?ordem=` (`zap/zap-baseline.txt` em `docs/aps/evidencias/depois/`).

A revisão apontou dois limites que permanecem. Um caminho inexistente com ponto, como `/obras/foo.bar`, recebe a CSP de arquivo, e a página 404 aparece sem estilo. Nenhuma rota real tem ponto, porque o identificador da obra o proíbe, e o uso normal não é afetado. Além disso, `/_next/image` não tem ponto no caminho nem passa pelo `proxy.ts`, e continua sem os cabeçalhos de segurança (P3).

### 4.7.3 Limitações do estudo
Os resultados valem nas condições em que foram obtidos, e as limitações abaixo restringem até onde eles podem ser generalizados.

- **Ambiente local.** Todas as medições rodaram num único *notebook*, com o gerador de carga e o servidor dividindo o mesmo processador. Os tempos não representam o servidor publicado, e cada métrica de carga foi medida uma só vez por rodada.
- **Ruído do k6.** Sem repetição, não há intervalo de confiança. Diferenças da ordem de 10% entre rodadas não permitem concluir ganho nem perda.
- **Sem publicação.** HTTPS, HSTS, as notas externas de cabeçalhos e TLS, a disponibilidade, o *backup* e as integrações reais com Mercado Pago e R2 ficaram fora (P7 e P8). Os dublês verificam o contrato da integração, não o serviço real.
- **`npm audit` pendente.** A meta de segurança das dependências não foi atendida nas duas rodadas. Até a atualização (P1), o sistema depende de versões com avisos críticos publicados.
- **Lighthouse e acessibilidade.** O Lighthouse não foi repetido, e o teclado e o foco não foram verificados manualmente. A varredura axe cobre só regras automáticas.
- **Escopo da varredura.** O ZAP rodou em modo passivo. Não houve teste ativo de injeção nem roteiro manual de XSS e CSRF além do já registrado no TCC.
- **Mesmo grupo como avaliador.** O sistema foi avaliado pela equipe que o desenvolveu. A revisão independente do *diff* reduz, mas não elimina, esse viés.

O Quadro 16 mantém o modelo de registro proposto antes da APS. As melhorias M1 a M3 foram registradas por esse modelo no comparativo das evidências, com a situação inicial, a ação, a verificação e a comparação.

::: {custom-style="Legenda"}
Quadro 16 Modelo de registro para o próximo ciclo
:::

| **Campo**        | **Conteúdo a registrar**                                |
|------------------|---------------------------------------------------------|
| Identificação    | Requisito, caso de teste, revisão e ambiente            |
| Situação inicial | Comportamento observado e evidência da falha            |
| Ação             | Mudança realizada e responsável efetivo                 |
| Verificação      | Comando ou roteiro, data, amostra e resultado           |
| Comparação       | Métrica anterior e posterior sob condições equivalentes |
| Encerramento     | Artefato, revisão por outro integrante e pendências     |

::: {custom-style="Legenda"}
Fonte Modelo proposto nesta avaliação e aplicado em Equipe Kolô (2026f).
:::

## 4.8 Manutenibilidade e código completo
A tipagem estrita, as validações por esquema, os módulos com APIs públicas e a integração contínua compõem o processo de manutenção definido no repositório. A presença desses controles facilita detectar regressões, mas não fornece, por si só, uma métrica de esforço de manutenção. As métricas medidas nesta APS, cobertura, complexidade, tamanho de arquivo e saúde da suíte, estão na seção 4.3.4. O tempo médio de correção não foi medido, por falta de registro histórico confiável.

A integração contínua executa, em todo *pull request* e em todo *push* na `main`, a mesma sequência usada como condição de comparação nesta APS (Código 4). O *merge* fica bloqueado se qualquer etapa falhar (RNF22). A cobertura, a carga e a varredura do ZAP ficaram fora da CI por decisão do plano, porque dependem de execução longa ou do *build* local (Equipe Kolô, 2026g).

::: {custom-style="Legenda"}
Código 4 Etapas de verificação da integração contínua
:::

```yaml
      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Typecheck
        run: npm run typecheck

      - name: Unit tests
        run: npm test

      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://kolo_user:kolo_password@localhost:5432/kolo_db

      - name: Build
        run: npm run build

      # PBI-45: E2E contra o build acima, no Postgres de serviço (banco kolo_e2e descartável).
      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        run: npm run test:e2e
```

::: {custom-style="Legenda"}
Fonte `.github/workflows/ci.yml`, linhas 40 a 68, na revisão `51bb1b8` (Equipe Kolô, 2026d). A filtragem por tipo de mudança, que a `main` recebeu em paralelo, não faz parte da revisão avaliada.
:::

A codificação completa permanece no repositório do projeto, identificado no Apêndice A por endereço e revisão. No corpo, os Códigos 1 a 4 mostram os trechos do sistema discutidos na avaliação. O Apêndice B traz na íntegra o controle de assinatura do *webhook*, e o Apêndice C, todo o código escrito para esta APS. A consulta ao código completo do sistema deve usar o repositório na revisão identificada, porque este documento não transcreve todos os arquivos.

A monografia e a Sprint 2 registram avanços de qualidade em desenvolvimento e testes. A inspeção desta versão também encontra relatórios administrativos já implementados, embora o briefing mais antigo os listasse como adiados. Para essa funcionalidade, prevalecem a atualização do RF32 no escopo, o PBI 48 e o módulo reports presente no código.

# 5 CONCLUSÕES E RECOMENDAÇÕES

## 5.1 Síntese dos resultados
Este trabalho investigou em que medida os testes e as medições sustentam a confiabilidade, a eficiência, a manutenibilidade, a usabilidade e a segurança do Kolô. Para isso, selecionou o sistema pelos riscos da operação do ateliê, classificou seus 24 requisitos não funcionais na ISO/IEC 25010:2011, definiu objetivos, perguntas e métricas pelo método GQM e fixou as metas antes da primeira medição. O alcance das conclusões é o das condições descritas na seção 3.5, e cada número novo corresponde a um arquivo de evidência (Equipe Kolô, 2026f, 2026g, 2026h).

Na linha de base, onze das quinze métricas medidas atenderam à meta, e os resultados mais fortes apareceram onde o risco do domínio é maior. Na rajada de 30 clientes disputando uma obra de estoque unitário, exatamente um pedido foi criado. O teste de carga fez 9504 requisições sem falha, com o percentil 95 abaixo da metade do limite nos três grupos. A cobertura chegou a 92,46% das linhas e 87,39% dos ramos. Ficaram fora da meta os ramos dos módulos `payments` e `scheduling`, a complexidade por função e a auditoria de dependências (seção 4.4).

As três melhorias implementadas foram verificadas nas mesmas métricas que as motivaram. Os ramos de `payments` passaram de 88,5% para 91,9%, e os de `scheduling`, de 88,2% para 91,5%, ambos acima da meta. O envio dos formulários por POST eliminou o alerta de informação sensível na URL, e os novos cabeçalhos retiraram quatro alertas da varredura. A suíte cresceu de 892 para 918 testes, todos aprovados, os doze casos de teste formalizados passaram e as medidas de carga não tiveram regressão (seções 4.3 e 4.7).

A avaliação indica, portanto, que o Kolô tem mecanismos de qualidade alinhados aos riscos do domínio e que a maior parte deles foi confirmada por medição na revisão avaliada. Ela não permite afirmar que todos os requisitos estão atendidos: a complexidade por função e a auditoria de dependências continuam fora da meta. O único alerta *Medium* restante da varredura foi analisado como falso positivo (seção 4.7.2).

## 5.2 Dificuldades
A primeira dificuldade foi conciliar melhoria e estabilidade. As medições ocorreram às vésperas da banca do TCC, o que restringiu as mudanças aceitáveis. Por esse motivo, a atualização das dependências e a divisão das telas mais complexas ficaram como propostas, embora sejam necessárias para atingir metas do próprio plano (seção 4.6.2).

A segunda foi consolidar números produzidos em momentos diferentes. A monografia, a Sprint 2 e a linha de base trazem contagens de testes distintas. A solução foi usar apenas os relatórios dos executores, na revisão identificada, e manter os valores anteriores como registro histórico (seção 4.3.1).

A terceira foi interpretar resultados que mudam por causas externas ao trabalho ou pela própria correção. A auditoria de dependências tinha zero avisos em 18 de outubro e 17 em 6 de novembro, com as mesmas versões (seção 4.5.1). Na varredura, declarar o método POST nos formulários fez surgir um alerta novo, analisado como falso positivo (seção 4.7.2). A contagem de alertas, isoladamente, não indicaria se a segurança havia melhorado.

## 5.3 Limitações
As limitações estão detalhadas na seção 4.7.3. As medições foram locais, em um único *notebook*, com gerador de carga e servidor no mesmo processador e uma execução por rodada, de modo que pequenas diferenças de tempo são tratadas como ruído. Elas também antecedem a publicação do sistema: HTTPS, notas externas de segurança, disponibilidade, restauração de *backup* e integrações reais com o Mercado Pago e o R2 não foram avaliados, e os dublês verificam o contrato da integração, e não o serviço real.

A acessibilidade foi verificada apenas por regras automáticas, com teclado e foco pendentes. O Lighthouse não foi repetido, e a varredura de segurança rodou em modo passivo. O sistema foi avaliado pela equipe que o desenvolveu, viés que a revisão independente do *diff* reduz, mas não elimina. O retorno qualitativo da administradora registrado na monografia é relevante, mas não permite generalizar a usabilidade nem calcular redução de tempo de atendimento.

## 5.4 Recomendações e trabalhos futuros
Recomenda-se priorizar, logo após a banca, a atualização de `next`, `better-auth` e `zod` e a inclusão da auditoria de dependências na CI (propostas P1 e P5), pois esses são os avisos de maior severidade e a correção tem critério de aceite objetivo. Em seguida, vêm a divisão dos componentes mais complexos (P2), o roteiro manual de teclado e foco (P6) e a estabilização da suíte com relógio controlado (P4).

Com o sistema publicado, os trabalhos futuros incluem repetir as medições no ambiente real: notas externas de TLS e cabeçalhos, Lighthouse em três rodadas, compra no *sandbox* pelo endereço público, reinício automático e restauração de *backup* (P7 e P8). Os dados de demonstração reproduzíveis (P9) entraram na `main` depois da revisão avaliada, e falta confirmar seu critério de aceite em um clone limpo (Equipe Kolô, 2026c). A avaliação também pode avançar para varredura ativa de segurança, testes de usabilidade com participantes e repetições das medições de carga que permitam estimar a variância.

## 5.5 Reflexão sobre a qualidade de software
Na formação acadêmica, o caso permitiu relacionar engenharia de requisitos, banco de dados, testes, segurança e experiência de uso a problemas concretos de um cliente real. Conteúdos que costumam ser estudados separadamente aparecem aqui ligados: o bloqueio de linhas, a transação e o teste de integração respondem ao mesmo risco de vender duas vezes uma peça única. O exercício também evidenciou a diferença entre afirmar e demonstrar qualidade, pois um resultado só sustenta uma conclusão quando estão registrados o requisito, o critério, o ambiente e a revisão a que ele se refere.

No contexto profissional, essas práticas têm consequência direta. No comércio eletrônico, uma falha de estoque ou de pagamento se traduz em estorno e em perda de confiança do cliente. A auditoria de dependências mostrou que qualidade não é um estado alcançado uma única vez, e sim uma verificação contínua, que precisa estar automatizada no processo de entrega. A decisão de não corrigir tudo às vésperas da banca ilustra outro aspecto da prática: qualidade também envolve avaliar o risco de mudar e registrar, com justificativa e critério de aceite, o que fica para depois.

O aprendizado central é que qualidade exige critérios observáveis e comunicação precisa dos limites: um resultado local aprovado constitui evidência útil, mas sua validade deve permanecer ligada ao cenário em que foi obtido.

# REFERÊNCIAS

BASILI, Victor R.; CALDIERA, Gianluigi; ROMBACH, H. Dieter. The Goal Question Metric approach. In: MARCINIAK, John J. (ed.). **Encyclopedia of Software Engineering**. New York: John Wiley & Sons, 1994. p. 528–532. Disponível em: <https://www.cs.umd.edu/~basili/publications/technical/T89.pdf>. Acesso em: 8 nov. 2026.

BECK, Kent. **Test-driven development**: by example. Boston: Addison-Wesley, 2003. Disponível em: <https://ptgmedia.pearsoncmg.com/images/9780321146533/samplepages/0321146530.pdf>. Acesso em: 8 nov. 2026.

CLARK, Connor. **What's new in Lighthouse 6.0**. Chrome for Developers. [S. l.], 2020. Disponível em: <https://developer.chrome.com/blog/lighthouse-6-0>. Acesso em: 8 nov. 2026.

COHN, Mike. **Succeeding with Agile**: software development using Scrum. 1. ed. Upper Saddle River: Addison-Wesley, 2010. Disponível em: <https://www.informit.com/store/succeeding-with-agile-software-development-using-scrum-9780321579362>. Acesso em: 8 nov. 2026.

DEQUE SYSTEMS. **axe-core**: accessibility engine for automated Web UI testing. [S. l.], [202-]. Disponível em: <https://github.com/dequelabs/axe-core>. Acesso em: 8 nov. 2026.

EQUIPE KOLÔ. **Escopo e Stack do projeto Kolô**. Versão 2.2, atualização de 18 out. 2026. 2026a. Documento técnico local: tcc-2/docs/ESCOPO-E-STACK.md.

EQUIPE KOLÔ. **Sprint 2**. 2026b. Registro técnico local: tcc-2/docs/Sprint-2.md. Seções dos PBIs 45 a 48.

EQUIPE KOLÔ. **Sprint 3 Pós entrega da monografia**. 2026c. Registro técnico local: tcc-2/docs/SPRINT-3.md.

EQUIPE KOLÔ. **Código-fonte da plataforma Kolô**. 2026d. Revisão 51bb1b8681c9a3e3502952d6e57078c9c1591675. Disponível em: <https://github.com/caioalves19/tcc-2/tree/51bb1b8681c9a3e3502952d6e57078c9c1591675>. Acesso em: 8 nov. 2026.

EQUIPE KOLÔ. **Diagrama Entidade Relacionamento**. 2026e. Documento técnico local: tcc-2/docs/DER.md.

EQUIPE KOLÔ. **Antes e depois das melhorias**. 6–7 nov. 2026f. Registro técnico do repositório tcc-2, revisão 85e385a, arquivo `docs/aps/evidencias/COMPARATIVO.md`.

EQUIPE KOLÔ. **APS**: avaliação e melhoria da qualidade (Kolô). 6 nov. 2026g. Plano técnico do repositório tcc-2, revisão 85e385a, arquivo `docs/aps/PLANO.md`.

EQUIPE KOLÔ. **Baseline de qualidade**. 6 nov. 2026h. Registro técnico do repositório tcc-2, revisão 85e385a, arquivo `docs/aps/evidencias/BASELINE.md`.

ESLINT. **complexity**. ESLint Documentation. [S. l.], [202-]. Disponível em: <https://eslint.org/docs/latest/rules/complexity>. Acesso em: 8 nov. 2026.

GOOGLE. **Lighthouse performance scoring**. Chrome for Developers. [S. l.], 19 set. 2019a. Disponível em: <https://developer.chrome.com/docs/lighthouse/performance/performance-scoring>. Acesso em: 8 nov. 2026.

GOOGLE. **Total Blocking Time**. Chrome for Developers. [S. l.], 9 out. 2019b. Disponível em: <https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time>. Acesso em: 8 nov. 2026.

GRAFANA LABS. **Built-in metrics**. Grafana k6 Documentation. [S. l.], [202-]. Disponível em: <https://grafana.com/docs/k6/latest/using-k6/metrics/reference/>. Acesso em: 8 nov. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION (ISO); INTERNATIONAL ELECTROTECHNICAL COMMISSION (IEC). **ISO/IEC 25010:2011**: Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models. 1. ed. Genebra: ISO, 2011. Disponível em: <https://www.iso.org/standard/35733.html>. Acesso em: 8 nov. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION (ISO); INTERNATIONAL ELECTROTECHNICAL COMMISSION (IEC). **ISO/IEC 25010:2023**: Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model. 2. ed. Genebra: ISO, 2023a. Disponível em: <https://www.iso.org/standard/78176.html>. Acesso em: 8 nov. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION (ISO); INTERNATIONAL ELECTROTECHNICAL COMMISSION (IEC). **ISO/IEC 25019:2023**: Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Quality-in-use model. 1. ed. Genebra: ISO, 2023b. Disponível em: <https://www.iso.org/standard/78177.html>. Acesso em: 8 nov. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION (ISO); INTERNATIONAL ELECTROTECHNICAL COMMISSION (IEC); INSTITUTE OF ELECTRICAL AND ELECTRONICS ENGINEERS (IEEE). **ISO/IEC/IEEE 29119-3:2021**: Software and systems engineering — Software testing — Part 3: Test documentation. 2. ed. Genebra: ISO, 2021a. Disponível em: <https://www.iso.org/standard/79429.html>. Acesso em: 8 nov. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION (ISO); INTERNATIONAL ELECTROTECHNICAL COMMISSION (IEC); INSTITUTE OF ELECTRICAL AND ELECTRONICS ENGINEERS (IEEE). **ISO/IEC/IEEE 29119-4:2021**: Software and systems engineering — Software testing — Part 4: Test techniques. 2. ed. Genebra: ISO, 2021b. Disponível em: <https://www.iso.org/standard/79430.html>. Acesso em: 8 nov. 2026.

INTERNATIONAL SOFTWARE TESTING QUALIFICATIONS BOARD (ISTQB). **Certified Tester**: Foundation Level syllabus. Versão 4.0.1. [S. l.]: ISTQB, 2024. Disponível em: <https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf>. Acesso em: 8 nov. 2026.

MCCABE, Thomas J. A complexity measure. **IEEE Transactions on Software Engineering**, [S. l.], v. SE-2, n. 4, p. 308–320, dez. 1976. DOI: 10.1109/TSE.1976.233837. Disponível em: <https://doi.org/10.1109/TSE.1976.233837>. Acesso em: 8 nov. 2026.

MDN WEB DOCS. **HTTP headers**. [S. l.], 21 out. 2026a. Disponível em: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers>. Acesso em: 8 nov. 2026.

MDN WEB DOCS. **The Form element**. [S. l.], 14 out. 2026b. Disponível em: <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form>. Acesso em: 8 nov. 2026.

MICROSOFT. **Installation**. Playwright. [S. l.], [202-]a. Disponível em: <https://playwright.dev/docs/intro>. Acesso em: 8 nov. 2026.

MICROSOFT. **Retries**. Playwright. [S. l.], [202-]b. Disponível em: <https://playwright.dev/docs/test-retries>. Acesso em: 8 nov. 2026.

NPM. **npm-audit**. npm Docs. [S. l.], 18 mar. 2026. Disponível em: <https://docs.npmjs.com/cli/v11/commands/npm-audit/>. Acesso em: 8 nov. 2026.

OLIVEIRA, Caio Scorsoni Martins et al. **Sistema web para ateliê e estúdio de tatuagem**. 2026. Trabalho de Conclusão de Curso (Bacharelado em Ciência da Computação) – Universidade Paulista, Campinas, 2026. Documento local: `docs/tcc-2.docx`.

OPEN WORLDWIDE APPLICATION SECURITY PROJECT (OWASP). **Cross-site request forgery prevention**. OWASP Cheat Sheet Series. [S. l.], [202-]. Disponível em: <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>. Acesso em: 8 nov. 2026.

OPEN WORLDWIDE APPLICATION SECURITY PROJECT (OWASP). **OWASP Top 10:2025**. [S. l.], 2025. Disponível em: <https://top10.owasp.org/2025/>. Acesso em: 8 nov. 2026.

UNIVERSIDADE PAULISTA. **Avaliação E Melhoria Da Qualidade Em Sistemas De Software**. APS Atividades Práticas Supervisionadas, 7º e 8º semestre, 2026/2. Campinas, 2026. Enunciado local convertido em 2026_2\_CC_SI_8.md.

VITEST. **Coverage**. Vitest Documentation. [S. l.], [202-]a. Disponível em: <https://vitest.dev/guide/coverage.html>. Acesso em: 8 nov. 2026.

VITEST. **Mocking Dates**. Vitest Documentation. [S. l.], [202-]b. Disponível em: <https://vitest.dev/guide/mocking/dates>. Acesso em: 8 nov. 2026.

W3C. **Content Security Policy Level 3**. W3C Working Draft. [S. l.], 27 out. 2026. Disponível em: <https://www.w3.org/TR/2026/WD-CSP3-20261027/>. Acesso em: 8 nov. 2026.

ZAP. **Alerts**. ZAP Documentation. [S. l.], [202-]a. Disponível em: <https://www.zaproxy.org/docs/desktop/start/features/alerts/>. Acesso em: 8 nov. 2026.

ZAP. **ZAP baseline scan**. ZAP Documentation. [S. l.], [202-]b. Disponível em: <https://www.zaproxy.org/docs/docker/baseline-scan/>. Acesso em: 8 nov. 2026.

# APÊNDICE A IDENTIFICAÇÃO DO CÓDIGO E DAS EVIDÊNCIAS

Repositório público: <https://github.com/caioalves19/tcc-2>. A avaliação usou duas revisões:

- **Linha de base:** `b3587b3f2453b375f2ec6958b6faa6d861a31793`, de 19 de outubro, a última da `main` que alterou o código do sistema antes da APS, acrescida só da configuração de medição.
- **Revisão avaliada:** `51bb1b8681c9a3e3502952d6e57078c9c1591675`, com as melhorias M1 a M3, incorporada à `main` pelo *pull request* 103.

Consulta da codificação completa na revisão avaliada: <https://github.com/caioalves19/tcc-2/tree/51bb1b8681c9a3e3502952d6e57078c9c1591675>.

Os *commits* posteriores na `main`, como o das listas paginadas, não foram medidos e não fazem parte da avaliação. O texto deste documento e as evidências brutas ficam em `docs/aps/`, no mesmo repositório.

::: {custom-style="Legenda"}
Quadro 17 Localização dos materiais para conferência
:::

| **Material**                       | **Caminho relativo à raiz do repositório**    |
|------------------------------------|-----------------------------------------------|
| Implementação                      | `src/`                                        |
| Esquema e migrações                | `prisma/schema.prisma` e `prisma/migrations/` |
| Testes unitários                   | `tests/unit/`                                 |
| Testes de integração               | `tests/integration/`                          |
| Fluxos E2E e varredura             | `tests/e2e/`                                  |
| Carga e rajada                     | `tests/carga/`                                |
| Configuração da cobertura          | `vitest.coverage.config.ts`                   |
| Pipeline de integração             | `.github/workflows/ci.yml`                    |
| Plano, linha de base e comparativo | `docs/aps/PLANO.md` e `docs/aps/evidencias/`  |
| Regras e arquitetura               | `docs/ESCOPO-E-STACK.md` e `docs/DER.md`      |
| Resultados históricos              | `docs/Sprint-2.md` e `docs/tcc-2.docx`        |
| Pendências posteriores             | `docs/SPRINT-3.md`                            |

::: {custom-style="Legenda"}
Fonte Inventário dos caminhos na revisão `51bb1b8`.
:::

Arquivos com credenciais, dependências instaladas e bancos de desenvolvimento não integram esse material. O Apêndice C traz na íntegra o código produzido para esta APS.

# APÊNDICE B CONTROLE DE ASSINATURA DO WEBHOOK

Listagem integral do arquivo `src/modules/payments/assinatura.ts` na revisão avaliada. O trecho mostra o uso do validador do SDK e o tratamento de recusa. A idempotência, que aparece no Código 2, e as alterações transacionais ficam em `src/modules/payments/webhook.ts`.

```ts
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";

export type DadosAssinatura = {
  assinatura: string | null;
  idRequisicao: string | null;
  idDado: string | null;
  segredo: string;
};

// RNF11: só processa a notificação que o Mercado Pago assinou (HMAC-SHA256 de id, request-id e
// ts com o segredo do webhook). O validador oficial do SDK compara em tempo constante.
export function assinaturaValida(dados: DadosAssinatura): boolean {
  try {
    WebhookSignatureValidator.validate({
      xSignature: dados.assinatura,
      xRequestId: dados.idRequisicao,
      dataId: dados.idDado,
      secret: dados.segredo,
    });
    return true;
  } catch (erro) {
    // O motivo e o x-request-id localizam o aviso no painel do Mercado Pago; nunca o segredo.
    console.warn(
      "Assinatura do webhook recusada",
      erro instanceof InvalidWebhookSignatureError ? erro.reason : "erro desconhecido",
      dados.idRequisicao,
    );
    return false;
  }
}
```

::: {custom-style="Legenda"}
Fonte Equipe Kolô (2026d), revisão `51bb1b8`, sem alteração.
:::

# APÊNDICE C CÓDIGO PRODUZIDO PARA A APS

Este apêndice traz todo o código escrito para a avaliação, entre a linha de base (`b3587b3`) e a revisão avaliada (`51bb1b8`). Arquivos novos aparecem na íntegra. Arquivos já existentes aparecem só com a alteração, no formato *diff* do git: as linhas com `+` foram acrescentadas e as com `-`, removidas. A mesma listagem pode ser obtida com `git diff b3587b3 51bb1b8`. Ficaram de fora as instruções de agentes, os documentos e o `package-lock.json`.

**C.1 Configuração da cobertura**

**`vitest.coverage.config.ts`** (arquivo novo, íntegra)

```ts
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// APS (qualidade): cobertura de unit + integração numa só execução. Precisa do Postgres local
// (`docker compose up -d`), como `npm run test:integration`. Fora da CI.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.ts",
    ],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
      reporter: ["text", "json-summary", "json", "html"],
      reportsDirectory: "coverage",
    },
  },
});
```

**`package.json`** (alteração, formato *diff*)

```diff
diff --git a/package.json b/package.json
index ac5ec9e..eb786b2 100644
--- a/package.json
+++ b/package.json
@@ -24,5 +24,6 @@
     "db:seed": "prisma db seed",
     "db:generate": "prisma generate",
-    "postinstall": "prisma generate"
+    "postinstall": "prisma generate",
+    "test:coverage": "vitest run --config vitest.coverage.config.ts --coverage"
   },
   "devDependencies": {
@@ -37,4 +38,5 @@
     "@types/pg": "^8.23.1",
     "@types/react": "19.2.18",
+    "@vitest/coverage-v8": "^4.1.12",
     "eslint": "^9.33.0",
     "globals": "^16.3.0",
```

**C.2 Carga e rajada com k6**

**`tests/carga/dados.ts`** (arquivo novo, íntegra)

```ts
// APS (qualidade): dados fixos da carga, lidos pelo servidor (Node) e espelhados nos scripts k6.
export const PORTA_CARGA = 3100;

// Estoque alto: o checkout sob carga mede tempo de resposta sem esgotar.
export const OBRA_CARGA = {
  id: "00000000-0000-4000-9000-0000000000c1",
  titulo: "Carga em Ocre",
  slug: "carga-em-ocre",
  precoCentavos: 15_000,
};

// Estoque 1: a rajada concorrente só pode reservar uma vez (RN de estoque único).
export const OBRA_RAJADA = {
  id: "00000000-0000-4000-9000-0000000000c2",
  titulo: "Rajada em Vermelho",
  slug: "rajada-em-vermelho",
  precoCentavos: 25_000,
};
```

**`tests/carga/servidor.ts`** (arquivo novo, íntegra)

```ts
// APS (qualidade): sobe o build de produção num banco descartável para o k6 e o OWASP ZAP.
// Reaproveita o preparo do E2E (kolo_e2e + dublês do Mercado Pago e do R2) e acrescenta as duas
// obras da carga. Nunca aponta para o banco de desenvolvimento. Fora da CI.
//
//   npm run build && npx tsx tests/carga/servidor.ts
import { execSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Client } from "pg";

import { ARTISTA, BANCO_E2E, R2_BUCKET_E2E, R2_CONTA_E2E } from "../e2e/dados";
import { OBRA_CARGA, OBRA_RAJADA, PORTA_CARGA } from "./dados";

const URL_BANCO = `postgresql://kolo_user:kolo_password@localhost:5432/${BANCO_E2E}`;
const URL_APP = `http://localhost:${PORTA_CARGA}`;
const segredo = () => randomBytes(32).toString("hex");

const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  NODE_OPTIONS: "--import ./tests/e2e/mercado-pago-falso.ts --import ./tests/e2e/r2-falso.ts",
  // O preparo do E2E exige este sufixo antes de esvaziar a pasta.
  E2E_R2_DIR: join(tmpdir(), "kolo-carga", "kolo-e2e-r2"),
  E2E_SENHA_EQUIPE: segredo(),
  DATABASE_URL: URL_BANCO,
  BETTER_AUTH_SECRET: segredo(),
  BETTER_AUTH_URL: URL_APP,
  APP_URL: "https://kolo-carga.test",
  MP_WEBHOOK_SECRET: segredo(),
  RESEND_API_KEY: `re_${segredo()}`,
  MP_ACCESS_TOKEN: `TEST-${segredo()}`,
  R2_ACCOUNT_ID: R2_CONTA_E2E,
  R2_BUCKET: R2_BUCKET_E2E,
  R2_ACCESS_KEY_ID: segredo(),
  R2_SECRET_ACCESS_KEY: segredo(),
  R2_PUBLIC_URL: "https://imagens-carga.invalid",
};

const shell = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
execSync("npx tsx tests/e2e/preparar-banco.ts", { env, stdio: "inherit", shell });

const db = new Client({ connectionString: URL_BANCO });
await db.connect();
for (const [obra, estoque] of [
  [OBRA_CARGA, 100_000],
  [OBRA_RAJADA, 1],
] as const) {
  await db.query(
    `INSERT INTO artwork (id, artist_id, titulo, slug, preco_centavos, quantidade_estoque, situacao)
     VALUES ($1, $2, $3, $4, $5, $6, 'DISPONIVEL')`,
    [obra.id, ARTISTA.id, obra.titulo, obra.slug, obra.precoCentavos, estoque],
  );
}
await db.end();

// O binário do Next direto pelo Node (sem npx nem shell): um processo só, que morre junto.
const servidor = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(PORTA_CARGA)],
  { env, stdio: "inherit" },
);
for (const sinal of ["SIGINT", "SIGTERM"] as const) process.on(sinal, () => servidor.kill(sinal));
process.on("exit", () => servidor.kill());
servidor.on("exit", (codigo) => process.exit(codigo ?? 0));
```

**`tests/carga/comum.js`** (arquivo novo, íntegra)

```js
// APS (qualidade): utilitários dos scripts k6. Roda no k6 (não no Node); fora da CI.
/* global __ENV, open -- globais do runtime do k6 */
import http from "k6/http";

export const BASE = __ENV.BASE_URL || "http://host.docker.internal:3100";

// Espelho de tests/carga/dados.ts.
export const OBRA_CARGA = { id: "00000000-0000-4000-9000-0000000000c1", slug: "carga-em-ocre" };
export const OBRA_RAJADA = {
  id: "00000000-0000-4000-9000-0000000000c2",
  slug: "rajada-em-vermelho",
};

// As server actions do Next são chamadas por POST com o id do build no cabeçalho Next-Action.
// O id muda a cada build; vem do manifest gerado pelo `npm run build`.
const manifest = JSON.parse(open("../../.next/server/server-reference-manifest.json"));

function idDaAcao(arquivo, nome) {
  for (const [id, acao] of Object.entries(manifest.node)) {
    if (acao.filename === arquivo && acao.exportedName === nome) return id;
  }
  throw new Error(`Server action não encontrada: ${arquivo}#${nome}`);
}

export const ACOES = {
  cadastrar: { id: idDaAcao("src/app/cadastro/actions.ts", "cadastrar"), pagina: "/cadastro" },
  adicionar: {
    id: idDaAcao("src/app/carrinho/actions.ts", "adicionarAoCarrinhoAcao"),
    pagina: "/carrinho",
  },
  endereco: { id: idDaAcao("src/app/conta/actions.ts", "salvarEnderecoAcao"), pagina: "/conta" },
  finalizar: {
    id: idDaAcao("src/app/checkout/actions.ts", "finalizarCompraAcao"),
    pagina: "/checkout",
  },
};

export function chamarAcao(acao, argumentos, params = {}) {
  return http.post(`${BASE}${acao.pagina}`, JSON.stringify(argumentos), {
    redirects: 0,
    ...params,
    headers: {
      "Next-Action": acao.id,
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      Origin: BASE,
      ...(params.headers || {}),
    },
  });
}

const ENDERECO = {
  destinatario: "Cliente Carga",
  cep: "01310100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

// Em produção o Better Auth grava o cookie como __Secure-…; Secure, o jar do k6 não o devolve
// por http. O script guarda os cookies e os manda à mão no cabeçalho Cookie.
function cabecalhoCookie(...respostas) {
  const valores = {};
  for (const resposta of respostas) {
    for (const [nome, lista] of Object.entries(resposta.cookies)) {
      if (lista.length > 0) valores[nome] = lista[0].value;
    }
  }
  return Object.entries(valores)
    .map(([nome, valor]) => `${nome}=${valor}`)
    .join("; ");
}

// Cadastro + obra no carrinho, como o cliente faria pela tela. Devolve o Cookie da sessão.
export function prepararCliente(rotulo, obraId) {
  const email = `carga-${rotulo}-${Date.now()}-${Math.floor(Math.random() * 1e9)}@kolo.test`;
  const cadastro = chamarAcao(
    ACOES.cadastrar,
    [{ nome: "Cliente Carga", email, telefone: "11987654321", senha: "SenhaCarga#2026" }],
    { tags: { etapa: "cadastro" } },
  );
  const cookie = cabecalhoCookie(cadastro);
  // RF05: o checkout pede um endereço na conta, mesmo para retirar no ateliê.
  chamarAcao(ACOES.endereco, [ENDERECO], {
    tags: { etapa: "endereco" },
    headers: { Cookie: cookie },
  });
  const carrinho = chamarAcao(ACOES.adicionar, [obraId, 1], {
    tags: { etapa: "carrinho" },
    headers: { Cookie: cookie },
  });
  return { cadastro, carrinho, cookie };
}

// O redirect da action vem no cabeçalho X-Action-Redirect; a recusa vem no corpo.
export function finalizar(cookie, tags) {
  return chamarAcao(ACOES.finalizar, [{ modalidade: "RETIRADA" }], {
    tags,
    headers: { Cookie: cookie },
  });
}

export function pedidoCriado(resposta) {
  const destino = resposta.headers["X-Action-Redirect"] || resposta.headers["x-action-redirect"];
  return typeof destino === "string" && /\/checkout\/\d{8}-[A-Z0-9]{6}/.test(destino);
}
```

**`tests/carga/carga.js`** (arquivo novo, íntegra)

```js
// APS (qualidade): carga de ~20 usuários simultâneos em catálogo, ficha da obra e checkout.
// Metas (docs/aps/PLANO.md): leitura p95 < 500 ms; checkout p95 < 1 s; erro < 1%.
//
//   docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run carga.js
/* global __VU -- globais do runtime do k6 */
import { check, sleep } from "k6";
import http from "k6/http";

import { BASE, OBRA_CARGA, finalizar, pedidoCriado, prepararCliente } from "./comum.js";

export const options = {
  scenarios: {
    leitura: {
      executor: "ramping-vus",
      exec: "leitura",
      stages: [
        { duration: "30s", target: 20 },
        { duration: "3m", target: 20 },
        { duration: "15s", target: 0 },
      ],
    },
    checkout: {
      executor: "ramping-vus",
      exec: "checkout",
      stages: [
        { duration: "30s", target: 5 },
        { duration: "3m", target: 5 },
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: {
    "http_req_duration{pagina:catalogo}": ["p(95)<500"],
    "http_req_duration{pagina:obra}": ["p(95)<500"],
    "http_req_duration{etapa:finalizar}": ["p(95)<1000"],
    "http_req_failed{scenario:leitura}": ["rate<0.01"],
    "checks{etapa:finalizar}": ["rate>0.99"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function leitura() {
  const catalogo = http.get(`${BASE}/obras`, { tags: { pagina: "catalogo" } });
  check(catalogo, { "catálogo 200": (r) => r.status === 200 });
  const obra = http.get(`${BASE}/obras/${OBRA_CARGA.slug}`, { tags: { pagina: "obra" } });
  check(obra, { "ficha 200": (r) => r.status === 200 });
  sleep(1);
}

// Cada iteração é um cliente novo: cadastro → carrinho → finalizar (retirada no ateliê).
export function checkout() {
  const { cadastro, carrinho, cookie } = prepararCliente(`vu${__VU}`, OBRA_CARGA.id);
  check(cadastro, { "cadastro aceito": (r) => r.status === 200 });
  check(carrinho, { "carrinho 200": (r) => r.status === 200 });
  const resposta = finalizar(cookie, { etapa: "finalizar" });
  check(resposta, { "pedido criado": pedidoCriado }, { etapa: "finalizar" });
  sleep(1);
}
```

**`tests/carga/rajada.js`** (arquivo novo, íntegra)

```js
// APS (qualidade): rajada concorrente — N clientes finalizam a compra da MESMA obra de estoque 1
// ao mesmo tempo. Meta: exatamente 1 pedido criado e N−1 recusados (RN de estoque único).
// Rode com o banco recém-preparado (tests/carga/servidor.ts), uma vez por subida.
//
// DISPARO é o instante (ms desde a época) em que todos finalizam; dê folga para os cadastros.
//   docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run -e N=30 \
//     -e DISPARO=$(( $(date +%s) * 1000 + 60000 )) rajada.js
/* global __ENV, __VU -- globais do runtime do k6 */
import { check } from "k6";
import { Counter } from "k6/metrics";

import { OBRA_RAJADA, finalizar, pedidoCriado, prepararCliente } from "./comum.js";

const N = Number(__ENV.N || 30);
const DISPARO = Number(__ENV.DISPARO);
if (!DISPARO) throw new Error("Defina -e DISPARO=<ms desde a época> (ver o cabeçalho).");
const criados = new Counter("pedidos_criados");
const recusados = new Counter("pedidos_recusados");

export const options = {
  scenarios: {
    rajada: { executor: "per-vu-iterations", vus: N, iterations: 1, maxDuration: "2m" },
  },
  thresholds: {
    pedidos_criados: ["count==1"],
    pedidos_recusados: [`count==${N - 1}`],
  },
  summaryTrendStats: ["avg", "min", "med", "p(95)", "max"],
};

export default function () {
  const { cookie } = prepararCliente(`rajada${__VU}`, OBRA_RAJADA.id);
  // Barreira: todos os VUs disparam o checkout no mesmo instante (relógio de parede).
  while (Date.now() < DISPARO) {
    /* espera ativa até o instante combinado */
  }
  const resposta = finalizar(cookie, { etapa: "rajada" });
  if (pedidoCriado(resposta)) criados.add(1);
  else recusados.add(1);
  check(resposta, { "resposta 2xx/3xx": (r) => r.status >= 200 && r.status < 400 });
}
```

**C.3 Testes da melhoria M1**

**Testes de integração acrescentados** (alteração, formato *diff*)

```diff
diff --git a/tests/integration/agenda.test.ts b/tests/integration/agenda.test.ts
index e3bc508..41770e3 100644
--- a/tests/integration/agenda.test.ts
+++ b/tests/integration/agenda.test.ts
@@ -419,2 +419,46 @@ it("RF22/RN10 o admin vê todos os artistas e filtra; cliente e visitante não l
   expect(await lerAgenda(new Headers(), {})).toMatchObject({ ok: false, erro: "nao_autenticado" });
 });
+
+// APS (qualidade): ramos de RN10 e RF22 que a suíte ainda não exercitava.
+it("RN10 conta de artista inativada perde a agenda na hora, mesmo com sessão aberta", async () => {
+  const { lerAgenda } = await import("../../src/modules/scheduling");
+  await db.query("UPDATE \"user\" SET situacao = 'INATIVO' WHERE email = 'bia@pbi17.test'");
+  try {
+    expect(await lerAgenda(bia, {})).toMatchObject({ ok: false, erro: "proibido" });
+  } finally {
+    await db.query("UPDATE \"user\" SET situacao = 'ATIVO' WHERE email = 'bia@pbi17.test'");
+  }
+});
+
+it("RF22 semana que não vem como texto (?semana repetido) cai na semana atual", async () => {
+  const { lerAgenda } = await import("../../src/modules/scheduling");
+  const segunda = async (filtro: Record<string, unknown>) => {
+    const r = await lerAgenda(admin, filtro);
+    if (!r.ok) throw new Error(r.mensagem);
+    return r.dados.dias[0]?.data;
+  };
+  // A semana atual é lida antes e depois: o teste não falha se rodar na virada da semana.
+  const antes = await segunda({});
+  const repetida = await segunda({ semana: ["2026-10-14", "2026-10-21"] });
+  const depois = await segunda({});
+
+  expect([antes, depois]).toContain(repetida);
+  expect(repetida).not.toBe("2026-10-12");
+});
+
+it("RF22 o admin edita sem escolher artista e o horário continua com a artista original", async () => {
+  const { cadastrarHorario, editarHorario } = await import("../../src/modules/scheduling");
+  const criado = await cadastrarHorario(horario(), ana);
+  if (!criado.ok) throw new Error(criado.mensagem);
+  const { id } = criado.dados;
+
+  expect(await editarHorario({ id, ...horario({ nomeContato: "Lucas S." }) }, admin)).toMatchObject(
+    { ok: true },
+  );
+
+  const { rows } = await db.query("SELECT artist_id, nome_contato FROM appointment WHERE id = $1", [
+    id,
+  ]);
+  expect(rows).toEqual([{ artist_id: idAna, nome_contato: "Lucas S." }]);
+  expect(await editarHorario(null, admin)).toMatchObject({ ok: false, erro: "nao_encontrado" });
+});
diff --git a/tests/integration/cancelamento.test.ts b/tests/integration/cancelamento.test.ts
index b7f54f5..c37ee23 100644
--- a/tests/integration/cancelamento.test.ts
+++ b/tests/integration/cancelamento.test.ts
@@ -196,2 +196,14 @@ it("PBI-43 cartão que entra em análise durante o cancelamento do Pix: o pedido
   });
 });
+
+// APS (qualidade): pedido inexistente, ramo que a suíte ainda não exercitava.
+it("PBI-43 pedido que não existe é recusado sem chamar o Mercado Pago", async () => {
+  const { cancelarPedido } = await import("../../src/modules/payments");
+  const gateway = gatewayDeCancelamento();
+
+  expect(
+    await cancelarPedido({ numero: "20261012-NAOEX1" }, cenario.contas.admin, { gateway }),
+  ).toMatchObject({ ok: false, erro: "nao_encontrado" });
+
+  expect(gateway.cancelados).toEqual([]);
+});
diff --git a/tests/integration/estorno.test.ts b/tests/integration/estorno.test.ts
index 9c2fb33..c603dcf 100644
--- a/tests/integration/estorno.test.ts
+++ b/tests/integration/estorno.test.ts
@@ -377,2 +377,20 @@ it("PBI-42 pagamento visto já estornado não conclui o pedido pago sem unidade
   ]);
 });
+
+// APS (qualidade): pagamento inexistente, ramo que a suíte ainda não exercitava.
+it("PBI-43 pagamento que não é do pedido é recusado sem chamar o Mercado Pago", async () => {
+  const { estornarPagamento } = await import("../../src/modules/payments");
+  const { obra } = await pedidoPago("e9-inexistente", "20261012-E9INE1");
+  const gateway = gatewayDeEstorno();
+
+  expect(
+    await estornarPagamento(
+      { numero: "20261012-E9INE1", idExterno: "mp-nao-existe" },
+      cenario.contas.admin,
+      { gateway },
+    ),
+  ).toMatchObject({ ok: false, erro: "nao_encontrado" });
+
+  expect(gateway.estornos).toEqual([]);
+  expect(await estado("20261012-E9INE1", obra)).toMatchObject({ situacao: "PAGO", estoque: 0 });
+});
diff --git a/tests/integration/webhook-pendente.test.ts b/tests/integration/webhook-pendente.test.ts
index 8137b93..6dc3fc9 100644
--- a/tests/integration/webhook-pendente.test.ts
+++ b/tests/integration/webhook-pendente.test.ts
@@ -3,4 +3,5 @@ import {
   cenarioWebhook,
   AGORA,
+  RESERVA_ATE,
   SEGREDO,
   PIX_PENDENTE,
@@ -172,2 +173,98 @@ it("RN06 Pix pago depois dos 10 minutos usa a reserva prorrogada e confirma o pe
   expect(await vencimentoDaReserva(cliente.sessaoId)).toEqual([]);
 });
+
+// APS (qualidade): ramos do RN06/PBI-43 que a suíte ainda não exercitava.
+it("RN06 cartão em análise fica pendente sem prorrogar a reserva: só Pix e boleto seguram a obra", async () => {
+  const { processarNotificacao } = await import("../../src/modules/payments");
+  const { obra, cliente } = await pedidoPendente(
+    "t7-analise",
+    "20261011-ANALI1",
+    "analise@pbi28.test",
+  );
+  const gateway = gatewayDeTeste({
+    "700041": pagamentoMp("700041", "20261011-ANALI1", {
+      status: "in_process",
+      status_detail: "pending_contingency",
+      date_approved: null,
+    }),
+  });
+
+  expect(
+    await processarNotificacao(notificacao("700041"), { gateway, segredo: SEGREDO, agora: AGORA }),
+  ).toEqual({ status: 200 });
+
+  const final = await estado("20261011-ANALI1", obra);
+  expect(final).toMatchObject({ situacao: "PENDENTE", estoque: 2, reservas: 1 });
+  expect(final.pagamentos).toMatchObject([
+    { id_externo: "700041", metodo: "CARTAO", situacao: "PENDENTE" },
+  ]);
+  expect(await vencimentoDaReserva(cliente.sessaoId)).toEqual([new Date(RESERVA_ATE)]);
+});
+
+it("PBI-43 Pix que expira com outro Pix do pedido em aberto não cancela o pedido", async () => {
+  const { processarNotificacao } = await import("../../src/modules/payments");
+  const { obra } = await pedidoPendente("t7-dois-pix", "20261011-DOISP1", "doispix@pbi28.test");
+  const gateway = gatewayDeTeste({
+    "700042": pagamentoMp("700042", "20261011-DOISP1", PIX_PENDENTE),
+    "700043": pagamentoMp("700043", "20261011-DOISP1", PIX_PENDENTE),
+  });
+  const opcoes = { gateway, segredo: SEGREDO, agora: AGORA };
+  await processarNotificacao(notificacao("700042"), opcoes);
+  await processarNotificacao(notificacao("700043"), opcoes);
+  gateway.trocar(
+    "700042",
+    pagamentoMp("700042", "20261011-DOISP1", {
+      ...PIX_PENDENTE,
+      status: "cancelled",
+      status_detail: "expired",
+    }),
+  );
+
+  expect(
+    await processarNotificacao(notificacao("700042"), {
+      ...opcoes,
+      agora: new Date("2026-10-12T15:01:00.000Z"),
+    }),
+  ).toEqual({ status: 200 });
+
+  const final = await estado("20261011-DOISP1", obra);
+  expect(final).toMatchObject({ situacao: "PENDENTE", estoque: 2 });
+  expect(final.pagamentos).toMatchObject([
+    { id_externo: "700042", situacao: "RECUSADO" },
+    { id_externo: "700043", situacao: "PENDENTE" },
+  ]);
+});
+
+it("PBI-43 Pix de outra tentativa que expira depois do pedido pago não mexe no pedido", async () => {
+  const { processarNotificacao } = await import("../../src/modules/payments");
+  const { obra } = await pedidoPendente("t7-pago-pix", "20261011-PAGOP1", "pagopix@pbi28.test");
+  const gateway = gatewayDeTeste({
+    "700044": pagamentoMp("700044", "20261011-PAGOP1"),
+    "700045": pagamentoMp("700045", "20261011-PAGOP1", PIX_PENDENTE),
+  });
+  const opcoes = { gateway, segredo: SEGREDO, agora: AGORA };
+  await processarNotificacao(notificacao("700044"), opcoes);
+  await processarNotificacao(notificacao("700045"), opcoes);
+  gateway.trocar(
+    "700045",
+    pagamentoMp("700045", "20261011-PAGOP1", {
+      ...PIX_PENDENTE,
+      status: "cancelled",
+      status_detail: "expired",
+    }),
+  );
+
+  expect(
+    await processarNotificacao(notificacao("700045"), {
+      ...opcoes,
+      agora: new Date("2026-10-12T15:01:00.000Z"),
+    }),
+  ).toEqual({ status: 200 });
+
+  const final = await estado("20261011-PAGOP1", obra);
+  expect(final).toMatchObject({ situacao: "PAGO", estoque: 0 });
+  expect(final.pagamentos).toMatchObject([
+    { id_externo: "700044", situacao: "APROVADO" },
+    { id_externo: "700045", situacao: "RECUSADO" },
+  ]);
+});
diff --git a/tests/integration/wizard-agendamento.test.ts b/tests/integration/wizard-agendamento.test.ts
index dbbd241..88fc036 100644
--- a/tests/integration/wizard-agendamento.test.ts
+++ b/tests/integration/wizard-agendamento.test.ts
@@ -188,2 +188,20 @@ it("o seed disponibiliza tamanhos iniciais sem duplicar ao repetir", async () =>
   expect(tamanhos.rows).toEqual([{ nome: "Pequena" }, { nome: "Média" }, { nome: "Grande" }]);
 }, 30_000);
+
+// APS (qualidade): o bloqueio também vale para a revisão, não só para a consulta de opções.
+it("RNF08 com o limite estourado, a revisão da preferência é recusada antes de validar", async () => {
+  const { createHash } = await import("node:crypto");
+  const { revisarPreferenciaWizard } = await import("../../src/modules/scheduling/index");
+  const chave = `wizard:${createHash("sha256").update("aps-limite-revisao").digest("hex")}`;
+  await db.query(
+    "INSERT INTO rate_limit (chave, tentativas, janela_inicio) VALUES ($1, 60, NOW())",
+    [chave],
+  );
+
+  expect(
+    await revisarPreferenciaWizard(
+      { nome: "inválido" },
+      new Headers({ "x-real-ip": "aps-limite-revisao" }),
+    ),
+  ).toEqual({ ok: false, mensagem: "Muitas tentativas. Tente novamente em 10 minutos." });
+});
```

**C.4 Melhoria M2, formulários por POST**

**`tests/unit/formularios-post.test.tsx`** (arquivo novo, íntegra)

```tsx
// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { FormularioContato } from "@/app/contato/formulario";
import { FormularioAdmin } from "@/components/admin/formulario";
import { FormularioHorario } from "@/components/agenda/formulario-horario";
import { WizardAgendamento } from "@/components/scheduling/wizard-agendamento";
import { FormularioCadastro } from "@/components/auth/formulario-cadastro";
import { FormularioEndereco } from "@/components/auth/formulario-endereco";
import { FormularioExclusaoConta } from "@/components/auth/formulario-exclusao-conta";
import { FormularioLogin } from "@/components/auth/formulario-login";
import { FormularioPedidoRecuperacao } from "@/components/auth/formulario-pedido-recuperacao";
import { FormularioPerfil } from "@/components/auth/formulario-perfil";
import { FormularioRedefinicao } from "@/components/auth/formulario-redefinicao";
import { FormularioTrocaSenha } from "@/components/auth/formulario-troca-senha";

vi.mock("@/modules/contact/actions", () => ({ enviarContato: vi.fn() }));

afterEach(cleanup);

const acao = vi.fn();
const endereco = {
  destinatario: "Maria",
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

// RNF06/RNF12 (APS, achado do OWASP ZAP): sem method, o formulário enviado antes da hidratação
// vira GET e põe senha e dados pessoais na URL (histórico, logs do servidor, Referer).
it.each<[string, () => ReactElement]>([
  ["login", () => <FormularioLogin acao={acao} />],
  ["cadastro", () => <FormularioCadastro acao={acao} />],
  ["pedido de recuperação", () => <FormularioPedidoRecuperacao acao={acao} />],
  ["redefinição de senha", () => <FormularioRedefinicao token="abc" acao={acao} />],
  ["troca de senha", () => <FormularioTrocaSenha acao={acao} />],
  ["exclusão de conta", () => <FormularioExclusaoConta acao={acao} />],
  [
    "perfil",
    () => <FormularioPerfil dados={{ nome: "Maria", telefone: "11987654321" }} acao={acao} />,
  ],
  ["endereço", () => <FormularioEndereco dados={endereco} acao={acao} />],
  ["contato", () => <FormularioContato />],
  [
    "agendamento (wizard)",
    () => (
      <WizardAgendamento
        opcoes={{
          artistas: [{ id: "ana", nome: "Ana", estilos: [{ id: "fineline", nome: "Fineline" }] }],
          tamanhos: [{ id: "pequena", nome: "Pequena" }],
        }}
        revisar={acao}
      />
    ),
  ],
  [
    "horário da agenda",
    () => (
      <FormularioHorario
        artistas={[]}
        opcoes={{ estilos: [], tamanhos: [] }}
        enviar={acao}
        aoSalvar={acao}
        aoCancelar={acao}
      />
    ),
  ],
  [
    "cadastro do admin",
    () => (
      <FormularioAdmin pendente={false} enviar={acao}>
        <input name="titulo" />
      </FormularioAdmin>
    ),
  ],
])("o formulário de %s envia por POST, nunca pela URL", (_nome, montar) => {
  const { container } = render(montar());
  const formulario = container.querySelector("form");

  expect(formulario?.method).toBe("post");
});
```

**Formulários** (alteração, formato *diff*)

```diff
diff --git a/src/app/contato/formulario.tsx b/src/app/contato/formulario.tsx
index 265d9aa..f77401c 100644
--- a/src/app/contato/formulario.tsx
+++ b/src/app/contato/formulario.tsx
@@ -71,5 +71,5 @@ export function FormularioContato() {
     <>
       <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
-      <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
+      <form method="post" noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
         <Campo
           id="nome"
diff --git a/src/components/admin/formulario.tsx b/src/components/admin/formulario.tsx
index 87c9ea3..e403e57 100644
--- a/src/components/admin/formulario.tsx
+++ b/src/components/admin/formulario.tsx
@@ -98,4 +98,5 @@ export function FormularioAdmin({
   return (
     <form
+      method="post"
       onSubmit={(evento) => {
         evento.preventDefault();
diff --git a/src/components/agenda/formulario-horario.tsx b/src/components/agenda/formulario-horario.tsx
index d7ef641..9b1d3d4 100644
--- a/src/components/agenda/formulario-horario.tsx
+++ b/src/components/agenda/formulario-horario.tsx
@@ -115,4 +115,5 @@ export function FormularioHorario({
   return (
     <form
+      method="post"
       onSubmit={(evento) => void salvar(evento)}
       noValidate
diff --git a/src/components/auth/formulario-cadastro.tsx b/src/components/auth/formulario-cadastro.tsx
index a8e6614..d14a13c 100644
--- a/src/components/auth/formulario-cadastro.tsx
+++ b/src/components/auth/formulario-cadastro.tsx
@@ -53,5 +53,5 @@ export function FormularioCadastro({
 
   return (
-    <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
+    <form method="post" noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
       {CAMPOS.map((campo) => (
         <Campo
diff --git a/src/components/auth/formulario-endereco.tsx b/src/components/auth/formulario-endereco.tsx
index 6a110cd..b42c1b3 100644
--- a/src/components/auth/formulario-endereco.tsx
+++ b/src/components/auth/formulario-endereco.tsx
@@ -52,4 +52,5 @@ export function FormularioEndereco({
   return (
     <form
+      method="post"
       noValidate
       onChange={() => setSucesso(false)}
diff --git a/src/components/auth/formulario-exclusao-conta.tsx b/src/components/auth/formulario-exclusao-conta.tsx
index 02653b3..7be3d95 100644
--- a/src/components/auth/formulario-exclusao-conta.tsx
+++ b/src/components/auth/formulario-exclusao-conta.tsx
@@ -49,4 +49,5 @@ export function FormularioExclusaoConta({
   return (
     <form
+      method="post"
       noValidate
       onSubmit={(evento) => void handleSubmit(enviar)(evento)}
diff --git a/src/components/auth/formulario-login.tsx b/src/components/auth/formulario-login.tsx
index 5089d28..8ea9390 100644
--- a/src/components/auth/formulario-login.tsx
+++ b/src/components/auth/formulario-login.tsx
@@ -45,5 +45,5 @@ export function FormularioLogin({
 
   return (
-    <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
+    <form method="post" noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
       <Campo
         id="email"
diff --git a/src/components/auth/formulario-pedido-recuperacao.tsx b/src/components/auth/formulario-pedido-recuperacao.tsx
index 8c2539b..800bc73 100644
--- a/src/components/auth/formulario-pedido-recuperacao.tsx
+++ b/src/components/auth/formulario-pedido-recuperacao.tsx
@@ -56,5 +56,5 @@ export function FormularioPedidoRecuperacao({
 
   return (
-    <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
+    <form method="post" noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
       <Campo
         id="email"
diff --git a/src/components/auth/formulario-perfil.tsx b/src/components/auth/formulario-perfil.tsx
index 9f903f0..504b232 100644
--- a/src/components/auth/formulario-perfil.tsx
+++ b/src/components/auth/formulario-perfil.tsx
@@ -51,4 +51,5 @@ export function FormularioPerfil({
   return (
     <form
+      method="post"
       noValidate
       onChange={() => setSucesso(false)}
diff --git a/src/components/auth/formulario-redefinicao.tsx b/src/components/auth/formulario-redefinicao.tsx
index 7d52c10..af2f693 100644
--- a/src/components/auth/formulario-redefinicao.tsx
+++ b/src/components/auth/formulario-redefinicao.tsx
@@ -74,5 +74,5 @@ export function FormularioRedefinicao({
 
   return (
-    <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
+    <form method="post" noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
       <Campo
         id="senha"
diff --git a/src/components/auth/formulario-troca-senha.tsx b/src/components/auth/formulario-troca-senha.tsx
index a9bc9c8..d0d7eb1 100644
--- a/src/components/auth/formulario-troca-senha.tsx
+++ b/src/components/auth/formulario-troca-senha.tsx
@@ -54,4 +54,5 @@ export function FormularioTrocaSenha({
   return (
     <form
+      method="post"
       noValidate
       onChange={() => setSucesso(false)}
diff --git a/src/components/scheduling/wizard-agendamento.tsx b/src/components/scheduling/wizard-agendamento.tsx
index 1c636d5..068274f 100644
--- a/src/components/scheduling/wizard-agendamento.tsx
+++ b/src/components/scheduling/wizard-agendamento.tsx
@@ -232,5 +232,11 @@ export function WizardAgendamento({
         </section>
       ) : (
-        <form noValidate onSubmit={avancar} aria-busy={ocupado} className="grid gap-5">
+        <form
+          method="post"
+          noValidate
+          onSubmit={avancar}
+          aria-busy={ocupado}
+          className="grid gap-5"
+        >
           <h2 id="wizard-titulo" ref={titulo} tabIndex={-1} className={TITULO}>
             {etapa + 1}. {ETAPAS[etapa]}
```

**C.5 Melhoria M3, cabeçalhos de segurança**

**`src/lib/seguranca.ts` e `next.config.ts`** (alteração, formato *diff*)

```diff
diff --git a/next.config.ts b/next.config.ts
index e1c1537..4aec4c6 100644
--- a/next.config.ts
+++ b/next.config.ts
@@ -1,4 +1,6 @@
 import type { NextConfig } from "next";
 
+import { cabecalhosDeArquivo } from "./src/lib/seguranca";
+
 // Libera o host público do R2 para o next/image (RNF14: formato moderno e tamanhos
 // responsivos). Sem R2_PUBLIC_URL nenhuma imagem remota é aceita.
@@ -21,6 +23,21 @@ function origensDeDesenvolvimento(): string[] {
 const nextConfig: NextConfig = {
   allowedDevOrigins: origensDeDesenvolvimento(),
+  // RNF07: a resposta não anuncia o framework.
+  poweredByHeader: false,
   // O `next dev` registra os argumentos das Server Actions, e o login e o cadastro levam senha.
   logging: { serverFunctions: false },
+  // RNF07: o proxy (src/proxy.ts) pula todo caminho com ponto (robots.txt, sitemap.xml,
+  // /_next/static, public); aqui esses caminhos recebem os cabeçalhos de segurança.
+  async headers() {
+    return [
+      {
+        source: "/:arquivo(.*\\..*)",
+        headers: Object.entries(cabecalhosDeArquivo(process.env)).map(([key, value]) => ({
+          key,
+          value,
+        })),
+      },
+    ];
+  },
   images: {
     formats: ["image/avif", "image/webp"],
diff --git a/src/lib/seguranca.ts b/src/lib/seguranca.ts
index afd3862..f5ccaa8 100644
--- a/src/lib/seguranca.ts
+++ b/src/lib/seguranca.ts
@@ -15,7 +15,11 @@ export type CabecalhosDeSeguranca = {
   "Referrer-Policy": string;
   "X-Frame-Options": string;
+  "Permissions-Policy": string;
   "Strict-Transport-Security"?: string;
 };
 
+// RNF07: recursos do navegador que o site não usa ficam desligados para qualquer script.
+const PERMISSOES = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
+
 // RNF05: CSP estrita por nonce. O proxy gera um nonce novo a cada requisição e o Next o aplica
 // aos próprios scripts; 'strict-dynamic' libera o que esses scripts carregarem (ex.: Turnstile).
@@ -57,5 +61,17 @@ export function cabecalhosDeSeguranca(nonce: string, ambiente: Ambiente): Cabeca
     "Referrer-Policy": "strict-origin-when-cross-origin",
     "X-Frame-Options": "DENY",
+    "Permissions-Policy": PERMISSOES,
     ...(producao ? { "Strict-Transport-Security": "max-age=31536000" } : {}),
   };
 }
+
+// RNF07: robots.txt, sitemap.xml, /_next/static e o public ficam fora do proxy (sem nonce). Nenhum é
+// página, então a CSP não libera nada; o resto repete os cabeçalhos das páginas.
+export function cabecalhosDeArquivo(ambiente: Ambiente): CabecalhosDeSeguranca {
+  return {
+    ...cabecalhosDeSeguranca("", ambiente),
+    // form-action, base-uri e frame-ancestors não herdam do default-src.
+    "Content-Security-Policy":
+      "default-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
+  };
+}
```

**`tests/unit/next-config.test.ts`** (arquivo novo, íntegra)

```ts
import { expect, it } from "vitest";

import nextConfig from "../../next.config";

// RNF07 (APS, achado do OWASP ZAP): a resposta não anuncia o framework (X-Powered-By: Next.js).
it("RNF07 o servidor não manda o cabeçalho X-Powered-By", () => {
  expect(nextConfig.poweredByHeader).toBe(false);
});

// RNF07: o proxy (src/proxy.ts) pula caminhos com ponto; o next.config cobre exatamente esses.
it("RNF07 o next.config aplica os cabeçalhos de arquivo a todo caminho com ponto", async () => {
  const regras = (await nextConfig.headers?.()) ?? [];
  const arquivos = regras.find((regra) => regra.source === "/:arquivo(.*\\..*)");

  expect(arquivos?.headers).toEqual(
    expect.arrayContaining([
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ]),
  );
});
```

**`tests/unit/seguranca.test.ts`** (alteração, formato *diff*)

```diff
diff --git a/tests/unit/seguranca.test.ts b/tests/unit/seguranca.test.ts
index edfe6e8..f5104e2 100644
--- a/tests/unit/seguranca.test.ts
+++ b/tests/unit/seguranca.test.ts
@@ -1,5 +1,5 @@
 import { expect, it } from "vitest";
 
-import { cabecalhosDeSeguranca } from "../../src/lib/seguranca";
+import { cabecalhosDeArquivo, cabecalhosDeSeguranca } from "../../src/lib/seguranca";
 
 // Lê uma diretiva da CSP ("script-src 'self' ...") e devolve as fontes, sem o nome.
@@ -107,2 +107,41 @@ it("RNF07 HSTS e upgrade-insecure-requests só em produção", () => {
   expect(diretiva(dev["Content-Security-Policy"], "upgrade-insecure-requests")).toBeUndefined();
 });
+
+// RNF07 (APS, achado do OWASP ZAP): o site não usa câmera, microfone nem localização; nenhum
+// script, nem de terceiro (Turnstile), pode pedir esses recursos ao navegador.
+it("RNF07 a Permissions-Policy desliga câmera, microfone e localização", () => {
+  const politica = cabecalhosDeSeguranca("abc123", { NODE_ENV: "production" })[
+    "Permissions-Policy"
+  ];
+
+  expect(politica?.split(",").map((p) => p.trim())).toEqual(
+    expect.arrayContaining(["camera=()", "microphone=()", "geolocation=()"]),
+  );
+});
+
+// RNF07 (APS, achado do OWASP ZAP): robots.txt, sitemap.xml, /_next/static e os arquivos do public
+// ficam fora do matcher do proxy (sem nonce); recebem os mesmos cabeçalhos e uma CSP que não executa
+// nada, porque nenhum deles é uma página.
+it("RNF07 arquivos fora do proxy recebem nosniff, DENY, Permissions-Policy e CSP sem execução", () => {
+  const cabecalhos = cabecalhosDeArquivo({ NODE_ENV: "production" });
+
+  expect(cabecalhos).toMatchObject({
+    "X-Content-Type-Options": "nosniff",
+    "X-Frame-Options": "DENY",
+    "Referrer-Policy": "strict-origin-when-cross-origin",
+    "Strict-Transport-Security": "max-age=31536000",
+  });
+  expect(cabecalhos["Permissions-Policy"]).toContain("camera=()");
+  const csp = cabecalhos["Content-Security-Policy"];
+  expect(diretiva(csp, "default-src")).toEqual(["'none'"]);
+  // Estas três não herdam do default-src (achado 10055 do ZAP na segunda rodada).
+  expect(diretiva(csp, "frame-ancestors")).toEqual(["'none'"]);
+  expect(diretiva(csp, "form-action")).toEqual(["'none'"]);
+  expect(diretiva(csp, "base-uri")).toEqual(["'none'"]);
+});
+
+it("RNF01 fora de produção os arquivos não recebem HSTS (localhost por http)", () => {
+  expect(cabecalhosDeArquivo({ NODE_ENV: "development" })).not.toHaveProperty(
+    "Strict-Transport-Security",
+  );
+});
```


# ANEXO A FICHA INDIVIDUAL DE ATIVIDADES

FICHA DAS ATIVIDADES PRÁTICAS SUPERVISIONADAS

Nome: Caio Scorsoni Martins Oliveira

Curso: Ciência da Computação Campus: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

RA: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Turma: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Semestre: \_\_\_\_\_\_\_\_\_\_ Turno: \_\_\_\_\_\_\_\_\_\_ Ano grade: \_\_\_\_\_\_\_\_\_\_

Código da atividade: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Trabalho: Avaliação e melhoria da qualidade de software na plataforma Kolô

Registro de atividades efetivamente realizadas

| **Data** | **Descrição da atividade** | **Total de horas** | **Assinatura do aluno** | **Horas atribuídas** | **Assinatura do professor** |
|------------|-----------------------------|---------------------|--------------------------|-----------------------|------------------------------|
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |

Horas atribuídas de acordo com o regulamento das Atividades Práticas Supervisionadas do curso.

Total de horas atribuídas: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Avaliação: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Aprovado ou reprovado: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Nota: \_\_\_\_\_\_\_\_\_\_ Data: \_\_\_\_ / \_\_\_\_ / \_\_\_\_\_\_\_\_

Carimbo e assinatura do coordenador do curso:

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Ficha adaptada do modelo fornecido no enunciado. Preenchimento e validação pelos responsáveis.

# ANEXO B FICHA INDIVIDUAL DE ATIVIDADES

FICHA DAS ATIVIDADES PRÁTICAS SUPERVISIONADAS

Nome: Caio Vinicius Luiz Alves

Curso: Ciência da Computação Campus: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

RA: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Turma: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Semestre: \_\_\_\_\_\_\_\_\_\_ Turno: \_\_\_\_\_\_\_\_\_\_ Ano grade: \_\_\_\_\_\_\_\_\_\_

Código da atividade: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Trabalho: Avaliação e melhoria da qualidade de software na plataforma Kolô

Registro de atividades efetivamente realizadas

| **Data** | **Descrição da atividade** | **Total de horas** | **Assinatura do aluno** | **Horas atribuídas** | **Assinatura do professor** |
|------------|-----------------------------|---------------------|--------------------------|-----------------------|------------------------------|
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |

Horas atribuídas de acordo com o regulamento das Atividades Práticas Supervisionadas do curso.

Total de horas atribuídas: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Avaliação: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Aprovado ou reprovado: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Nota: \_\_\_\_\_\_\_\_\_\_ Data: \_\_\_\_ / \_\_\_\_ / \_\_\_\_\_\_\_\_

Carimbo e assinatura do coordenador do curso:

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Ficha adaptada do modelo fornecido no enunciado. Preenchimento e validação pelos responsáveis.

# ANEXO C FICHA INDIVIDUAL DE ATIVIDADES

FICHA DAS ATIVIDADES PRÁTICAS SUPERVISIONADAS

Nome: Guilherme dos Santos Salustiano

Curso: Ciência da Computação Campus: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

RA: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Turma: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Semestre: \_\_\_\_\_\_\_\_\_\_ Turno: \_\_\_\_\_\_\_\_\_\_ Ano grade: \_\_\_\_\_\_\_\_\_\_

Código da atividade: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Trabalho: Avaliação e melhoria da qualidade de software na plataforma Kolô

Registro de atividades efetivamente realizadas

| **Data** | **Descrição da atividade** | **Total de horas** | **Assinatura do aluno** | **Horas atribuídas** | **Assinatura do professor** |
|------------|-----------------------------|---------------------|--------------------------|-----------------------|------------------------------|
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |

Horas atribuídas de acordo com o regulamento das Atividades Práticas Supervisionadas do curso.

Total de horas atribuídas: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Avaliação: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Aprovado ou reprovado: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Nota: \_\_\_\_\_\_\_\_\_\_ Data: \_\_\_\_ / \_\_\_\_ / \_\_\_\_\_\_\_\_

Carimbo e assinatura do coordenador do curso:

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Ficha adaptada do modelo fornecido no enunciado. Preenchimento e validação pelos responsáveis.

# ANEXO D FICHA INDIVIDUAL DE ATIVIDADES

FICHA DAS ATIVIDADES PRÁTICAS SUPERVISIONADAS

Nome: Gustavo Henrique Rodrigues de Magalhães

Curso: Ciência da Computação Campus: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

RA: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Turma: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Semestre: \_\_\_\_\_\_\_\_\_\_ Turno: \_\_\_\_\_\_\_\_\_\_ Ano grade: \_\_\_\_\_\_\_\_\_\_

Código da atividade: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Trabalho: Avaliação e melhoria da qualidade de software na plataforma Kolô

Registro de atividades efetivamente realizadas

| **Data** | **Descrição da atividade** | **Total de horas** | **Assinatura do aluno** | **Horas atribuídas** | **Assinatura do professor** |
|------------|-----------------------------|---------------------|--------------------------|-----------------------|------------------------------|
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |

Horas atribuídas de acordo com o regulamento das Atividades Práticas Supervisionadas do curso.

Total de horas atribuídas: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Avaliação: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Aprovado ou reprovado: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Nota: \_\_\_\_\_\_\_\_\_\_ Data: \_\_\_\_ / \_\_\_\_ / \_\_\_\_\_\_\_\_

Carimbo e assinatura do coordenador do curso:

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Ficha adaptada do modelo fornecido no enunciado. Preenchimento e validação pelos responsáveis.

# ANEXO E FICHA INDIVIDUAL DE ATIVIDADES

FICHA DAS ATIVIDADES PRÁTICAS SUPERVISIONADAS

Nome: Robert Estevan da Silva Junior

Curso: Ciência da Computação Campus: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

RA: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Turma: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Semestre: \_\_\_\_\_\_\_\_\_\_ Turno: \_\_\_\_\_\_\_\_\_\_ Ano grade: \_\_\_\_\_\_\_\_\_\_

Código da atividade: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Trabalho: Avaliação e melhoria da qualidade de software na plataforma Kolô

Registro de atividades efetivamente realizadas

| **Data** | **Descrição da atividade** | **Total de horas** | **Assinatura do aluno** | **Horas atribuídas** | **Assinatura do professor** |
|------------|-----------------------------|---------------------|--------------------------|-----------------------|------------------------------|
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |
|          |                            |                    |                         |                      |                             |

Horas atribuídas de acordo com o regulamento das Atividades Práticas Supervisionadas do curso.

Total de horas atribuídas: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Avaliação: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Aprovado ou reprovado: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Nota: \_\_\_\_\_\_\_\_\_\_ Data: \_\_\_\_ / \_\_\_\_ / \_\_\_\_\_\_\_\_

Carimbo e assinatura do coordenador do curso:

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Ficha adaptada do modelo fornecido no enunciado. Preenchimento e validação pelos responsáveis.
