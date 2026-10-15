# PBI-38 — Perfil unificado do cliente no admin

**Referências:** RF30 ("Gestão de clientes: perfil unificado com compras"). **Dependências:**
PBI-26 (pedidos) e PBI-30 (leitura de situação e rótulos do admin).

## Objetivo e contrato confirmado

O ADMIN consulta os clientes e, no perfil de cada um, os dados da conta, o endereço de entrega e
todas as compras. Decisões confirmadas antes de codar (14/10/2026):

- **Lista e link no pedido:** `/admin/clientes` (busca e paginação), `/admin/clientes/[id]` (perfil)
  e o nome do cliente no detalhe do pedido leva ao perfil.
- **Conteúdo literal do RF30:** dados, endereço e compras. Os horários da agenda (PBI-34) ficam fora.
- **Histórico com todos os pedidos:** a mesma leitura do filtro "Todos" do PBI-30, com as tentativas
  sem pagamento marcadas "Não concluído". O total gasto soma só os pagos.
- **Quem é cliente:** só o papel `CLIENTE`. Conta com `excluido_em` aparece, marcada "Conta
  excluída", e mantém os pedidos (prepara o PBI-40, que anonimiza).
- **Fora:** editar, bloquear ou excluir cliente; ações sobre pedidos no perfil (ficam no detalhe do
  pedido); anonimização (PBI-40); migração; payload do pagamento; exportar ou métricas além do total
  gasto.

## API pública

`src/modules/customers` (tudo pelo `comoAdmin`: sessão e papel relidos no banco; visitante recebe
`nao_autenticado`, cliente e artista `proibido`):

| Função | Resultado |
|--------|-----------|
| `listarClientesAdmin({ busca, pagina }, cabecalhos)` | `{ clientes, total, pagina, totalPaginas, busca }`; cada cliente com id, nome, e-mail, data de cadastro e `excluido`. Por nome; busca em parte do nome ou do e-mail sem diferenciar maiúsculas; 20 por página; valor inválido volta ao padrão |
| `lerClienteAdmin(id, cabecalhos)` | Dados (nome, e-mail, telefone, situação da conta, cadastro, `excluido`), endereço como foi gravado (ou `null`), `pedidos` e `totalGastoCentavos`; `nao_encontrado` para id fora do formato uuid, inexistente ou de quem não é `CLIENTE` |

`src/modules/orders` ganhou:

| Função | Resultado |
|--------|-----------|
| `pedidosDoClienteAdmin(tx, userId, agora)` | Todos os pedidos não excluídos do usuário, do mais recente ao mais antigo, com a mesma linha da lista do admin (sem o cliente). Roda na transação de quem chama, que já passou pelo `comoAdmin` |
| `lerPedidoAdmin` | `cliente.perfilId`: id do perfil, ou `null` quando quem comprou não é `CLIENTE` |

A linha do pedido é montada por `resumoDoPedido` (`orders/gestao.ts`), compartilhada com a lista de
pedidos: a regra de situação e rótulo não foi duplicada.

## Regra pura (`src/modules/customers/regras.ts`)

| Função | O que faz |
|--------|-----------|
| `totalGasto(pedidos)` | Soma os pedidos em Pago, Em preparação, Enviado e Entregue. Pendente e Cancelado (inclusive o estornado, PBI-43) não contam |

## Telas

- Menu do admin com "Clientes".
- `/admin/clientes`: busca por formulário GET, cards com nome (link para o perfil), e-mail, "Cliente
  desde", etiqueta "Conta excluída", contagem e paginação mantendo a busca.
- `/admin/clientes/[id]`: volta para Clientes, etiqueta da conta excluída, Compras (total gasto,
  contagem e pedidos com etiqueta, data, itens e total, cada um levando ao detalhe), Dados (e-mail com
  `mailto`, telefone ou "Sem telefone", cadastro, conta ativa ou inativa) e Endereço de entrega (ou
  "Nenhum endereço cadastrado."); 404 para cliente não encontrado.
- `/admin/pedidos/[numero]`: o nome do cliente é link para o perfil quando há `perfilId`.

## Limites conhecidos

- **Histórico sem paginação:** o perfil traz todos os pedidos do cliente; suficiente para o volume do
  ateliê.
- **Busca sem tolerância a acento** no nome (só maiúsculas), como a busca de pedidos do PBI-30.

## Validação

- `npm run test:integration -- perfil-cliente pedidos-admin.test` (PostgreSQL real):
  - permissões na lista e no perfil (visitante, cliente e artista recusados);
  - lista só com `CLIENTE`, por nome, com a conta excluída marcada;
  - busca por parte do nome ou do e-mail sem diferenciar maiúsculas; admin não aparece;
  - perfil com dados e endereço; sem endereço; conta excluída;
  - id inválido, inexistente, de admin ou de artista dá `nao_encontrado`;
  - histórico só com os pedidos do cliente, com o não concluído, sem o pedido excluído, do mais
    recente ao mais antigo; total gasto só dos pagos; cliente sem compras com total 0;
  - `perfilId` no detalhe do pedido, e `null` quando quem comprou é o admin.
- `npm run test:unit -- clientes-regras lista-clientes-admin perfil-cliente-admin paginas-admin-clientes pedido-admin admin-layout`.
- Gates em 14/10/2026: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` (512
  testes), `npm run test:integration` (262 testes) e `npm run build` sem erros.
- **No navegador:** pendente (ver Sprint 2).
