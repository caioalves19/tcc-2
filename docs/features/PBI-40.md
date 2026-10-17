# PBI-40 — Exclusão de conta e anonimização

**Referências:** RN12 ("Cliente exclui a própria conta, mas os pedidos pagos são preservados de forma
anonimizada") e RNF19. **Dependências:** PBI-26 (formato do pedido e de `endereco_copia`) e PBI-38
(leitura do admin, que já marca a conta excluída).

## Objetivo e contrato confirmado

O CLIENTE exclui a própria conta em `/conta`. Os dados pessoais são anonimizados numa transação só, e
os pedidos e pagamentos ficam com os mesmos valores, para o registro da venda. Decisões confirmadas
antes de codar (16/10/2026):

- **Pedido a caminho bloqueia:** com pedido `PAGO`, `PROCESSANDO` ou `ENVIADO`, a exclusão é
  recusada (o ateliê ainda precisa do endereço). Liberada quando todos estão `ENTREGUE` ou
  `CANCELADO`.
- **Pedido não pago:** `PENDENTE` vira `CANCELADO` e solta a reserva. Um pagamento aprovado depois
  não reabre o pedido: o webhook o marca para estorno (`PEDIDO_NAO_PENDENTE`, PBI-43). Nenhum pedido é
  apagado.
- **Confirmação explícita:** senha atual mais a caixa "Entendo que a exclusão não pode ser desfeita".
- **Agenda e e-mails:** o horário registrado pela equipe fica, sem `user_id`; o destinatário do
  `email_log` é anonimizado.
- **Cópia do endereço no pedido:** ficam só cidade e UF; o resto vira texto vazio, no mesmo formato.
- **Fora:** exclusão pelo admin, desfazer, carência, artista ou admin se excluindo, contato da agenda,
  `contact_message` (sem vínculo com a conta), `payment.payload` (sem dados do pagador, PBI-28),
  migração.

## API pública

`src/modules/customers`:

| Função | Resultado |
|--------|-----------|
| `excluirPropriaConta(entrada, cabecalhos)` | `{ ok: true }`; `invalido` com `campos` (senha vazia, caixa desmarcada); `nao_autenticado`; `proibido` (ARTISTA, ADMIN, conta inativa ou já excluída); `senha_incorreta`; `pedido_em_andamento`; `concorrencia` (impasse de travas no banco: tentar de novo) |
| `NOME_EXCLUIDO` | `"Cliente excluído"` |

O usuário vem só do cookie assinado. Na transação, a linha do usuário é travada (`FOR UPDATE`) antes
de reler a sessão e a conta e de checar os pedidos, na mesma ordem de travas do checkout e do webhook
(usuário → pedido → sessão): um pagamento aprovado ou um pedido criado ao mesmo tempo termina antes e
entra na checagem. A senha é conferida com o hash do Better Auth (`conferirSenha`, `src/lib/auth`).
Uma sessão criada por um login que termine junto com a exclusão não lê nem grava perfil, senha e
endereço: essas leituras de `src/lib/auth` recusam conta com `excluido_em` (`nao_autenticado`). Os
módulos que já releem a conta no banco (gestão, carrinho, checkout, mídia, agenda) continuam
respondendo `proibido`, como nos PBIs 16, 17, 24, 34 e 35.
Validação em `src/modules/identity` (`validarExclusaoConta`), a mesma do formulário.

## O que a exclusão faz

| Tabela | Efeito |
|--------|--------|
| `user` | nome "Cliente excluído", e-mail `excluido-<id>@kolo.invalid` (único, domínio reservado), telefone e imagem nulos, `excluido_em` |
| `session` | todas apagadas (as reservas vão junto, em cascata) |
| `account` | apagada: sem senha, e com o e-mail trocado o login antigo não abre. O e-mail antigo fica livre para uma conta nova |
| `address`, `cart`/`cart_item` | apagados |
| `verification` | códigos de recuperação do usuário apagados |
| `order` | `PENDENTE` → `CANCELADO`; `endereco_copia` só com cidade e UF; valores, itens, pagamentos e `user_id` iguais |
| `appointment` | `user_id` nulo; nome e telefone de contato ficam |
| `email_log` | destinatário anonimizado |

## Telas

- `/conta`: seção "Excluir conta" no fim, com o que acontece, o aviso do pedido a caminho, link para a
  política e o formulário (senha atual, caixa, botão "Excluir minha conta"). Com sucesso, a ação
  apaga o cookie (`sair`) e leva para a home.
- Detalhe do pedido (conta e admin): pedido anonimizado mostra "Endereço apagado com a exclusão da
  conta" e cidade / UF.
- Política de privacidade: "Seus direitos" aponta para Excluir conta em vez do pedido por e-mail;
  "Por quanto tempo guardamos" diz o que some na hora e o que fica na agenda.

## Limites conhecidos

- **Sem limite de tentativas da senha na exclusão,** como na troca de senha: quem tenta já está com a
  sessão aberta.
- **Sessão que sobrar numa conta excluída** ainda mostra o cabeçalho de quem está conectado (o
  `layout` usa `sessaoDaRequisicao`), sem acesso a nenhum dado nem ação.
- **Pix ou boleto em aberto não é cancelado no Mercado Pago** (o cancelamento do admin, PBI-43, faz
  isso). Se for pago, o webhook marca o estorno, e o admin o conclui pelo filtro "Estorno pendente".
- **Texto da política:** a mudança entra no mesmo aceite da equipe pendente do PBI-22/PBI-39.

## Validação

- `npm run test:integration -- exclusao-conta` (PostgreSQL real, 12 testes):
  - conta anônima e pedido entregue com os mesmos totais, itens e pagamento, endereço só com cidade
    e UF;
  - sessões (inclusive a de outro navegador), senha, endereço, carrinho e verificação apagados; login
    antigo recusado;
  - `PENDENTE` cancelado com a reserva solta; `CANCELADO` estornado igual;
  - agenda sem `user_id` com o contato mantido; `email_log` anonimizado;
  - pedido `PAGO`, `PROCESSANDO` e `ENVIADO` recusam sem gravar nada;
  - senha errada, caixa desmarcada, senha vazia e entrada inválida recusam sem gravar nada;
  - visitante, ARTISTA e ADMIN recusados;
  - `lerClienteAdmin` (PBI-38) mostra a conta excluída com as compras e o total gasto; o e-mail
    antigo cria uma conta nova;
  - corrida: com o webhook segurando o usuário e aprovando o pedido, a exclusão espera e recusa com
    `pedido_em_andamento` (o pedido fica pago);
  - sessão que sobrar numa conta excluída não lê nem grava perfil, senha e endereço.
- `npm run test:unit -- formulario-exclusao-conta exclusao-conta-acao pagina-conta paginas-politicas pedido-admin`.
- Gates em 16/10/2026: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` (519
  testes) e `npm run test:integration` (275 testes) sem erros, depois das correções da revisão.
- **No navegador** (16/10/2026, Postgres local, conta CLIENTE local de teste criada em `/cadastro`):
  caixa desmarcada e senha errada mostram o erro sem excluir; com a senha certa, a página vai para a
  home, `/conta` passa a levar ao login e o banco mostra a conta anônima sem sessão nem senha. Console
  e log do servidor sem erros.
- **Revisão independente** (subagente, read-only): PASS, com três achados corrigidos:
  - o `Serializable` não enxergava o webhook e o checkout (Read Committed): a exclusão passou a travar
    o usuário primeiro, com teste da corrida;
  - sessão criada por um login simultâneo podia gravar perfil e endereço na conta excluída: agora
    recusada;
  - a política e `/conta` não diziam que nome e telefone de contato ficam na agenda: texto corrigido.
  Sugestões não aplicadas: validar a cópia antiga de endereço sem cidade/UF e mensagem própria para
  conta inativa.
