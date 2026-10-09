# PBI-19 — Catálogo público

**Referências:** RF09, RN01 e RN11; apoio RNF13, RNF14, RNF20 e RNF21. **Dependências:** PBI-18
(e o `CardObra` do PBI-20, sobre o qual esta branch foi feita).

## Objetivo e contrato confirmado

Grade pública das obras, sem login, com paginação e ordenação. Decisões confirmadas com o Robert
antes de codar (08/10/2026):

- **"Mais recentes" pela data de cadastro:** a migração `0005_artwork_criado_em` acrescenta
  `artwork.criado_em`, preenchida pelo banco. As obras que já existiam recebem a data da migração.
  O código do PBI-18 não muda.
- **Disponíveis primeiro:** em qualquer ordenação, as esgotadas vêm no fim, com o selo (RN11).
- **O card só leva à obra:** sem botão de compra no card; o "Adicionar ao carrinho" fica na página
  da obra.
- **Fora:** busca (PBI-41), filtros por artista/técnica/tag (fora do escopo, conforme as telas),
  rolagem infinita e os selos "Peça única"/"N disponíveis" do mockup.

## API pública (`src/modules/catalog`)

| Função ou constante | Uso | Resultado |
|---------------------|-----|-----------|
| `listarCatalogo({ pagina, ordem })` | Página `/obras` | `{ obras: CardObra[], total, pagina, totalPaginas, ordem }` |
| `ORDENS_CATALOGO`, `ROTULOS_ORDEM` | Seletor de ordenação | `recentes`, `menor-preco`, `maior-preco`, `destaque` e os rótulos |
| `hrefCatalogo(ordem, pagina?)` | Links de paginação e ordenação | `/obras?ordem=…&pagina=…`, sem os padrões |
| `OBRAS_POR_PAGINA` | Módulo e tela | `12` |

As constantes e o `hrefCatalogo` são puros e saem também por `catalog/cliente.ts`, para o seletor
(componente de cliente) não importar o Prisma.

`CardObra` ganhou `artistaNome`, que aparece no catálogo e em "Outras obras" (PBI-20).

## Comportamentos

- **Visibilidade:** só obras publicadas (`DISPONIVEL` ou `ESGOTADA`) e não arquivadas; rascunho e
  arquivada não entram na lista nem na contagem.
- **Ordem no banco:** situação (disponível antes de esgotada, pela ordem do enum), depois o critério
  (recentes: `criado_em` desc; menor/maior preço; destaque: destaque e depois recentes), depois o
  `id`. O `id` desempata e deixa a paginação estável: uma obra não repete nem some entre páginas.
- **Entrada da URL:** `pagina` inteiro de 1 a 1.000.000 e `ordem` da lista; qualquer outro valor
  (texto, zero, negativo, decimal, `1e999`, parâmetro repetido) cai no padrão (página 1, recentes).
  Com parâmetro repetido, vale o primeiro.
- **Tela `/obras`:**
  - "Catálogo de obras", seletor "Ordenar por" (formulário GET; com JavaScript, muda ao escolher e
    volta para a página 1) e "Mostrando X a Y de N obras";
  - grade de `CardObra` (1, 2 ou 4 colunas): foto, artista, título, dimensões · técnica, preço,
    selo "Esgotada" e preço riscado na esgotada; o card inteiro leva à `/obras/[slug]`;
  - paginação "Anterior", números e "Próxima", com `aria-current` na atual e a ordenação mantida;
  - catálogo vazio: "Ainda não há obras publicadas."; página além do fim: "Esta página não tem
    obras." com "Ir para a primeira página";
  - falha ao carregar (`error.tsx`): "Não foi possível carregar o catálogo agora." e "Tentar de
    novo", que usa o `retry` do Next 16 (refaz a requisição ao servidor; o `reset` só limparia o
    erro no navegador). O erro técnico não aparece.
- **Metadados:** "Catálogo de obras · Kolô".

## Limites conhecidos

- **A paginação mostra todos os números.** Com muitas páginas, a lista fica longa; o acervo
  previsto é pequeno, e reticências podem entrar depois.
- **A data das obras antigas** é a da migração, então elas empatam entre si em "recentes" (o `id`
  desempata).

## Validação

Seams: `listarCatalogo`; os componentes `CatalogoObras`, `SeletorOrdem` e `CardObra`; a página
`/obras` e o `error.tsx` dela.

- `npm run test:integration -- tests/integration/catalogo-publico` (PostgreSQL real, 4 testes; cada
  um começa com o acervo vazio):
  - só publicadas, com contagem; `criado_em` preenchido pelo banco; recentes primeiro e esgotadas no
    fim;
  - 12 por página, 15 obras com a mesma data sem repetir nem pular, ordem repetível, página além do
    fim vazia com o total, parâmetros inválidos no padrão;
  - as quatro ordenações com uma esgotada que é a mais barata e a mais nova (fica no fim em todas);
  - card completo, com o artista.
- `npm run test:unit -- catalogo-obras pagina-catalogo card-obra`: grade e "Mostrando…", links da
  paginação com a ordenação e `aria-current`, seletor (navega para a página 1 com o novo critério),
  vazio, sem resultados, repasse dos parâmetros da URL e erro com "Tentar de novo".
- **No navegador** (08/10/2026, Postgres local com 15 obras de demonstração, sem R2):
  - "Mostrando 1 a 12 de 15 obras" e paginação; "Menor preço" muda a URL e ordena; a página 2
    mantém a ordenação e traz a esgotada no fim;
  - página 9 mostra o aviso e o link para a primeira página com a ordenação;
  - o card abre a obra, e o "Voltar ao catálogo" do PBI-20 chega aqui;
  - sem rolagem horizontal em 375 e 320 px; console sem erros;
  - a conferência achou fotos de alturas diferentes quando os títulos ocupam linhas diferentes;
    corrigido no `CardObra` (a foto fica com a própria altura e a sobra vai para o texto).
  - **Pendente:** ver as fotos reais (precisa de `R2_PUBLIC_URL`).

## Pendências para os próximos PBIs

- **PBI-21:** a home pode reaproveitar `CardObra` e um `listarCatalogo({ ordem: "destaque" })` (ou
  uma consulta própria só de destaques).
- **PBI-41:** a busca textual entra no mesmo `listarCatalogo`, como mais um parâmetro da URL
  (feito no PBI-41).
