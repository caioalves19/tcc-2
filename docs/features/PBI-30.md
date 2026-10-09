# PBI-30 — Gestão administrativa de pedidos

**Referências:** RF29; apoio RN05 e RF16. **Dependências:** PBI-26 e PBI-29 (feito sobre a branch
dele, porque o contrato de situação é compartilhado).

## Objetivo e contrato confirmado

O ADMIN consulta pedidos e pagamentos, avança a situação operacional e registra o rastreio, sem
nunca substituir a aprovação do gateway. Decisões confirmadas com o Robert antes de codar
(08/10/2026):

- **Transições só para frente, podendo pular etapas:** Pago → Em preparação → Enviado → Entregue
  (uma retirada no mesmo dia vai de Pago a Entregue). Nunca volta, nunca leva a Pago e nunca tira de
  Pendente: isso é do gateway (RN05, PBI-28).
- **Cancelar fica fora:** cancelar pedido pago envolve reembolso e devolver a peça ao estoque, que
  dependem do Mercado Pago (27/28). O pendente sem pagamento já se cancela sozinho (reserva vence,
  novo checkout).
- **Rótulos da retirada:** na retirada no ateliê, ENVIADO aparece como "Pronto para retirada" e
  ENTREGUE como "Retirado", no admin e na conta do cliente. No banco nada muda.
- **Lista com filtro e busca:** abre em "A fazer" (pagos e em preparação, os mais antigos primeiro);
  filtros por situação e "Todos", que inclui as tentativas sem pagamento, marcadas "Não concluído";
  busca por número ou e-mail; 20 por página; tudo na URL.
- **Rastreio opcional a partir de Pago,** com correção e remoção (código vazio).
- **Fora:** cancelamento, reembolso e devolução ao estoque; marcar como pago; mostrar o `payload` do
  pagamento; link para transportadora; editar itens, valores ou endereço; migração; perfil do
  cliente com histórico (PBI-38).

## Regras puras (`src/modules/orders/regras.ts`)

| Função | O que faz |
|--------|-----------|
| `transicaoPermitida(de, para)` | Só de uma situação do andamento (Pago, Processando, Enviado, Entregue) para outra mais adiante |
| `proximasSituacoes(de)` | As situações possíveis a partir de `de`, na ordem do andamento |
| `aceitaRastreio(situacao)` | Pago em diante (fora de Pendente e Cancelado) |
| `rotuloSituacao(situacao, modalidade)` | Rótulo para cliente e admin, com "Pronto para retirada" e "Retirado" na retirada; "Não concluído" para a tentativa sem pagamento |
| `rotuloDoAndamento(situacao, modalidade)` | O mesmo, a partir da situação gravada no banco (botões do admin) |

As funções que vão para componentes de cliente saem também por `orders/cliente.ts`, como no
catálogo, para não levar o Prisma ao navegador. O código de rastreio é validado por
`schemaRastreio` (`orders/validacao.ts`): letras, números e hífen, de 4 a 40 caracteres, em
maiúsculas; vazio vira `null`.

## API pública (`src/modules/orders`, tudo pelo `comoAdmin`)

| Função | Resultado |
|--------|-----------|
| `listarPedidosAdmin({ filtro, busca, pagina }, cabecalhos)` | `{ pedidos, total, pagina, totalPaginas, filtro, busca }`; cada pedido com número, data, cliente (nome e e-mail), situação para o cliente ou `NAO_CONCLUIDO`, situação no banco, modalidade, total e unidades |
| `lerPedidoAdmin(numero, cabecalhos)` | Pedido com cliente (nome, e-mail, telefone), itens, valores, endereço, rastreio, datas e pagamentos (provedor, id externo, método, situação, valor); `nao_encontrado` se não existe |
| `mudarSituacaoPedido({ numero, de, para }, cabecalhos)` | `{ situacao }`; recusa `invalido` (transição), `conflito` (a situação já não é `de`), `nao_encontrado` |
| `registrarRastreio({ numero, codigo }, cabecalhos)` | `{ rastreio }`; recusa `invalido` (código ou situação) e `nao_encontrado` |

`comoAdmin` relê sessão e papel no banco e roda tudo numa transação Serializable. Visitante recebe
`nao_autenticado`; cliente e artista, `proibido`.

## Comportamentos

- **Situação desatualizada:** a tela manda a situação que mostrava (`de`); se outro admin mudou
  antes, nada é gravado e a tela pede para atualizar. Dois cliques simultâneos geram uma mudança só
  (a outra cai em `conflito` ou `concorrencia`).
- **Marcar como enviado** (pronto para retirada) grava `enviado_em`, que aparece no andamento do
  cliente. Pular de Pago para Entregue não grava data de envio.
- **Pagamentos** são lidos com `select` explícito: o `payload` do gateway nunca sai do banco.
- **Telas:**
  - menu do admin com "Pedidos";
  - `/admin/pedidos`: filtros (com o atual marcado), busca por formulário GET, cards com número,
    cliente, data, itens, etiqueta e total, contagem e paginação mantendo filtro e busca;
  - `/admin/pedidos/[numero]`: etiqueta, datas (feito, pago, pronto/enviado), "Mudar situação" com
    um botão por próxima situação e confirmação ("Esta mudança não pode ser desfeita"), rastreio,
    cliente (e-mail com `mailto`), pagamentos, entrega e resumo. Pendente mostra que a situação muda
    com a aprovação do Mercado Pago, sem botões nem rastreio; 404 para pedido inexistente.

## Limites conhecidos

- **Sem cancelamento pelo admin** (decisão acima). Fica para os PBIs 27/28 (reembolso) e 40.
- **Pagamentos sem ordem garantida:** a tabela `payment` não tem data; o detalhe mostra na ordem do
  banco.
- **Aviso do `pg` nos logs:** "Calling client.query() when the client is already executing a
  query" vem do Prisma 7 (`@prisma/adapter-pg`), que carrega as relações em paralelo dentro de
  transações. Já acontecia no admin de obras (PBI-18). Só passa a importar no `pg@9`.

## Validação

- `npm run test:integration -- tests/integration/pedidos-admin` (PostgreSQL real, 8 testes, com os
  pedidos de teste do helper compartilhado `tests/integration/pedidos-de-teste.ts`):
  - permissões nas quatro funções (visitante, cliente e artista recusados);
  - "A fazer" (os mais antigos primeiro), cada filtro, "Todos" com o não concluído, busca por e-mail
    e por parte do número sem diferenciar maiúsculas, filtro inválido no padrão, paginação de 20;
  - detalhe completo, pagamentos sem o payload, tentativa sem pagamento visível ao admin, números
    inválidos;
  - avanço passo a passo e pulando etapas, com `enviado_em` e o reflexo na conta do cliente;
  - transições proibidas (voltar, Pago, Cancelado, sair de Pendente, depois de Entregue) sem gravar
    nada;
  - situação desatualizada e cliques simultâneos (3 rodadas, uma mudança por rodada);
  - rastreio registrado, corrigido e limpo, refletido no `lerMeuPedido`; recusado em pendente,
    cancelado, código inválido e para quem não é admin.
- `npm run test:unit -- pedidos-admin-regras acoes-pedido lista-pedidos-admin pedido-admin paginas-admin-pedidos admin-layout`:
  regras puras, confirmação antes de mudar, erro do servidor, campo de rastreio atualizado depois de
  salvar, filtros e paginação na URL, detalhe e páginas.
- **No navegador** (08/10/2026, Postgres local, logado como `admin@kolo.test`, com 4 pedidos de
  teste apagados depois):
  - "A fazer" com pago e em preparação; "Todos" com o não concluído; busca pelo número;
  - pendente sem botões nem rastreio;
  - Pago → Pronto para retirada com confirmação; restou só "Marcar como Retirado"; rastreio salvo;
  - na conta do cliente: "Pronto para retirada" com a data e o código em maiúsculas;
  - payload ausente do HTML; sem rolagem horizontal e axe-core sem violações em 1280 e 375 px.
  - A conferência achou o campo de rastreio mostrando o texto digitado em vez do gravado e títulos
    fora do padrão das outras seções; corrigidos.
- **Revisão de código e de segurança:** permissões no módulo (não só na tela), entrada validada
  depois da checagem de papel, cada ação grava só o próprio campo, RN05 coberta por teste, payload
  fora de todas as leituras.

## Pendências para os próximos PBIs

- **PBI-28:** gravar `pago_em` e passar o pedido a Pago na aprovação; é daí que o admin começa.
- **PBIs 27/28 e 40:** cancelamento com reembolso e devolução ao estoque.
- **PBI-38:** perfil do cliente com histórico pode reaproveitar `listarPedidosAdmin` com a busca por
  e-mail.
- **PBI-42:** cada nova modalidade entra em `ROTULOS_POR_MODALIDADE` (regras.ts) com os rótulos dela.
