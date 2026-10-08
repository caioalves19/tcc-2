# PBI-26 — Checkout e criação do pedido

**Referências:** RF12, RN01, RN07; consome RF05 (PBI-23), RF11 (PBI-24) e RF15/RN03/RN04/RN06
(PBI-25). **Dependências:** PBI-23, PBI-24 e PBI-25.

## Objetivo e contrato confirmado

Levar o cliente do carrinho a um pedido `PENDENTE`, com as unidades reservadas, pronto para o
pagamento (PBI-27). Decisões confirmadas com o Robert antes de codar (08/10/2026):

- **O pedido e a reserva nascem no clique em "Finalizar compra",** na mesma transação. O `/checkout`
  só mostra o resumo; abrir a página não prende peça única.
- **Migração `0004`:** `order.session_id` (a sessão que reservou, pedida pelo PBI-25 para a baixa no
  PBI-28) e `order.modalidade_entrega` (enum `DeliveryMethod`, só `RETIRADA` por enquanto; o PBI-42
  acrescenta as demais). A coluna é obrigatória e sem default: quem cria o pedido escolhe a
  modalidade.
- **O endereço do RF05 é exigido sempre,** mesmo na retirada, e copiado no pedido.
- **Um novo "Finalizar" substitui o pedido abandonado:** `PENDENTE` sem pagamento em aberto vira
  `CANCELADO`. Com Pix ou boleto em aberto, o cliente volta ao pedido existente.

Implementação no módulo `src/modules/orders` (`checkout.ts` e `pedido.ts`), com API pública em
`index.ts`.

## API pública (`src/modules/orders`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `resumoCheckout(contexto, agora?)` | Página `/checkout` | `{ ok, dados: { itens, endereco, modalidade, subtotalCentavos, freteCentavos, totalCentavos } }` ou `nao_autenticado`, `carrinho_vazio`, `indisponivel` (com as obras), `sem_endereco`, `falha` |
| `finalizarCompra(entrada, contexto, opcoes?)` | Server Action do `/checkout` | `{ ok, dados: { numero, expiraEm } }`, `pendente` com o `numero` existente, `invalido` ou os erros do resumo |
| `lerPedido(numero, contexto, agora?)` | Página `/checkout/[numero]` | o pedido com a reserva ativa (`reservaExpiraEm`), ou `null` para quem não é o dono |
| `numeroDoPedido(agora, aleatorio)` | Função pura usada pelo `finalizarCompra` | `AAAAMMDD-XXXXXX` |

`entrada` é `{ modalidade: "RETIRADA" }`. `opcoes` aceita `agora` e `gerarNumero`, injetáveis só para
os testes, como o relógio do PBI-25.

## Comportamentos

- **Tudo vem do banco (RN07):** quantidades do `cart_item`, preços de `artwork.preco_centavos` e
  endereço do RF05, revalidado com `validarEndereco`. Campos extras da entrada (preço, total, frete,
  itens, endereço) são descartados pelo schema. O total é `Σ preço × quantidade + frete`, com frete 0
  na retirada.
- **Recusas:**
  - visitante → `nao_autenticado` (a página manda para `/login`);
  - carrinho vazio → `carrinho_vazio` (a página volta ao `/carrinho`);
  - obra em rascunho, arquivada, esgotada ou presa por outro cliente → `indisponivel`;
  - sem endereço ou com endereço inválido → `sem_endereco`.
- **Disponibilidade no resumo:** unidades livres = estoque − reservas ativas de **outros clientes**.
  As reservas do próprio cliente, em qualquer sessão, pertencem a um pedido dele: ou é abandonado, e
  o finalizar o cancela, ou tem pagamento em aberto, e o finalizar leva a ele. A conferência que vale
  é a de `reservarItens`, sob trava, dentro da transação.
- **Transação do finalizar**, com as travas na ordem usuário → sessão → obras:
  1. trava a linha do usuário: cliques simultâneos da mesma conta se enfileiram e sobra um
     `PENDENTE` só;
  2. com pedido `PENDENTE` que tem `payment` `PENDENTE` (Pix/boleto em aberto) → `pendente`, sem
     mexer em nada;
  3. cancela os `PENDENTE` sem pagamento em aberto (inclusive com pagamento recusado) e apaga as
     reservas das sessões deles, mesmo que seja outra sessão da conta;
  4. `reservarItens(sessão, itens, agora, tx)` por 10 minutos;
  5. cria o pedido com número sorteado, `session_id`, `modalidade_entrega`, totais e cópias
     (`endereco_copia`, `titulo_copia`, `preco_centavos_copia`).
- **Recusa no meio desfaz tudo:** a recusa da reserva é lançada dentro da transação, e o cancelamento
  do pedido anterior também é desfeito. O cliente fica como estava.
- **Número do pedido:** `AAAAMMDD-XXXXXX`, com a data de São Paulo (RN09) e 6 caracteres sem
  `0 O 1 I L`. Não é sequencial, para não expor o volume de vendas. Se repetir um número existente
  (`P2002`), a transação inteira roda de novo, até 5 vezes; depois disso volta `falha`, sem pedido
  nem reserva.
- **O carrinho não muda** ao criar o pedido: segue igual até a aprovação do pagamento.
- **Telas:**
  - `/carrinho`: "Finalizar compra" leva ao `/checkout`; com obra indisponível, o botão fica
    desabilitado e pede para removê-la;
  - `/checkout`: endereço (com "Editar endereço" para `/conta`), retirada no ateliê grátis e resumo do
    servidor; sem endereço, pede o cadastro; com obra indisponível, volta ao carrinho;
  - `/checkout/[numero]`: só para o dono (para os demais, 404); mostra a situação, o resumo e o
    cronômetro da reserva. Reserva vencida avisa e leva ao carrinho. "Pagar com Mercado Pago" fica
    desabilitado até o PBI-27.

## Limites conhecidos

- **O login não volta ao checkout:** o visitante vai para `/login` e, depois de entrar, cai em `/`
  (TODO já existente na action de login). O carrinho é preservado pela junção do PBI-24.
- **Pedido abandonado só é cancelado no próximo checkout.** Até lá ele fica `PENDENTE`, sem reserva
  depois dos 10 minutos. Os PBIs 29 e 30 devem tratar `PENDENTE` sem `payment` e sem reserva ativa
  como abandonado.
- **Preço lido logo antes da transação:** o resumo usado pelo finalizar é lido antes da trava. Uma
  edição de preço no mesmo instante do clique pode ir para o pedido com o valor de milissegundos
  antes. O estoque, esse sim, é conferido sob trava.
- **Carrinho vazio com Pix em aberto:** o finalizar responde `carrinho_vazio` antes de levar ao
  pedido pendente. Hoje não acontece, porque o carrinho só é limpo na aprovação.
- **Logout no meio do pagamento:** herda o limite do PBI-25. A reserva cai com a sessão, e
  `order.session_id` vira `NULL` (`ON DELETE SET NULL`); a baixa do PBI-28 segue pelo caminho
  `sessaoId` `null`.

## Validação

Seams: `resumoCheckout`, `finalizarCompra`, `lerPedido` e `numeroDoPedido`; a Server Action
`finalizarCompraAcao`; os componentes `CheckoutCompra`, `PedidoCheckout` e `CarrinhoCompras`; as
páginas `/checkout` e `/checkout/[numero]`.

- `npm run test:integration -- tests/integration/checkout` (PostgreSQL real, 10 testes):
  - resumo com itens, endereço, retirada e total literais;
  - recusas: visitante, carrinho vazio, rascunho, arquivada, unidade presa por outro cliente, sem
    endereço e endereço inválido;
  - pedido `PENDENTE` com cópias, `session_id`, modalidade e reserva de 10 minutos; editar a obra e o
    endereço depois não muda o pedido;
  - recusas sem rastro (nem pedido nem reserva) e valores adulterados ignorados (conferido por
    mutação: sem a validação da entrada, o teste falha);
  - novo finalizar cancela o abandonado, inclusive de outra sessão, e solta a reserva dele;
  - Pix em aberto devolve `pendente` sem criar pedido nem mexer na reserva prorrogada; pagamento
    recusado conta como abandonado;
  - 4 cliques simultâneos em 5 rodadas deixam um só `PENDENTE` (sem a trava do usuário, sobravam 4);
    dois clientes disputando uma peça única geram um pedido e um `indisponivel`;
  - número repetido tenta de novo; esgotadas as tentativas, nada fica gravado;
  - recusa dentro da transação desfaz o cancelamento do pedido anterior;
  - `lerPedido` só para o dono; outro cliente, visitante e número inexistente recebem `null`.
- `npm run test:unit -- checkout pedido-checkout carrinho-compras`: regras do número, Server Action,
  telas e páginas.
- `npm run test:integration -- tests/integration/catalogo-obras`: o pedido sintético do PBI-18 passou
  a informar `modalidade_entrega`.

## Pendências para os próximos PBIs

- **PBI-27:** criar a preferência a partir do pedido `PENDENTE` (número como referência externa),
  habilitar "Pagar com Mercado Pago" e, para Pix/boleto, chamar `prorrogarReserva` com os itens do
  pedido e o vencimento. Gravar o `payment` `PENDENTE`, que é o que faz o checkout tratar o pedido como
  "em aberto".
- **PBI-28:** chamar `baixarEstoque(order.session_id, itens, agora, tx)` com o pagamento aprovado e
  limpar o carrinho do cliente na mesma transação.
- **PBI-29/30:** listar os pedidos e tratar o `PENDENTE` abandonado (veja "Limites conhecidos").
- **PBI-42:** novas modalidades no enum `DeliveryMethod`, com o frete calculado no servidor.
