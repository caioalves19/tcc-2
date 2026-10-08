# PBI-20 — Página da obra

**Referências:** RF10, RN01 e RN11; apoio RNF13, RNF14 e RNF21. **Dependência:** PBI-18.

## Objetivo e contrato confirmado

Página pública de cada obra, sem login, com galeria, ficha técnica e o caminho para o carrinho.
Decisões confirmadas com o Robert antes de codar (08/10/2026):

- **Rota `/obras/[slug]`.** O slug é único (PBI-18) e é o que o catálogo (PBI-19) vai linkar.
- **Entram também:** botão de WhatsApp com a obra na mensagem, "Outras obras do artista" e a trilha
  de navegação.
- **Ficam de fora:** seletor de quantidade (o botão adiciona 1; a quantidade se ajusta no
  carrinho), zoom/lightbox e os selos do mockup que não existem nos dados (certificado, caixa de
  madeira, suporte, tiragem, localização).
- **Galeria:** abre na imagem principal; as miniaturas, na ordem cadastrada, trocam a imagem grande
  pelo clique ou pelo teclado.

Não houve mudança de schema.

## API pública (`src/modules/catalog`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `lerObraPublica(slug)` | Página `/obras/[slug]` | `ObraPublica` (ficha, artista, `disponivel`, imagens na ordem com a principal marcada) ou `null` |
| `outrasObrasDoArtista(obra, limite = 4)` | "Outras obras do artista" | `CardObra[]` |

`CardObra` (`slug`, `titulo`, `tecnica`, `dimensoes`, `precoCentavos`, `disponivel` e a imagem
principal) é o contrato do card da vitrine, que o catálogo (PBI-19) pode reaproveitar com o
componente `CardObra`.

## Comportamentos

- **Visibilidade (RN01/RN11):** rascunho, obra arquivada (`excluido_em`) e slug inexistente devolvem
  `null`, e a página responde 404 com "Obra não encontrada", sem dizer qual é o caso. Slug fora do
  formato (`a-z`, `0-9`, `-`, até 160) nem chega ao banco. A esgotada continua visível.
- **Disponível** = situação `DISPONIVEL` e estoque maior que zero. Unidades reservadas no checkout
  de outra pessoa não mudam a página (a reserva só pesa no checkout, como no PBI-25).
- **Página:**
  - trilha "Início / Obras / Artista / Título" e "Voltar ao catálogo";
  - galeria com `next/image` a partir do original no R2 (formato moderno e `sizes`); `priority` só
    na imagem grande (LCP); as miniaturas são botões com `aria-pressed` e o texto alternativo no
    nome;
  - título, artista, preço; disponível mostra "Adicionar ao carrinho" (`BotaoAdicionarAoCarrinho`
    do PBI-24); esgotada mostra o selo e "não está mais disponível para compra", sem botão;
  - "Tirar dúvidas com o ateliê" abre o `wa.me` do `CONTATO` com título e artista na mensagem;
  - "Sobre a obra" (descrição) e a ficha técnica (artista, técnica, dimensões, ano), omitindo o que
    não foi cadastrado;
  - "Outras obras de {artista}": até 4 obras publicadas do mesmo artista, sem a atual; destaques
    primeiro, depois as disponíveis antes das esgotadas, depois o título.
- **Metadados:** título "{obra} · Kolô" e descrição da obra, cortada em 160 caracteres (sem
  descrição, "{obra}, obra de {artista} no Kolô Ateliê."). A obra é lida uma vez por requisição
  (`cache`).
- **Sem `R2_PUBLIC_URL`,** as fotos viram "Sem foto", como no carrinho.

## Limites conhecidos

- **Links para `/obras`** (trilha e "Voltar ao catálogo") só funcionam quando o PBI-19 existir
  (resolvido pelo PBI-19).
- **O artista aparece sem link:** não há página pública de artista no escopo.
- **Sem data de cadastro em `artwork`:** a ordem de "Outras obras" não usa "mais recentes". O
  catálogo (PBI-19) vai precisar resolver o mesmo para a ordenação por recentes.

## Validação

Seams: `lerObraPublica` e `outrasObrasDoArtista`; os componentes `GaleriaObra`, `CardObra` e
`DetalheObra`; a página `/obras/[slug]` (com `generateMetadata`) e o `not-found` dela.

- `npm run test:integration -- tests/integration/obra-publica` (PostgreSQL real, 3 testes):
  - obra disponível com ficha, artista e imagens na ordem, com a principal marcada;
  - esgotada visível como indisponível; rascunho, arquivada, inexistente e slugs malformados
    devolvem `null`;
  - outras obras: no máximo 4, só do mesmo artista, sem a atual, rascunho ou arquivada, na ordem
    combinada.
- `npm run test:unit -- galeria-obra card-obra detalhe-obra pagina-obra obra-nao-encontrada`:
  galeria (principal, ordem, clique e teclado, espaço reservado), card, detalhe (ficha, esgotada,
  carrinho, WhatsApp, trilha, outras obras), página (404, metadados) e aviso de não encontrada.
- **No navegador** (08/10/2026, Postgres local, sem R2):
  - a obra abre para visitante; "Adicionar ao carrinho" levou a obra ao `/carrinho` e o cabeçalho
    passou a mostrar 1;
  - rascunho e slug inexistente respondem 404 com o aviso em português; a esgotada responde 200,
    com o selo e sem botão de compra;
  - sem rolagem horizontal em 375 e 320 px; console sem erros.
  - **Pendente:** ver as fotos reais (precisa de `R2_PUBLIC_URL`).

## Pendências para os próximos PBIs

- **PBI-19:** criar `/obras` (os links já apontam para lá), reaproveitando `CardObra`, e decidir
  como ordenar por "recentes" sem data de cadastro na obra.
- **PBI-21:** a home pode usar `CardObra` para os destaques.
- **PBI-17:** o item de entrega responsiva das imagens passa a ter uso real aqui (`next/image` com
  `sizes`).
