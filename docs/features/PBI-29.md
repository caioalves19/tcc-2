# PBI-29 — Acompanhamento de pedidos pelo cliente

**Referências:** RF16; apoio RN01, RN03, RN06 e RN09. **Dependências:** PBI-26.

## Objetivo e contrato confirmado

O cliente acompanha os próprios pedidos: lista, detalhe, situação e rastreio. Decisões confirmadas
com o Robert antes de codar (08/10/2026):

- **Lista e página do pedido:** `/conta/pedidos` com cards resumidos e `/conta/pedidos/[numero]`
  com o detalhe. A `/conta` ganha o link "Meus pedidos". Pedido aguardando pagamento leva ao
  `/checkout/[numero]` (PBI-26/27), que é onde se paga.
- **Tentativas sem pagamento ficam ocultas:** cada novo "Finalizar compra" cancela o pendente
  anterior (PBI-26), e mostrar tudo encheria a lista de pedidos que o cliente nunca pagou.
- **Etiqueta e linha do tempo:** na lista, só a etiqueta; no detalhe, o andamento com as datas que
  o banco guarda.
- **Rastreio com botão Copiar,** sem link para transportadora: o pedido não guarda qual é (as
  modalidades de frete são do PBI-42).
- **Fora:** pagar ou cancelar pela lista, nota fiscal e certificado (fora do escopo), fotos das obras
  no pedido (o pedido guarda só as cópias de título e preço), mudança no `/checkout/[numero]`,
  mudança de schema e qualquer tela do admin (PBI-30).

## Situação para o cliente (contrato com o PBI-30)

`situacaoParaCliente({ situacao, pagamentos, reservaAtiva })`, função pura em
`src/modules/orders/regras.ts`, exportada pelo `index`:

| No banco | Para o cliente |
|----------|----------------|
| `PAGO`, `PROCESSANDO`, `ENVIADO`, `ENTREGUE` | `PAGO`, `EM_PREPARACAO`, `ENVIADO`, `ENTREGUE` |
| `PENDENTE` com pagamento `PENDENTE` (Pix/boleto em aberto) ou reserva ativa | `AGUARDANDO_PAGAMENTO` |
| `PENDENTE` sem nada disso (checkout abandonado) | `null`: oculto |
| `CANCELADO` com algum registro em `payment` | `CANCELADO` |
| `CANCELADO` sem nenhum pagamento (cancelado por um novo "Finalizar") | `null`: oculto |

"Reserva ativa" é a mesma leitura do `lerPedido` do PBI-26: reserva da sessão que fez o checkout,
numa obra do pedido, que ainda não venceu.

## API pública (`src/modules/orders`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `listarMeusPedidos(contexto, agora?)` | `/conta/pedidos` | `PedidoDaLista[]` (número, data, situação, total, unidades), do mais recente ao mais antigo; `null` para visitante |
| `lerMeuPedido(numero, contexto, agora?)` | `/conta/pedidos/[numero]` | `PedidoDetalhado` (itens, valores, modalidade, endereço, rastreio, datas de pago e envio) ou `null` |
| `situacaoParaCliente(pedido)` | As duas acima e o PBI-30 | Tabela acima |

`contexto` é `{ cabecalhos }`. `agora` é injetável só para os testes, como no PBI-26.

## Comportamentos

- **Só o dono (RN01):** as duas funções leem a sessão ativa no servidor e filtram por `user_id`.
  Pedido de outro cliente, oculto, excluído (`excluido_em`), inexistente, visitante e número fora do
  formato (vazio, não texto, mais de 32 caracteres) dão `null`, sem revelar que o pedido existe.
- **Páginas:**
  - `/conta/pedidos`: visitante vai para o `/login`. Cards com "Pedido <número>" (o card inteiro
    leva ao detalhe), data de São Paulo (RN09), "N itens", etiqueta e total. Sem pedidos: "Você
    ainda não tem pedidos." e "Ver obras".
  - `/conta/pedidos/[numero]`:
    - pedido alheio, oculto ou inexistente dá 404; visitante vai para o `/login` com qualquer
      número, então o redirecionamento também não revela nada;
    - "Meus pedidos" (volta), etiqueta, "Pedido <número>", "Feito em <data>";
    - aguardando pagamento: aviso e "Ir para o pagamento" (`/checkout/[numero]`);
    - andamento: Pedido feito → Pago → Em preparação → Enviado → Entregue, com o passo atual em
      `aria-current="step"` e as datas de pedido, pagamento e envio; preparação e entrega não têm
      data no banco;
    - cancelado: sem andamento, com o aviso e o link para a política de cancelamento;
    - rastreio (quando existe) com "Copiar"; sem acesso à área de transferência, pede para copiar
      à mão;
    - entrega (modalidade e endereço copiados no checkout) e resumo (itens, subtotal, retirada,
      total).

## Limites conhecidos

- **Pendente com pagamento recusado** fica oculto enquanto está `PENDENTE` e aparece como
  "Cancelado" depois que um novo "Finalizar" o cancela (passa a ser um cancelado com pagamento).
- **"Ir para o pagamento" em Pix/boleto em aberto:** hoje o `/checkout/[numero]` mostra "A reserva
  expirou" quando não há reserva. O PBI-27 prorroga a reserva do Pix/boleto, e aí a página fica
  coerente.
- **Retirada no ateliê:** resolvido pelo PBI-30. Na retirada, ENVIADO aparece como "Pronto para
  retirada" e ENTREGUE como "Retirado" (`rotuloSituacao`); a lista passou a trazer a modalidade.

## Validação

- `npm run test:integration -- tests/integration/pedidos-cliente` (PostgreSQL real, 3 testes, com
  pedidos de teste gravados por SQL, porque pagamento e situação ainda não têm fluxo próprio):
  - lista só os visíveis do dono, do mais recente ao mais antigo, com situação, total e unidades;
    oculta o abandonado, o cancelado sem pagamento, o pendente de reserva vencida e o excluído;
    outro cliente vê só o dele; visitante recebe `null`;
  - pedido criado pelo `finalizarCompra` real aparece como aguardando pagamento e some quando a
    reserva vence (11 minutos depois);
  - detalhe completo do pedido enviado (itens, valores, endereço, rastreio, datas); pendente com
    reserva aguardando pagamento; alheio nos dois sentidos, oculto, inexistente, visitante e números
    inválidos dão `null`.
- `npm run test:unit -- pedidos-cliente-regras lista-pedidos copiar-codigo detalhe-pedido paginas-pedidos pagina-conta`:
  a tabela de situações, a lista (com e sem pedidos, data de São Paulo), o copiar (com e sem
  acesso à área de transferência), o detalhe (enviado, aguardando e cancelado) e as páginas
  (login, 404, visitante no detalhe, link na `/conta`).
- **No navegador** (08/10/2026, Postgres local, logado como `admin@kolo.test`, Chrome headless em
  1280 e 375 px, com 5 pedidos de teste apagados depois):
  - a lista mostrou aguardando, enviado e cancelado, sem o abandonado;
  - pedido de outra conta, abandonado e inexistente deram 404; visitante foi para o `/login`;
  - "Copiar" pôs o código na área de transferência e avisou;
  - sem rolagem horizontal e axe-core (WCAG 2.1 AA) sem violações nas 8 telas;
  - a conferência achou o resumo esticando até a altura da coluna e o ícone do andamento
    desalinhado quando o rótulo quebra; corrigidos.
- **Revisão de código e de segurança:** dono conferido no servidor nas duas funções, só a situação do
  pagamento sai do banco (nunca o `payload`), reservas lidas só das sessões dos pedidos do próprio
  cliente. Achado corrigido em TDD: o visitante no detalhe recebia 404 em vez de ir para o login.

## Pendências para os próximos PBIs

- **PBI-27:** prorrogar a reserva do Pix/boleto, para o "Ir para o pagamento" não cair em "reserva
  expirada".
- **PBI-28:** gravar `pago_em` na aprovação (o andamento usa essa data).
- **PBI-30:** gravar `enviado_em` e `codigo_rastreio` ao marcar como enviado, e reaproveitar o
  `situacaoParaCliente` para manter o mesmo vocabulário no admin.
