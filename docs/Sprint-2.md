# Kolô — Sprint 2: Projeto completo e dependências técnicas

**Período-alvo:** 05 a 18/10/2026.
**Equipe:** Caio Alves, Caio Oliveira, Guilherme, Gustavo e Robert.
**Meta:** planejar todo o trabalho restante do escopo v2.2, do acervo à entrega final.
**Fontes:** [Ordem de execução](ORDEM-DE-EXECUCAO.md) · [Escopo e Stack v2.2](ESCOPO-E-STACK.md) · [DER](DER.md).
**Ponto de partida:** [Sprint 1](SPRINT-1.md) concluída; não reabrir nem alterar seu arquivo.

## Como executar

A numeração organiza o backlog; **o início de um PBI depende dos pré-requisitos técnicos da tabela, não do número anterior**. PBIs com as dependências atendidas podem ser executados em paralelo pelos integrantes. Os responsáveis não são predefinidos neste documento.

- A tabela mostra as entregas consumidas por cada PBI. Quando há vários pré-requisitos, todos precisam estar disponíveis para sua integração e aceite completos. As dependências transitivas continuam valendo, mesmo quando não são repetidas.
- Interfaces e funções isoladas podem ser preparadas antes, com contratos combinados e dados de exemplo. Isso não elimina a dependência nem comprova a integração real. Compartilhar o contrato de campos, validações e API pública antes de dividir trabalho que usa os mesmos dados.
- Cada entrega inclui implementação, testes do comportamento, revisão por outro integrante e PR aprovado. Integrar os pré-requisitos na base comum antes do aceite de seus dependentes; usar branches próprias por PBI e coordenar alterações nos arquivos compartilhados.
- Registrar PR, evidências, migrações/configurações necessárias e impedimentos na passagem entre integrantes.
- P0 é indispensável à defesa. P1 pode avançar em paralelo quando seus pré-requisitos estiverem prontos, mas a disponibilidade de um P1 não lhe dá prioridade sobre P0. Qualquer adiamento deve ter justificativa e permanecer registrado como pendência.
- Os números continuam a Sprint 1 e não correspondem à coluna “#” do roteiro original. O fechamento global está nos PBIs 45–47.

**Viabilidade:** o roteiro original prevê oito semanas. As janelas até 18/10 são metas de acompanhamento, não estimativas validadas nem garantia de conclusão. O paralelismo reduz esperas, mas continua limitado à capacidade dos cinco integrantes e às revisões e integrações necessárias. Reavaliar a viabilidade a cada marco.

## Visão geral — dependências técnicas

Todos os PBIs herdam a base da Sprint 1, já concluída. “Sprint 1” na última coluna significa que não há outro PBI desta sprint bloqueando o início. Nos PBIs 45 e 46, a tabela distingue preparação antecipada e fechamento/publicação.

| PBI | Entrega                                      | Requisitos                                      | Prioridade    | Dependências técnicas                                         |
| --- | -------------------------------------------- | ----------------------------------------------- | ------------- | ------------------------------------------------------------- |
| 16  | CRUD de artistas, estilos e tags             | RF28                                            | P0            | Sprint 1 (concluída)                                          |
| 17  | Upload e tratamento de imagens               | RF27                                            | P0            | Sprint 1 (concluída)                                          |
| 18  | CRUD de obras                                | RF26                                            | P0            | PBI-16, PBI-17                                                |
| 19  | Catálogo público                             | RF09                                            | P0            | PBI-18                                                        |
| 20  | Página da obra                               | RF10                                            | P0            | PBI-18                                                        |
| 21  | Home com destaques                           | RF07                                            | P0            | PBI-19, PBI-20                                                |
| 22  | Páginas institucionais                       | RF08                                            | P0            | Sprint 1 (concluída)                                          |
| 23  | Endereço de entrega                          | RF05                                            | P0            | Sprint 1 (concluída)                                          |
| 24  | Carrinho persistente                         | RF11                                            | P0            | PBI-18                                                        |
| 25  | Reserva temporária e concorrência de estoque | RF15; RN02–RN04, RN06                           | P0            | PBI-18                                                        |
| 26  | Checkout e criação do pedido                 | RF12; RN01, RN07                                | P0            | PBI-23, PBI-24, PBI-25                                        |
| 27  | Pagamento Mercado Pago em sandbox            | RF13; RNF10, RNF12                              | P0            | PBI-26                                                        |
| 28  | Webhook e confirmação do pedido              | RF14; RN05, RN06, RNF11                         | P0            | PBI-25, PBI-26, PBI-27                                        |
| 29  | Acompanhamento de pedidos pelo cliente       | RF16                                            | P0            | PBI-26                                                        |
| 30  | Gestão administrativa de pedidos             | RF29                                            | P0            | PBI-26                                                        |
| 31  | Wizard público de agendamento                | RF20; RN01, RNF08                               | P0            | PBI-16                                                        |
| 32  | Checks obrigatórios de conformidade          | RF23–RF25; RNF18                                | P0            | PBI-31                                                        |
| 33  | Conclusão pelo WhatsApp e integração da home | RF21; conclusão do RF07                         | P0            | PBI-21, PBI-31, PBI-32                                        |
| 34  | Agenda manual do artista e administrador     | RF22; RN08–RN10                                 | P0            | PBI-16                                                        |
| 35  | Gestão do portfólio                          | RF19; RN10                                      | P0            | PBI-16, PBI-17                                                |
| 36  | Galeria pública de tatuagens                 | RF17                                            | P0            | PBI-35                                                        |
| 37  | Busca no portfólio                           | RF18                                            | P0            | PBI-36                                                        |
| 38  | Perfil unificado do cliente no admin         | RF30                                            | P1            | PBI-26                                                        |
| 39  | Configurações do site                        | RF31                                            | P1            | PBI-21, PBI-22, PBI-33                                        |
| 40  | Exclusão de conta e anonimização             | RN12; RNF19                                     | P1            | PBI-26                                                        |
| 41  | Busca textual no catálogo                    | Fase 1, item 13; modelo de dados                | P1            | PBI-19                                                        |
| 42  | Modalidades adicionais de frete              | Complemento do RF12                             | P1            | PBI-26                                                        |
| 43  | Cancelamento e estorno administrativo        | Complemento do RF29                             | P1            | PBI-25, PBI-28, PBI-30                                        |
| 44  | Contato com proteção antibot                 | Fase 1, item 14; RNF08                          | P1            | Sprint 1 (concluída)                                          |
| 45  | Qualidade integrada e segurança              | RNF02–RNF14, RNF17–RNF23, conforme aplicável    | Entrega final | Sprint 1 para preparar; PBIs 16–37 e P1 incluídos para fechar |
| 46  | Deploy, operação e restauração               | RNF01, RNF07, RNF12, RNF15, RNF16, RNF23, RNF24 | Entrega final | Sprint 1 para preparar; PBI-45 para publicar a versão final   |
| 47  | Validação com cliente e preparação da defesa | Fase 6; aceite global                           | Entrega final | PBI-45, PBI-46                                                |

## Quais PBIs podem avançar em paralelo

Este quadro mostra a primeira liberação possível por dependências, não datas nem exigência de finalizar uma camada inteira. **Cada PBI é liberado assim que seus próprios pré-requisitos estiverem integrados**, mesmo que outros itens da mesma camada ainda estejam em andamento. Distribuir os itens liberados entre os cinco integrantes, respeitando prioridade e capacidade.

| Liberação        | PBIs tecnicamente liberados em conjunto                |
| ---------------- | ------------------------------------------------------ |
| Base da Sprint 1 | PBI-16, PBI-17, PBI-22, PBI-23, PBI-44                 |
| Camada 1         | PBI-18, PBI-31, PBI-34, PBI-35                         |
| Camada 2         | PBI-19, PBI-20, PBI-24, PBI-25, PBI-32, PBI-36         |
| Camada 3         | PBI-21, PBI-26, PBI-37, PBI-41                         |
| Camada 4         | PBI-27, PBI-29, PBI-30, PBI-33, PBI-38, PBI-40, PBI-42 |
| Camada 5         | PBI-28, PBI-39                                         |
| Camada 6         | PBI-43                                                 |

Além desses grupos, a preparação do PBI-45 e da infraestrutura do PBI-46 pode acompanhar todas as camadas. Esses dois PBIs só recebem aceite final nos gates indicados na tabela principal.

Exemplos de divisão técnica:

- **Agora:** PBI-17, PBI-22, PBI-23 e PBI-44 podem começar independentemente do PBI-16. Como o PBI-16 já foi integrado, wizard (31) e agenda manual (34) também estão liberados; obras (18) e gestão do portfólio (35) aguardam o upload (17). Reservar capacidade para revisões e preparação de testes/infraestrutura.
- **Após 16 e 17:** uma frente trabalha no CRUD de obras (18), outra na gestão do portfólio (35); wizard (31) e agenda manual (34) precisam apenas de 16 e podem já estar em andamento.
- **Após 18:** catálogo (19), ficha da obra (20), carrinho (24) e reservas (25) podem ser desenvolvidos por frentes diferentes.
- **Após 26:** pagamento (27), consulta de pedidos (29), gestão de pedidos (30), perfil administrativo do cliente (38), anonimização (40) e frete adicional (42) estão liberados, com prioridade para P0.

## Etapa 1 — Acervo e vitrine

### PBI-16 — CRUD administrativo de artistas, estilos e tags

**Requisito:** RF28 · **Deps:** Sprint 1 (concluída).

Construir as telas e operações administrativas sobre o modelo existente, reutilizando autenticação e controle de acesso.

- [x] Cadastrar, listar, editar e excluir artistas, estilos e tags
- [x] Vincular o artista ao usuário correspondente e aos estilos
- [x] Validar entradas no servidor e apresentar erros de duplicidade de forma compreensível
- [x] Impedir exclusões que violem vínculos existentes, com mensagem explicativa
- [x] Restringir telas e operações de gestão ao papel ADMIN, inclusive no servidor
- [x] Cobrir persistência, validações e tentativas de acesso sem permissão com testes

**Situação:** implementação do PBI-16 integrada à `main` pelo PR #28. A entrega está disponível para integrar os PBIs que consomem artistas, estilos e tags (18, 31, 34 e 35). O PBI-17 não depende tecnicamente desta entrega.

**Entregas:** telas `/admin/artistas`, `/admin/estilos` e `/admin/tags`, com acesso pelo cabeçalho para ADMIN. Cadastro de artista cria conta, credencial e perfil em transação ou vincula uma conta CLIENTE/ARTISTA ativa sem perfil. Exclusão preserva a conta, bloqueia vínculos existentes e revoga sessões quando o papel passa de ARTISTA para CLIENTE. O primeiro acesso do ADMIN pode ser provisionado pelo seed usando `SEED_ADMIN_PASSWORD`, conforme o README.

**Evidências:** `npm run lint`, `npm run typecheck` e `npm test` passaram (115 testes); `npm run test:integration` passou com PostgreSQL real (43 testes, incluindo 6 do CRUD e o novo teste de senha do seed). Revisão independente de código sem achados. `npm run build -- --webpack` passou; o build padrão com Turbopack encontrou restrição de porta interna no ambiente. Validação visual em navegador ainda não realizada.

### PBI-17 — Upload e tratamento de imagens

**Requisito:** RF27 · **Apoio:** RNF09, RNF12, RNF14 · **Deps:** Sprint 1 (concluída).

Integrar o armazenamento Cloudflare R2 ao fluxo de imagens do acervo, conforme a arquitetura prevista no escopo.

- [x] Disponibilizar upload com URL assinada de curta duração para operação autorizada
- [x] Validar tipo e tamanho antes de emitir a assinatura e rejeitar arquivos inválidos
- [ ] Persistir a referência do objeto conforme o contrato do modelo, sem armazenar o arquivo no banco
- [ ] Gerar miniaturas e entregar imagens otimizadas e responsivas
- [x] Exibir feedback de envio, sucesso e falha, permitindo nova tentativa
- [x] Documentar configuração e variáveis de ambiente sem versionar credenciais
- [x] Testar rejeição de arquivos e falhas de upload; registrar evidência de envio real ao R2

**Decisões (registradas em 05/10/2026):** formatos JPEG, PNG e WebP, até 5 MB, sem SVG no upload. Miniatura fixa gerada com `sharp` (WebP, ~400 px), demais variantes pelo `next/image`; o `sharp` é uma dependência nova em relação à stack original do escopo. ADMIN envia para qualquer artista e destino; ARTISTA só para o próprio portfólio (obras são geridas só pelo ADMIN, ESCOPO §7 e RN10).

**Situação:** integrado à `main` pelo PR #33 em 06/10/2026, aprovado por outro integrante. A miniatura (WebP, até 400 px) já é gerada no pós-envio; o item "Gerar miniaturas e entregar imagens otimizadas e responsivas" segue desmarcado só pela parte da entrega responsiva.

**Entregas:** módulo `src/modules/media` (validação, chave do objeto gerada no servidor, autorização relida no banco, assinatura no R2, miniatura e URL pública), Server Actions em `src/app/imagens/actions.ts` e componente `UploadImagem` com envio, sucesso, falha e nova tentativa. A API pública expõe `chaveMiniatura` para o PBI-18 e o PBI-35 derivarem a miniatura a partir da chave gravada.

**Pendências (fora do PBI-17):** (a) gravar a chave em `artwork_image.url` e `portfolio_item.imagem_url` fica com o PBI-18 e o PBI-35, por isso o item de persistência segue desmarcado; (b) a entrega otimizada e responsiva só se confirma quando uma página renderizar a imagem com `next/image` (o host do R2 já está liberado); (c) o envio pela tela será exercitado de ponta a ponta quando o PBI-18/35 usar o `UploadImagem`.

**Evidências:** `npm run lint` e `npm run typecheck` sem erros; `npm run test:unit` com 141 testes e `npm run test:integration` com 56 testes passando (PostgreSQL real, R2 simulado); `npm run build` compilando. Revisão de código com os achados corrigidos em TDD (ARTISTA só no próprio portfólio, esquema Zod na entrada, objeto inexistente, original apagado só quando o arquivo não decodifica, preservado em outras falhas, campo com id próprio).

**Evidência de envio real ao R2 (05/10/2026, bucket `kolo-imagens`, artista fictício `00000000-0000-4000-8000-000000000017`):** com o código do módulo e sem simulação, uma URL assinada recusou com 403 um corpo de tamanho diferente e um `Content-Type` diferente do assinado e aceitou o correto com 200; o `armazenamentoR2()` leu o original e gravou a miniatura `image/webp` de 400×267; os dois objetos responderam 200 pela URL pública. No navegador, um `PUT` assinado feito a partir de `http://localhost:3000` retornou 200 (CORS), e o mesmo `PUT` a partir de `https://example.com` foi bloqueado. O painel do Cloudflare listou o PNG original, a miniatura e o PNG enviado pelo navegador. O teste revelou que o SDK embutia na URL assinada o checksum de um corpo vazio; corrigido com `requestChecksumCalculation: "WHEN_REQUIRED"` e coberto por teste. Os objetos de teste foram removidos do bucket ao final.

### PBI-18 — CRUD administrativo de obras

**Requisito:** RF26 · **Regras:** RN02, RN07, RN11 · **Deps:** PBI-16, PBI-17.

Permitir a gestão completa da obra, conectando os cadastros auxiliares e o upload de imagens.

**Contrato do upload (PBI-17):** só gravar em `artwork_image.url` uma chave que `processarImagem` devolveu com sucesso, e nunca uma chave recebida direto do navegador: é o `processarImagem` que confirma que o objeto é uma imagem JPEG, PNG ou WebP de verdade. Ao remover uma imagem da obra, remover também o original e a miniatura do bucket (a chave da miniatura sai de `chaveMiniatura`, na API pública do módulo `media`).

- [x] Cadastrar, listar, editar e excluir obras respeitando vínculos existentes
- [x] Gerenciar título, slug, descrição, artista, técnica, dimensões, ano e tags
- [x] Gerenciar múltiplas imagens, imagem principal, ordem e texto alternativo
- [x] Armazenar preço em centavos inteiros e validar valores e quantidade de estoque
- [x] Usar estoque padrão 1, editável pelo administrador
- [x] Gerenciar destaque e situações rascunho, disponível e esgotada, mantendo coerência com o estoque
- [x] Restringir todas as operações administrativas no servidor e preservar integridade dos vínculos
- [x] Cobrir criação, edição, exclusão e entradas inválidas com testes de integração no PostgreSQL real

**Decisões (registradas em 05/10/2026):**

- O admin escolhe só entre rascunho e publicada. Publicada fica disponível com estoque > 0 e esgotada com 0, pela função `situacaoPorEstoque`, que os PBIs 25 e 28 devem reutilizar.
- Obra em carrinho ou pedido recebe exclusão lógica (`excluido_em`); sem vínculo, é apagada de vez, com as imagens no R2.
- Publicar exige pelo menos uma imagem, e o texto alternativo é obrigatório.
- A obra nasce como rascunho, e as imagens entram na edição.
- Contrato completo em [PBI-18](features/PBI-18.md).

**Situação:** integrado à `main` pelo PR #35 em 07/10/2026, aprovado por outro integrante. A entrega está disponível para os PBIs 19, 20, 24 e 25.

**Entregas:**

- Módulo `src/modules/catalog`: regras, validação, obras e imagens, com API pública em `index.ts` e funções puras para o navegador em `cliente.ts`.
- Tela `/admin/obras`, com link no menu do admin, e Server Actions em `src/app/admin/obras/actions.ts`.
- Componentes `GestaoObras` e `GestaoImagensObra`; este usa o `UploadImagem` do PBI-17.
- `comoAdmin`, `validar` e `ErroGestao` agora saem pela API pública de `artists`.
- Correção no teste do seed do wizard, que falhava no Windows (`execFileSync("npx")`).

**Evidências:**

- `npm run lint` e `npm run typecheck` sem erros.
- `npm test` com 197 testes, e a integração com 71 testes no PostgreSQL real (11 novos do catálogo, R2 simulado).
- `npm run build` compilando.
- No navegador, com o Postgres local:
  - cadastro como rascunho;
  - publicação recusada sem imagem;
  - disponível e esgotada pelo estoque;
  - última imagem protegida;
  - exclusão;
  - sem rolagem horizontal em 320 e 1440 px;
  - axe-core 4.10.2 sem violações.

**Pendências:**

- O envio real de imagem pela tela depende das chaves do R2 no `.env`. O fluxo está testado com o R2 simulado, e o envio real ao bucket já foi comprovado no PBI-17.
- Os PBIs 19, 20 e 21 precisam filtrar `excluido_em IS NULL` e a situação.

---

## Vitrine pública

### PBI-19 — Catálogo público

**Requisito:** RF09 · **Regras:** RN01, RN11 · **Deps:** PBI-18.

Construir a grade pública de obras integrada ao acervo persistido.

- [x] Permitir consulta sem autenticação
- [x] Exibir imagem, título, preço e disponibilidade das obras
- [x] Implementar paginação e ordenação por recentes, preço e destaque
- [x] Ocultar rascunhos e manter obras esgotadas identificadas no acervo, sem apresentá-las como disponíveis para compra
- [x] Tratar catálogo vazio, páginas sem resultados e falhas de carregamento
- [x] Conectar os itens à página da obra
- [x] Testar paginação, ordenação e visibilidade conforme situação e estoque

**Decisões:**

- Migração `0005`: `artwork.criado_em`, preenchida pelo banco, para a ordenação por "mais recentes".
- Em qualquer ordenação, as disponíveis vêm antes das esgotadas; 12 obras por página; página e ordenação ficam na URL.
- O card só leva à página da obra, sem botão de compra. Sem busca (PBI-41) nem filtros.
- Contrato completo em [PBI-19](features/PBI-19.md).

**Situação:** implementação local validada na branch `feat/pbi-19-catalogo`, feita sobre a do PBI-20 (PR #41): integrar depois dele. Para encerrar o DoD, faltam a revisão de outro integrante e a aprovação do PR. A conferência com as fotos reais do R2 ficou pendente.

### PBI-20 — Página da obra

**Requisito:** RF10 · **Regras:** RN01, RN11 · **Deps:** PBI-18.

Apresentar a obra em uma página pública com galeria e ficha técnica.

- [x] Renderizar a galeria respeitando imagem principal e ordenação cadastradas
- [x] Exibir ficha técnica, artista, descrição, preço e disponibilidade
- [x] Identificar claramente obras esgotadas
- [x] Tratar obra inexistente e impedir acesso público a rascunhos, inclusive por URL direta
- [x] Usar imagens responsivas e textos alternativos
- [x] Testar acesso público, galeria e estados de obra disponível, esgotada, inexistente e rascunho

**Decisões:**

- Rota `/obras/[slug]`; rascunho, arquivada e inexistente respondem 404 com "Obra não encontrada".
- Entram também o botão de WhatsApp com a obra na mensagem, "Outras obras do artista" (até 4) e a trilha de navegação. Sem seletor de quantidade: o botão adiciona 1.
- `CardObra` (dados e componente) fica pronto para o catálogo (PBI-19) e a home (PBI-21).
- Contrato completo em [PBI-20](features/PBI-20.md).

**Situação:** implementação local validada na branch `feat/pbi-20-pagina-obra`. Para encerrar o DoD, faltam a revisão de outro integrante e a aprovação do PR. A conferência com as fotos reais do R2 ficou pendente (sem `R2_PUBLIC_URL` no ambiente da validação).

**Pendências:**

- Os links para `/obras` (trilha e "Voltar ao catálogo") dependem do PBI-19. Resolvido pelo PBI-19.
- `artwork` não tem data de cadastro: o PBI-19 precisa definir a ordenação por "recentes". Resolvido pelo PBI-19 (migração `0005`).

### PBI-21 — Home com destaques

**Requisito:** RF07 · **Deps:** PBI-19, PBI-20.

Substituir a home provisória pela vitrine institucional, reutilizando a identidade visual e os componentes existentes.

- [x] Apresentar conteúdo institucional do Kolô e obras em destaque vindas do banco
- [x] Conectar navegação ao catálogo e às páginas das obras
- [x] Tratar ausência de destaques sem quebrar o layout
- [x] Oferecer chamada provisória para agendamento por contato WhatsApp com número configurado
- [x] Não direcionar visitantes para rotas ainda inexistentes
- [x] Testar destaques, links e estados vazios

O contato WhatsApp é uma solução provisória para a chamada da home. O wizard será implementado nos PBIs 31–33; o PBI-33 substituirá este contato provisório pelo acesso ao wizard.

**Decisões (registradas em 08/10/2026):**

- Destaques: até 4 obras marcadas no admin, publicadas e não arquivadas; disponíveis antes das esgotadas e, entre elas, as mais recentes. Sem obra marcada, a seção some.
- A chamada de tatuagem abre o WhatsApp do ateliê com mensagem pronta; o bloco de tatuagem descreve o fluxo de hoje (conversa, anamnese e termo no estúdio). Mesmo formato para o orçamento de mural.
- O menu "Tatuagem" do cabeçalho passa a levar a `/#tatuagem` (a rota `/tatuagem` não existe). Um teste confere que todo link interno da home e do cabeçalho tem página.
- Contrato completo em [PBI-21](features/PBI-21.md).

**Situação:** implementação local validada na branch `feat/pbi-21-home`. Para encerrar o DoD, faltam a revisão de outro integrante e a aprovação do PR. A conferência com as fotos reais do R2 ficou pendente.

**Entregas:**

- `listarDestaques` em `src/modules/catalog` e `linkWhatsApp` em `src/lib/contato.ts`.
- Componente `VitrineDestaques` e a nova `src/app/page.tsx`: topo, destaques, bloco de tatuagem e faixa de murais.
- Menu "Tatuagem" do cabeçalho apontando para `/#tatuagem`.

**Evidências:**

- `npm run lint`, `npm run typecheck` e `npm run build` sem erros; a home é renderizada a cada requisição (`ƒ /`).
- `npm run test:unit` com 297 testes (10 novos) e a integração com 125 testes no PostgreSQL real (1 novo, dos destaques), em execução sequencial.
- No navegador, com o Postgres local, em 1280, 768, 375 e 320 px: com e sem obras marcadas, sem rolagem horizontal, axe-core sem violações e console sem erros. A conferência achou o botão de orçamento de mural passando da borda no celular, corrigido.

**Pendências:**

- PBI-33: trocar o WhatsApp do bloco de tatuagem pelo wizard e reescrever os três passos.
- Portfólio público: trocar o menu "Tatuagem" de `/#tatuagem` para a rota própria.

---

## Institucional

### PBI-22 — Páginas institucionais

**Requisito:** RF08 · **Apoio:** RNF17, RNF18 · **Deps:** Sprint 1 (concluída).

Disponibilizar as páginas de privacidade, termos de uso e política de cancelamento.

- [x] Publicar as três páginas com leitura adequada em dispositivos móveis e desktop
- [x] Incluir links acessíveis no rodapé
- [ ] Revisar os textos com a equipe para refletir o escopo, os dados tratados e as funcionalidades disponíveis
- [x] Não apresentar como implementados recursos futuros ou coleta de dados de saúde
- [x] Validar navegação, renderização e acessibilidade das páginas

Os textos serão mantidos no projeto nesta sprint; a edição administrativa de políticas será implementada no PBI-39 (RF31).

**Situação:** integrado à `main` pelo PR #31 em 06/10/2026, aprovado por outro integrante. O item de revisão dos textos com a equipe segue desmarcado até a equipe confirmar essa revisão.

**Entregas:** páginas `/politicas/privacidade`, `/politicas/termos` e `/politicas/cancelamento`, todas montadas pelo componente `DocumentoPolitica`, com índice das três políticas (a atual marcada), índice "Nesta página" com âncoras e cartão "Dúvidas?". Os textos ficam em `src/app/politicas/*/conteudo.ts` como dados puros, prontos para o `site_setting` do PBI-39, e cobrem o escopo P0 da v2.2. O inventário da privacidade vem do schema (RNF17). E-mail e WhatsApp vêm de `src/lib/contato.ts`, também usado pelo rodapé. Links dentro do texto só aceitam endereços seguros.

**Evidências:** `npm run lint`, `npm run typecheck` e `npm test` passaram (139 testes, 24 novos). `npm run build` passou. No navegador, as três páginas foram conferidas:

- em 320, 768 e 1920 px, sem rolagem horizontal;
- com navegação por teclado e foco visível;
- com as âncoras parando abaixo do cabeçalho fixo;
- com o axe-core 4.10.2 (WCAG 2.0, 2.1 e 2.2 A/AA, mais boas práticas) sem violações.

**Pendências registradas:**

- Confirmar com o cliente razão social, CNPJ e endereço, que entram na privacidade, e as regras de remarcação da sessão de tatuagem.
- Atualizar os textos quando entrarem o formulário de contato (PBI-44) e a exclusão de conta pelo site (PBI-40).
- Revisar a seção de dados da privacidade se o PBI-28 guardar o payload completo do Mercado Pago, que pode trazer dados do pagador.

---

## Etapa 2 — Loja e pagamentos

### PBI-23 — Endereço de entrega

**Referências:** RF05 · **Prioridade:** P0 · **Deps:** Sprint 1 (concluída).

- [X] Permitir cadastrar e editar um único endereço por usuário autenticado
- [X] Validar campos no servidor e impedir leitura ou alteração do endereço de outro usuário
- [X] Testar persistência, atualização e isolamento entre usuários

**Situação:** integrado à `main` pelo PR #37 em 08/10/2026, aprovado por dois integrantes. A entrega está disponível para o checkout (26).

### PBI-24 — Carrinho persistente

**Referências:** RF11 · **Prioridade:** P0 · **Deps:** PBI-18.

Consome as obras, preços e disponibilidade do PBI-18. Não precisa esperar o endereço (23), o catálogo (19) ou a ficha (20) para implementar a persistência e as operações do carrinho; os pontos de entrada nas telas públicas serão integrados conforme elas estiverem prontas.

- [x] Adicionar, remover e alterar quantidades de obras disponíveis; recalcular valores no servidor
- [x] Persistir o carrinho do visitante por cookie e o do usuário no banco entre sessões; tratar a entrada na conta sem perder itens
- [x] Testar quantidades inválidas, indisponibilidade e persistência; carrinho não reserva estoque

**Decisões (registradas em 06/10/2026):**

- Entram a página `/carrinho` e a contagem no cabeçalho; o botão "Adicionar ao carrinho" fica pronto para o PBI-20.
- Obra que fica indisponível continua no carrinho, marcada e fora do total.
- Ao entrar na conta, os carrinhos se juntam, com a maior quantidade limitada ao estoque.
- Contrato completo em [PBI-24](features/PBI-24.md).

**Situação:** integrado à `main` pelo PR #36 em 07/10/2026, depois do PR #35, aprovado por outro integrante.

**Entregas:**

- Módulo `src/modules/orders`: regras, carrinho e junção.
- Página `/carrinho` e Server Actions em `src/app/carrinho`, com o cookie em `cookie.ts`.
- Componentes `CarrinhoCompras` e `BotaoAdicionarAoCarrinho`.
- Cabeçalho com link e contagem.
- Junção dos carrinhos nas actions de login e de cadastro.

**Evidências:**

- `npm run lint` e `npm run typecheck` sem erros.
- `npm test` com 212 testes, e a integração com 76 testes no PostgreSQL real (5 novos do carrinho).
- `npm run build` compilando.
- No navegador, com o Postgres local:
  - como visitante, ver, alterar e remover, com o cabeçalho acompanhando;
  - ao entrar na conta, o carrinho passou para a conta e o cookie foi apagado;
  - sem rolagem horizontal em 320 e 1440 px;
  - axe-core 4.10.2 sem violações.

**Pendências:**

- O PBI-20 precisa ligar o botão de adicionar na página da obra.
- O PBI-26 precisa habilitar "Finalizar compra", recusar itens indisponíveis e chamar a reserva do PBI-25.

### PBI-25 — Reserva temporária e concorrência de estoque

**Referências:** RF15; RN02–RN04, RN06 · **Prioridade:** P0 · **Deps:** PBI-18.

Consome estoque e obras do PBI-18 e a sessão existente. A API de reserva pode ser construída em paralelo ao carrinho (24), recebendo obra e quantidade; a ligação entre ambos será feita no checkout (26).

- [x] Reservar unidades no checkout por transação no PostgreSQL, sem ultrapassar estoque em acessos concorrentes
- [x] Implementar expiração de 10 minutos e liberação por tarefa pg-boss, com reexecução segura
- [x] Documentar e testar o ciclo entre reserva inicial e pagamento pendente de Pix/boleto conforme RN06; reconciliar aprovação após expiração sem vender além do estoque
- [x] Testar concorrência, expiração e liberação usando PostgreSQL real

**Decisões (registradas em 07/10/2026):**

- A reserva fica ligada à sessão, sem migração. Para Pix e boleto, o checkout prorroga a reserva até o vencimento do meio de pagamento (`prorrogarReserva`). Enquanto houver reserva prorrogada, um novo checkout da mesma sessão recebe `pendente` e não a substitui.
- Pagamento aprovado depois que a obra saiu de venda é honrado se ainda houver unidade.
- O worker do pg-boss sobe no `instrumentation.ts`, sem script nem serviço novo. O `pg-boss` entra como dependência, já prevista no ESCOPO.
- A baixa do estoque (`baixarEstoque`) fica neste PBI; o PBI-28 a chama dentro da transação do webhook (`tx`), que também garante a idempotência pelo evento único. Reserva vencida baixa só se nenhuma outra sessão segura a unidade; senão volta `sem_estoque` para o estorno (PBI-43).
- Carrinho e vitrine não mudam: as reservas só pesam no checkout.
- Contrato completo e ciclo do RN06 em [PBI-25](features/PBI-25.md).

**Situação:** integrado à `main` pelo PR #39 em 08/10/2026. A entrega está disponível para os PBIs 26, 27 e 28.

**Entregas:**

- `src/modules/orders/reserva.ts`: reservar, prorrogar, liberar, estoque livre e baixa, com API pública em `index.ts`.
- `src/modules/orders/tarefas.ts` e `src/lib/tarefas.ts`: fila `liberar-reservas-expiradas` a cada minuto, iniciada no `src/instrumentation.ts`.

**Pendências:**

- O PBI-26 precisa chamar `reservarItens` ao finalizar a compra e guardar no pedido a sessão que reservou.
- O PBI-27 precisa prorrogar a reserva com o vencimento do Pix/boleto.
- O PBI-28 precisa chamar `baixarEstoque` com o pagamento aprovado, na mesma transação do evento e do pedido, e tratar `sem_estoque`.

### PBI-26 — Checkout e criação do pedido

**Referências:** RF12; RN01, RN07 · **Prioridade:** P0 · **Deps:** PBI-23, PBI-24, PBI-25.

- [x] Exigir autenticação e apresentar resumo, endereço, quantidades, frete e total calculados no servidor
- [x] Usar retirada sem custo como modalidade mínima; opções adicionais entram no PBI-42
- [x] Criar pedido pendente com cópias imutáveis de endereço, títulos e preços, integrado à reserva
- [x] Testar carrinho vazio, estoque insuficiente, endereço inválido e tentativa de manipular valores

**Decisões:**

- O pedido `PENDENTE` e a reserva de 10 minutos nascem juntos no clique em "Finalizar compra"; abrir o `/checkout` não reserva.
- Migração `0004`: `order.session_id` (sessão que reservou, para a baixa no PBI-28) e `order.modalidade_entrega` (enum só com `RETIRADA`).
- O endereço do RF05 é exigido também na retirada e copiado no pedido.
- Um novo "Finalizar" cancela o `PENDENTE` sem pagamento em aberto; com Pix/boleto em aberto, o cliente volta ao pedido existente.
- Contrato completo em [PBI-26](features/PBI-26.md).

**Situação:** implementação local validada na branch `feat/pbi-26-checkout`. Para encerrar o DoD, faltam a revisão de outro integrante e a aprovação do PR.

**Pendências:**

- O PBI-27 precisa habilitar "Pagar com Mercado Pago", gravar o `payment` e prorrogar a reserva do Pix/boleto.
- O PBI-28 precisa baixar o estoque com `order.session_id` e limpar o carrinho na aprovação.
- O login não volta ao checkout depois de entrar (TODO já existente na action de login).

### PBI-27 — Pagamento Mercado Pago em sandbox

**Referências:** RF13; RNF10, RNF12 · **Prioridade:** P0 · **Deps:** PBI-26.

- [ ] Integrar Checkout Pro com Pix, cartão e boleto, sem trafegar dados de cartão pelo sistema
- [ ] Criar preferência com referência do pedido e URLs de retorno/notificação; tratar erros e nova tentativa
- [ ] Documentar credenciais de sandbox e realizar pagamentos de teste
- [ ] Não confirmar pedido nem baixar estoque pela URL de retorno do navegador

### PBI-28 — Webhook e confirmação do pedido

**Referências:** RF14; RN05, RN06, RNF11 · **Prioridade:** P0 · **Deps:** PBI-25, PBI-26, PBI-27.

- [ ] Validar assinatura do webhook e consultar o pagamento na API do provedor
- [ ] Conferir vínculo e valor do pagamento; confirmar pedido e baixar estoque somente após aprovação
- [ ] Garantir idempotência e atualização transacional; tratar rejeição, expiração e eventos fora de ordem
- [ ] Testar assinatura inválida, reenvio, concorrência e aprovação com PostgreSQL real; não enviar e-mail de pedido

### PBI-29 — Acompanhamento de pedidos pelo cliente

**Referências:** RF16 · **Prioridade:** P0 · **Deps:** PBI-26.

Consome o contrato de pedido e suas cópias de dados do PBI-26. Pode avançar junto com pagamento (27), webhook (28) e gestão administrativa (30), usando pedidos de teste. A confirmação real pelo gateway será verificada na integração global.

- [x] Listar e detalhar apenas pedidos do usuário autenticado
- [x] Exibir itens, valores, situação e rastreio quando disponível
- [x] Testar tentativa de acesso a pedido alheio e estados pendente, pago e enviado

**Decisões (registradas em 08/10/2026):**

- `/conta/pedidos` (lista) e `/conta/pedidos/[numero]` (detalhe), com o link "Meus pedidos" na `/conta`. Pedido aguardando pagamento leva ao `/checkout/[numero]`.
- Tentativas de compra sem nenhum pagamento (checkout abandonado ou cancelado por um novo "Finalizar") não aparecem para o cliente. A regra fica em `situacaoParaCliente`, para o PBI-30 reaproveitar.
- Na lista, a etiqueta da situação; no detalhe, o andamento com as datas que o banco guarda e o rastreio com "Copiar", sem link para transportadora.
- Contrato completo em [PBI-29](features/PBI-29.md).

**Situação:** implementação local validada na branch `feat/pbi-29-pedidos`. Para encerrar o DoD, faltam a revisão de outro integrante e a aprovação do PR. A situação real dos pedidos depende do pagamento (27/28) e da gestão do admin (30); até lá, os testes usam pedidos de teste.

**Entregas:**

- `situacaoParaCliente`, `listarMeusPedidos` e `lerMeuPedido` em `src/modules/orders`.
- Componentes `ListaPedidos`, `DetalhePedido`, `CopiarCodigo` e a etiqueta da situação, em `src/components/conta`.
- Páginas `/conta/pedidos` e `/conta/pedidos/[numero]`; link "Meus pedidos" na `/conta`.

**Evidências:**

- `npm run lint`, `npm run typecheck` e `npm run build` sem erros.
- `npm run test:unit` com 302 testes (15 novos) e a integração com 127 testes no PostgreSQL real (3 novos), em execução sequencial.
- No navegador, com o Postgres local e pedidos de teste (apagados depois), em 1280 e 375 px: lista sem o abandonado, 404 no pedido alheio, visitante no login, "Copiar" funcionando, sem rolagem horizontal e axe-core sem violações. A conferência e a revisão acharam três ajustes, corrigidos.

**Pendências:**

- PBI-27: prorrogar a reserva do Pix/boleto, para o "Ir para o pagamento" não cair em "reserva expirada".
- PBI-28 e PBI-30: gravar `pago_em`, `enviado_em` e `codigo_rastreio`, que o andamento e o rastreio já leem.

### PBI-30 — Gestão administrativa de pedidos

**Referências:** RF29 · **Prioridade:** P0 · **Deps:** PBI-26.

Consome pedidos do PBI-26. Pode avançar junto com a área do cliente (29) e o gateway (27–28); o contrato de status, pagamento e rastreio deve ser compartilhado. O fluxo completo com aprovação real depende também do PBI-28.

- [x] Permitir ao ADMIN consultar pedidos e dados de pagamento, registrar rastreio e atualizar situação operacional
- [x] Não permitir que alteração manual de status substitua a aprovação de pagamento pelo gateway
- [x] Validar transições e testar permissões e reflexo do rastreio na área do cliente

**Decisões (registradas em 08/10/2026):**

- Transições só para frente a partir de Pago, podendo pular etapas; nunca para Pago nem a partir de Pendente (RN05). Cancelar fica fora (reembolso e estoque dependem do 27/28).
- Na retirada no ateliê, Enviado aparece como "Pronto para retirada" e Entregue como "Retirado", no admin e na conta do cliente.
- Lista em "A fazer" por padrão, com filtros, "Todos" (inclui as tentativas sem pagamento, marcadas), busca por número ou e-mail e 20 por página. Rastreio opcional a partir de Pago.
- Feito sobre a branch do PBI-29, porque o contrato de situação é compartilhado. Contrato completo em [PBI-30](features/PBI-30.md).

**Situação:** implementação local validada na branch `feat/pbi-30-admin-pedidos`, que sai da `feat/pbi-29-pedidos` (PR #45): integrar depois dele. Para encerrar o DoD, faltam a revisão de outro integrante e a aprovação do PR. A aprovação real do pagamento depende do PBI-28; até lá, os testes usam pedidos de teste.

**Entregas:**

- Regras `transicaoPermitida`, `proximasSituacoes`, `aceitaRastreio`, `rotuloSituacao` e `rotuloDoAndamento`; validação do rastreio e dos filtros.
- `listarPedidosAdmin`, `lerPedidoAdmin`, `mudarSituacaoPedido` e `registrarRastreio` em `src/modules/orders/gestao.ts`.
- Páginas `/admin/pedidos` e `/admin/pedidos/[numero]`, Server Actions, componentes `ListaPedidosAdmin`, `PedidoAdminDetalhe` e `AcoesPedido`, e "Pedidos" no menu do admin.
- Rótulos da retirada também na conta do cliente (PBI-29) e helper compartilhado de pedidos de teste.

**Evidências:**

- `npm run lint`, `npm run typecheck` e `npm run build` sem erros.
- `npm run test:unit` com 322 testes e a integração com 135 testes no PostgreSQL real (8 novos), em execução sequencial.
- No navegador, com pedidos de teste (apagados depois), em 1280 e 375 px: filtros, busca, avanço com confirmação, rastreio refletido na conta do cliente, payload fora do HTML e axe-core sem violações. A conferência achou dois ajustes, corrigidos.

**Pendências:**

- PBI-28: passar o pedido a Pago e gravar `pago_em` na aprovação.
- PBIs 27/28 e 40: cancelamento com reembolso e devolução ao estoque.

## Etapa 3 — Agendamento

### PBI-31 — Wizard público de agendamento

**Referências:** RF20; RN01, RNF08 · **Prioridade:** P0 · **Deps:** PBI-16.

Consome artistas e estilos do PBI-16. Não depende da loja, da agenda manual (34) nem do portfólio.

- [x] Implementar etapas de nome, artista, estilo, região, tamanho e preferência de data/horário
- [x] Permitir avançar e voltar com validação e limitação de taxa aplicável
- [x] Não persistir solicitação, reservar horário ou coletar imagens e dados clínicos
- [x] Testar navegação e validações; manter a conclusão indisponível até os PBIs 32 e 33

Implementação em `/agendamento`, com tamanhos de `SizeTier`. Contrato, testes e limites registrados em [PBI-31](features/PBI-31.md). Revisão independente de código: PASS. Integrado à `main` pelo PR #30 em 06/10/2026, aprovado por dois integrantes. Conferência visual nas larguras previstas e aceite humano continuam pendentes para encerramento.

### PBI-32 — Checks obrigatórios de conformidade

**Referências:** RF23–RF25; RNF18 · **Prioridade:** P0 · **Deps:** PBI-31.

- [ ] Exibir avisos e exigir aceites de anamnese presencial, termo presencial e declaração de maioridade
- [ ] Bloquear conclusão se qualquer aceite estiver ausente
- [ ] Testar cada bloqueio sem coletar ou persistir respostas clínicas

### PBI-33 — Conclusão pelo WhatsApp e integração da home

**Referências:** RF21; conclusão do RF07 · **Prioridade:** P0 · **Deps:** PBI-21, PBI-31, PBI-32.

A geração da mensagem e do link pode ser preparada enquanto a home é construída; o aceite completo exige os dados do wizard (31), os checks (32) e a conexão da chamada na home (21). O número pode vir da configuração de ambiente até a integração do PBI-39.

- [ ] Gerar link wa.me com nome, artista, estilo, região, tamanho, preferência de data/horário e aceites
- [ ] Codificar a mensagem corretamente e usar número de contato configurado
- [ ] Conectar a chamada da home ao wizard completo e testar o link sem enviar mensagem automaticamente
- [ ] Não criar agendamento no banco ao concluir o wizard

### PBI-34 — Agenda manual do artista e administrador

**Referências:** RF22; RN08–RN10 · **Prioridade:** P0 · **Deps:** PBI-16.

Consome artistas e estilos do PBI-16 e a constraint de agenda da Sprint 1. O horário é cadastrado manualmente; não depende do wizard, do WhatsApp, da loja ou do portfólio.

- [ ] Cadastrar horário combinado com contato, artista, início/fim e observações; usuário cliente é opcional
- [ ] Permitir ao artista operar somente a própria agenda e ao ADMIN gerenciar as agendas
- [ ] Armazenar UTC e apresentar America/Sao_Paulo; validar intervalos
- [ ] Testar sobreposição e concorrência no PostgreSQL real usando a constraint existente

## Etapa 4 — Portfólio

### PBI-35 — Gestão do portfólio

**Referências:** RF19; RN10 · **Prioridade:** P0 · **Deps:** PBI-16, PBI-17.

Consome artistas/estilos (16) e upload (17). Pode avançar em paralelo ao CRUD de obras (18), à loja e à agenda. O upload precisa autorizar também o papel ARTISTA, respeitando a propriedade dos trabalhos.

**Contrato do upload (PBI-17):** só gravar em `portfolio_item.imagem_url` uma chave que `processarImagem` devolveu com sucesso, e nunca uma chave recebida direto do navegador: é o `processarImagem` que confirma que o objeto é uma imagem JPEG, PNG ou WebP de verdade.

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

**Referências:** RF30 · **Prioridade:** P1 · **Deps:** PBI-26.

Consome os pedidos e os dados do cliente definidos no PBI-26. Não depende do portfólio, da agenda ou das configurações do site.

- [ ] Permitir ao ADMIN consultar dados do cliente e histórico de compras
- [ ] Restringir acesso no servidor e exibir estados sem compras
- [ ] Testar permissões e correspondência entre cliente e pedidos

### PBI-39 — Configurações do site

**Referências:** RF31 · **Prioridade:** P1 · **Deps:** PBI-21, PBI-22, PBI-33.

O formulário e a persistência de configurações podem ser preparados com a base existente. As dependências listadas são para integrar todos os consumidores previstos: home (21), políticas (22) e WhatsApp (33). Esses PBIs usam configuração de ambiente/textos locais inicialmente e não ficam bloqueados pelo PBI-39.

- [ ] Permitir ao ADMIN editar contato, horários, textos institucionais e políticas
- [ ] Integrar os valores às páginas públicas e ao número usado no WhatsApp
- [ ] Validar entradas no servidor e testar persistência e controle de acesso

### PBI-40 — Exclusão de conta e anonimização

**Referências:** RN12; RNF19 · **Prioridade:** P1 · **Deps:** PBI-26.

Consome o formato real do pedido e das cópias de dados pessoais definido no PBI-26 para anonimizar também esse conteúdo. Pode usar pedidos pagos de teste e não precisa esperar o webhook (28) ou as configurações (39); a integração global confirma a preservação de compras reais.

- [ ] Permitir exclusão da própria conta com confirmação explícita na interface
- [ ] Anonimizar dados pessoais preservando pedidos pagos e integridade contábil
- [ ] Revogar sessões e testar anonimização e preservação dos pedidos no PostgreSQL real

### PBI-41 — Busca textual no catálogo

**Referências:** Fase 1, item 13; modelo de dados · **Prioridade:** P1 · **Deps:** PBI-19.

- [x] Adicionar busca textual tolerante a acentos, integrada à paginação e ordenação
- [x] Preservar regras de visibilidade de rascunhos e esgotadas
- [x] Testar acentos, ausência de resultados e consultas inválidas; não adicionar filtros de catálogo adiados

**Decisões:**

- Busca em título, descrição e técnica, por começo de palavra ("metro" acha "Metrópole"), sem acento e sem diferenciar maiúsculas; várias palavras exigem todas. Sem filtros nem busca por artista.
- Migração `0006`: extensão `unaccent`, configuração `kolo_busca` e índice `artwork_busca_idx` no lugar do `artwork_search_idx`.
- A busca fica na URL (`?busca=`) e convive com a paginação e as ordenações do PBI-19.
- Contrato completo em [PBI-41](features/PBI-41.md).

**Situação:** implementação local validada na branch `feat/pbi-41-busca-catalogo`. Para encerrar o DoD, faltam a revisão de outro integrante e a aprovação do PR.

### PBI-42 — Modalidades adicionais de frete

**Referências:** Complemento do RF12 · **Prioridade:** P1 · **Deps:** PBI-26.

Consome o cálculo e o contrato de frete/total do checkout (26). Pode avançar junto com o gateway; validar as modalidades adicionais no fluxo integrado antes do fechamento.

- [ ] Complementar retirada com valor fixo e tabela de frete
- [ ] Calcular modalidade e valor no servidor e preservar cópia no pedido
- [ ] Testar totais e indisponibilidade de modalidade; sem integração com Correios

### PBI-43 — Cancelamento e estorno administrativo

**Referências:** Complemento do RF29 · **Prioridade:** P1 · **Deps:** PBI-25, PBI-28, PBI-30.

Consome reservas (25), confirmação/reconciliação de pagamento (28) e operações administrativas de pedidos (30). Não depende das modalidades adicionais de frete (42).

- [ ] Permitir ao ADMIN cancelar pedido não pago e solicitar estorno pelo gateway
- [ ] Conciliar estado do pagamento, pedido e liberação de reserva sem duplicar operações
- [ ] Testar falhas, reenvios e permissões no sandbox; não implementar política automática de cancelamento

### PBI-44 — Contato com proteção antibot

**Referências:** Fase 1, item 14; RNF08 · **Prioridade:** P1 · **Deps:** Sprint 1 (concluída).

Usa autenticação/validação, banco e rate limit da base existente, além de credenciais Turnstile. Não depende de loja, agenda, portfólio ou estorno.

- [x] Disponibilizar formulário de contato com validação no servidor e persistência em contact_message
- [x] Validar Cloudflare Turnstile e limitar taxa de envio
- [x] Testar rejeição de token inválido e entradas inválidas; sem novos e-mails transacionais

**Situação:** integrado à `main` pelo PR #34 em 07/10/2026, aprovado por outro integrante.

## Etapa 6 — Qualidade, operação e entrega

### PBI-45 — Qualidade integrada e segurança

**Referências:** RNF02–RNF14, RNF17–RNF23, conforme aplicável · **Prioridade:** Entrega final · **Deps:** Sprint 1 para preparar; PBIs 16–37 e P1 incluídos para fechar.

Preparação de Playwright, axe-core, verificações de segurança e testes dos fluxos já disponíveis pode começar imediatamente e acompanhar as demais frentes. O aceite final exige todos os P0 dos PBIs 16–37 integrados e os P1 efetivamente incluídos testados; P1 formalmente adiados não bloqueiam o fechamento P0 e devem constar nas pendências.

- [ ] Configurar Playwright real e axe-core; o script E2E atual é apenas placeholder
- [ ] Automatizar compra sandbox até confirmação, wizard até wa.me, cadastro de obra e gestão/consulta do portfólio
- [ ] Executar regressão de autenticação, permissões, validações, CSRF, XSS, rate limit e integridade transacional
- [ ] Validar 320, 768, 1440 e 1920 px, teclado, foco, contraste e textos alternativos; axe-core sem violações críticas
- [ ] Medir catálogo e ficha: Lighthouse ≥ 90 e LCP abaixo de 2,5 s em 4G simulado; corrigir falhas
- [ ] Executar gates, revisar dependências sem vulnerabilidades altas/críticas e registrar evidências

### PBI-46 — Deploy, operação e restauração

**Referências:** RNF01, RNF07, RNF12, RNF15, RNF16, RNF23, RNF24 · **Prioridade:** Entrega final · **Deps:** Sprint 1 para preparar; PBI-45 para publicar a versão final.

Compose, CI, configuração da VPS, observabilidade e backups podem ser preparados em paralelo ao desenvolvimento com a aplicação existente. A publicação da versão final exige o gate de qualidade do PBI-45. As verificações de HTTPS, cabeçalhos, restauração e operação após deploy pertencem a este PBI, evitando uma dependência circular com o PBI-45.

- [ ] Preparar Docker Compose, app, PostgreSQL, Caddy e HTTPS na VPS; não expor banco à internet
- [ ] Configurar CI com lint, tipagem, testes e build; documentar publicação e rollback por imagem
- [ ] Configurar segredos, reinício automático, logs estruturados e captura de exceções
- [ ] Configurar backup diário com retenção mínima de 7 dias e comprovar restauração
- [ ] Validar HTTPS, cabeçalhos e aplicação implantada; publicação/push somente com autorização humana exigida pelo repositório

### PBI-47 — Validação com cliente e preparação da defesa

**Referências:** Fase 6; aceite global · **Prioridade:** Entrega final · **Deps:** PBI-45, PBI-46.

O roteiro da banca, os dados de demonstração e o agendamento da validação podem ser preparados antecipadamente. O aceite com a versão final depende da qualidade integrada (45) e da aplicação publicada e validada em operação (46).

- [ ] Executar roteiro assistido com o cliente e registrar feedback e correções
- [ ] Preparar dados de demonstração, roteiro da banca e evidências dos fluxos completos
- [ ] Conferir cobertura RF01–RF31 e RN/RNF, distinguindo concluídos e eventuais P1 adiados
- [ ] Registrar resultado final em 18/10 e listar qualquer pendência sem declarar conclusão integral enquanto houver itens abertos

## Marcos até 18/10

As janelas se sobrepõem deliberadamente. O início real de cada card segue a tabela de dependências, e não apenas a data desejada. Trabalhar em no máximo cinco frentes por vez, incluindo a capacidade reservada para revisões e integração.

| Janela-alvo | Frentes que podem avançar em paralelo                                                                 | Marco esperado                                     |
| ----------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 05–07/10    | Base do acervo (16, 17), institucional (22), endereço (23); preparar testes e infraestrutura (45, 46) | Bases integradas para obras, loja e tatuagem       |
| 06–10/10    | Obras e vitrine (18–21), wizard e agenda (31–34), portfólio (35–37), conforme pré-requisitos          | Acervo público, agendamento e portfólio integrados |
| 08–13/10    | Carrinho e reservas (24, 25), checkout (26), gateway (27, 28), áreas de pedidos (29, 30)              | Compra sandbox com confirmação e gestão de pedidos |
| 10–16/10    | P1 liberados (38–44), em paralelo aos P0 restantes; testes e preparação de operação contínuos         | Complementos incluídos ou adiamentos registrados   |
| 17–18/10    | Fechamento da qualidade (45), publicação final e verificação operacional (46), aceite e defesa (47)   | Evidências e entrega final registradas             |

Um atraso bloqueia os dependentes técnicos daquele PBI; as frentes independentes podem continuar. Reavaliar os marcos e a capacidade sem retirar testes ou transformar entrega parcial em aceite. Não preencher o período de fechamento com novas funcionalidades.

## Cobertura do projeto

| Parte do escopo                                              | Onde está contemplada                      |
| ------------------------------------------------------------ | ------------------------------------------ |
| Fundação, autenticação e perfil — RF01–RF04 e RF06           | Sprint 1, concluída                        |
| Endereço — RF05                                              | PBI-23                                     |
| Home, políticas, catálogo e ficha — RF07–RF10                | PBIs 19–22; home conectada ao wizard no 33 |
| Carrinho, checkout, pagamento, reserva e pedidos — RF11–RF16 | PBIs 24–29; complemento de frete no 42     |
| Portfólio — RF17–RF19                                        | PBIs 35–37                                 |
| Wizard, WhatsApp, agenda e checks — RF20–RF25                | PBIs 31–34                                 |
| Obras, imagens e cadastros — RF26–RF28                       | PBIs 16–18                                 |
| Administração de pedidos — RF29                              | PBIs 30 e 43                               |
| Clientes e configurações — RF30–RF31                         | PBIs 38–39                                 |
| Anonimização — RN12/RNF19                                    | PBI-40                                     |
| Busca no catálogo e contato — P1 do roteiro                  | PBIs 41 e 44                               |
| Qualidade, requisitos não funcionais, produção e defesa      | Critérios de cada PBI e PBIs 45–47         |

“Projeto completo” significa o escopo v2.2, incluindo P1, qualidade e operação. Itens expressamente fora de escopo ou adiados na seção 14 da especificação não entram: 3D, páginas públicas de artista, filtros de catálogo, dados de saúde, API oficial WhatsApp, motor de slots, split de pagamentos e demais exclusões permanecem fora.

## Definição de pronto e validação

Reutilizar autenticação, tokens visuais e schema existentes. Respeitar APIs públicas dos módulos em `src/modules/*/index.ts`; mudanças de modelo exigem migração e revisão. Seguir o ciclo de desenvolvimento e revisão do repositório.

Cada PBI disponibiliza sua entrega aos dependentes técnicos depois de atender aos critérios, passar nos testes pertinentes e ter o PR aprovado por integrante diferente do autor e integrado na base comum. PBIs independentes podem continuar em paralelo. No fechamento integrado, executar:

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
| ---- | --- | ------------------------ | ------------------------- | -------- |
| —    | —   | Nenhum registrado        | —                         | —        |
