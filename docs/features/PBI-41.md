# PBI-41 — Busca textual no catálogo

**Referências:** Fase 1, item 13 (ORDEM-DE-EXECUCAO); seção 10 do ESCOPO (índice de busca em
`artwork`); RNF04. **Prioridade:** P1. **Dependência:** PBI-19.

## Objetivo e contrato confirmado

Busca no `/obras` tolerante a acentos, integrada à paginação e à ordenação do PBI-19. Decisões
confirmadas com o Robert antes de codar (09/10/2026):

- **Campos:** título, descrição e técnica, todos na tabela `artwork`, num índice só. O nome do
  artista fica de fora.
- **Por começo de palavra:** "metro" acha "Metrópole"; "grafit" acha "grafite". Sem redução do
  português: "telas" não acha "tela".
- **Várias palavras exigem todas.** As quatro ordenações continuam; não há ordenação por relevância.
- **Fora:** filtros (artista, estilo, tag, preço, disponibilidade), adiados pelo PBI; sugestões e
  autocompletar; o portfólio (PBI-37).

## Banco — migração `0006_busca_sem_acento`

- Extensão `unaccent` (confiável desde o Postgres 13: o dono do banco pode criá-la).
- Configuração de busca `kolo_busca`: cópia da `simple` (minúsculas, sem stemming nem stopwords) com
  o `unaccent` antes, para os tipos de palavra (`asciiword`, `word`, `hword`…). "Metrópole" e
  "metropole" viram o mesmo termo no índice e na consulta.
- O índice `artwork_search_idx` da migração inicial (configuração `simple`, sem tirar acento, só
  título e descrição) foi trocado por `artwork_busca_idx`: GIN sobre
  `to_tsvector('kolo_busca', titulo || descricao || tecnica)`.
- O índice de `portfolio_item` não mudou (PBI-37).

## API pública (`src/modules/catalog`)

| Função | Mudança |
|--------|---------|
| `listarCatalogo({ pagina, ordem, busca })` | aceita `busca` e devolve `busca` já limpa (`""` sem busca) |
| `hrefCatalogo(ordem, pagina, busca)` | leva a busca na URL (`/obras?ordem=…&busca=…&pagina=…`) |
| `palavrasDaBusca(texto)` | regra pura que limpa a busca |

## Comportamentos

- **Limpeza da entrada (`palavrasDaBusca`):** só sequências de letras e números (`\p{L}\p{N}`), dos
  primeiros 100 caracteres, até 8 palavras. Operadores do `to_tsquery` (`& | ! ( ) :*`), aspas,
  ponto e vírgula e emoji somem. Sem nenhuma palavra (vazio, só símbolos, valor que não é texto), é
  como não ter busca: volta o catálogo inteiro.
- **Consulta:** `palavra1:* & palavra2:*`, passada como parâmetro no `$queryRaw` (RNF04), com a
  mesma expressão do índice para o Postgres usá-lo. A busca devolve os ids, que entram como mais um
  filtro nas regras do PBI-19: rascunho e arquivada continuam fora, as esgotadas continuam no fim, e
  a paginação e as ordenações valem sobre o resultado.
- **Tela `/obras`:**
  - campo "Buscar obras" (formulário GET, `role="search"`), com o termo atual e a ordenação mantida
    num campo oculto; não aparece com o catálogo vazio;
  - "Mostrando 1 a 3 de 3 obras para “metro”" (no singular com uma obra só);
  - sem resultado: "Nenhuma obra encontrada para “x”." e "Limpar busca", que mantém a ordenação;
  - paginação, "Ir para a primeira página" e o seletor de ordenação levam a busca.

## Limites conhecidos

- **Sem plural por redução:** "telas" não acha "tela" (decisão: começo de palavra).
- **O nome do artista não entra na busca.** Entraria por junção, fora do índice.
- **Sem relevância:** o resultado segue a ordenação escolhida (padrão: mais recentes).
- **Ids em memória:** a busca devolve os ids e o Prisma filtra por eles. Para o acervo do TCC é
  rápido; com dezenas de milhares de obras, valeria levar a paginação para dentro do SQL.

## Validação

Seams: `listarCatalogo`; os componentes `CatalogoObras` e `SeletorOrdem`; a página `/obras`.

- `npm run test:integration -- tests/integration/catalogo-busca` (PostgreSQL real, 5 testes; cada
  um começa com o acervo vazio):
  - acentos e maiúsculas nos dois sentidos ("METRÓPOLE", "metropole", "São" acha "Sao");
  - começo de palavra em título, descrição e técnica; várias palavras exigem todas; sem resultado;
  - rascunho e arquivada fora, esgotada no fim, paginação e ordenação com busca (conferido por
    mutação: com busca, ignorar a visibilidade derruba o teste);
  - entradas vazias, só símbolos, operadores, SQL, 500 caracteres, mais de 8 palavras e valores que
    não são texto, sem erro (conferido por mutação: sem a limpeza, o teste cai);
  - `EXPLAIN` com a varredura sequencial desligada usa `artwork_busca_idx`.
- `npm run test:unit -- catalogo-obras pagina-catalogo`: campo com o termo e a ordenação oculta,
  resumo "para “x”" e no singular, links e seletor com a busca, sem resultado com "Limpar busca",
  catálogo vazio sem o campo, e a página repassando `busca` da URL.
- **No navegador** (09/10/2026, Postgres local com as obras de demonstração):
  - "metropole" acha "Metrópole em chamas" e a URL fica `/obras?busca=metropole`;
  - "spray" acha 13 obras em 2 páginas, com `busca=spray` nos links; trocar para "Maior preço"
    mantém a busca no campo e na URL;
  - "aquarela" mostra o aviso e "Limpar busca" mantendo a ordenação;
  - uma URL com `'; DROP TABLE artwork; -- &|!` vira a busca "DROP TABLE artwork", sem erro;
  - console sem erros;
  - a conferência achou "de 1 obras" no resumo; corrigido para o singular.

## Pendências para os próximos PBIs

- **PBI-37 (busca no portfólio):** pode reaproveitar a configuração `kolo_busca`, o
  `palavrasDaBusca` e o mesmo desenho (índice com a expressão idêntica à da consulta), trocando o
  índice `portfolio_item_search_idx`.
