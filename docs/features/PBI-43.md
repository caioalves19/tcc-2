# PBI-43 — Cancelamento e estorno administrativo

**Referências:** complemento do RF29; RN05, RN06, RN11 e RNF11. **Dependências:** PBI-25, PBI-28
e PBI-30.

## Objetivo e contrato confirmado

O ADMIN cancela o pedido que não foi pago e estorna pagamentos pelo Mercado Pago, sem duplicar
operações com o webhook. Decisões confirmadas antes de codar (12/10/2026):

- **Estorno só total**, um por pagamento. Pedido `ENVIADO` ou `ENTREGUE` não é cancelado pelo
  sistema (a devolução é combinada fora dele).
- **Estorno devolve o estoque** do pedido pago, na mesma transação; a obra esgotada volta a
  `DISPONIVEL` (rascunho continua rascunho).
- **Os casos que o webhook deixava no log viram estorno pendente** no banco
  (`payment.estornar_motivo`, migração `0008`), e o admin os encontra no filtro "Estorno
  pendente".
- **Achado R4 do PBI-28:** as transições do pedido ficam em `orders` e rodam na transação de quem
  chama (webhook, checkout e admin), sem mudar o comportamento do webhook e do checkout.
- **Risco "Pix vencido seguido de cartão" (PR #51):** tratado aqui. O risco "frete no valor
  conferido" passou ao PBI-42 (só existe com frete acima de 0).
- **Sem política automática de cancelamento:** nada cancela ou estorna sozinho.

## API pública

`src/modules/orders` (transações recebem o `tx` de quem chama, que já travou usuário e pedido):

| Função | Uso | Resultado |
|--------|-----|-----------|
| `confirmarPedidoPago(tx, pedidoId, agora)` | Webhook | `{ ok, estoqueBaixado }` ou `nao_pendente` |
| `cancelarPedidoPendente(tx, pedidoId)` | Webhook, checkout, admin | `{ ok }` ou `nao_pendente`; solta a reserva do pedido |
| `cancelarPedidoPago(tx, pedidoId, { devolverEstoque })` | Estorno | `{ ok }` ou `nao_cancelavel` (só `PAGO`/`PROCESSANDO`) |
| `voltarReservaAoPrazo(tx, pedidoId)` | Webhook | reserva prorrogada volta a `criado_em + 10 min` |
| `acaoDeEstorno`, `podeCancelarPedido`, `estornoCancelaPedido`, `estornoDevolveEstoque` | Regras puras (também em `orders/cliente.ts`) | o que o admin pode fazer |

`src/modules/payments`:

| Função | Uso | Resultado |
|--------|-----|-----------|
| `estornarPagamento({ numero, idExterno }, cabecalhos, { gateway })` | Server Action do admin | `ResultadoGestao`: `nao_autenticado`, `proibido`, `nao_encontrado`, `invalido`, `falha` |
| `cancelarPedido({ numero }, cabecalhos, { gateway })` | Server Action do admin | idem |
| `gatewayMercadoPago().estornarPagamento(id, chave)` | `POST /v1/payments/{id}/refunds` | estorno total com `X-Idempotency-Key` |
| `gatewayMercadoPago().cancelarPagamento(id)` | `PUT /v1/payments/{id}` | Pix ou boleto em aberto cancelado |

`lerPedidoAdmin` ganha `cancelavel` e, em cada pagamento, `motivoEstorno` e `acaoEstorno`
(`"estornar"`, `"concluir"` ou `null`). `listarPedidosAdmin` aceita `filtro: "estorno-pendente"`.

## Comportamentos

- **Motivos gravados pelo webhook** (além do log, que continua):

  | Motivo | Quando | O estorno faz |
  |--------|--------|---------------|
  | `PEDIDO_NAO_PENDENTE` | Aprovação de pedido cancelado ou já pago por outro pagamento | Só devolve o dinheiro |
  | `VALOR_DIVERGENTE` | `transaction_amount` ≠ total ou moeda ≠ BRL | Só devolve o dinheiro |
  | `SEM_ESTOQUE` | Pedido pago sem unidade livre para baixar | Cancela o pedido sem devolver estoque |
  | nenhum | Pagamento que pagou o pedido | Cancela o pedido e devolve as unidades |

- **Estorno em duas transações, gateway no meio.** A primeira confere papel, pagamento e pedido;
  o gateway é chamado fora da transação; a segunda trava usuário → pedido (mesma ordem do
  webhook), marca o pagamento `ESTORNADO` e cancela o pedido conforme o motivo. Se o pedido mudou
  entre as duas (pago por outro, enviado), `cancelarPedidoPago` não cancela.
- **Idempotência:** a chave do estorno é `kolo-estorno-<id do pagamento>`, então clique duplo ou
  nova tentativa não estornam de novo. Se o gateway falhar, a consulta do pagamento decide:
  `refunded` conclui no Kolô, qualquer outra coisa responde `falha` sem gravar nada.
- **Estorno feito no painel do Mercado Pago:** o webhook grava `ESTORNADO`; o admin vê "Concluir
  estorno" e o Kolô cancela o pedido sem chamar o gateway. O aviso `refunded` que chega depois do
  estorno do admin não muda nada (a situação do pagamento não volta atrás).
- **Cancelamento do pedido não pago:** só `PENDENTE`. Pix ou boleto em aberto é cancelado no
  Mercado Pago antes (falha ou pagamento já cancelado conferidos pela consulta); cartão ou saldo
  em análise é recusado ("aguarde a resposta"). Pedido pago se resolve pelo estorno.
- **Pix encerrado antes do prazo para pagar** (`criado_em + 10 min − 2 min`, o fim da preferência
  do PBI-27): o pedido fica `PENDENTE` e a reserva prorrogada volta ao prazo do checkout, para o
  cliente pagar de outro jeito. Depois do prazo, o Pix vencido cancela o pedido como antes.
- **Tela:** `/admin/pedidos/[numero]` ganha a seção "Cancelamento e estorno", com o motivo de cada
  pagamento e confirmação antes de qualquer ação; a lista ganha o filtro "Estorno pendente".

## Testes

- `tests/integration/pedido-transicoes.test.ts`: as quatro transições de `orders`.
- `tests/integration/webhook-estorno.test.ts`: os três motivos, aprovação normal sem motivo e Pix
  cancelado antes do prazo.
- `tests/integration/estorno.test.ts`: estorno do pedido pago, papéis, pedido enviado/entregue,
  motivos, pagamento não aprovado, gateway fora, resposta perdida, clique duplo, estorno feito no
  painel e aviso `refunded` depois.
- `tests/integration/cancelamento.test.ts`: cancelamento simples, pedido não pendente, Pix em
  aberto, cartão em análise, gateway fora, Pix já cancelado e papéis.
- `tests/integration/pedidos-admin-estorno.test.ts`: filtro e ações no detalhe.
- `tests/unit/mercado-pago.test.ts`, `estorno-pedido.test.tsx` e `estorno-acoes.test.ts`:
  adaptador, tela e Server Actions.

## Revisão (12/10/2026)

Revisão read-only por agente: PASS. Corrigidos em TDD: o filtro "Estorno pendente" seguia
mostrando a aprovação `SEM_ESTOQUE` de pedido já enviado (sem ação possível), e o cancelamento
passou a conferir de novo, na segunda transação, se chegou um pagamento novo (cartão em análise
ou outro Pix) enquanto o Pix era cancelado no Mercado Pago. `PROVEDOR` ficou numa constante só.

Pendência aceita: se a segunda transação do estorno falhar por concorrência (um aviso `refunded`
gravado ao mesmo tempo), o admin vê a mensagem genérica de concorrência, embora o dinheiro já tenha
voltado. Repetir é seguro (mesma chave; a ação vira "Concluir estorno"), mas a mensagem poderia
dizer isso.

## Antes do deploy

- Migração `0008` (`npm run db:migrate`).
- O estorno usa o mesmo `MP_ACCESS_TOKEN` do pagamento; nenhuma variável nova.
