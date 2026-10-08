# PBI-25 — Reserva temporária e concorrência de estoque

**Referências:** RF15, RN02, RN03, RN04, RN05 e RN06. **Dependência:** PBI-18.

## Objetivo e contrato confirmado

Prender as unidades das obras durante o checkout, sem vender além do estoque mesmo com compras
simultâneas. Decisões confirmadas antes de codar (07/10/2026):

- **A reserva fica ligada à sessão** (`artwork_reservation.session_id`, como no DER). Não houve
  migração. Para Pix e boleto (RN06), o checkout prorroga a reserva da sessão até o vencimento do
  meio de pagamento.
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
| `reservarItens(sessaoId, itens, agora?)` | PBI-26, ao ir para o pagamento | `{ ok, dados: { expiraEm } }` ou `indisponivel` com as obras |
| `prorrogarReserva(sessaoId, ate, agora?)` | PBI-26/27, Pix ou boleto pendente | `{ ok, dados: { expiraEm } }` ou `sem_reserva` |
| `liberarReservas(sessaoId)` | Cliente desiste ou pedido cancelado antes de pagar | — |
| `estoqueDisponivel(obraId, agora?)` | Checkout, para avisar antes de reservar | unidades livres (0 se a obra não está à venda) |
| `baixarEstoque(sessaoId \| null, itens, agora?)` | PBI-28, pagamento aprovado | `{ ok }` ou `sem_estoque` com as obras |
| `liberarReservasExpiradas(agora?)` | Tarefa do pg-boss | quantas reservas apagou |

`itens` é `[{ obraId, quantidade }]`, sem obra repetida. Entrada inválida volta como `invalido`.
O relógio (`agora`) pode ser injetado para os testes.

## Comportamentos

- **Unidades livres** = `quantidade_estoque` − reservas ativas (`expira_em > agora`) **de outras
  sessões**. Só obra publicada como disponível, com estoque e não arquivada pode ser reservada
  (`obraDisponivel`, RN11).
- **Tudo ou nada:** se uma obra não cabe, nada é reservado, e a resposta lista as obras que faltam.
- **Concorrência (RN04):** a reserva e a baixa rodam numa transação que trava as linhas de
  `artwork` com `SELECT … FOR UPDATE`, sempre na ordem do id (sem deadlock entre carrinhos com as
  mesmas obras).
- **10 minutos (RN03):** a reserva vale até `agora + 10 min`. Uma nova reserva da mesma sessão
  substitui a anterior (o cliente voltou ao checkout com outro carrinho).
- **Reservar não baixa estoque.** O estoque só cai em `baixarEstoque`.
- **Limpeza:** o pg-boss agenda a fila `liberar-reservas-expiradas` com `* * * * *`. A disponibilidade
  já ignora reservas vencidas, então a limpeza é só higiene: atrasar ou rodar duas vezes não muda o
  estoque livre.

## Ciclo com Pix e boleto (RN06)

1. **Checkout (PBI-26):** `reservarItens` → reserva por 10 minutos.
2. **Pagamento criado (PBI-27):**
   - cartão: a aprovação costuma chegar dentro dos 10 minutos;
   - Pix ou boleto: o pedido fica pendente, e o checkout chama `prorrogarReserva(sessaoId,
     vencimento)` com o vencimento do meio de pagamento. Reserva já vencida não é ressuscitada
     (`sem_reserva`): nesse caso o pagamento não deve ser emitido com essas unidades garantidas.
3. **Aprovação (PBI-28):** `baixarEstoque(sessaoId, itens)`.
   - Reserva ativa: é consumida e o estoque baixa. Com estoque 0, a obra publicada passa a
     ESGOTADA (`situacaoPorEstoque`).
   - Reserva vencida, ou sessão apagada (logout, com `sessaoId` `null`): baixa só se nenhuma outra
     sessão segura a unidade. Senão volta `sem_estoque`, e o estoque fica como estava. O pedido pago
     sem unidade segue para estorno (PBI-43).
4. **Vencimento sem pagamento:** a reserva expira sozinha e o pg-boss a apaga.

O estoque nunca fica negativo, porque a baixa confere as unidades livres dentro da mesma trava.

## Validação

Seams: funções públicas de `src/modules/orders` e `iniciarTarefas` (`src/lib/tarefas.ts`).

- `npm run test:integration -- tests/integration/reserva` (PostgreSQL real):
  - reserva até o estoque livre, recusa o que outra sessão segura e não baixa estoque;
  - recusa rascunho e obra arquivada;
  - 8 sessões disputando uma peça única, em 10 rodadas: só uma reserva por rodada;
  - expira em 10 min (vale em 9:59.999, livre em 10:00.001) e a nova reserva da sessão substitui a
    anterior;
  - prorrogação da reserva ativa e recusa da vencida;
  - limpeza idempotente, que mantém as ativas;
  - estoque livre com e sem reserva, e depois de liberar;
  - baixa com reserva ativa (estoque 0 e ESGOTADA);
  - baixa depois de vencer: com unidade livre baixa, com unidade tomada volta `sem_estoque`
    (também com `sessaoId` `null`).
- `npm run test:integration -- tests/integration/tarefas`: o pg-boss real agenda `* * * * *` e o
  worker apaga só a reserva vencida.

## Pendências para os próximos PBIs

- **PBI-26:** chamar `reservarItens` ao finalizar a compra e recusar os itens `indisponivel`.
  Guardar no pedido a sessão que reservou, para o PBI-28 passar à `baixarEstoque`.
- **PBI-27:** prorrogar a reserva com o vencimento do Pix/boleto.
- **PBI-28:** chamar `baixarEstoque` só com pagamento aprovado e tratar `sem_estoque`.
- **PBI-43:** estornar o pedido pago que voltou `sem_estoque`.
