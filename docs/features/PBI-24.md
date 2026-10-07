# PBI-24 — Carrinho persistente

**Referências:** RF11, RN02 e RN11. **Dependência:** PBI-18.

## Objetivo e contrato confirmado

Manter o carrinho entre sessões: o do visitante no banco, encontrado por um cookie, e o da conta no
banco, ligado ao usuário. Decisões confirmadas com o Robert antes de codar (06/10/2026):

- **Telas:** a página `/carrinho` (seguindo a tela do Stitch) e o cabeçalho com link e contagem
  entram agora. O botão "Adicionar ao carrinho" fica pronto para o PBI-20 ligar na página da obra.
- **Obra que fica indisponível** (esgota, volta a rascunho ou é arquivada) continua no carrinho,
  marcada, fora do total, e sem mudança de quantidade. O checkout (PBI-26) deve recusá-la.
- **Ao entrar na conta,** o carrinho do visitante se junta ao da conta: se a mesma obra está nos
  dois, vale a maior quantidade, limitada ao estoque.

Implementação no módulo `src/modules/orders` (previsto no ESCOPO para carrinho, pedido e frete), com
API pública em `index.ts`. Não houve mudança de schema.

## Comportamentos

- **Adicionar** só aceita obra comprável: publicada como disponível, com estoque e sem arquivamento
  (`obraDisponivel`). A quantidade vai de 1 até o estoque atual (RN02); somar a quantidade de uma
  obra que já está no carrinho também respeita o estoque.
- **O carrinho não reserva estoque.** A reserva (RN03/RN04) é o PBI-25.
- **Preço, disponibilidade e total** vêm sempre do banco, com o preço atual da obra. O total soma só
  os itens disponíveis (`resumirCarrinho`).
- **Cookie do visitante** `kolo_carrinho`:
  - `HttpOnly`, `SameSite=Lax`, `Secure` em produção, 30 dias (`src/app/carrinho/cookie.ts`);
  - o token é aleatório (32 bytes), e o banco guarda só o hash SHA-256 em `cart.cookie_token`;
  - o token nunca volta ao navegador pela resposta da Server Action;
  - se o cookie aponta para um carrinho que não existe mais, a próxima adição cria outro e troca o
    cookie.
- **Conta:** a sessão é relida no banco (conta ativa e não excluída). O carrinho da conta vale para
  qualquer sessão do mesmo usuário e não aparece para outra pessoa.
- **Juntar** (`juntarCarrinhos`) roda nas actions de login e de cadastro, logo depois de abrir a
  sessão. O carrinho do visitante é apagado e o cookie, removido. Se a junção falhar, o cookie fica
  e nada se perde.
- **Telas:**
  - `/carrinho` lista foto, título, artista e preço; mostra a quantidade só para tiragem (estoque
    maior que 1); remove itens;
  - o resumo traz o subtotal, "frete calculado no checkout" e o total;
  - "Finalizar compra" fica desabilitado até o PBI-26 existir;
  - o cabeçalho mostra "Carrinho, N itens", contados em unidades no layout. Se o banco falhar, mostra
    0 e a página segue.

## Validação

Seams: funções públicas de `src/modules/orders`, as regras puras, as Server Actions e os componentes
`CarrinhoCompras`, `BotaoAdicionarAoCarrinho` e `Cabecalho`.

- `npm run test:unit -- carrinho-regras`: quantidade, junção, disponibilidade e totais.
- `npm run test:integration -- carrinho` (PostgreSQL real):
  - visitante adiciona, altera e remove, com o hash do token no banco;
  - recusa obra em rascunho, inexistente, quantidade inválida e peça única repetida, sem reservar
    estoque;
  - o carrinho da conta vale entre sessões e fica isolado;
  - a junção ao entrar;
  - item indisponível marcado nos três casos.
- `npm run test:unit -- carrinho-ao-entrar carrinho-acoes carrinho-compras botao-adicionar-carrinho cabecalho`:
  - junção chamada no login e no cadastro, com o cookie apagado;
  - cookie gravado sem devolver o token;
  - tela do carrinho;
  - botão de adicionar;
  - link e contagem no cabeçalho.

**Conferência no navegador** (06/10/2026, Postgres local), com duas obras publicadas e um carrinho de
visitante preparados no banco:

1. Como visitante, `/carrinho` mostrou "Peça única", o seletor da tiragem e o total do servidor.
2. Alterar para 3 e remover atualizaram o total e o cabeçalho.
3. Ao entrar na conta, os itens passaram para o carrinho da conta, o carrinho do visitante sumiu do
   banco e o cookie foi apagado.
4. Em 1440 e 320 px não há rolagem horizontal; o axe-core 4.10.2 não acusou violações.

## Pendências e limites conhecidos

- **Página da obra (PBI-20):** colocar o `BotaoAdicionarAoCarrinho` com a `adicionarAoCarrinhoAcao`.
  Até lá, nenhuma tela pública adiciona itens; o fluxo de adicionar está coberto pelos testes.
- **Checkout (PBI-26):** habilitar "Finalizar compra", recusar itens indisponíveis e chamar a reserva
  (PBI-25), já que o carrinho não reserva.
- **Carrinhos de visitante abandonados** ficam no banco (o cookie dura 30 dias). Uma limpeza
  periódica pode entrar junto com as tarefas do pg-boss no PBI-25.
