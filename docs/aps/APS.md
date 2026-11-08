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

Este trabalho avalia a qualidade da plataforma web Kolô Ateliê & Estúdio, desenvolvida para exposição e comercialização de obras de arte e apoio ao agendamento de tatuagens. O objetivo é relacionar requisitos, processos e evidências técnicas para identificar riscos e propor melhorias verificáveis. Adota-se um estudo aplicado baseado na análise documental da monografia, da especificação do projeto, do código-fonte e dos registros de desenvolvimento. A avaliação considera testes unitários, testes de integração com PostgreSQL, testes de ponta a ponta, auditorias de desempenho e verificações automatizadas de acessibilidade. Os registros do projeto indicam controle transacional de reservas de estoque, tratamento idempotente de notificações de pagamento e melhorias de interface e carregamento de imagens. A mediana documentada do Lighthouse passou de 88 para 97 pontos no catálogo, com redução do LCP de 3,92 para 2,43 segundos. Permanecem limitações relativas à navegação por teclado, à validação no ambiente publicado, à restauração de backups e à consolidação das evidências na mesma revisão do sistema. Os dados apresentados são resultados históricos das fontes consultadas e não representam uma nova execução das suítes. Conclui-se que o projeto reúne mecanismos relevantes de qualidade em ambiente de desenvolvimento e testes, mas a comprovação operacional depende da implantação e de uma rodada final de validação. Propõe-se um plano de melhoria com prioridades, métricas e critérios de aceite.

Palavras-chave: Qualidade de software; Testes de software; Comércio eletrônico; Confiabilidade; Kolô.

**Delimitação desta versão**

Documento elaborado a partir dos arquivos disponíveis na pasta TCC em 26 de outubro de 2026. As atividades e conclusões seguem o tema da APS; os resultados são atribuídos às respectivas fontes. Campos individuais de RA, carga horária e assinatura permanecem sem preenchimento por dependerem de comprovação dos integrantes.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

**SUMÁRIO**

```{=openxml}
<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve">TOC \o "1-3" \h \z \u</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Clique com o botão direito e escolha Atualizar campo para gerar o sumário.</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
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
4. Executar testes funcionais e não funcionais nas condições definidas no [plano de qualidade](PLANO.md).
5. Registrar e analisar os resultados em relação às metas, identificando pontos críticos e oportunidades de melhoria com base no [baseline da APS](evidencias/BASELINE.md).
6. Propor melhorias com base nas medições e verificar novamente as métricas afetadas pelas mudanças implementadas, com registro no [comparativo das melhorias](evidencias/COMPARATIVO.md).
7. Documentar o processo e refletir sobre sua contribuição para a formação acadêmica e para a prática profissional.

### 1.4.3 Delimitação do estudo

A visão geral do repositório tcc-2 abrange as páginas e os módulos de negócio em `src/`, o esquema de dados em `prisma/`, as suítes em `tests/` e a integração contínua em `.github/workflows/`. A avaliação transversal considera cobertura de testes, complexidade e auditoria de dependências. A análise aprofunda três fluxos da plataforma.

- **Catálogo e ficha da obra.** O carregamento das imagens e a apresentação da obra em telas móveis influenciam o acesso ao acervo e o início da compra.
- **Carrinho, checkout e webhook.** A disputa pela última unidade em estoque e a repetição de notificações do Mercado Pago exercitam a consistência entre reserva, pagamento e baixa de estoque.
- **Assistente de agendamento.** Um link incorreto para o WhatsApp pode impedir que o cliente inicie o contato pelo assistente. Se a mensagem omitir ou alterar a preferência de data ou horário, o cliente pode precisar informá-la novamente na conversa.

Os registros da APS no repositório documentam execuções locais de testes unitários, de integração e de ponta a ponta, além de medições de cobertura, complexidade, carga e segurança. Nesta versão do relatório, o desenvolvimento e as conclusões discutem os resultados históricos atribuídos às respectivas fontes do TCC, entre elas a monografia (Oliveira et al., 2026).

As novas medições foram realizadas em ambiente local, com PostgreSQL em contêiner e serviços externos simulados nos ensaios de carga e na varredura de segurança. A avaliação em produção fica para depois da publicação. O catálogo apresenta as obras em duas dimensões. A integração com o WhatsApp se limita ao link direto com mensagem pré-preenchida. O artista ou administrador cadastra manualmente o horário combinado, e a coleta de dados de anamnese ocorre presencialmente no estúdio (Equipe Kolô, 2026a).

# 2 REVISÃO TEÓRICA

## 2.1 Qualidade como requisito verificável
Neste estudo, qualidade é tratada como o atendimento de critérios explícitos sob condições conhecidas. A especificação do Kolô transforma objetivos amplos em requisitos, como evitar estoque negativo, validar entradas no servidor, limitar o LCP das páginas e restringir operações por perfil. A análise utiliza esses contratos como referência de aceite, em vez de formular uma nota geral sem método (Equipe Kolô, 2026a).

A ISO/IEC 25010:2011 distingue qualidade do produto, observada nas propriedades do sistema, de qualidade em uso, observada nos resultados da interação em um contexto determinado. O modelo de produto agrupa essas propriedades nas características de adequação funcional, eficiência de desempenho, compatibilidade, usabilidade, confiabilidade, segurança, manutenibilidade e portabilidade. Os requisitos funcionais (RF) descrevem o que o sistema deve fazer, enquanto os requisitos não funcionais (RNF) explicitam atributos de qualidade ou restrições. As regras de negócio (RN) expressam condições que a operação deve respeitar, como o limite de estoque. Um requisito pode fornecer evidência para mais de uma característica quando verificado de maneiras diferentes (Equipe Kolô, 2026a; ISO; IEC, 2011).[^iso25010]

[^iso25010]: A ISO/IEC 25010:2023 substituiu a edição de 2011 e trata do modelo de qualidade do produto, agora com nove características. A qualidade em uso passou a ter norma própria, a ISO/IEC 25019:2023. Nesta APS, a classificação dos requisitos e a leitura das métricas seguem a edição de 2011 adotada no plano (ISO; IEC, 2023a, 2023b).

O método Goal–Question–Metric (GQM) parte de um objetivo de avaliação, formula perguntas que permitem julgar seu atendimento e escolhe métricas capazes de respondê-las. Para avaliar a eficiência do catálogo, por exemplo, a pergunta pode ser quanto demora a resposta sob a carga prevista. A métrica é a duração das requisições no percentil 95 e a meta é o limite com o qual esse valor será comparado (Basili; Caldiera; Rombach, 1994). No [plano da APS](PLANO.md), os limites foram estabelecidos antes da medição (Equipe Kolô, 2026g).

A confiabilidade é observada na preservação de invariantes do domínio e no tratamento de falhas e repetições. A eficiência é examinada pela duração das requisições sob carga e pelos indicadores de carregamento das páginas. A manutenibilidade envolve a facilidade de analisar, alterar e testar o produto. Na APS, a separação de módulos, a tipagem, as validações e os controles de integração ajudam a interpretar as medidas de cobertura e complexidade. A usabilidade exige fluxos compreensíveis e verificações de acessibilidade que vão além da inspeção visual.

## 2.2 Verificação e validação no projeto
A verificação compara a implementação com os contratos que restringem a administração de obras e limitam as reservas concorrentes ao estoque disponível. A validação examina se os fluxos resolvem as necessidades do ateliê. A monografia registra uma sessão com a administradora, realizada com uma versão anterior às correções finais (Oliveira et al., 2026).

Os testes funcionais verificam o comportamento especificado, como a recusa de uma operação sem permissão. Os não funcionais examinam propriedades como desempenho sob carga, segurança e acessibilidade. O teste de confirmação volta ao cenário que motivou uma correção para verificar se o problema foi resolvido. Já o teste de regressão procura efeitos indesejados da mudança em comportamentos que antes funcionavam (ISTQB, 2024).

Um teste demonstra uma propriedade nas condições do ensaio. O retorno de uma participante descreve sua experiência. Essas evidências se complementam, mas não comprovam, isoladamente, disponibilidade contínua ou melhoria operacional após a publicação.

## 2.3 Níveis de teste
A estratégia combina testes unitários, integração com PostgreSQL e testes de ponta a ponta. O teste unitário verifica uma unidade de código ou um componente em isolamento. O de integração exercita a comunicação entre partes, como o módulo de reservas e o banco de dados. O teste de ponta a ponta (E2E, de *end-to-end*) percorre um fluxo do ponto de vista do usuário, da ação no navegador até um resultado observável. O Kolô usa Vitest para as duas primeiras camadas e Playwright para a terceira. Reservas e agenda exigem banco real para avaliar concorrência. Os serviços simulados nos testes de interface limitam o alcance dos resultados às integrações presentes no ensaio (ISTQB, 2024; Microsoft, [202-]a; Vitest, [202-]a).

A pirâmide de testes organiza a automação com mais testes rápidos e focados na base e menos testes amplos no topo, onde há mais componentes envolvidos e maior custo de manutenção. A camada intermediária cobre as interações que um teste isolado deixaria de fora. A proporção entre camadas é uma orientação para distribuir custo e alcance. No Kolô, ela ajuda a decidir quais regras podem ser verificadas isoladamente, quais pedem integração com o banco e quais justificam um percurso completo no navegador (Cohn, 2010).

No desenvolvimento orientado por testes (TDD), primeiro se escreve um teste que falha pelo motivo esperado. Em seguida se faz a menor alteração que o leva a passar e, por fim, se melhora a estrutura do código mantendo os testes verdes. A sequência é conhecida como vermelho, verde e refatoração (Beck, 2003). Um teste que já passa pode ampliar a cobertura de um comportamento existente ao exercitar um caso ainda ausente da suíte. As correções que seguiram o ciclo de TDD e o acréscimo de casos de integração estão distinguidos no [comparativo das melhorias](evidencias/COMPARATIVO.md) (Equipe Kolô, 2026f).

A ISO/IEC/IEEE 29119-3:2021 apresenta modelos para a documentação de teste. O modelo adotado na APS prevê que o registro do caso reúna identificador, requisito, pré-condições, dados de entrada, passos e resultado esperado. O registro da execução deve acrescentar o resultado obtido, o status e a referência ao teste automatizado, quando aplicável. O resultado esperado vem do requisito e orienta a comparação com o que foi observado (ISO; IEC; IEEE, 2021a).

A partição de equivalência e a análise de valor-limite são técnicas de projeto de testes tratadas na ISO/IEC/IEEE 29119-4:2021. A primeira divide os dados em grupos para os quais se espera o mesmo comportamento e escolhe representantes de cada grupo pertinente. A segunda se concentra nos pontos de transição entre partições ordenadas e nos valores vizinhos. Por exemplo, ao pedir quantidade positiva de uma obra, pode-se separar quantidades que cabem no estoque disponível das que o excedem. Exercitar o estoque disponível e uma unidade a mais verifica a transição entre aceitar o pedido e recusá-lo (Equipe Kolô, 2026a; ISO; IEC; IEEE, 2021b; ISTQB, 2024).

## 2.4 Concorrência e idempotência

Há concorrência quando operações progridem no mesmo intervalo e podem disputar um recurso, como a última unidade de uma obra ou um horário na agenda. Um invariante é uma condição que deve continuar válida após as operações, como o limite de estoque. Uma operação atômica agrupa as alterações em uma transação que é confirmada por inteiro ou desfeita. Na agenda, uma restrição no banco impede a gravação de horários sobrepostos para o mesmo artista (Equipe Kolô, 2026a, 2026d).

A reserva de estoque é modelada como operação atômica. O código ordena identificadores e bloqueia os registros envolvidos antes de calcular a disponibilidade. O estoque livre considera a quantidade existente e as reservas ativas de outras sessões. O objetivo é evitar que duas compras se apoiem na mesma unidade disponível (Equipe Kolô, 2026d).

Um *webhook* é uma notificação HTTP que um serviço envia a outro em resposta a um evento. No recebimento de pagamentos, idempotência significa que repetir uma notificação não deve repetir o efeito de negócio. A implementação associa a verificação de assinatura à consulta do pagamento no gateway e ao registro de eventos. O resultado do navegador não é usado como prova de quitação. A análise considera a baixa única de estoque e a manutenção de transições válidas como propriedades verificáveis (Equipe Kolô, 2026a, 2026d).

## 2.5 Desempenho e acessibilidade

Um teste de carga mede o comportamento do sistema sob um volume de trabalho definido. No k6, cada usuário virtual (VU) executa o roteiro de requisições do cenário. O percentil 95 (p95) é a duração abaixo da qual, ou igual à qual, ficam aproximadamente 95% dos tempos medidos. A taxa de falha HTTP é a proporção de requisições que o k6 classifica como falhas. Já um *check* é uma verificação booleana definida no roteiro, como verificar se a resposta do checkout indica que o pedido foi criado (Grafana Labs, [202-]). O roteiro de carga avalia duração e taxa de falha nas páginas de leitura, e duração e proporção de *checks* bem-sucedidos na finalização do checkout. A rajada concentra tentativas em um intervalo curto. Na APS, ela força a disputa pela mesma unidade. O roteiro incrementa o contador de pedidos recusados sempre que falta o redirecionamento esperado para a página do pedido. Esse contador agrupa respostas de causas distintas. A recusa prevista por falta de estoque é um resultado válido da operação. A verificação da regra usa o item de pedido persistido no banco para conferir se a quantidade respeitou o estoque disponível. Os roteiros e resultados das duas rodadas estão descritos no [registro da linha de base](evidencias/BASELINE.md) e no [comparativo](evidencias/COMPARATIVO.md) (Equipe Kolô, 2026f, 2026h).

O Lighthouse mede o desempenho da página no navegador e reúne os indicadores em uma pontuação ponderada. O *Largest Contentful Paint* (LCP) mede o tempo desde o início do carregamento até a renderização do maior conteúdo elegível visível na tela. O *First Contentful Paint* (FCP) mede quanto tempo decorre até aparecer o primeiro texto, imagem ou outro conteúdo da página. O *Total Blocking Time* (TBT) soma, no intervalo de medição, as parcelas das tarefas que excedem 50 ms na linha de execução principal. O *Cumulative Layout Shift* (CLS) mede a instabilidade visual causada por deslocamentos inesperados de elementos (Clark, 2020; Google, 2019a, 2019b).

O requisito RNF13 estabelece Lighthouse de pelo menos 90 pontos e LCP inferior a 2,5 segundos no catálogo e na ficha da obra. A comparação só é interpretável quando as condições do ensaio são registradas. O projeto informa mediana de três rodadas em simulação móvel de rede 4G (Equipe Kolô, 2026b).

Responsividade é a adaptação da interface a diferentes larguras de tela. Os testes de largura identificam transbordamento horizontal. Acessibilidade diz respeito à possibilidade de perceber e operar a interface com diferentes capacidades e formas de interação. A varredura com axe-core cobre verificações automatizáveis, como a presença de nome acessível em controles (Deque Systems, [202-]). O próprio código filtra impactos críticos e sérios e deixa resultados inconclusivos fora desse gate. Por isso, ausência de falhas nesse conjunto não equivale à conformidade integral de acessibilidade. Teclado, foco e avaliação com pessoas permanecem necessários.

## 2.6 Rastreabilidade e melhoria contínua

Rastreabilidade liga requisito, teste, execução e evidência. A integração contínua (CI) automatiza verificações como análise estática, checagem de tipos e testes a partir de mudanças no repositório. Taxa de aprovação é a proporção de casos executados que passaram. Cobertura de linhas é a proporção de linhas executáveis percorridas. Cobertura de ramos é a proporção de alternativas do fluxo de controle exercitadas, como os dois resultados de uma condição. Uma suíte pode executar muitas vezes os mesmos caminhos. Assim, contagem, aprovação e cobertura respondem a perguntas diferentes, e cobertura alta ainda depende da qualidade das verificações. Na APS, o relatório de cobertura do Vitest reúne as execuções de testes unitários e de integração (ISTQB, 2024; Vitest, [202-]a).

A complexidade ciclomática de McCabe mede o número de caminhos linearmente independentes no grafo de fluxo de controle. Uma função de fluxo linear começa com complexidade um. Em estruturas simples, uma decisão binária acrescenta um caminho independente. O ESLint operacionaliza essa medida com a regra `complexity`, que conta também construções da linguagem capazes de desviar o fluxo. A complexidade sinaliza quanto esforço pode ser necessário para entender ou exercitar uma função. O tamanho do arquivo, medido em linhas, é um indicador separado (ESLint, [202-]; McCabe, 1976).

Uma suíte também pode apresentar sinais de manutenção difícil, como testes duplicados ou dependentes do relógio real. Um teste instável (*flaky*) alterna entre aprovação e falha sem mudança correspondente no código avaliado (Microsoft, [202-]b). Controlar o relógio permite reproduzir o limite de expiração com o mesmo instante em todas as execuções (Vitest, [202-]b).

O ciclo de melhoria adotado consiste em identificar o risco, definir um critério, aplicar a mudança e repetir a medição nas mesmas condições. A linha de base (*baseline*) é a rodada inicial, usada como ponto de comparação. A rodada posterior verifica se a métrica atingiu a meta e se o comportamento antes aprovado continua funcionando. A revisão avaliada, o ambiente e os relatórios de cada rodada permitem interpretar diferenças e separar uma mudança observada de variações do ensaio, como registrado na [linha de base](evidencias/BASELINE.md) e no [comparativo](evidencias/COMPARATIVO.md) (Equipe Kolô, 2026f, 2026h).

## 2.7 Segurança de aplicações web

O *Open Worldwide Application Security Project* (OWASP) publica o OWASP Top 10 para orientar a atenção aos riscos mais relevantes em aplicações web, como falhas de controle de acesso e de configuração (OWASP, 2025). Autenticação verifica a identidade de quem solicita uma operação. Autorização verifica se essa identidade pode realizá-la, inclusive sobre o recurso específico. Em um ataque de falsificação de requisição entre sites (*Cross-Site Request Forgery*, CSRF), o navegador de uma pessoa autenticada é induzido a enviar uma ação que ela não solicitou (OWASP, [202-]).

Cabeçalhos de resposta HTTP comunicam políticas ao navegador. A *Content Security Policy* (CSP) define quais recursos o navegador pode carregar ou executar. Um *nonce* de uso único em uma resposta pode autorizar os scripts marcados com esse valor (W3C, 2026). `Permissions-Policy` restringe recursos do navegador, como a câmera, e `X-Content-Type-Options: nosniff` impede que ele tente deduzir outro tipo de conteúdo em contextos como scripts e folhas de estilo. O cabeçalho `X-Powered-By` identifica a tecnologia do servidor (MDN Web Docs, 2026a). Nos formulários, o envio por GET inclui os campos na URL e pode expô-los no histórico ou em registros. O envio por POST coloca esses campos no corpo da requisição (MDN Web Docs, 2026b).

O Zed Attack Proxy (ZAP) inspeciona o tráfego de aplicações web. A varredura passiva do modo *Baseline Scan* usa um rastreador para descobrir páginas e examina as mensagens HTTP observadas, sem executar ataques ativos. Cada alerta indica um problema potencial e informa o risco e a confiança da detecção. Um alerta é classificado como falso positivo quando a análise demonstra que o problema apontado não se aplica à resposta ou ao fluxo avaliado. Um alerta inconclusivo permanece pendente de validação. As conclusões valem para as rotas e condições alcançadas pelo rastreador (ZAP, [202-]a, [202-]b).

A auditoria com `npm audit` compara as dependências do projeto com avisos de segurança conhecidos no registro consultado (npm, 2026). Ela inclui dependências diretas, declaradas pelo projeto, e transitivas, trazidas por outros pacotes. A severidade do aviso orienta a análise, que ainda precisa verificar se o caminho afetado é alcançável no Kolô. Os relatórios de dependências e os alertas do ZAP são evidências complementares, reunidas no [registro da linha de base](evidencias/BASELINE.md) e no [comparativo das melhorias](evidencias/COMPARATIVO.md) (Equipe Kolô, 2026f, 2026h).

# 3 METODOLOGIA

## 3.1 Procedimento e materiais
A avaliação combina dois procedimentos. O primeiro é a análise documental. O enunciado da APS define a estrutura e os objetivos acadêmicos. O escopo versão 2.2 fornece os requisitos, e o DER e o esquema Prisma descrevem os dados. O código e os testes indicam os mecanismos implementados, enquanto os registros da Sprint 2 e a monografia trazem os resultados históricos. A Sprint 3 contextualiza as pendências posteriores à entrega da monografia. Nessa análise foram identificados os fluxos de maior risco e os requisitos associados. Também se conferiu a presença de implementação e testes, e os resultados foram transcritos com atribuição à fonte. Divergências entre documentos foram preservadas como limitações de rastreabilidade.

O segundo procedimento é a medição local, em duas rodadas e com as mesmas ferramentas e comandos. A linha de base mede a revisão `b3587b3`, a da `main` no início da APS, acrescida apenas da configuração de medição da APS. A nova medição mede a revisão `51bb1b8`, que contém as três melhorias. As duas rodadas foram executadas em 6 e 7 de novembro de 2026 na mesma máquina, e as saídas brutas ficaram em `docs/aps/evidencias/baseline/` e `docs/aps/evidencias/depois/` (Equipe Kolô, 2026f, 2026h).

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
|-------------------------------------|-----------------------------|-----------------------------------------------------------------|-------------|
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
O plano de qualidade tem três partes: a classificação dos requisitos não funcionais nas características da ISO/IEC 25010:2011, o desdobramento das características escolhidas em objetivos, perguntas e métricas pelo método GQM e o processo que liga a medição às melhorias. Segundo o [plano da APS](PLANO.md), as metas foram fixadas na sessão de decisões de 6 de novembro de 2026, antes da primeira rodada de medição, para que o resultado não influenciasse o limite com o qual seria comparado (Basili; Caldiera; Rombach, 1994; Equipe Kolô, 2026g; ISO; IEC, 2011).

### 3.3.1 Requisitos de qualidade
O escopo do Kolô define 24 requisitos não funcionais, cada um com um critério de verificação. O Quadro 3 classifica cada RNF por característica e subcaracterística da ISO/IEC 25010:2011 e indica como ele é tratado nesta APS. Um requisito pode ser medido nesta avaliação, apoiar-se em evidência registrada no TCC ou ficar fora do escopo por depender do ambiente publicado. Quando o requisito sustenta mais de uma característica, a principal aparece primeiro.

::: {custom-style="Legenda"}
Quadro 3 Requisitos não funcionais do Kolô na ISO/IEC 25010:2011
:::

| **RNF** | **Requisito (resumo)**                                  | **Característica e subcaracterística**                    | **Tratamento nesta APS**                              |
|---------|---------------------------------------------------------|-----------------------------------------------------------|-------------------------------------------------------|
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

As regras de negócio completam o quadro na confiabilidade. O limite de estoque (RN02 a RN04) e a confirmação do pedido só com pagamento aprovado (RN05) correspondem à maturidade e à correção funcional. Por isso a rajada concorrente sobre uma obra de estoque unitário aparece no plano como métrica de confiabilidade, e não de desempenho. A restrição de operações por perfil e por proprietário (RF06 e RN10) corresponde à autenticidade e à responsabilização da segurança. Ela é verificada pelas suítes de integração e E2E e reexecutada no caso T03 da seção 3.4 (Equipe Kolô, 2026a).

A ISO/IEC 25010:2011 não tem característica própria de privacidade. Os requisitos de coleta mínima, ausência de dado clínico e anonimização (RNF17 a RNF19) foram classificados em confidencialidade. Compatibilidade não recebeu requisito no escopo; a única integração crítica, o *gateway* de pagamento, é tratada pelo RNF11 (ISO; IEC, 2011).

### 3.3.2 Objetivos, perguntas e métricas
O Quadro 4 apresenta os objetivos e as perguntas do plano. As características escolhidas cobrem os três fluxos aprofundados e os requisitos que podem ser medidos sem o ambiente publicado. O Quadro 5 traz as métricas, as ferramentas e as metas de cada pergunta, com os mesmos limites usados na linha de base e na nova medição (Equipe Kolô, 2026f, 2026g, 2026h).

::: {custom-style="Legenda"}
Quadro 4 Objetivos e perguntas do plano GQM
:::

| **ID** | **Característica**                  | **Objetivo**                                                                           | **Pergunta**                                                                                           |
|--------|-------------------------------------|----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
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
|--------|-----------------------------------------------------------------|-------------------------------------------------|-----------------------------------------------------------|
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

1. **Plano.** Requisitos classificados, perguntas e metas registrados no [plano da APS](PLANO.md) antes de qualquer medição.
2. **Linha de base.** Todas as métricas do Quadro 5, exceto o Lighthouse, medidas numa mesma revisão do código, na mesma máquina, com os comandos e as saídas brutas guardados no [registro da linha de base](evidencias/BASELINE.md).
3. **Pontos críticos.** Cada métrica fora da meta e cada alerta de segurança a analisar viram um ponto crítico. A lista resultante é o insumo da escolha das melhorias.
4. **Melhoria.** Os pontos críticos foram ordenados por risco de mudança às vésperas da banca do TCC. O plano previa apenas testes novos ou refatoração coberta pela suíte. Dois pontos de segurança apontados pelo ZAP foram aceitos como exceção, por serem mudanças pequenas de configuração cobertas por testes unitários e pela suíte E2E. Os pontos escolhidos foram implementados por TDD: um teste que falha pelo motivo esperado, a menor alteração que o faz passar e a repetição até cobrir o comportamento. Quando a melhoria só acrescenta testes a comportamento já existente, não há etapa vermelha. Antes da nova medição, um revisor que não escreveu o código analisou o *diff*, e os ajustes que ele pediu entraram na mesma rodada.
5. **Nova medição.** Os mesmos comandos, na mesma máquina, sobre a revisão com as melhorias. O [comparativo das melhorias](evidencias/COMPARATIVO.md) põe antes e depois lado a lado na mesma métrica. Nas medidas de tempo, uma variação pequena é lida como ausência de regressão, não como ganho, porque o ensaio local tem ruído.

Pontos críticos não tratados ficam como propostas, com a justificativa de por que ficaram fora (seção 4.6). Uma rodada seguinte repetiria o ciclo a partir da etapa 2, sobre as métricas afetadas pelas mudanças (Beck, 2003; Equipe Kolô, 2026f, 2026h).

Cada rodada registra a revisão do código, a data, o ambiente, o comando, o resultado e o arquivo da evidência. Esse registro permite comparar rodadas e evita a combinação de números de versões diferentes, como a contagem de testes da monografia, anterior à linha de base desta APS.

## 3.4 Roteiro de testes funcionais e não funcionais
::: {custom-style="Legenda"}
Quadro 6 Casos prioritários para reexecução
:::

| **Caso**       | **Entrada ou ação**                                               | **Resultado esperado**                                         |
|----------------|-------------------------------------------------------------------|----------------------------------------------------------------|
| T01 Reserva    | Duas ou mais sessões disputam uma peça de estoque 1               | Só a quantidade disponível é reservada; sem estoque negativo   |
| T02 Webhook    | Assinatura inválida e depois dois avisos válidos iguais           | Inválido recusado; efeito de negócio aplicado uma vez          |
| T03 Perfil     | Cliente tenta ação administrativa; artista altera outro portfólio | Operações recusadas no servidor                                |
| T04 Agenda     | Duas inserções simultâneas sobrepostas do mesmo artista           | Só um horário é aceito                                         |
| T05 Assistente | Avançar sem aceite e depois completar todos os passos             | Conclusão bloqueada até aceites; link correto sem persistência |
| T06 Conta      | Excluir conta que tem pedido pago                                 | Dados pessoais tratados conforme contrato; pedido preservado   |
| T07 Interface  | Percorrer compra e assistente por teclado em tela estreita        | Foco visível, sequência coerente e ações alcançáveis           |
| T08 Relatório  | Período que cruza meia-noite em São Paulo e pedido estornado      | Totais coerentes com período e situação do pedido              |

::: {custom-style="Legenda"}
Fonte Elaborado a partir de RF06, RF12 a RF25, RF32 e RN01 a RN12.
:::

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
|-------------------------------|-------------------------------------------------|-------------------------------------------------------|-----------------------------------------|
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
A implementação segue um monólito modular com Next.js, React e TypeScript. PostgreSQL e Prisma sustentam persistência e migrações. Os módulos de domínio incluem identidade, catálogo, mídia, pedidos, pagamentos, agenda, portfólio, clientes e relatórios. A separação permite localizar regras e testar contratos por domínio. Essa estrutura é observável no repositório; a infraestrutura pública descrita no escopo deve ser tratada como planejada enquanto não houver comprovação de implantação.

::: {custom-style="Legenda"}
Figura 1 Relações principais da arquitetura avaliada
:::

![](midia/media/image1.png){width="6.299212598425197in" height="2.7559055118110236in"}

::: {custom-style="Legenda"}
Fonte Elaborado a partir do código e do escopo. O diagrama não comprova implantação pública.
:::

## 4.2 Modelo de dados e invariantes
No comércio, artwork se relaciona a artwork_reservation, cart_item e order_item; order reúne itens e pagamentos. Na agenda, appointment vincula artista, intervalo e contato. As contas e sessões sustentam a identificação e o controle de acesso. O modelo utiliza valores monetários inteiros em centavos e datas armazenadas em UTC. O DER completo e o esquema estão identificados no Apêndice A.

## 4.3 Resultados de confiabilidade e testes
A monografia registra um experimento com dez rodadas de oito sessões concorrentes, cada rodada disputando uma obra de estoque unitário. Em cada rodada, uma reserva foi concedida e sete foram recusadas. O total foi de 80 tentativas, com dez reservas concedidas para dez disputas independentes. O resultado sustenta a propriedade de não exceder o estoque nesse cenário, mas não mede latência e não exercita carrinhos com várias obras (Oliveira et al., 2026).

::: {custom-style="Legenda"}
Tabela 1 Síntese do experimento de concorrência registrado
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

Os testes presentes incluem reserva concorrente, agenda sobreposta e processamento simultâneo de avisos de pagamento. A inspeção confirma a existência desses casos e dos mecanismos correspondentes; a aprovação atual depende da execução na revisão avaliada. A monografia informa 562 testes unitários, 276 de integração e 43 de ponta a ponta. Também observa que as contagens de integração e E2E antecedem o relatório de vendas.

A Sprint 2, no fechamento da qualidade integrada, registra 532 testes unitários, 276 de integração e 43 E2E. A diferença entre 532 e 562 não foi tratada como erro aritmético nem somada entre documentos: as contagens pertencem a registros de momentos distintos. A ação recomendada é produzir um relatório unificado da revisão final, com contagem, aprovação e artefatos de cada suíte.

## 4.4 Desempenho e melhorias já registradas
O catálogo não atingia inicialmente o requisito de desempenho: o registro informa 88 pontos e LCP de 3,92 s. A equipe identificou disputa de banda entre imagens da primeira linha carregadas antecipadamente. A correção manteve prioridade elevada somente na primeira imagem. Depois da alteração, a mediana de três rodadas foi de 97 pontos e LCP de 2,43 s (Equipe Kolô, 2026b).

::: {custom-style="Legenda"}
Tabela 2 Comparação de desempenho documentada
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
Figura 2 Catálogo de obras do projeto
:::

![](midia/media/image2.png){width="6.299212598425197in" height="4.921259842519685in"}

::: {custom-style="Legenda"}
Fonte Captura já disponível em docs/telas/atelie. Imagem ilustrativa da interface, sem nova auditoria.
:::

## 4.5 Acessibilidade e segurança
A Sprint 2 registra varredura de 35 telas nas larguras de 320, 768, 1440 e 1920 px. O axe-core é executado em 320 e 1440 px. A documentação descreve correções em nomes acessíveis de botões de ordenação no portfólio e quebra de texto em ações do pedido administrativo. O fechamento informa lista de exceções vazia no conjunto verificado. A revisão também identificou alvo de toque de 44 px, corrigido para pelo menos 48 px e acompanhado de teste.

O resultado é parcial em relação ao RNF21: teclado e foco permaneceram pendentes. A varredura verifica regras automáticas e os impactos selecionados, sem garantir a experiência de usuários com deficiência. A inspeção do teste confirma que resultados inconclusivos não entram no gate. Esse limite deve acompanhar qualquer afirmação sobre acessibilidade.

::: {custom-style="Legenda"}
Quadro 8 Evidências históricas de segurança e seus limites
:::

| **Controle**          | **Evidência registrada**                               | **Limite**                                           |
|-----------------------|--------------------------------------------------------|------------------------------------------------------|
| Assinatura de webhook | Aviso sem assinatura recebe HTTP 401                   | Revalidar com o gateway pelo endereço publicado      |
| Permissões            | Ação administrativa repetida por cliente foi recusada  | Não substitui revisão de todas as operações          |
| CSRF e entradas       | Origem externa recusada; entrada inválida rejeitada    | Roteiro aplicado ao ambiente local de testes         |
| Dependências          | Audit com zero vulnerabilidades no fechamento de 18/10 | Resultado histórico; requer nova consulta na entrega |
| Cabeçalhos e CSP      | Nonce por requisição e cabeçalhos inspecionados        | Nota pública e HTTPS dependem da implantação         |

::: {custom-style="Legenda"}
Fonte Equipe Kolô (2026b), PBI 45. Nenhuma nova varredura de segurança foi executada neste relatório.
:::

A ausência de anamnese no esquema é coerente com o escopo de minimização de dados do projeto. Isso não é apresentado como certificação de conformidade jurídica. A análise limita-se aos contratos e à estrutura de dados inspecionados.

## 4.6 Análise crítica e plano de melhoria
As melhorias já registradas atacam falhas concretas de desempenho, nomes acessíveis, transbordamento e tamanho de botões. O próximo ciclo deve concentrar-se em lacunas de evidência e operação, antes de ampliar funcionalidades. A priorização abaixo é uma proposta desta avaliação; não representa trabalho já executado nem atribuição individual acordada.

::: {custom-style="Legenda"}
Quadro 9 Melhorias propostas e critérios de encerramento
:::

| **Prioridade e ação**                 | **Justificativa**                                 | **Critério de aceite**                                                                      |
|---------------------------------------|---------------------------------------------------|---------------------------------------------------------------------------------------------|
| Alta Consolidar execução final        | Contagens e resultados são de momentos diferentes | Mesma revisão com lint, tipos, build e três suítes; artefatos e falhas registrados          |
| Alta Teclado e foco                   | RNF21 permanece parcialmente verificado           | Compra, login, assistente e admin percorridos sem mouse; foco e ordem documentados          |
| Alta Homologar integrações publicadas | Dublês E2E não substituem Mercado Pago e R2 reais | Compra sandbox pela URL pública e upload real com miniatura e exibição                      |
| Alta Restaurar backup                 | Plano de operação ainda carece de comprovação     | Dump restaurado em ambiente isolado; integridade e tempo registrados                        |
| Média Ampliar concorrência            | Experimento usa apenas uma obra por disputa       | Carrinhos multiobra, repetição concorrente e fronteiras de expiração sem violar invariantes |
| Média Repetir desempenho na VPS       | Catálogo tem margem local de apenas 70 ms         | Três rodadas comparáveis por página; LCP \< 2,5 s e nota ≥ 90                               |
| Média Reproduzir dados de demo        | Sprint 3 registra povoamento incompleto           | Clone limpo executa migração e seed e apresenta catálogo e portfólio com imagens            |

::: {custom-style="Legenda"}
Fonte Propostas elaboradas com base nas pendências das Sprints 2 e 3 e na monografia.
:::

## 4.7 Registro e acompanhamento das melhorias
Cada ação deve gerar um registro com problema observado, requisito afetado, alteração, teste que demonstra o defeito, teste após a correção e evidência final. A versão da aplicação precisa ser identificada para que a comparação tenha significado. Em caso de falha, preserva-se o resultado e abre-se nova tarefa; a tentativa posterior não deve apagar o histórico.

::: {custom-style="Legenda"}
Quadro 10 Modelo de registro para o próximo ciclo
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
Fonte Modelo proposto nesta avaliação. Não preenchido com execuções fictícias.
:::

## 4.8 Manutenibilidade e código completo
A tipagem estrita, as validações por esquema, os módulos com APIs públicas e a integração contínua compõem o processo de manutenção definido no repositório. A presença desses controles facilita detectar regressões, mas não fornece, por si só, uma métrica de esforço de manutenção. Não foram inventados índices de complexidade, cobertura de código ou tempo médio de correção.

A codificação completa permanece no repositório do projeto, identificado no Apêndice A por endereço e revisão. Este documento apresenta a arquitetura, o modelo de avaliação e um trecho integral representativo do controle de assinatura. A consulta ou entrega do código completo deve usar o repositório identificado; este arquivo Word não contém a transcrição de todos os arquivos do sistema.

A monografia e a Sprint 2 registram avanços de qualidade em desenvolvimento e testes. A inspeção desta versão também encontra relatórios administrativos já implementados, embora o briefing mais antigo os listasse como adiados. Para essa funcionalidade, prevalecem a atualização do RF32 no escopo, o PBI 48 e o módulo reports presente no código.

# 5 CONCLUSÕES E RECOMENDAÇÕES

A avaliação indica que a plataforma Kolô possui mecanismos de qualidade alinhados aos riscos do domínio e evidências históricas relevantes de testes. O controle de reserva busca impedir a venda além do estoque; o processamento de pagamento verifica autenticidade e repetição; as verificações de interface e desempenho levaram a correções documentadas. O catálogo atingiu as metas registradas após a priorização do carregamento de imagens.

O objetivo deste trabalho foi atendido por meio da seleção e caracterização do sistema, organização dos requisitos de qualidade, definição de métricas, análise de resultados disponíveis e proposição de melhorias com critérios verificáveis. O alcance dessa conclusão é documental e restrito aos ambientes descritos nas fontes. Não houve reexecução das suítes nem comprovação de qualidade em produção nesta análise.

As limitações centrais são a ausência de uma rodada consolidada da revisão final, a verificação pendente de teclado e foco e a necessidade de comprovar integrações, disponibilidade e restauração no ambiente publicado. O retorno qualitativo da administradora registrado na monografia é relevante, mas não permite generalizar usabilidade nem calcular redução de tempo de atendimento.

Recomenda-se executar primeiro as ações de prioridade alta do plano de melhoria e manter os resultados vinculados à mesma revisão. A ampliação dos testes de concorrência, o povoamento reproduzível da demonstração e a medição pública de desempenho devem acompanhar o fechamento. Novas funcionalidades podem ser reavaliadas após a consolidação dessas evidências.

Na formação acadêmica, o caso permite relacionar engenharia de requisitos, banco de dados, testes, segurança e experiência de uso a problemas concretos. O aprendizado central é que qualidade exige critérios observáveis e comunicação precisa dos limites: um resultado local aprovado constitui evidência útil, mas sua validade deve permanecer ligada ao cenário em que foi obtido.

# REFERÊNCIAS

BASILI, Victor R.; CALDIERA, Gianluigi; ROMBACH, H. Dieter. The Goal Question Metric approach. In: MARCINIAK, John J. (ed.). **Encyclopedia of Software Engineering**. New York: John Wiley & Sons, 1994. p. 528–532. Disponível em: <https://www.cs.umd.edu/~basili/publications/technical/T89.pdf>. Acesso em: 8 nov. 2026.

BECK, Kent. **Test-driven development**: by example. Boston: Addison-Wesley, 2003. Disponível em: <https://ptgmedia.pearsoncmg.com/images/9780321146533/samplepages/0321146530.pdf>. Acesso em: 8 nov. 2026.

BIBLIOTECA DA UNIVERSIDADE PAULISTA. **Guia de normalização para apresentação de trabalhos acadêmicos da Universidade Paulista**: ABNT. São Paulo: UNIP, 2025. Disponível em: https://www.unip.br/servicos/biblioteca/assets/download/manual_de_normalizacao_abnt.pdf. Acesso em: 26 out. 2026.

CLARK, Connor. **What's new in Lighthouse 6.0**. Chrome for Developers. [S. l.], 2020. Disponível em: <https://developer.chrome.com/blog/lighthouse-6-0>. Acesso em: 8 nov. 2026.

COHN, Mike. **Succeeding with Agile**: software development using Scrum. 1. ed. Upper Saddle River: Addison-Wesley, 2010. Disponível em: <https://www.informit.com/store/succeeding-with-agile-software-development-using-scrum-9780321579362>. Acesso em: 8 nov. 2026.

DEQUE SYSTEMS. **axe-core**: accessibility engine for automated Web UI testing. [S. l.], [202-]. Disponível em: <https://github.com/dequelabs/axe-core>. Acesso em: 8 nov. 2026.

EQUIPE KOLÔ. **Escopo e Stack do projeto Kolô**. Versão 2.2, atualização de 18 out. 2026. 2026a. Documento técnico local: tcc-2/docs/ESCOPO-E-STACK.md.

EQUIPE KOLÔ. **Sprint 2**. 2026b. Registro técnico local: tcc-2/docs/Sprint-2.md. Seções dos PBIs 45 a 48.

EQUIPE KOLÔ. **Sprint 3 Pós entrega da monografia**. 2026c. Registro técnico local: tcc-2/docs/SPRINT-3.md.

EQUIPE KOLÔ. **Código-fonte da plataforma Kolô**. 2026d. Revisão a94ad02bc90bf4945ded28b7c1b70960abc71b90. Disponível no repositório: https://github.com/caioalves19/tcc-2/tree/a94ad02bc90bf4945ded28b7c1b70960abc71b90. Cópia local consultada em: 26 out. 2026.

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

Repositório de origem: https://github.com/caioalves19/tcc-2. Revisão local inspecionada: a94ad02bc90bf4945ded28b7c1b70960abc71b90. O estado de trabalho estava sem alterações locais no momento da identificação. O endereço é derivado da configuração local; não foi verificada a disponibilidade externa do repositório.

Consulta da codificação completa na revisão: https://github.com/caioalves19/tcc-2/tree/a94ad02bc90bf4945ded28b7c1b70960abc71b90

::: {custom-style="Legenda"}
Quadro 11 Localização dos materiais para conferência
:::

| **Material**           | **Caminho relativo a tcc-2**              |
|------------------------|-------------------------------------------|
| Implementação          | src/                                      |
| Esquema e migrações    | prisma/schema.prisma e prisma/migrations/ |
| Testes unitários       | tests/unit/                               |
| Testes de integração   | tests/integration/                        |
| Fluxos E2E e varredura | tests/e2e/                                |
| Pipeline de integração | .github/workflows/ci.yml                  |
| Regras e arquitetura   | docs/ESCOPO-E-STACK.md e docs/DER.md      |
| Resultados históricos  | docs/Sprint-2.md e docs/tcc-2.docx        |
| Pendências posteriores | docs/SPRINT-3.md                          |

::: {custom-style="Legenda"}
Fonte Inventário dos caminhos presentes na cópia local consultada.
:::

Para entrega acadêmica, o código completo deve acompanhar o documento por acesso ao repositório ou por exportação da mesma revisão, conforme o procedimento adotado pela disciplina. Arquivos com credenciais, dependências instaladas e bancos de desenvolvimento não integram esse material. As fichas a seguir registram apenas identificação: carga horária e participação individual precisam ser preenchidas e conferidas pelos responsáveis.

# APÊNDICE B CONTROLE DE ASSINATURA DO WEBHOOK

Listagem integral do arquivo src/modules/payments/assinatura.ts na revisão identificada. O trecho mostra o uso do validador do SDK e o tratamento de recusa. A idempotência e as alterações transacionais pertencem a outros arquivos do módulo e devem ser consultadas no código completo.

import { InvalidWebhookSignatureError, WebhookSignatureValidator } from \"mercadopago\";

export type DadosAssinatura = {

assinatura: string \| null;

idRequisicao: string \| null;

idDado: string \| null;

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

\"Assinatura do webhook recusada\",

erro instanceof InvalidWebhookSignatureError ? erro.reason : \"erro desconhecido\",

dados.idRequisicao,

);

return false;

}

}

::: {custom-style="Legenda"}
Fonte Equipe Kolô (2026d). Código transcrito da cópia local, sem alteração de comportamento.
:::

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
|----------|----------------------------|--------------------|-------------------------|----------------------|-----------------------------|
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
|----------|----------------------------|--------------------|-------------------------|----------------------|-----------------------------|
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
|----------|----------------------------|--------------------|-------------------------|----------------------|-----------------------------|
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
|----------|----------------------------|--------------------|-------------------------|----------------------|-----------------------------|
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
|----------|----------------------------|--------------------|-------------------------|----------------------|-----------------------------|
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
