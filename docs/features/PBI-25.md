# PBI-25 — Reserva temporária e concorrência de estoque

**Referências:** RF15, RN02, RN03, RN04, RN05 e RN06. **Dependência:** PBI-18.

## Objetivo e contrato confirmado

Prender as unidades das obras durante o checkout, sem vender além do estoque mesmo com compras
simultâneas. Decisões confirmadas antes de codar (07/10/2026):

- **A reserva fica ligada à sessão** (`artwork_reservation.session_id`, como no DER). Não houve
  migração. Para Pix e boleto (RN06), a reserva da sessão é prorrogada até o vencimento do meio
  de pagamento. Quem prorroga é o webhook (PBI-28): no Checkout Pro, o meio só é conhecido depois
  que o Mercado Pago cria o pagamento (decisão do PBI-27, 10/10/2026).
- **pg-boss no `instrumentation.ts`:** o worker sobe junto com o servidor do Next. Não há script
  nem serviço novo.
- **A baixa do estoque fica neste PBI** (`baixarEstoque`). O webhook (PBI-28) só chama, com o
  pagamento aprovado.
- **Carrinho e vitrine não mudam.** As reservas só pesam no checkout (PBI-26). O carrinho continua
  sem reservar, como decidido no PBI-24.

Implementação no módulo `src/modules/orders`, com API pública em `index.ts`.

## API pública (`src/modules/orders`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `reservarItens(sessaoId, itens, agora?)` | PBI-26, ao ir para o pagamento | `{ ok, dados: { expiraEm } }`, `indisponivel` com as obras ou `pendente` |
| `prorrogarReserva(sessaoId, itens, ate, agora?)` | PBI-28, Pix ou boleto pendente | `{ ok, dados: { expiraEm } }`, `sem_reserva` ou `invalido` |
| `liberarReservas(sessaoId)` | Cliente desiste ou pedido cancelado antes de pagar | — |
| `estoqueDisponivel(obraId, agora?, sessaoId?)` | Checkout, para avisar antes de reservar | unidades livres (0 se a obra não está à venda); com `sessaoId`, as reservas dela contam como livres |
| `baixarEstoque(sessaoId \| null, itens, agora?, tx?)` | PBI-28, pagamento aprovado | `{ ok }` ou `sem_estoque` com as obras |
| `liberarReservasExpiradas(agora?)` | Tarefa do pg-boss | quantas reservas apagou |

`itens` é `[{ obraId, quantidade }]`, sem obra repetida; o `obraId` é normalizado para minúsculas.
Entrada inválida volta como `invalido`. O relógio (`agora`) pode ser injetado para os testes.

## Comportamentos

- **Unidades livres** = `quantidade_estoque` − reservas ativas (`expira_em > agora`) **de outras
  sessões**. Só obra publicada como disponível, com estoque e não arquivada pode ser reservada
  (`obraDisponivel`, RN11).
- **Tudo ou nada:** se uma obra não cabe, nada é reservado, e a resposta lista as obras que faltam.
- **Concorrência (RN04):** a reserva, a prorrogação e a baixa rodam numa transação que trava as
  linhas de `artwork` com `SELECT … FOR UPDATE`, sempre na ordem do id (sem deadlock entre
  carrinhos com as mesmas obras). A reserva e a prorrogação travam antes a linha da `session`:
  um checkout e uma prorrogação da mesma sessão se enfileiram, e um não apaga o que o outro garante.
- **10 minutos (RN03):** a reserva vale até `agora + 10 min`. Uma nova reserva da mesma sessão
  substitui a anterior (o cliente voltou ao checkout com outro carrinho).
- **Pix/boleto pendente (RN06):** se a sessão tem reserva prorrogada (vence depois de
  `agora + 10 min`), `reservarItens` devolve `pendente` e não mexe nela. A reserva sai com a
  aprovação (baixa), o vencimento ou o cancelamento do pedido (`liberarReservas`); veja o limite
  dos 10 minutos finais em "Limites conhecidos".
- **Reservar não baixa estoque.** O estoque só cai em `baixarEstoque`.
- **Limpeza:** o pg-boss agenda a fila `liberar-reservas-expiradas` com `* * * * *`. A disponibilidade
  já ignora reservas vencidas, então a limpeza é só higiene: atrasar ou rodar duas vezes não muda o
  estoque livre. Se a fila não sobe (banco fora no boot), o servidor sobe mesmo assim e registra o
  motivo no log.

## Ciclo com Pix e boleto (RN06)

1. **Checkout (PBI-26):** `reservarItens` → reserva por 10 minutos.
2. **Checkout Pro aberto (PBI-27):** a preferência do Mercado Pago fecha 2 minutos antes da
   reserva. O cliente só gera Pix, boleto ou pagamento de cartão enquanto as unidades estão presas,
   e o webhook ainda tem essa folga para prorrogar a reserva. O PBI-27 não grava `payment` nem
   prorroga nada.
3. **Pagamento criado (webhook, PBI-28):**
   - cartão: a aprovação costuma chegar dentro dos 10 minutos;
   - Pix ou boleto: o pedido fica pendente, e o webhook chama `prorrogarReserva(sessaoId,
     itens, vencimento)` com os itens do pedido e o vencimento do meio de pagamento. Só prorroga
     se as reservas ativas da sessão forem exatamente esses itens; reserva já vencida não é
     ressuscitada, e um carrinho trocado por um novo checkout não é prorrogado no lugar do pedido.
     Nos dois casos volta `sem_reserva`, e o pagamento não deve ser emitido com essas unidades
     garantidas.
     A prorrogação recusa (`invalido`) itens inválidos, prazo no passado, data inválida ou prazo
     menor que o atual: ela nunca encurta a reserva.
4. **Aprovação (PBI-28):** `baixarEstoque(sessaoId, itens, agora, tx)`, dentro da transação do
   webhook. O PBI-28 grava o `webhook_event` (id único), paga o pedido e baixa o estoque na mesma
   `tx`: se algo falha, tudo é desfeito. A idempotência (RNF11) fica com o evento único, porque uma
   segunda baixa de uma tiragem com estoque sobrando passaria.
   - Reserva ativa: é consumida e o estoque baixa. Com estoque 0, a obra publicada passa a
     ESGOTADA (`situacaoPorEstoque`).
   - Reserva vencida, ou sessão apagada (logout, com `sessaoId` `null`): baixa só se nenhuma outra
     sessão segura a unidade. Senão volta `sem_estoque`, e o estoque fica como estava. O pedido pago
     sem unidade segue para estorno (PBI-43).
5. **Vencimento sem pagamento:** a reserva expira sozinha e o pg-boss a apaga.

O estoque nunca fica negativo, porque a baixa confere as unidades livres dentro da mesma trava.

## Limites conhecidos

- **Logout no meio de um Pix pendente:** `artwork_reservation` cai em cascata com a `session`.
  Logout, troca de senha ou remoção da conta apagam a reserva; a aprovação cai no caminho
  `sessaoId` `null` (baixa se a unidade ainda estiver livre, senão `sem_estoque`). É o custo da
  decisão "reserva ligada à sessão", sem migração.
- **Últimos 10 minutos de uma reserva prorrogada:** sem coluna nova, `pendente` reconhece a
  prorrogação só enquanto ela vence depois de `agora + 10 min`. Nos 10 minutos finais do Pix/boleto,
  um novo checkout da mesma sessão substitui a reserva. Por isso o PBI-26 deve consultar o pedido
  pendente da sessão antes de chamar `reservarItens`, e não depender só do `pendente`.
- **Prorrogação na virada do prazo:** se outra sessão levou a peça logo depois do vencimento, a
  prorrogação volta `sem_reserva`. O Pix/boleto já foi emitido pelo Mercado Pago: o PBI-28 decide
  como tratá-lo, e a aprovação posterior cai na reconciliação (baixa só se a unidade estiver livre).
- **Limpeza e prorrogação na mesma virada:** o job do pg-boss apaga reservas sem travar as obras.
  Bem no vencimento, com duas ou mais reservas da mesma sessão, a limpeza e uma prorrogação podem
  travar as mesmas linhas em ordem cruzada. O Postgres detecta (`40P01`) e aborta uma das duas: a
  limpeza roda de novo no minuto seguinte, sem efeito colateral; a prorrogação lança erro, e o
  PBI-28 deve tratá-lo como falha da notificação (responder erro para o Mercado Pago reenviar).
- **Baixa de obra que saiu de venda:** se o pagamento é aprovado depois que o admin despublicou ou
  arquivou a obra, a baixa acontece mesmo assim (o cliente pagou), e a obra em rascunho continua
  em rascunho.

## Validação

Seams: funções públicas de `src/modules/orders` e `iniciarTarefas` (`src/lib/tarefas.ts`).

- `npm run test:integration -- tests/integration/reserva` (PostgreSQL real):
  - reserva até o estoque livre, recusa o que outra sessão segura e não baixa estoque;
  - recusa rascunho e obra arquivada;
  - 8 sessões disputando uma peça única, em 10 rodadas: só uma reserva por rodada;
  - expira em 10 min (vale em 9:59.999, livre em 10:00.001) e a nova reserva da sessão substitui a
    anterior;
  - prorrogação da reserva ativa e recusa da vencida; itens inválidos e prazo no passado, menor
    que o atual (entre agora e o vencimento) ou inválido voltam `invalido` e não encurtam a reserva;
  - prorrogação que chega depois de outra sessão levar a peça na virada do prazo volta
    `sem_reserva`, e a peça segue com uma reserva só;
  - limpeza idempotente, que mantém as ativas;
  - estoque livre com e sem reserva, e depois de liberar;
  - baixa com reserva ativa (estoque 0 e ESGOTADA);
  - baixa depois de vencer: com unidade livre baixa, com unidade tomada volta `sem_estoque`
    (também com `sessaoId` `null`);
  - baixa dentro de uma transação externa desfeita: estoque e reserva intactos;
  - tudo ou nada com uma obra que cabe e outra que não, na reserva e na baixa;
  - baixa de obra que voltou a rascunho continua rascunho;
  - carrinhos com as mesmas obras em ordem invertida, em paralelo, sem deadlock (conferido por
    mutação: travando na ordem do pedido, o Postgres acusa `deadlock detected`);
  - o dono da reserva vê as próprias unidades como livres, e id em maiúsculas vale igual;
  - com Pix pendente, um novo checkout da mesma sessão volta `pendente`, a peça continua presa, e
    depois de cancelar (`liberarReservas`) a sessão reserva de novo;
  - checkout e prorrogação simultâneos na mesma sessão (ordem fixada por uma trava externa): o
    checkout troca o carrinho e a prorrogação volta `sem_reserva`, sem prorrogar o carrinho novo
    (conferido por mutação: sem a trava da sessão ou sem conferir os itens, o teste falha).
- `npm run test:integration -- tests/integration/tarefas`: o pg-boss real agenda `* * * * *` e o
  worker apaga só a reserva vencida.
- `npm run test:unit -- instrumentation`: o servidor sobe mesmo se a fila falhar.

## Pendências para os próximos PBIs

- **PBI-26:** chamar `reservarItens` ao finalizar a compra, recusar os itens `indisponivel` e, em
  `pendente`, levar o cliente ao pedido pendente (pagar ou cancelar).
  Guardar no pedido a sessão que reservou, para o PBI-28 passar à `baixarEstoque`.
- **PBI-27:** prorrogar a reserva com o vencimento do Pix/boleto.
- **PBI-28:** chamar `baixarEstoque` só com pagamento aprovado, passando a `tx` do webhook
  (evento único + pedido pago + baixa na mesma transação), e tratar `sem_estoque`.
- **PBI-43:** estornar o pedido pago que voltou `sem_estoque`.
