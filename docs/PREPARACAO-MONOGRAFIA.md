# Kolô — Preparação da monografia (TCC 2)

> **Entrega:** 20/10/2026, pela tarefa do Teams, enviada por **um** integrante. O nome do arquivo deve conter o **número do grupo**. Grupo que não entregar não apresenta para a banca.
>
> **Fontes:** NORMAS DISCIPLINA TCC2, ESTRUTURA DA MONOGRAFIA e Aulas 1, 2 e 3 da Profa. Elisa Botta.
>
> **Base avaliada:** `docs/TCC.txt`, última alteração em 08/09/2026. Se houver uma versão mais nova fora do repositório, conferir cada item contra ela antes de refazer o trabalho.

---

## Como o texto é avaliado (5,0 pontos)

| Critério                                                                          | Valor |
| --------------------------------------------------------------------------------- | ----- |
| Estrutura: todos os capítulos obrigatórios e desenvolvimento adequado              | 1,0   |
| Escrita acadêmica: clareza, coesão, objetividade e linguagem científica             | 1,0   |
| Citações: ABNT, diretas e indiretas, relação entre texto e referências             | 1,0   |
| Referências: quantidade, atualidade, diversidade e ABNT                             | 1,0   |
| Acabamento: formatação ABNT, figuras, tabelas, numeração, ortografia e revisão final | 1,0   |

## Exigências mínimas: situação em 16/10

| Exigência                                                       | Situação                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 40 páginas de texto (sem capa, folha de rosto, resumo, sumário, referências, apêndices e anexos) | ❌ cerca de 3.600 palavras, uns 10 a 12 páginas. Faltam perto de **30 páginas**.                                 |
| ≥ 10 referências, ≥ 6 de artigos, livros, teses ou documentação oficial | ✅ 31 referências                                                                                          |
| ≥ 15 referências no Capítulo 2, com fontes diversas                | 🟡 em número sim, mas só um artigo científico (Jiang e Benbasat, 2007)                                     |
| ≥ 5 figuras numeradas e citadas no texto                         | ❌ 4 legendas sem imagem; as Figuras 3 e 4 mostram o fluxo com Google Calendar, que não existe no sistema |
| Descrição da arquitetura e das tecnologias                        | 🟡 existe, mas descreve 3D, Google Calendar e e-mail transacional                                          |
| Apresentação e discussão dos resultados                           | ❌ capítulo vazio                                                                                          |
| Conclusão coerente com os objetivos do TCC1                       | ❌ capítulo vazio                                                                                          |

"Não será aceito": só prints de tela, só código-fonte, tutorial de tecnologia, cópia de documentação, menos de 10 referências, só referências de internet, falta de discussão dos resultados.

---

## 1. Reestruturar os capítulos

| Exigido                          | Hoje no `TCC.txt`                                    | Ação                                                        |
| -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| 1 Introdução (1.1 a 1.7)         | 1 Introdução em texto corrido                       | Dividir nas sete subseções                                  |
| 2 Fundamentação Teórica          | 2 Referencial Teórico (2.1 a 2.5)                   | Renomear e completar (ver seção 3 deste arquivo)            |
| 3 Metodologia                    | 3 Metodologia                                        | Corrigir para o que foi realmente feito                     |
| 4 Desenvolvimento do Sistema     | 4 Requisitos + 5 Modelagem + 6 Desenvolvimento (vazio) | Fundir os três num capítulo só                             |
| 5 Resultados e Discussão         | 7 Testes e Resultados (vazio)                       | Escrever                                                    |
| 6 Conclusão                      | 8 Considerações finais (vazio)                      | Escrever                                                    |

- [ ] Renumerar os capítulos para 1 a 6
- [ ] Pré-textuais: preencher lista de figuras, criar lista de tabelas, revisar lista de siglas (tirar WebGL e JWT se saírem do texto; incluir LGPD, RN, PBI, CI, E2E, UTC, Pix etc.), gerar o sumário automático
- [ ] Atualizar resumo e abstract **por último**, com o que foi feito e os resultados

## 2. Introdução (Capítulo 1)

A Aula 1 pede que a introdução reflita o TCC2, não o projeto.

- [ ] Separar 1.1 Contextualização, 1.2 Problema de pesquisa, 1.3 Hipótese, 1.4 Objetivo geral, 1.5 Objetivos específicos, 1.6 Justificativa, 1.7 Estrutura do trabalho
- [ ] **Reescrever a hipótese.** "Aumenta as vendas assíncronas" não tem como ser medido sem uso em produção. Sugestão: "a centralização de catálogo, pedidos e agenda em uma plataforma única elimina os controles manuais de venda e de agendamento identificados no diagnóstico". Assim o Capítulo 5 consegue mostrar evidência
- [ ] Tirar dos objetivos e da hipótese: Google Calendar, e-mail transacional, recomendações personalizadas, visualização 3D
- [ ] Escrever os objetivos específicos de modo verificável, para a Conclusão marcar realizado, parcial ou não realizado. "Objetivo ≠ funcionalidade" (Aula 2)
- [ ] Atualizar o contexto: o Kolô não tem mais espaço físico em Pinheiros (`ESCOPO-E-STACK.md` §1)
- [ ] 1.7: descrever os seis capítulos novos

## 3. Fundamentação Teórica (Capítulo 2)

"É o capítulo mais importante da pesquisa." Relacionar conceitos ao problema, comparar soluções e justificar escolhas; não virar tutorial.

**Remover ou reescrever:**

- [ ] 2.2 Visualização 3D: retirar, ou reduzir a um parágrafo de "trabalhos futuros" na Conclusão
- [ ] 2.1: o sistema **não é marketplace**, é loja única (`ESCOPO-E-STACK.md` §2). Ajustar o texto sobre efeito de rede
- [ ] 2.3: tirar Google Calendar e notificações por e-mail. As sessões são persistidas no banco e revogáveis (Better Auth), não JWT stateless
- [ ] 2.4: o Checkout Pro redireciona para o checkout hospedado do Mercado Pago; não há tokenização no navegador nem token enviado ao back-end. Trocar "liberação do conteúdo adquirido" por confirmação do pedido e baixa de estoque
- [ ] 2.5: tirar Three.js, React Three Fiber, React Native e a justificativa do Virtual DOM pelo visualizador 3D

**Incluir (o que a estrutura pede e hoje falta):**

- [ ] **Trabalhos relacionados e comparação entre soluções.** Montar uma tabela de funcionalidades (catálogo, venda, agendamento, portfólio, pagamento local) entre o Kolô e soluções de mercado, por exemplo: plataformas de loja (Nuvemshop, Shopify), marketplaces de arte (Artsy, Saatchi Art), agenda de serviços (Booksy, Fresha) e portfólio de tatuagem (Tattoodo). Mostrar a lacuna que justifica o sistema: nenhuma junta venda de obra e agendamento de tatuagem
- [ ] Concorrência e integridade transacional (reserva de estoque, RN03 e RN04), base para explicar a reserva de 10 minutos
- [ ] Segurança em aplicações web (OWASP Top 10) e LGPD (Lei 13.709/2018), base para RNF01–RNF12 e para a anonimização (RN12)
- [ ] Usabilidade e acessibilidade (heurísticas de Nielsen, WCAG 2.1), base para RNF20 e RNF21
- [ ] Arquitetura monolítica modular versus microsserviços, com comparação, para justificar a escolha

## 4. Metodologia (Capítulo 3)

"Outro grupo conseguiria entender como vocês realizaram a pesquisa?" Descrever **o que foi feito**, não o que estava previsto.

- [ ] 3.6: retirar ou marcar como não realizados os testes de ponta a ponta e de usabilidade. O script E2E é um placeholder (PBI-45 aberto)
- [ ] 3.4: confirmar se as "uma ou duas amostragens" com o cliente aconteceram. Se sim, registrar data, participantes e o que mudou. Se não, corrigir o texto
- [ ] 3.7: tirar "Google Calendar, e-mail" e "visualização 3D" da ordem de implementação
- [ ] **Registrar e justificar a mudança de escopo** (exigido na Aula 1): stack React + Laravel + MySQL do TCC1 → Next.js + PostgreSQL; versão 2.1 → 2.2 (3D, Google Calendar, motor de horários e e-mails de pedido adiados). Motivos e lista completa em `ESCOPO-E-STACK.md` §§2 e 14
- [ ] Descrever o processo real: backlog em PBIs, duas sprints (`SPRINT-1.md`, `Sprint-2.md`), PR revisado por outro integrante, CI barrando merge, TDD (`AGENTS.md`)
- [ ] Ambiente e instrumentos: IDE, Node 24, Docker, GitHub Actions, Vitest, Postgres real nos testes de integração. Declarar também o uso de assistentes de IA (Cursor e Claude Code, ver `AGENTS.md` e `.claude/`), para não ser questionado na banca
- [ ] Critérios de avaliação usados no Capítulo 5 (quais testes, quais métricas, como foi a validação)

## 5. Desenvolvimento do Sistema (Capítulo 4)

Mostrar decisões técnicas, não manual de uso. Código longo vai para o apêndice. Este é o capítulo que mais rende páginas (estimativa: 12 a 15).

| Item obrigatório                                                | De onde tirar no repo                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Requisitos funcionais e não funcionais                          | `ESCOPO-E-STACK.md` §4 (RF01–RF32), §5 (RNF01–RNF24), §6 (RN01–RN12)          |
| Tecnologias justificadas: linguagem, framework, banco, IDE, servidor, bibliotecas | `ESCOPO-E-STACK.md` §8; `BRIEFING.md`; `package.json`                         |
| Arquitetura e justificativa                                     | `ESCOPO-E-STACK.md` §9 (diagrama mermaid e organização por módulos)           |
| DER, MER, casos de uso, classes, sequência                      | `DER.md`; papéis em `ESCOPO-E-STACK.md` §7; webhook em §11                     |
| Modelo lógico e físico do banco                                 | `DER.md`; `prisma/schema.prisma`; `prisma/migrations/`                         |
| Telas importantes                                               | `docs/telas/` (56 capturas, celular e desktop)                                |
| Principais funcionalidades e regras de negócio                  | `docs/features/PBI-*.md` (contrato e decisões de cada entrega)                |

- [ ] Substituir as listas de requisitos do TCC1 (10 RF, 5 RNF, 3 RN) pelas da versão 2.2, em tabelas com prioridade P0/P1
- [ ] Corrigir a RN01 do texto: o wizard de agendamento é público e não exige login
- [ ] Tirar Google Calendar e e-mail transacional das seções de arquitetura (4.6 e 5.1 atuais) e passar o texto para o passado ("foi desenvolvido", não "será desenvolvido")
- [ ] Explicar as decisões que mais demonstram técnica:
  - [ ] reserva de 10 minutos com transação no banco e compras concorrentes (PBI-25)
  - [ ] pedido pago só pelo webhook com assinatura HMAC, consulta à API e idempotência (PBI-28)
  - [ ] agenda sem sobreposição garantida por restrição do próprio PostgreSQL (RN08, PBI-34)
  - [ ] upload direto ao R2 com URL assinada, validação e miniatura (PBI-17)
  - [ ] preços em centavos inteiros (RN07) e horários em UTC (RN09)
  - [ ] wizard que gera o link `wa.me` sem gravar dado de saúde (PBI-31 a 33, RNF18)
  - [ ] exclusão de conta com anonimização e pedidos preservados (PBI-40, LGPD)
- [ ] Mostrar uma ou duas telas por fluxo, explicando o que a tela resolve. Ex.: "o checkout exibe o tempo restante da reserva para..."

## 6. Resultados e Discussão (Capítulo 5)

"Mostrar telas não é discutir resultados." Descrever o resultado e depois interpretar.

**Evidências que já existem:**

- [ ] Tabela de cobertura: cada RF → PBI → teste automatizado → situação (atendido, parcial, adiado). Base: `Sprint-2.md`, seção "Cobertura do projeto"
- [ ] Testes: 519 testes unitários em 112 arquivos (medição local em 16/10/2026, na branch do PBI-40; recontar na versão final), mais a suíte de integração com PostgreSQL real; CI no GitHub Actions rodando lint, tipos, testes e build a cada PR
- [ ] Acessibilidade e responsividade: axe-core sem violações e sem rolagem horizontal em 320 e 1440 px (registrado em `features/PBI-18.md`, `PBI-21.md`, `PBI-24.md`, `PBI-29.md`)
- [ ] Integrações reais: compra no sandbox do Mercado Pago confirmada pelo webhook (PBI-28), estorno no sandbox (PBI-43), envio real ao R2 (PBI-35)
- [ ] Concorrência: o teste de integração da reserva mostra que compras simultâneas não ultrapassam o estoque. Citar o caso de teste e o resultado

**Evidências para produzir até 19/10:**

- [ ] Rodar o Lighthouse no catálogo e na ficha da obra e registrar desempenho e LCP (meta: ≥ 90 e < 2,5 s, RNF13). É uma métrica no estilo que a Aula 3 pede
- [ ] Validação com o cliente: uma sessão curta com o responsável pelo Kolô, nem que seja local, com registro de data, tarefas executadas e feedback. Ver `PREPARACAO-BANCA.md`, critério 10

**Discussão:**

- [ ] Objetivos do Capítulo 1 × o que foi entregue
- [ ] Dificuldades: integração e webhook em ambiente local (túnel https), concorrência de estoque, CORS do R2
- [ ] Limitações, com honestidade: sem deploy público até a data da entrega (se ainda for o caso), sem testes E2E, sem medição de vendas reais, funcionalidades adiadas, o caso do Pix vencido seguido de pagamento com cartão (`Sprint-2.md`, PBI-43)
- [ ] Decisões que influenciaram o resultado: corte de escopo na v2.2, monolito modular, Postgres real nos testes

## 7. Conclusão (Capítulo 6)

Não é resumo. Responder às perguntas da estrutura e não trazer informação nova.

- [ ] Objetivos alcançados, parciais e não alcançados
- [ ] A hipótese reescrita foi confirmada?
- [ ] Contribuições: para o Kolô e técnicas (por exemplo, a reserva transacional e o webhook idempotente)
- [ ] Limitações
- [ ] Trabalhos futuros: os itens adiados da v2.2 (visualizador 3D, Google Calendar, motor de horários, e-mail de pedido, painel de faturamento, login com Google)

## 8. Citações e referências

- [ ] **Incluir FOWLER (2002) na lista de referências.** É citado na seção 2.3 e não aparece lá. Referência: FOWLER, M. _Patterns of Enterprise Application Architecture_. Boston: Addison-Wesley, 2002
- [ ] Trocar GEEKFORGEEKS (blog técnico) e HOUAISS (dicionário) por definição de requisito em Sommerville (2019) ou Pressman e Maxim (2021), que já estão na lista
- [ ] Retirar as referências que deixam de ser citadas: POIMANDRES, EISENMAN e, se a 2.2 sair, JIANG e BENBASAT
- [ ] Acrescentar **artigos científicos**, que hoje são só um. Pesquisar no Google Acadêmico, no Portal de Periódicos CAPES e na SBC OpenLib (anais do SBSI e do WebMedia) com termos como: e-commerce para pequenas empresas, economia criativa e plataformas digitais, sistemas de agendamento de serviços, controle de concorrência em reservas, usabilidade de comércio eletrônico
- [ ] Fontes oficiais e livros que cobrem os temas novos (conferir edição e dados antes de citar): Lei 13.709/2018 (LGPD); OWASP Top 10 (2021); W3C WCAG 2.1 (2018); NIELSEN, _Usability Engineering_; BECK, _Test-Driven Development: By Example_; KLEPPMANN, _Designing Data-Intensive Applications_ (transações e concorrência); RICHARDS e FORD, _Fundamentals of Software Architecture_ (monolito × microsserviços); documentação do Next.js, Prisma e Better Auth
- [ ] Depois de cada citação, explicar a relação com o trabalho (Aula 1, slide 10)
- [ ] Conferir: toda citação está na lista e toda referência da lista é citada

## 9. Figuras e tabelas (meta: 8 a 10 figuras)

Regra ABNT da Aula 3: citar no texto **antes** de aparecer; título acima; fonte abaixo ("Fonte: Elaborado pelos autores (2026)").

- [ ] Figura: arquitetura do sistema (exportar o mermaid de `ESCOPO-E-STACK.md` §9)
- [ ] Figura: DER (exportar o `erDiagram` de `DER.md` como imagem)
- [ ] Figura: casos de uso **atualizado** com Visitante, Cliente, Artista e Admin (`ESCOPO-E-STACK.md` §7)
- [ ] Figura: fluxo de compra **atualizado** (carrinho → reserva de 10 min → Checkout Pro → webhook → pedido pago e estoque baixado)
- [ ] Figura: fluxo de agendamento **atualizado** (wizard → checks → `wa.me` → artista cadastra o horário). Sem Google Calendar
- [ ] Figura: diagrama de sequência do webhook do Mercado Pago (`ESCOPO-E-STACK.md` §11)
- [ ] Figuras: 3 a 4 telas-chave de `docs/telas/` (catálogo, wizard, checkout, gestão de pedidos)
- [ ] Tabelas: requisitos, tecnologias, comparação com trabalhos relacionados, cobertura RF × evidência, resultados dos testes

## 10. Acabamento e escrita

- [ ] Linguagem impessoal e no passado; sem "a gente", "deu certo"
- [ ] Parágrafo com ideia, explicação, evidência, análise e conexão (Aula 1, slide 9)
- [ ] ABNT: margens, fonte, espaçamento, numeração de páginas e de seções, citações com mais de 3 linhas recuadas
- [ ] Ortografia e concordância revisadas por alguém que não escreveu o capítulo
- [ ] Todo integrante conhece o trabalho inteiro: na banca qualquer um pode ser perguntado

---

## Cronograma até a entrega

| Dia        | Entrega                                                                                                 | Responsável |
| ---------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| 16–17/10   | Reestruturação em 6 capítulos; limpeza de 3D, Calendar e e-mail; Introdução 1.1–1.7; hipótese reescrita | —           |
| 17–18/10   | Capítulo 4 completo, com figuras                                                                        | —           |
| 18/10      | Capítulo 2: trabalhos relacionados, comparação e artigos novos; Capítulo 3 corrigido                    | —           |
| 18–19/10   | Lighthouse e validação com o cliente; Capítulos 5 e 6                                                   | —           |
| 19/10      | Resumo e abstract; ABNT; listas e sumário; conferência de citações e referências; revisão cruzada       | —           |
| 20/10      | Envio pelo Teams, com o número do grupo no nome do arquivo                                              | —           |

## Checklist antes de enviar (Aula 1, slide 21)

- [ ] Todos os capítulos obrigatórios estão presentes
- [ ] O texto responde ao problema e aos objetivos
- [ ] A metodologia corresponde ao que realmente foi feito
- [ ] Há resultados concretos e análise dos resultados
- [ ] Todas as citações estão nas referências
- [ ] Referências atualizadas, diversificadas e em ABNT
- [ ] Figuras e tabelas numeradas e mencionadas no texto
- [ ] Ortografia e formatação revisadas
- [ ] Pelo menos 40 páginas de texto
- [ ] Arquivo identificado com o número do grupo
- [ ] Enviado pelo Teams até 20/10
