# PBI-42 — Modalidades adicionais de frete

**Referências:** complemento do RF12; RN07. **Dependências:** PBI-26.

## Objetivo e contrato confirmado

O cliente escolhe no checkout entre retirar no ateliê e receber no endereço; o frete é calculado no
servidor e copiado no pedido. Decisões confirmadas antes de codar (12/10/2026):

- **Duas modalidades:** `RETIRADA` (sem custo) e `ENTREGA` (migração `0009`).
- **Entrega:** valor fixo na cidade de São Paulo/SP (cidade comparada sem acento, maiúsculas nem
  espaços nas pontas); fora dela, tabela por UF. UF fora da tabela deixa a entrega indisponível, e
  sobra a retirada.
- **Valores em constantes** em `src/modules/orders/frete.ts`, de exemplo, a confirmar com a equipe.
  A tela para o ADMIN editar ficou anotada no PBI-39.
- **Mercado Pago (risco herdado do PBI-28):** o frete vai como item "Frete" da preferência, não em
  `shipments.cost`; assim o `transaction_amount` inclui o frete e a conferência do webhook
  (valor = total) não muda. A preferência confere itens + frete = total.
- **Achado da revisão do PBI-43:** "Concluir estorno" só aparece quando nenhum outro pagamento do
  pedido o pagou (aprovado sem motivo, ou aprovado sem unidade livre, `SEM_ESTOQUE`).
- **Fora:** Correios ou API de frete, faixa de CEP, tabela no banco, tela de admin e estorno
  parcial do frete.

| Modalidade | Endereço | Frete (exemplo) |
|------------|----------|-----------------|
| Retirada no ateliê | qualquer | R$ 0,00 |
| Entrega no endereço | São Paulo/SP | R$ 30,00 |
| Entrega no endereço | SP (fora da capital) | R$ 45,00 |
| Entrega no endereço | RJ, MG, PR | R$ 65,00 |
| Entrega no endereço | ES, SC, RS, DF, GO, MS | R$ 85,00 |
| Entrega no endereço | demais UFs | indisponível |

## API pública

`src/modules/orders`:

| Função | Uso | Resultado |
|--------|-----|-----------|
| `resumoCheckout(contexto, agora?)` | Página `/checkout` | ganha `modalidades: { modalidade, freteCentavos \| null }[]`; `modalidade`, `freteCentavos` e `totalCentavos` são os da retirada |
| `finalizarCompra({ modalidade }, contexto, opcoes?)` | Server Action | aceita `RETIRADA` ou `ENTREGA`; recalcula o frete; `invalido` para entrega indisponível, sem pedido nem reserva |
| `pagouOPedido(pagamento)` | Regra pura | pagamento aprovado sem motivo ou com `SEM_ESTOQUE` (a regra de `estornoCancelaPedido`) |
| `acaoDeEstorno(pagamento, situacaoPedido, pagoPorOutro)` | Regra pura | `"concluir"` só sem outro pagamento que pagou o pedido |

`src/modules/orders/cliente.ts` expõe `ROTULO_MODALIDADE` ("Retirada no ateliê", "Entrega no
endereço") para checkout, conta e admin.

`src/modules/payments`: `montarPreferencia` acrescenta o item `{ id: "frete", title: "Frete" }`
quando o frete é maior que 0.

## Validação

- `tests/unit/frete.test.ts`: retirada 0, valor fixo na capital (com e sem acento), tabela por UF e
  UF fora da tabela.
- `tests/integration/checkout.test.ts`: o resumo lista o frete de cada modalidade; finalizar com
  entrega grava modalidade, frete e total, ignorando frete e total do navegador; entrega fora da
  tabela é recusada sem pedido nem reserva.
- `tests/unit/pagamento-preferencia.test.ts`: item "Frete" e conferência itens + frete = total.
- `tests/unit/checkout-compra.test.tsx` e `tests/unit/detalhe-pedido.test.tsx`: escolha da
  modalidade, entrega indisponível desabilitada, rótulos e andamento de envio.
- `tests/integration/estorno.test.ts` e `tests/integration/pedidos-admin-estorno.test.ts`:
  pagamento visto já estornado com outro pagamento que pagou o pedido (sem motivo ou sem unidade
  livre) não conclui o estorno, não devolve estoque e fica fora do filtro.

## Antes do deploy

- Migração `0009`.
- Confirmar os valores do frete com a equipe.
