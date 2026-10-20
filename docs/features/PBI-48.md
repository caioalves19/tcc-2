# PBI-48 — Painel de indicadores e relatório de vendas

**Referências:** RF32 ("Painel de indicadores (faturamento, pedidos e obras por situação, agenda da
semana) e relatório de vendas por período, com obras mais vendidas e faturamento por artista");
critério 8 da banca ("Relatórios e consultas"). **Dependências:** PBI-30 (situação e filtros dos
pedidos), PBI-34 (agenda), PBI-43 (estorno), além das obras (PBI-18) e do total gasto (PBI-38).

## Objetivo e contrato confirmado

A página inicial do admin vira um painel, e o admin ganha um relatório de vendas por período, com
versão para impressão. Só leitura: nenhuma tabela nova e nenhuma ação sobre pedidos. Decisões
confirmadas antes de codar (19/10/2026, proposta do `Sprint-2.md` aprovada como está):

- **Pedido pago:** situação de Pago a Entregue, a mesma regra do total gasto do cliente (PBI-38),
  agora numa função só (`pedidoPago`). Estorno que cancela o pedido o tira da conta; estorno de
  pagamento em duplicidade não muda o total do pedido.
- **Período:** pelo `pago_em`, no fuso de São Paulo (RN09), dias inteiros nos dois extremos.
  Padrão: mês corrente (do dia 1 até hoje). Últimos 30 dias são hoje e os 29 anteriores.
- **Valores:** o faturamento soma `total_centavos` (com frete). Por obra e por artista, soma
  `preco_centavos_copia × quantidade` dos itens, sem frete; a tela avisa que os totais podem não
  bater. Ticket médio = faturamento ÷ pedidos pagos, arredondado ao centavo; "—" sem pedido pago.
- **Situação atual, não do período:** pedidos por situação (os filtros que já existem em
  `/admin/pedidos`, menos "Todos"), obras por situação (Rascunho, Disponível, Esgotada, sem as
  arquivadas) e horários `AGENDADO` que começam de agora até 7 dias depois, de todos os artistas.
- **Telas:** `/admin` mostra o mês corrente, sem formulário, e leva ao relatório;
  `/admin/relatorio` tem os três períodos e a impressão. Sem gráfico. O menu do admin ganha o visual
  do site.
- **Fora:** exportação CSV (§14 do escopo), painel para o ARTISTA, comparação entre períodos,
  gráfico, migração e dependência nova.

## API pública

`src/modules/reports` (módulo novo; leituras dentro do `comoAdmin`: sessão e papel relidos no banco;
visitante recebe `nao_autenticado`, cliente e artista `proibido`):

| Função | Resultado |
|--------|-----------|
| `periodoDoRelatorio({ periodo, de, ate }, agora)` | `{ tipo, de, ate, inicio, fim, aviso }`. `tipo` é `este-mes` (padrão), `30-dias` ou `intervalo`; `de` e `ate` em "AAAA-MM-DD", os dois incluídos; a consulta usa `[inicio, fim)`, com o fim na meia-noite de São Paulo do dia seguinte ao último. Intervalo sem as duas datas, com data impossível, fora de 2020–2100 ou com `de` depois de `ate` volta ao mês corrente com `aviso`; período desconhecido volta sem aviso |
| `lerRelatorioVendas({ periodo, de, ate }, cabecalhos, agora)` | `{ periodo, faturamentoCentavos, pedidosPagos, ticketMedioCentavos, obras, artistas }`. `obras`: por obra, unidades e valor, mais unidades primeiro e, no empate, maior valor; `artistas`: por artista, maior valor primeiro |
| `lerPainel(cabecalhos, agora)` | `{ periodo, vendas, pedidos, obras, horarios }`: vendas do mês corrente (o mesmo resumo do relatório), quantos pedidos cada filtro da lista mostra, obras por situação e os próximos horários |

Leituras novas nos módulos donos dos dados, todas na transação de quem chama (que já passou pelo
`comoAdmin`), como o `pedidosDoClienteAdmin` do PBI-38:

| Módulo | Função | Resultado |
|--------|--------|-----------|
| `orders` | `pedidoPago(situacao)` | Regra única de pedido pago (de Pago a Entregue), usada também pelo `totalGasto` |
| `orders` | `vendasDoPeriodo(tx, { inicio, fim })` | Pedidos pagos e não excluídos com `pago_em` no intervalo: total e itens (preço da cópia, quantidade, obra e artista atuais, inclusive de obra arquivada) |
| `orders` | `contarPedidosPorFiltro(tx)` | Contagem por filtro com o mesmo `where` da lista (`ondeDaLista`), então o número do painel é o total da lista com o filtro |
| `catalog` | `contarObrasPorSituacao(tx)` | Obras não arquivadas por situação |
| `scheduling` | `proximosHorarios(tx, agora)` | `AGENDADO`, não excluídos, com início de agora até 7 dias depois, em ordem de início, com horário de São Paulo |

As funções de fuso da agenda (`deSaoPauloParaUtc`, `paraHorarioSaoPaulo`, `paraData`, `somarDias`)
foram para `src/lib/fuso.ts`, compartilhadas entre a agenda e o relatório, sem mudar comportamento.

## Telas

- **`/admin` (painel):** "Vendas de outubro de 2026" com faturamento, pedidos pagos e ticket médio e
  o link "Ver relatório de vendas"; "Pedidos agora" com um card-link por filtro (mesmos rótulos e
  endereços da lista); "Obras" com disponíveis, esgotadas e rascunhos e "Gerenciar obras";
  "Próximos 7 dias" com dia, hora, contato e artista de cada horário (ou "Nenhum horário agendado
  nos próximos 7 dias.") e "Abrir agenda". Falha na leitura vira alerta.
- **`/admin/relatorio`:** "Este mês" e "Últimos 30 dias" como links (o atual marcado) e o intervalo
  num formulário GET (De e Até, sem JavaScript); aviso de intervalo inválido; total do período;
  tabelas "Obras mais vendidas" (a artista fica sob o título, para caber em 320 px) e "Faturamento
  por artista"; nota sobre o frete; "Nenhuma venda no período." sem venda; botão "Imprimir"
  (`window.print`).
- **Impressão:** escolha do período, botão, menu do admin, cabeçalho e rodapé do site ficam com
  `print:hidden`; sai só o relatório.
- **Menu do admin (`MenuAdmin`):** botões do site com `aria-current` na tela atual (Painel só em
  `/admin`; os outros itens também nas telas de dentro). Mantém o nome "Administração", que o E2E de
  restrições procura.

## Limites conhecidos

- **Obra e artista atuais:** o relatório agrupa pela obra e mostra o título e a artista de hoje, não
  a cópia gravada no pedido. Se o admin trocar a artista de uma obra, as vendas antigas passam a
  contar para a nova.
- **Estorno feito no Mercado Pago e ainda não concluído:** como no total gasto (PBI-38), a conta
  decide pela situação do pedido. O pedido segue somando até o admin concluir o estorno, que o
  cancela.
- **Sem limite de linhas:** as tabelas trazem todas as obras e artistas com venda no período;
  suficiente para o volume do ateliê.
