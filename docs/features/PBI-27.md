# PBI-27 — Pagamento Mercado Pago em sandbox

**Referências:** RF13, RN01, RN03, RN05, RN06, RNF10 e RNF12. **Dependência:** PBI-26.

## Objetivo e contrato confirmado

Levar o cliente do pedido pendente ao Checkout Pro do Mercado Pago, que oferece Pix, cartão e
boleto, sem que nenhum dado de cartão passe pelo Kolô. Decisões confirmadas antes de codar
(10/10/2026):

- **A prorrogação da reserva para Pix/boleto (RN06) é do webhook (PBI-28).** No Checkout Pro, o
  meio de pagamento só é conhecido depois que o Mercado Pago cria o pagamento. Este PBI só abre o
  checkout. A nota do PBI-25 foi ajustada.
- **O checkout fecha 2 minutos antes da reserva** (`FOLGA_PAGAMENTO_MS`; decisão da revisão,
  10/10/2026). A preferência e o botão param 2 minutos antes da reserva vencer. Assim, um Pix ou
  boleto gerado no último instante ainda encontra a reserva quando o webhook chega para
  prorrogá-la. O cliente tem 8 dos 10 minutos para começar a pagar.
- **A preferência nasce no botão da página do pedido** (`/checkout/[numero]`), e não no
  `finalizarCompra`. A nova tentativa é o mesmo botão, enquanto a reserva durar.
- **Sem migração e sem linha em `payment`.** `external_reference` é o número do pedido. O
  `payment` nasce no webhook, quando o meio já é conhecido: uma linha `PENDENTE` criada aqui
  faria o checkout tratar um cartão em andamento como "Pix em aberto".
- **Testes com dublê do gateway** e Postgres real para pedido e reserva. O pagamento no sandbox
  fica como evidência manual (abaixo), sem teste automatizado batendo na API.

Implementação no módulo novo `src/modules/payments`, com API pública em `index.ts`.

## API pública (`src/modules/payments`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `iniciarPagamento(numero, contexto, { gateway, agora?, appUrl? })` | Server Action do pedido | `{ ok, dados: { url } }` ou recusa (tabela abaixo) |
| `montarPreferencia(pedido, appUrl)` | Usada por `iniciarPagamento`; pura | corpo da preferência ou `invalido` |
| `gatewayMercadoPago(token?)` | Adaptador real do SDK `mercadopago` | `GatewayPagamento` |
| `prazoParaPagar(reservaExpiraEm)` / `FOLGA_PAGAMENTO_MS` | Prazo do checkout (fim da reserva − 2 min); também em `payments/cliente.ts` para a tela | `Date` ou `null` |

`GatewayPagamento` tem uma operação só, `criarPreferencia(corpo) → { url }`. Os testes injetam um
dublê; a Server Action (`src/app/checkout/[numero]/actions.ts`) injeta `gatewayMercadoPago()`.

| Recusa | Quando |
|--------|--------|
| `nao_encontrado` | Visitante, número inexistente ou pedido de outro cliente: mesma resposta (RN01) |
| `nao_pendente` | Pedido pago, cancelado ou em outra situação |
| `pagamento_em_aberto` | Já existe `payment` `PENDENTE` (Pix/boleto emitido) para o pedido (RN06) |
| `reserva_expirada` | Sem reserva ativa da sessão do pedido (RN03), ou faltando 2 minutos ou menos para ela vencer |
| `falha` | Gateway fora do ar, sem `MP_ACCESS_TOKEN`, `init_point` ausente ou fora de `https://*.mercadopago.com(.br)`, ou total que não fecha com os itens |

## Comportamentos

- **A preferência cobra o que o pedido gravou:** itens de `order_item` (título e preço da cópia),
  preço em reais convertido dos centavos e `currency_id` `BRL`. Se a soma dos itens não for igual
  ao total do pedido, nada vai ao Mercado Pago. Frete pago entra com o PBI-42.
- **Fecha antes da reserva:** `expires: true` e `expiration_date_to` igual ao fim da reserva
  menos 2 minutos, com deslocamento explícito `-03:00` (formato da documentação do Mercado Pago).
  Depois disso, a preferência não aceita pagamento **novo**. Um Pix ou boleto já gerado continua
  pagável pelo prazo próprio dele, e por isso existe a folga (ver PBI-28 abaixo).
- **Tela:** o cronômetro conta até o prazo para pagar ("Você tem mm:ss para iniciar o
  pagamento"). Ao zerar, mostra "O prazo para pagar acabou" e leva de volta ao carrinho.
- **URLs:**
  - `back_urls` (sucesso, pendente e falha) voltam para `/checkout/[numero]?retorno=mercadopago`;
  - com `APP_URL` em https, a preferência também leva `notification_url`
    (`/api/webhooks/mercadopago`, Route Handler do PBI-28) e `auto_return: "approved"`;
  - em `http://localhost` esses dois ficam de fora, porque o Mercado Pago não alcança o app.
- **A volta do navegador não decide nada (RN05).** A página relê o pedido do banco e, com
  `?retorno=mercadopago`, só mostra "Estamos confirmando seu pagamento". Os parâmetros que o
  Mercado Pago acrescenta (`status`, `collection_status`…) são ignorados. O pedido continua
  `PENDENTE` até o webhook (PBI-28).
- **Erros:** falha do gateway volta como mensagem na tela, e o botão destrava para uma nova
  tentativa. O log registra só o tipo do erro e o status HTTP, nunca a mensagem ou a resposta do
  provedor.
- **Redirecionamento:** só para `init_point` em https num domínio do Mercado Pago. Enquanto a
  página sai para o checkout, o botão segue travado, porque um segundo clique abriria outra
  preferência.

## Configuração (RNF12)

Variáveis no `.env` (documentadas no `.env.example`, nunca versionadas):

| Variável | Valor |
|----------|-------|
| `MP_ACCESS_TOKEN` | Access Token do **vendedor de teste** (sandbox) ou da conta real (produção). Sem ela o app sobe, mas o pagamento responde com erro. |
| `APP_URL` | URL pública do app. Em produção o servidor não sobe sem `https://` (`verificarAmbienteDeProducao`). Para receber webhook em desenvolvimento, use um túnel https (ngrok/cloudflared). |

### Credenciais de sandbox

1. Com a conta do Mercado Pago da equipe, abra o painel de desenvolvedor (Suas integrações) e
   crie uma aplicação do tipo **Checkout Pro**.
2. Na aplicação, em **Contas de teste**, crie duas contas do Brasil: uma **vendedor** e uma
   **comprador**. Guarde usuário e senha fora do repositório.
3. Entre com o **vendedor de teste** (janela anônima), abra o painel de desenvolvedor, crie uma
   aplicação Checkout Pro e copie o **Access Token de produção** dessa conta de teste
   (`APP_USR-…`) para `MP_ACCESS_TOKEN`. Por ser conta de teste, o dinheiro é fictício.
4. Para pagar, entre no checkout com o **comprador de teste**. Cartões de teste publicados pelo
   Mercado Pago, por exemplo Mastercard `5031 4332 1540 6351`, CVV `123`, validade `11/30`. O
   nome do titular define o resultado: `APRO` aprova, `OTHE` recusa. CPF `12345678909`.

## Testes

- `tests/unit/pagamento-preferencia.test.ts`: corpo da preferência (prazo com folga e `-03:00`),
  https × localhost, recusas por reserva ausente e total que não fecha.
- `tests/integration/pagamento.test.ts` (Postgres real e gateway dublê):
  - caminho feliz sem tocar em pedido, estoque e `payment`;
  - RN01;
  - pedido não pendente;
  - Pix em aberto;
  - reserva vencida ou ausente;
  - 2 minutos finais da reserva;
  - falha do gateway com nova tentativa;
  - log só com tipo e status HTTP.
- `tests/unit/mercado-pago.test.ts`: adaptador com o SDK substituído (token, `init_point` só
  https do Mercado Pago, erro sem token).
- `tests/unit/ambiente.test.ts`: produção sem `APP_URL` em https não sobe.
- `tests/unit/pagamento-acoes.test.ts`, `pedido-checkout.test.tsx` e `paginas-checkout.test.tsx`:
  redirecionamento, botão com estados de espera e erro (travado no redirect), cronômetro até o
  prazo para pagar, aviso na volta.

## Evidência no sandbox

_Pendente: depende das credenciais de teste da equipe._ Registrar aqui a data, quem testou, o
número do pedido e as capturas destas etapas:

1. botão → checkout do Mercado Pago com o valor do pedido;
2. pagamento com cartão `APRO` aprovado no sandbox;
3. volta para `/checkout/[numero]` com o aviso, e o pedido ainda **Aguardando pagamento** (a
   confirmação é do PBI-28);
4. `GET /checkout/preferences/{id}`: o `expiration_date_to` gravado é o fim da reserva menos 2
   minutos, no horário certo;
5. tentativa de pagar pela mesma preferência depois desse prazo é recusada pelo Mercado Pago.

## Passagem para o PBI-28

- O webhook encontra o pedido por `external_reference` (número), consulta o pagamento na API,
  grava o `payment` e, para Pix/boleto pendente, chama `prorrogarReserva` (ver PBI-25).
- `MP_WEBHOOK_SECRET` e a validação de `x-signature` ficam com o PBI-28.
- **Riscos que o PBI-27 não fecha (achado 1 da revisão).** Até o webhook chegar, um pedido em
  pagamento parece abandonado: `PENDENTE` e sem `payment`. Por isso:
  - um novo checkout da mesma conta cancela esse pedido e solta a reserva (regra do PBI-26),
    enquanto a preferência aberta ainda aceita pagamento por cartão;
  - o cliente pode pagar duas vezes o mesmo pedido (duas abas, ou pagar de novo depois de voltar).
    São pagamentos e eventos diferentes, então a idempotência por `webhook_event` não basta.
- **O que o PBI-28 precisa garantir:**
  - aprovação de pedido que não está `PENDENTE` (`CANCELADO` ou já `PAGO`) não reabre nem paga o
    pedido de novo e segue para estorno (PBI-43);
  - só o primeiro pagamento aprovado paga o pedido (idempotência também por pedido);
  - conferir `transaction_amount` e `currency_id` contra `totalCentavos`;
  - testes de integração com "aprovação de pedido CANCELADO" e "segunda aprovação do mesmo
    pedido".
- **Pagamento depois da reserva:** a folga de 2 minutos cobre o webhook atrasado de um Pix ou
  boleto gerado no fim do prazo. Se mesmo assim `prorrogarReserva` voltar `sem_reserva`, ou um
  cartão em análise for aprovado depois, a aprovação cai na reconciliação do PBI-25: baixa só se a
  unidade estiver livre, senão estorno.
