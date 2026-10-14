# PBI-37 — Busca no portfólio

**Referências:** RF18; apoio RN01. **Dependência:** PBI-36.

## Objetivo e contrato confirmado

Busca por palavra-chave na galeria `/tatuagens`, integrada aos filtros de artista, estilo e região
do PBI-36. Decisões confirmadas com o Robert antes de codar (13/10/2026):

- **Onde procura:** título, descrição, região do corpo, nomes dos estilos e nome do artista (o
  Stitch sugere "estilo, elemento ou tatuador").
- **Como procura:** a mesma regra do catálogo (PBI-41): sem acento, por começo de palavra
  ("blackw" acha "Blackwork") e todas as palavras obrigatórias.
- **Somada aos filtros:** busca e filtros por interseção, tudo na URL (formulário GET).
- **Busca e filtros ativos:** "N trabalhos encontrados" e "Limpar busca e filtros"; sem resultado,
  a mensagem cita o termo.
- **Fora:** índice novo ou migração (o portfólio é pequeno), ordenação por relevância, sugestões e
  autocompletar, etiquetas por filtro, paginação e "carregar mais" do Stitch, gestão do portfólio
  (PBI-35).

## Regra compartilhada (`src/lib/busca.ts`)

A limpeza e a montagem da consulta saíram do catálogo para `src/lib`, usadas pelos dois, sem mudar
o comportamento do catálogo:

- `palavrasDaBusca(texto)`: só sequências de letras e números (`\p{L}\p{N}`), de um texto de até
  100 caracteres, até 8 palavras. Os operadores do `to_tsquery` (`&`, `|`, `!`, `:*`) somem.
- `consultaDaBusca(palavras)`: `palavra:* & outra:*`.

## API pública (`src/modules/portfolio`)

`listarGaleria({ artista, estilo, regiao, busca })`:

- aceita `busca` e devolve `filtros.busca` já limpa (`""` sem busca), para o formulário mostrar o
  que valeu;
- com palavras, busca os ids por SQL (`$queryRaw` com parâmetro) sobre
  `to_tsvector('kolo_busca', título, descrição, região, nome do artista, nomes dos estilos)`, a
  configuração sem acento da migração 0006, e soma `id IN (…)` aos filtros da consulta principal;
- a visibilidade (conta excluída) continua na consulta principal, então vale também para a busca.

O índice `portfolio_item_search_idx` da Sprint 1 (configuração `simple`, com acento, só título e
descrição) fica sem uso: a busca nova cobre mais campos, com junções. Com o portfólio pequeno, a
consulta sem índice basta.

## Tela `/tatuagens`

- Campo "Buscar por palavra-chave" (`type="search"`, até 100 caracteres) no mesmo formulário dos
  três filtros; o botão continua "Filtrar".
- Com busca ou filtro ativo: "1 trabalho encontrado" ou "N trabalhos encontrados" (`role="status"`)
  e o link "Limpar busca e filtros" (`/tatuagens`). Sem nada ativo, nem contagem nem link.
- Vazios: "Nenhum trabalho encontrado para “termo”." (com " com os filtros selecionados" quando há
  filtro), "Nenhum trabalho encontrado para os filtros selecionados." (só filtros) e "Ainda não há
  tatuagens cadastradas." (acervo vazio).
- Busca só com símbolos é como não ter busca: o campo volta vazio.

## Validação

- `npm run test:unit -- busca pagina-galeria`: limpeza e consulta; página repassando a busca
  (primeiro valor se repetida), campo no mesmo formulário, contagem, vazio com o termo e com
  filtros, sem contagem nem link quando nada está ativo.
- `npm run test:integration -- tests/integration/galeria-publica` (PostgreSQL real): título sem
  acento e por começo de palavra, descrição, região, estilo, artista; várias palavras; busca somada
  a artista, região e estilo; sem resultado; vazia, só símbolos, hostil ao `to_tsquery` e repetida;
  busca devolvida limpa; conta excluída fora da busca.
- `npm run test:integration -- tests/integration/catalogo-busca`: a busca do catálogo segue igual
  com a regra compartilhada.
- **No navegador** (13/10/2026, Postgres local com 3 trabalhos e 2 estilos temporários, apagados
  depois; servidor sem `R2_PUBLIC_URL`, então as fotos aparecem como "Imagem indisponível"):
  "lirio", "blackw", "pontilhismo", "fine braço", busca com região, "dragão" e "& | !" pelo
  formulário; sem rolagem horizontal, axe-core (WCAG 2.1 AA) sem violações em 1280 e 375 px,
  console sem erros.
- **Revisão de código e de segurança:** busca como parâmetro, entrada limpa antes (teste com
  operadores), só dados já públicos, conta excluída fora.

## Pendências

- Se o portfólio crescer, trocar o `portfolio_item_search_idx` antigo por um índice com
  `kolo_busca` (migração), como o PBI-41 fez no catálogo.
