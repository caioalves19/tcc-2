# PBI-21 — Home com destaques

**Referências:** RF07; apoio RN01, RF23 a RF25, RNF21. **Dependências:** PBI-19 e PBI-20.

## Objetivo e contrato confirmado

Trocar a home provisória do PBI-10 pela vitrine institucional do Kolô. Decisões confirmadas com o
Robert antes de codar (08/10/2026):

- **Destaques só das obras marcadas:** até 4 obras com "destaque" ligado no admin (PBI-18),
  publicadas e não arquivadas. As disponíveis vêm antes das esgotadas (com o selo, como no catálogo)
  e, entre elas, as mais recentes. Não completa com outras obras.
- **Sem destaque, a seção some:** a home continua com o institucional e o "Ver obras" do topo.
- **Chamada de tatuagem provisória pelo WhatsApp:** abre a conversa com o ateliê e uma mensagem
  pronta. O wizard (`/agendamento`) já existe, mas ainda não conclui (PBIs 32 e 33); o PBI-33 troca
  este link.
- **Menu "Tatuagem" → `/#tatuagem`:** a rota `/tatuagem` não existe; até o portfólio público ter rota
  própria, o link leva ao bloco de tatuagem da home.
- **Fora:** fotos do portfólio de tatuagem (portfólio público), link para o wizard (PBI-33), textos e
  número vindos do banco (PBI-39), mudança de schema e as promessas do Stitch que o sistema não
  cumpre ("certificado de autenticidade", "toda peça é 01/01": o estoque pode passar de 1).

## API pública

| Função ou componente | Onde | Resultado |
|----------------------|------|-----------|
| `listarDestaques(limite = 4)` | `@/modules/catalog` | `CardObra[]` na ordem de exibição |
| `linkWhatsApp(mensagem)` | `@/lib/contato` | `https://wa.me/<número do ateliê>?text=<mensagem codificada>` |
| `VitrineDestaques({ destaques, baseImagens })` | `@/components/loja/vitrine-destaques` | Seção "Obras em destaque"; `null` sem destaques |

O `linkWhatsApp` usa o mesmo número de `CONTATO` (rodapé e políticas), que o PBI-39 leva para as
configurações do site.

## A home

1. **Topo (Ateliê):** "Arte urbana autêntica, feita por pessoas reais", apresentação do ateliê e do
   estúdio, "Ver obras" (`/obras`) e "Agendar tatuagem" (`#tatuagem`, rola até o bloco).
2. **Obras em destaque:** grade de `CardObra` (1, 2 ou 4 colunas), cada card levando à
   `/obras/[slug]`, e "Ver catálogo completo" (`/obras`).
3. **Bloco de tatuagem** (`id="tatuagem"`, `data-brand="tattoo"`): três passos do fluxo de hoje
   (chamar no WhatsApp; combinar estilo, orçamento e horário com o artista; anamnese e termo de
   consentimento no estúdio, a partir de 18 anos) e "Agendar pelo WhatsApp", com a mensagem
   "Olá! Quero agendar uma tatuagem no Kolô.".
4. **Murais:** "Seu espaço merece mais que uma parede branca" e "Pedir orçamento pelo WhatsApp", com
   a mensagem "Olá! Quero pedir um orçamento de mural.".

Os links do WhatsApp abrem em nova aba (`noopener noreferrer`), como na página da obra. A home é
renderizada a cada requisição (o layout lê a sessão), então os destaques nunca ficam congelados no
build. Se o banco falhar ao ler os destaques, a home segue no ar sem a seção e o erro vai para o log,
o mesmo padrão do layout com a sessão e o carrinho.

## Validação

- `npm run test:integration -- tests/integration/catalogo-publico` (PostgreSQL real): sem obra
  marcada devolve lista vazia; ignora a obra comum, o rascunho marcado e a arquivada marcada; ordem
  disponíveis recentes e esgotada no fim; limite de 4.
- `npm run test:unit -- link-whatsapp vitrine-destaques pagina-home links-internos`:
  - link do WhatsApp com número e mensagem codificada;
  - vitrine com os links das obras, o selo da esgotada e o catálogo; vazia não renderiza nada;
  - home com destaques do banco; sem destaques, inteira e sem a seção; falha do banco nos
    destaques, no ar sem a seção e sem mostrar o erro; chamada de tatuagem provisória com a
    mensagem, sem link para o wizard; orçamento de mural;
  - **todo link interno da home e do cabeçalho (deslogado e ADMIN logado) tem página em `src/app`**,
    inclusive as dinâmicas; o menu "Tatuagem" leva a `/#tatuagem` e o bloco existe.
- **No navegador** (08/10/2026, Postgres local, Chrome headless em 1280, 768, 375 e 320 px):
  - sem obra marcada: home sem a seção de destaques; com as duas obras locais marcadas: a seção
    aparece com os dois cards e o link do catálogo (marcação desfeita depois);
  - sem rolagem horizontal, axe-core (WCAG 2.1 AA) sem violações e console sem erros nas duas
    situações;
  - a conferência achou o botão "Pedir orçamento pelo WhatsApp" passando da borda do cartão em 375 e
    320 px; corrigido (o rótulo quebra a linha no celular, mantendo a altura mínima de 48 px).
- **Revisão de código:** achou que uma falha do banco nos destaques derrubava a home inteira (não há
  `error.tsx` na raiz); corrigido em TDD com o padrão do layout. O teste de rotas passou a cobrir
  também o cabeçalho deslogado.
  - **Pendente:** ver os destaques com as fotos reais do R2 (as obras locais não têm imagem).

## Pendências para os próximos PBIs

- **PBI-33:** trocar o "Agendar pelo WhatsApp" do bloco de tatuagem pelo wizard e reescrever os três
  passos (hoje descrevem a conversa pelo WhatsApp). O menu "Agendar" do cabeçalho já leva ao wizard,
  que ainda não conclui.
- **Portfólio público:** quando existir a rota, trocar o menu "Tatuagem" de `/#tatuagem` para ela.
- **PBI-39:** levar os textos da home e o número do WhatsApp para as configurações do site.
