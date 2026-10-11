# PBI-28 — Webhook e confirmação do pedido

**Referências:** RF14, RN05, RN06, RN07 e RNF11. **Dependências:** PBI-25, PBI-26 e PBI-27.

## Objetivo e contrato confirmado

O Mercado Pago avisa o Kolô quando um pagamento muda. O webhook confere a assinatura, consulta o
pagamento na API e, com ele aprovado, confirma o pedido e baixa o estoque, uma vez só, mesmo com
reenvio, avisos simultâneos ou fora de ordem. Decisões confirmadas antes de codar (11/10/2026):

- **Processamento síncrono no Route Handler**, sem fila. Assinatura, consulta e transação
  acontecem na requisição; qualquer falha responde 500 e o Mercado Pago reenvia.
- **Só os campos úteis do pagamento** em `payment.payload` e `webhook_event.payload` (id,
  situação, meio, valor, moeda, datas e `external_reference`). Nada do pagador, então a seção de
  dados da privacidade não muda (nota do Sprint-2).
- **Cartão recusado mantém o pedido `PENDENTE`** (o cliente tenta de novo enquanto a reserva
  durar); **Pix ou boleto expirado ou cancelado cancela o pedido** e devolve as unidades.
- **Saldo da conta Mercado Pago tem meio próprio** (`SALDO_MERCADO_PAGO`). O Checkout Pro o
  oferece e não deixa excluí-lo da preferência, então ele é gravado com o meio certo, não como
  cartão. Meio que o Kolô não conhece responde 500 com log, sem ser gravado como outro.
- **Estorno fica no log, não automático** (PBI-43): aprovação de pedido cancelado, segunda
  aprovação do mesmo pedido, valor divergente e aprovação sem unidade livre.

## API pública (`src/modules/payments`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `processarNotificacao({ url, cabecalhos, corpo }, { gateway, segredo, agora? })` | Route Handler | `{ status: 200 \| 401 \| 500 }` |
| `assinaturaValida({ assinatura, idRequisicao, idDado, segredo })` | `x-signature` | `boolean`; recusa vai para o log com o motivo e o `x-request-id` |
| `lerPagamento(resposta)` | resposta do `GET /v1/payments/{id}` | pagamento traduzido, `invalido`, `situacao_ignorada` ou `meio_desconhecido` |
| `gatewayMercadoPago().consultarPagamento(id)` | adaptador do SDK | resposta da API, ou `null` quando ela devolve 404 |

O Route Handler é `src/app/api/webhooks/mercadopago/route.ts`: lê `MP_WEBHOOK_SECRET`, repassa a
requisição e devolve o status. `prorrogarReserva` (PBI-25) passou a aceitar a `tx` do webhook,
como a `baixarEstoque`.

## Comportamentos

**Respostas ao Mercado Pago**

| Aviso | Resposta |
|-------|----------|
| Sem assinatura válida | 401, nada consultado nem gravado |
| IPN (`?topic=&id=`, sem `data.id`) ou tipo que não é `payment` | 200, sem processar (só o aviso assinado muda o pedido) |
| Pagamento que a API não encontra (404) ou sem pedido no Kolô | 200 com log (reenviar não ajuda) |
| Disputa aberta (`in_mediation`) | 200, sem mudar o pedido |
| API fora, tempo esgotado, deadlock, banco fora ou meio desconhecido | 500, nada gravado; o Mercado Pago reenvia |
| Tratado, ou aviso já visto | 200 |

**Situação do pagamento** (`approved` → `APROVADO`; `pending`, `in_process`, `authorized` →
`PENDENTE`; `rejected`, `cancelled` → `RECUSADO`; `refunded`, `charged_back` → `ESTORNADO`) nunca
volta atrás: um `pending` atrasado depois do `approved` não muda nada.

**Na transação do aviso** (ordem de travas igual à do checkout: usuário → pedido → sessão → obras):

1. Grava o `webhook_event` (`mercado_pago:<id do aviso>`, ou o `x-request-id` se o corpo vier sem
   id). Aviso já visto encerra aqui; um reenvio simultâneo espera o primeiro terminar.
2. Grava ou atualiza o `payment`, único por (`provedor`, `id_externo`).
3. Conforme a situação:
   - **Aprovado**, pedido `PENDENTE`, valor igual ao total e em BRL: pedido `PAGO` com `pago_em`,
     `baixarEstoque` com a sessão do pedido e as obras do pedido saem do carrinho do cliente.
     Sem unidade livre, o pedido fica pago e o log pede estorno.
   - **Aprovado** de pedido que não está `PENDENTE`, ou com valor ou moeda divergente: não paga;
     log de estorno (PBI-43).
   - **Pix ou boleto pendente**: `prorrogarReserva` até `date_of_expiration`. Sem reserva para
     prorrogar (venceu, ou o carrinho mudou), fica no log e a aprovação cai na reconciliação da
     baixa (PBI-25).
   - **Pix ou boleto recusado/expirado**, sem outro pagamento em aberto: pedido `CANCELADO` e
     reserva liberada.

## Configuração

| Variável | Uso |
|----------|-----|
| `MP_WEBHOOK_SECRET` | Assinatura secreta do webhook. Sem ela o webhook responde 500 a tudo; em produção o servidor não sobe. |
| `MP_ACCESS_TOKEN` / `APP_URL` | Como no PBI-27. Com `APP_URL` em https a preferência leva a `notification_url`. |

**O Mercado Pago assina o aviso com o segredo da conta que recebe o pagamento.** Conferido no
sandbox (11/10/2026):

- A simulação do painel da aplicação da conta real passa com o segredo dessa aplicação.
- Os pagamentos do vendedor de teste chegam com `SignatureMismatch` com esse mesmo segredo e
  passam com o segredo do webhook configurado **na conta do vendedor de teste**.
- Sem `notification_url` na preferência, pagamento do vendedor de teste não gera aviso nenhum.

### Sandbox

1. Abra um túnel https para o app (`cloudflared tunnel --url http://localhost:3000`) e ponha o
   endereço em `APP_URL` e `BETTER_AUTH_URL`, e o host (sem `https://`) em `DEV_ORIGINS`: sem
   isso o `next dev` bloqueia os próprios scripts no túnel e os formulários viram GET.
2. Numa janela anônima, entre no Mercado Pago Developers **como o vendedor de teste** (usuário e
   senha em *Contas de teste* da conta real). Em *Suas integrações → aplicação → Webhooks →
   Configurar notificações*, cadastre `<APP_URL>/api/webhooks/mercadopago` com o evento
   **Pagamentos** e copie a **assinatura secreta** para `MP_WEBHOOK_SECRET`.
3. `MP_ACCESS_TOKEN` é o Access Token do **mesmo** vendedor de teste.
4. Rode `npm run db:migrate` no banco do `next dev` (migração `0007`).
5. Feche as janelas anônimas abertas como vendedor antes de pagar: elas compartilham a sessão, e o
   pagamento precisa ser feito logado como **comprador de teste**.

### Produção

Configure o webhook na aplicação da **conta real** (a que recebe): mesma URL, evento Pagamentos, e
a assinatura dela em `MP_WEBHOOK_SECRET`, junto com o Access Token de produção dessa conta.

## Testes

- `npm run test:unit -- webhook mercado-pago ambiente`: assinatura (válida, 8 recusas, log do
  motivo), leitura do pagamento (situações, meios, centavos, vencimento, sem pagador), adaptador
  (`consultarPagamento`, 404 → `null`), Route Handler e `MP_WEBHOOK_SECRET` em produção.
- `npm run test:integration -- webhook` (PostgreSQL real, gateway dublê, 32 testes em
  `webhook-aprovacao`, `webhook-pendente` e `webhook-http`): aprovação,
  `sem_estoque`, saldo, reenvio, avisos simultâneos (conferido por mutação: sem as travas, falha),
  aviso tardio, pedido cancelado, segunda aprovação, valor e moeda, pedido inexistente, Pix
  pendente e prorrogado, Pix depois da reserva, Pix expirado, cartão recusado, fora de ordem, Pix
  pago depois dos 10 minutos, assinatura inválida, tipo não pagamento, aviso sem id, API fora,
  meio desconhecido, disputa, 404, IPN, corpo lido só depois da assinatura, estorno e chargeback
  de pedido pago, e "Finalizar" simultâneo à aprovação (trava externa; conferido por mutação: sem
  a trava do usuário no webhook e sem o filtro `PENDENTE` no cancelamento do checkout, o pedido
  pago termina cancelado).
- `npm run test:integration -- reserva`: prorrogação desfeita junto com a transação do webhook.

## Evidência no sandbox (11/10/2026)

Túnel `cloudflared`, Checkout Pro com comprador e vendedor de teste:

| Pagamento | Pedido | Resultado |
|-----------|--------|-----------|
| `182609447467` (Visa) | `20261011-PTXRNF` | Aviso assinado → 200; pedido `PAGO`, `payment` `APROVADO`/`CARTAO` sem pagador, estoque 3 → 2, reserva consumida; volta pelas `back_urls` funcionando |
| `183624726710` (Visa) | `20261011-BCQW22` | Pedido cancelado por um checkout seguinte; reenvio assinado do Mercado Pago → 200, pedido segue `CANCELADO`, `payment` `APROVADO`, log de estorno |
| `182610244329` (saldo) | `20261011-NX7X2W` | 500 enquanto a `0007` não estava aplicada no banco local (nada gravado); aplicada a migração, o **reenvio automático** do Mercado Pago 20 min depois confirmou: pedido `PAGO`, `payment` `SALDO_MERCADO_PAGO`/`account_money`, estoque 3 → 1 |
| `183623486996` (Visa) | `20261011-TQR8J2` | Reenvio automático de um aviso já processado: 200, nada alterado (sem segundo log de estorno) |

Achados do sandbox que viraram código ou configuração: avisos IPN e pagamento inexistente respondiam erro e seriam
reenviados sem fim (agora 200); a recusa de assinatura passou a registrar o motivo.

## Decisões da revisão

- **Sem tolerância de `ts` na assinatura** (achado R2). Um aviso assinado capturado pode ser
  reenviado, mas não muda nada: a situação vem da API e não volta atrás. Uma tolerância poderia
  recusar reenvios legítimos (no sandbox, eles chegaram 15 a 20 minutos depois e passaram), e não
  há garantia documentada de que o Mercado Pago renove o `ts` a cada reenvio.
- **Transições do pedido dentro de `payments`** (achado R4): ficam para o PBI-43, anotado lá.

## Antes do deploy

- **Migração `0007`** (`prisma migrate deploy`) antes do webhook receber avisos: sem ela, o
  pagamento com saldo responde 500 até a migração rodar.
- **Webhook na aplicação da conta real** e `MP_WEBHOOK_SECRET` em produção (o servidor não sobe
  sem ele). Com isso, o `MP_ACCESS_TOKEN` da conta real pode substituir o de sandbox.
- **Primeiro pagamento real:** conferir que o pedido vai a `PAGO` sozinho e estornar (PBI-43).

## Pendências para os próximos PBIs

- **PBI-43:**
  - estornar os pagamentos que o log marca com `estornar (PBI-43)`;
  - revisar os pedidos pagos com `Pagamento estornado de pedido já pago` no log (estorno ou
    chargeback chegou depois do pagamento, e o pedido segue na fila do admin);
  - levar as transições do pedido (pago, cancelado, carrinho) para funções de `orders` que
    aceitam a transação, usadas no webhook, no checkout e no cancelamento do admin (achado R4).
- **Pix e boleto no sandbox:** a conta de teste não ofereceu Pix (como no PBI-27). O caminho
  pendente → prorrogado → aprovado ou expirado está coberto pelos testes de integração, não por
  pagamento real.
