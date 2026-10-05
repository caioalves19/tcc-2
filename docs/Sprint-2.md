# Kolô — Sprint 2: Projeto completo em ordem de execução

**Período-alvo:** 05 a 18/10/2026.
**Equipe:** Caio Alves, Caio Oliveira, Guilherme, Gustavo e Robert.
**Meta:** planejar todo o trabalho restante do escopo v2.2, do acervo à entrega final.
**Fontes:** [Ordem de execução](ORDEM-DE-EXECUCAO.md) · [Escopo e Stack v2.2](ESCOPO-E-STACK.md) · [DER](DER.md).
**Ponto de partida:** [Sprint 1](SPRINT-1.md) concluída; não reabrir nem alterar seu arquivo.

## Como executar

A ordem é **estritamente sequencial: PBI-16 → PBI-17 → … → PBI-47**. Um integrante conclui o PBI-16, outra pessoa pode assumir o PBI-17 depois, e assim sucessivamente. Os responsáveis não são predefinidos neste documento.

- Iniciar um PBI somente depois do aceite e da integração do anterior. A dependência sequencial é uma regra de organização da equipe, mesmo quando não há dependência técnica direta.
- Cada entrega inclui implementação, integração e testes do comportamento, revisão por outro integrante e PR aprovado. Não deixar todos os testes para o fechamento.
- Na passagem, registrar PR, evidências, migrações/configurações necessárias e eventuais impedimentos. O próximo integrante parte da versão integrada.
- P0 é indispensável à defesa; P1 também está contemplado no projeto completo, mas pode ser formalmente adiado se o prazo exigir. Um P1 adiado deve ter justificativa registrada antes de avançar, e não pode ser marcado como concluído.
- Os números de PBI continuam a Sprint 1; não correspondem aos números da coluna “#” do roteiro original. Nesta revisão, o antigo PBI-23 de fechamento do acervo foi substituído pelo endereço de entrega; o fechamento global está nos PBIs 45–47.

**Viabilidade:** o roteiro original prevê oito semanas para o projeto. Concentrar todo o restante entre 05 e 18/10, com execução serial, representa alto risco de prazo. As janelas abaixo são metas de acompanhamento, não estimativas validadas nem garantia de conclusão. Se houver atraso, registrar o desvio e revisar o prazo; não reduzir testes nem declarar P0 entregue parcialmente.

## Visão geral — seguir de cima para baixo

| PBI | Entrega | Requisitos | Prioridade | Só iniciar após |
| --- | --- | --- | --- | --- |
| 16 | CRUD de artistas, estilos e tags | RF28 | P0 | Sprint 1 |
| 17 | Upload e tratamento de imagens | RF27 | P0 | PBI-16 |
| 18 | CRUD de obras | RF26 | P0 | PBI-17 |
| 19 | Catálogo público | RF09 | P0 | PBI-18 |
| 20 | Página da obra | RF10 | P0 | PBI-19 |
| 21 | Home com destaques | RF07 | P0 | PBI-20 |
| 22 | Páginas institucionais | RF08 | P0 | PBI-21 |
| 23 | Endereço de entrega | RF05 | P0 | PBI-22 |
| 24 | Carrinho persistente | RF11 | P0 | PBI-23 |
| 25 | Reserva temporária e concorrência de estoque | RF15; RN02–RN04, RN06 | P0 | PBI-24 |
| 26 | Checkout e criação do pedido | RF12; RN01, RN07 | P0 | PBI-25 |
| 27 | Pagamento Mercado Pago em sandbox | RF13; RNF10, RNF12 | P0 | PBI-26 |
| 28 | Webhook e confirmação do pedido | RF14; RN05, RN06, RNF11 | P0 | PBI-27 |
| 29 | Acompanhamento de pedidos pelo cliente | RF16 | P0 | PBI-28 |
| 30 | Gestão administrativa de pedidos | RF29 | P0 | PBI-29 |
| 31 | Wizard público de agendamento | RF20; RN01, RNF08 | P0 | PBI-30 |
| 32 | Checks obrigatórios de conformidade | RF23–RF25; RNF18 | P0 | PBI-31 |
| 33 | Conclusão pelo WhatsApp e integração da home | RF21; conclusão do RF07 | P0 | PBI-32 |
| 34 | Agenda manual do artista e administrador | RF22; RN08–RN10 | P0 | PBI-33 |
| 35 | Gestão do portfólio | RF19; RN10 | P0 | PBI-34 |
| 36 | Galeria pública de tatuagens | RF17 | P0 | PBI-35 |
| 37 | Busca no portfólio | RF18 | P0 | PBI-36 |
| 38 | Perfil unificado do cliente no admin | RF30 | P1 | PBI-37 |
| 39 | Configurações do site | RF31 | P1 | PBI-38 |
| 40 | Exclusão de conta e anonimização | RN12; RNF19 | P1 | PBI-39 |
| 41 | Busca textual no catálogo | Fase 1, item 13; modelo de dados | P1 | PBI-40 |
| 42 | Modalidades adicionais de frete | Complemento do RF12 | P1 | PBI-41 |
| 43 | Cancelamento e estorno administrativo | Complemento do RF29 | P1 | PBI-42 |
| 44 | Contato com proteção antibot | Fase 1, item 14; RNF08 | P1 | PBI-43 |
| 45 | Qualidade integrada e segurança | RNF02–RNF14, RNF17–RNF23, conforme aplicável | Entrega final | PBI-44 |
| 46 | Deploy, operação e restauração | RNF01, RNF07, RNF12, RNF15, RNF16, RNF23, RNF24 | Entrega final | PBI-45 |
| 47 | Validação com cliente e preparação da defesa | Fase 6; aceite global | Entrega final | PBI-46 |

## Etapa 1 — Acervo e vitrine

### PBI-16 — CRUD administrativo de artistas, estilos e tags

**Requisito:** RF28 · **Deps:** Sprint 1.

Construir as telas e operações administrativas sobre o modelo existente, reutilizando autenticação e controle de acesso.

- [ ] Cadastrar, listar, editar e excluir artistas, estilos e tags
- [ ] Vincular o artista ao usuário correspondente e aos estilos
- [ ] Validar entradas no servidor e apresentar erros de duplicidade de forma compreensível
- [ ] Impedir exclusões que violem vínculos existentes, com mensagem explicativa
- [ ] Restringir telas e operações de gestão ao papel ADMIN, inclusive no servidor
- [ ] Cobrir persistência, validações e tentativas de acesso sem permissão com testes

### PBI-17 — Upload e tratamento de imagens

**Requisito:** RF27 · **Apoio:** RNF09, RNF12, RNF14 · **Deps:** PBI-16.

Integrar o armazenamento Cloudflare R2 ao fluxo de imagens do acervo, conforme a arquitetura prevista no escopo.

- [ ] Disponibilizar upload com URL assinada de curta duração para operação autorizada
- [ ] Validar tipo e tamanho antes de emitir a assinatura e rejeitar arquivos inválidos
- [ ] Persistir a referência do objeto conforme o contrato do modelo, sem armazenar o arquivo no banco
- [ ] Gerar miniaturas e entregar imagens otimizadas e responsivas
- [ ] Exibir feedback de envio, sucesso e falha, permitindo nova tentativa
- [ ] Documentar configuração e variáveis de ambiente sem versionar credenciais
- [ ] Testar rejeição de arquivos e falhas de upload; registrar evidência de envio real ao R2

### PBI-18 — CRUD administrativo de obras

**Requisito:** RF26 · **Regras:** RN02, RN07, RN11 · **Deps:** PBI-17.

Permitir a gestão completa da obra, conectando os cadastros auxiliares e o upload de imagens.

- [ ] Cadastrar, listar, editar e excluir obras respeitando vínculos existentes
- [ ] Gerenciar título, slug, descrição, artista, técnica, dimensões, ano e tags
- [ ] Gerenciar múltiplas imagens, imagem principal, ordem e texto alternativo
- [ ] Armazenar preço em centavos inteiros e validar valores e quantidade de estoque
- [ ] Usar estoque padrão 1, editável pelo administrador
- [ ] Gerenciar destaque e situações rascunho, disponível e esgotada, mantendo coerência com o estoque
- [ ] Restringir todas as operações administrativas no servidor e preservar integridade dos vínculos
- [ ] Cobrir criação, edição, exclusão e entradas inválidas com testes de integração no PostgreSQL real

---

## Bloco B — Vitrine pública

### PBI-19 — Catálogo público

**Requisito:** RF09 · **Regras:** RN01, RN11 · **Deps:** PBI-18.

Construir a grade pública de obras integrada ao acervo persistido.

- [ ] Permitir consulta sem autenticação
- [ ] Exibir imagem, título, preço e disponibilidade das obras
- [ ] Implementar paginação e ordenação por recentes, preço e destaque
- [ ] Ocultar rascunhos e manter obras esgotadas identificadas no acervo, sem apresentá-las como disponíveis para compra
- [ ] Tratar catálogo vazio, páginas sem resultados e falhas de carregamento
- [ ] Conectar os itens à página da obra
- [ ] Testar paginação, ordenação e visibilidade conforme situação e estoque

### PBI-20 — Página da obra

**Requisito:** RF10 · **Regras:** RN01, RN11 · **Deps:** PBI-19.

Apresentar a obra em uma página pública com galeria e ficha técnica.

- [ ] Renderizar a galeria respeitando imagem principal e ordenação cadastradas
- [ ] Exibir ficha técnica, artista, descrição, preço e disponibilidade
- [ ] Identificar claramente obras esgotadas
- [ ] Tratar obra inexistente e impedir acesso público a rascunhos, inclusive por URL direta
- [ ] Usar imagens responsivas e textos alternativos
- [ ] Testar acesso público, galeria e estados de obra disponível, esgotada, inexistente e rascunho

### PBI-21 — Home com destaques

**Requisito:** RF07 · **Deps:** PBI-20.

Substituir a home provisória pela vitrine institucional, reutilizando a identidade visual e os componentes existentes.

- [ ] Apresentar conteúdo institucional do Kolô e obras em destaque vindas do banco
- [ ] Conectar navegação ao catálogo e às páginas das obras
- [ ] Tratar ausência de destaques sem quebrar o layout
- [ ] Oferecer chamada provisória para agendamento por contato WhatsApp com número configurado
- [ ] Não direcionar visitantes para rotas ainda inexistentes
- [ ] Testar destaques, links e estados vazios

O contato WhatsApp é uma solução provisória para a chamada da home. O wizard será implementado nos PBIs 31–33; o PBI-33 substituirá este contato provisório pelo acesso ao wizard.

---

## Bloco C — Institucional

### PBI-22 — Páginas institucionais

**Requisito:** RF08 · **Apoio:** RNF17, RNF18 · **Deps:** PBI-21.

Disponibilizar as páginas de privacidade, termos de uso e política de cancelamento.

- [ ] Publicar as três páginas com leitura adequada em dispositivos móveis e desktop
- [ ] Incluir links acessíveis no rodapé
- [ ] Revisar os textos com a equipe para refletir o escopo, os dados tratados e as funcionalidades disponíveis
- [ ] Não apresentar como implementados recursos futuros ou coleta de dados de saúde
- [ ] Validar navegação, renderização e acessibilidade das páginas

Os textos serão mantidos no projeto nesta sprint; a edição administrativa de políticas será implementada no PBI-39 (RF31).

---

## Etapa 2 — Loja e pagamentos

### PBI-23 — Endereço de entrega

**Referências:** RF05 · **Prioridade:** P0 · **Deps:** PBI-22.

- [ ] Permitir cadastrar e editar um único endereço por usuário autenticado
- [ ] Validar campos no servidor e impedir leitura ou alteração do endereço de outro usuário
- [ ] Testar persistência, atualização e isolamento entre usuários

### PBI-24 — Carrinho persistente

**Referências:** RF11 · **Prioridade:** P0 · **Deps:** PBI-23.

- [ ] Adicionar, remover e alterar quantidades de obras disponíveis; recalcular valores no servidor
- [ ] Persistir o carrinho do visitante por cookie e o do usuário no banco entre sessões; tratar a entrada na conta sem perder itens
- [ ] Testar quantidades inválidas, indisponibilidade e persistência; carrinho não reserva estoque

### PBI-25 — Reserva temporária e concorrência de estoque

**Referências:** RF15; RN02–RN04, RN06 · **Prioridade:** P0 · **Deps:** PBI-24.

- [ ] Reservar unidades no checkout por transação no PostgreSQL, sem ultrapassar estoque em acessos concorrentes
- [ ] Implementar expiração de 10 minutos e liberação por tarefa pg-boss, com reexecução segura
- [ ] Documentar e testar o ciclo entre reserva inicial e pagamento pendente de Pix/boleto conforme RN06; reconciliar aprovação após expiração sem vender além do estoque
- [ ] Testar concorrência, expiração e liberação usando PostgreSQL real

### PBI-26 — Checkout e criação do pedido

**Referências:** RF12; RN01, RN07 · **Prioridade:** P0 · **Deps:** PBI-25.

- [ ] Exigir autenticação e apresentar resumo, endereço, quantidades, frete e total calculados no servidor
- [ ] Usar retirada sem custo como modalidade mínima; opções adicionais entram no PBI-42
- [ ] Criar pedido pendente com cópias imutáveis de endereço, títulos e preços, integrado à reserva
- [ ] Testar carrinho vazio, estoque insuficiente, endereço inválido e tentativa de manipular valores

### PBI-27 — Pagamento Mercado Pago em sandbox

**Referências:** RF13; RNF10, RNF12 · **Prioridade:** P0 · **Deps:** PBI-26.

- [ ] Integrar Checkout Pro com Pix, cartão e boleto, sem trafegar dados de cartão pelo sistema
- [ ] Criar preferência com referência do pedido e URLs de retorno/notificação; tratar erros e nova tentativa
- [ ] Documentar credenciais de sandbox e realizar pagamentos de teste
- [ ] Não confirmar pedido nem baixar estoque pela URL de retorno do navegador

### PBI-28 — Webhook e confirmação do pedido

**Referências:** RF14; RN05, RN06, RNF11 · **Prioridade:** P0 · **Deps:** PBI-27.

- [ ] Validar assinatura do webhook e consultar o pagamento na API do provedor
- [ ] Conferir vínculo e valor do pagamento; confirmar pedido e baixar estoque somente após aprovação
- [ ] Garantir idempotência e atualização transacional; tratar rejeição, expiração e eventos fora de ordem
- [ ] Testar assinatura inválida, reenvio, concorrência e aprovação com PostgreSQL real; não enviar e-mail de pedido

### PBI-29 — Acompanhamento de pedidos pelo cliente

**Referências:** RF16 · **Prioridade:** P0 · **Deps:** PBI-28.

- [ ] Listar e detalhar apenas pedidos do usuário autenticado
- [ ] Exibir itens, valores, situação e rastreio quando disponível
- [ ] Testar tentativa de acesso a pedido alheio e estados pendente, pago e enviado

### PBI-30 — Gestão administrativa de pedidos

**Referências:** RF29 · **Prioridade:** P0 · **Deps:** PBI-29.

- [ ] Permitir ao ADMIN consultar pedidos e dados de pagamento, registrar rastreio e atualizar situação operacional
- [ ] Não permitir que alteração manual de status substitua a aprovação de pagamento pelo gateway
- [ ] Validar transições e testar permissões e reflexo do rastreio na área do cliente

## Etapa 3 — Agendamento

### PBI-31 — Wizard público de agendamento

**Referências:** RF20; RN01, RNF08 · **Prioridade:** P0 · **Deps:** PBI-30.

- [ ] Implementar etapas de nome, artista, estilo, região, tamanho e preferência de data/horário
- [ ] Permitir avançar e voltar com validação e limitação de taxa aplicável
- [ ] Não persistir solicitação, reservar horário ou coletar imagens e dados clínicos
- [ ] Testar navegação e validações; manter a conclusão indisponível até os PBIs 32 e 33

### PBI-32 — Checks obrigatórios de conformidade

**Referências:** RF23–RF25; RNF18 · **Prioridade:** P0 · **Deps:** PBI-31.

- [ ] Exibir avisos e exigir aceites de anamnese presencial, termo presencial e declaração de maioridade
- [ ] Bloquear conclusão se qualquer aceite estiver ausente
- [ ] Testar cada bloqueio sem coletar ou persistir respostas clínicas

### PBI-33 — Conclusão pelo WhatsApp e integração da home

**Referências:** RF21; conclusão do RF07 · **Prioridade:** P0 · **Deps:** PBI-32.

- [ ] Gerar link wa.me com nome, artista, estilo, região, tamanho, preferência de data/horário e aceites
- [ ] Codificar a mensagem corretamente e usar número de contato configurado
- [ ] Conectar a chamada da home ao wizard completo e testar o link sem enviar mensagem automaticamente
- [ ] Não criar agendamento no banco ao concluir o wizard

### PBI-34 — Agenda manual do artista e administrador

**Referências:** RF22; RN08–RN10 · **Prioridade:** P0 · **Deps:** PBI-33.

- [ ] Cadastrar horário combinado com contato, artista, início/fim e observações; usuário cliente é opcional
- [ ] Permitir ao artista operar somente a própria agenda e ao ADMIN gerenciar as agendas
- [ ] Armazenar UTC e apresentar America/Sao_Paulo; validar intervalos
- [ ] Testar sobreposição e concorrência no PostgreSQL real usando a constraint existente

## Etapa 4 — Portfólio

### PBI-35 — Gestão do portfólio

**Referências:** RF19; RN10 · **Prioridade:** P0 · **Deps:** PBI-34.

- [ ] Reutilizar upload para incluir, editar, ordenar, destacar e remover trabalhos
- [ ] Associar artista, estilos e região do corpo aos trabalhos
- [ ] Permitir gestão pelo ADMIN e pelo próprio artista, com autorização no servidor
- [ ] Testar persistência e impedir alterações em portfólio de outro artista

### PBI-36 — Galeria pública de tatuagens

**Referências:** RF17 · **Prioridade:** P0 · **Deps:** PBI-35.

- [ ] Exibir trabalhos cadastrados com imagens responsivas e textos alternativos
- [ ] Filtrar por artista, estilo e região do corpo
- [ ] Testar filtros combinados, estado vazio e acesso sem autenticação

### PBI-37 — Busca no portfólio

**Referências:** RF18 · **Prioridade:** P0 · **Deps:** PBI-36.

- [ ] Buscar trabalhos por estilo e palavra-chave, integrada aos filtros
- [ ] Tratar consulta vazia e ausência de resultados
- [ ] Testar resultados e parâmetros inválidos

## Etapa 5 — Complementos P1 do projeto

### PBI-38 — Perfil unificado do cliente no admin

**Referências:** RF30 · **Prioridade:** P1 · **Deps:** PBI-37.

- [ ] Permitir ao ADMIN consultar dados do cliente e histórico de compras
- [ ] Restringir acesso no servidor e exibir estados sem compras
- [ ] Testar permissões e correspondência entre cliente e pedidos

### PBI-39 — Configurações do site

**Referências:** RF31 · **Prioridade:** P1 · **Deps:** PBI-38.

- [ ] Permitir ao ADMIN editar contato, horários, textos institucionais e políticas
- [ ] Integrar os valores às páginas públicas e ao número usado no WhatsApp
- [ ] Validar entradas no servidor e testar persistência e controle de acesso

### PBI-40 — Exclusão de conta e anonimização

**Referências:** RN12; RNF19 · **Prioridade:** P1 · **Deps:** PBI-39.

- [ ] Permitir exclusão da própria conta com confirmação explícita na interface
- [ ] Anonimizar dados pessoais preservando pedidos pagos e integridade contábil
- [ ] Revogar sessões e testar anonimização e preservação dos pedidos no PostgreSQL real

### PBI-41 — Busca textual no catálogo

**Referências:** Fase 1, item 13; modelo de dados · **Prioridade:** P1 · **Deps:** PBI-40.

- [ ] Adicionar busca textual tolerante a acentos, integrada à paginação e ordenação
- [ ] Preservar regras de visibilidade de rascunhos e esgotadas
- [ ] Testar acentos, ausência de resultados e consultas inválidas; não adicionar filtros de catálogo adiados

### PBI-42 — Modalidades adicionais de frete

**Referências:** Complemento do RF12 · **Prioridade:** P1 · **Deps:** PBI-41.

- [ ] Complementar retirada com valor fixo e tabela de frete
- [ ] Calcular modalidade e valor no servidor e preservar cópia no pedido
- [ ] Testar totais e indisponibilidade de modalidade; sem integração com Correios

### PBI-43 — Cancelamento e estorno administrativo

**Referências:** Complemento do RF29 · **Prioridade:** P1 · **Deps:** PBI-42.

- [ ] Permitir ao ADMIN cancelar pedido não pago e solicitar estorno pelo gateway
- [ ] Conciliar estado do pagamento, pedido e liberação de reserva sem duplicar operações
- [ ] Testar falhas, reenvios e permissões no sandbox; não implementar política automática de cancelamento

### PBI-44 — Contato com proteção antibot

**Referências:** Fase 1, item 14; RNF08 · **Prioridade:** P1 · **Deps:** PBI-43.

- [ ] Disponibilizar formulário de contato com validação no servidor e persistência em contact_message
- [ ] Validar Cloudflare Turnstile e limitar taxa de envio
- [ ] Testar rejeição de token inválido e entradas inválidas; sem novos e-mails transacionais

## Etapa 6 — Qualidade, operação e entrega

### PBI-45 — Qualidade integrada e segurança

**Referências:** RNF02–RNF14, RNF17–RNF23, conforme aplicável · **Prioridade:** Entrega final · **Deps:** PBI-44.

- [ ] Configurar Playwright real e axe-core; o script E2E atual é apenas placeholder
- [ ] Automatizar compra sandbox até confirmação, wizard até wa.me, cadastro de obra e gestão/consulta do portfólio
- [ ] Executar regressão de autenticação, permissões, validações, CSRF, XSS, rate limit e integridade transacional
- [ ] Validar 320, 768, 1440 e 1920 px, teclado, foco, contraste e textos alternativos; axe-core sem violações críticas
- [ ] Medir catálogo e ficha: Lighthouse ≥ 90 e LCP abaixo de 2,5 s em 4G simulado; corrigir falhas
- [ ] Executar gates, revisar dependências sem vulnerabilidades altas/críticas e registrar evidências

### PBI-46 — Deploy, operação e restauração

**Referências:** RNF01, RNF07, RNF12, RNF15, RNF16, RNF23, RNF24 · **Prioridade:** Entrega final · **Deps:** PBI-45.

- [ ] Preparar Docker Compose, app, PostgreSQL, Caddy e HTTPS na VPS; não expor banco à internet
- [ ] Configurar CI com lint, tipagem, testes e build; documentar publicação e rollback por imagem
- [ ] Configurar segredos, reinício automático, logs estruturados e captura de exceções
- [ ] Configurar backup diário com retenção mínima de 7 dias e comprovar restauração
- [ ] Validar HTTPS, cabeçalhos e aplicação implantada; publicação/push somente com autorização humana exigida pelo repositório

### PBI-47 — Validação com cliente e preparação da defesa

**Referências:** Fase 6; aceite global · **Prioridade:** Entrega final · **Deps:** PBI-46.

- [ ] Executar roteiro assistido com o cliente e registrar feedback e correções
- [ ] Preparar dados de demonstração, roteiro da banca e evidências dos fluxos completos
- [ ] Conferir cobertura RF01–RF31 e RN/RNF, distinguindo concluídos e eventuais P1 adiados
- [ ] Registrar resultado final em 18/10 e listar qualquer pendência sem declarar conclusão integral enquanto houver itens abertos

## Marcos até 18/10

| Janela-alvo | Sequência | Marco |
| --- | --- | --- |
| 05–07/10 | 16 → 17 → 18 → 19 → 20 → 21 → 22 | Acervo e vitrine integrados |
| 08–11/10 | 23 → 24 → 25 → 26 → 27 → 28 → 29 → 30 | Compra sandbox, confirmação e gestão de pedidos |
| 12–13/10 | 31 → 32 → 33 → 34 | Wizard até WhatsApp e agenda manual |
| 14/10 | 35 → 36 → 37 | Portfólio gerenciado e consultável |
| 15–16/10 | 38 → 39 → 40 → 41 → 42 → 43 → 44 | Complementos P1 ou adiamentos explicitamente registrados |
| 17–18/10 | 45 → 46 → 47 | Qualidade, operação, validação e defesa |

Não há sobreposição planejada de PBIs. Se uma entrega ultrapassar sua janela, a seguinte continua bloqueada pelo aceite anterior. Registrar progresso e reavaliar a viabilidade a cada marco. Não preencher o período de fechamento com novas funcionalidades.

## Cobertura do projeto

| Parte do escopo | Onde está contemplada |
| --- | --- |
| Fundação, autenticação e perfil — RF01–RF04 e RF06 | Sprint 1, concluída |
| Endereço — RF05 | PBI-23 |
| Home, políticas, catálogo e ficha — RF07–RF10 | PBIs 19–22; home conectada ao wizard no 33 |
| Carrinho, checkout, pagamento, reserva e pedidos — RF11–RF16 | PBIs 24–29; complemento de frete no 42 |
| Portfólio — RF17–RF19 | PBIs 35–37 |
| Wizard, WhatsApp, agenda e checks — RF20–RF25 | PBIs 31–34 |
| Obras, imagens e cadastros — RF26–RF28 | PBIs 16–18 |
| Administração de pedidos — RF29 | PBIs 30 e 43 |
| Clientes e configurações — RF30–RF31 | PBIs 38–39 |
| Anonimização — RN12/RNF19 | PBI-40 |
| Busca no catálogo e contato — P1 do roteiro | PBIs 41 e 44 |
| Qualidade, requisitos não funcionais, produção e defesa | Critérios de cada PBI e PBIs 45–47 |

“Projeto completo” significa o escopo v2.2, incluindo P1, qualidade e operação. Itens expressamente fora de escopo ou adiados na seção 14 da especificação não entram: 3D, páginas públicas de artista, filtros de catálogo, dados de saúde, API oficial WhatsApp, motor de slots, split de pagamentos e demais exclusões permanecem fora.

## Definição de pronto e validação

Reutilizar autenticação, tokens visuais e schema existentes. Respeitar APIs públicas dos módulos em `src/modules/*/index.ts`; mudanças de modelo exigem migração e revisão. Seguir o ciclo de desenvolvimento e revisão do repositório.

Cada PBI só libera o próximo com critérios atendidos, testes pertinentes verdes e PR aprovado por integrante diferente do autor. No fechamento integrado, executar:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

- Usar PostgreSQL real nos testes de escrita transacional, reserva, webhook e agenda.
- O E2E só conta após a configuração de testes reais; cada RF P0 deve ter cobertura automatizada.
- Registrar resultados, capturas, evidências das integrações e roteiro da demonstração.
- Concluir integralmente o projeto exige todos os PBIs aceitos. Se houver P1 adiado, registrar entrega P0 com pendências, sem afirmar que o projeto inteiro foi concluído.

## Premissas e impedimentos

Disponibilizar acesso a R2, Mercado Pago sandbox, número WhatsApp, VPS/domínio e, para o contato P1, Turnstile antes dos respectivos PBIs. Preparar credenciais e acesso não autoriza publicar ou enviar mensagens externas automaticamente. Respeitar a autorização humana para push e produção exigida pelo repositório.

Registrar impedimentos e adiamentos com data, impacto e ação necessária. A ausência de registros não comprova disponibilidade das integrações.

| Data | PBI | Impedimento ou adiamento | Impacto / ação necessária | Situação |
| --- | --- | --- | --- | --- |
| — | — | Nenhum registrado | — | — |
