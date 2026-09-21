# Kolô — Identidade visual e tokens (PBI-09)

> Fonte da verdade dos tokens: `src/app/globals.css`. Este documento explica **como usar**.
> Regras de produto (o que existe ou não na tela) continuam em `docs/ESCOPO-E-STACK.md`.

**Verificação:** `npm run test:unit -- identidade-visual` lê o `globals.css` e reprova qualquer
token que quebre o contraste mínimo do RNF23 (4,5:1 em texto, 3:1 em foco e borda de campo).

---

## 1. Duas marcas, um sistema

O Kolô tem duas identidades irmãs. Elas compartilham grid, tipografia, cantos e acessibilidade,
e mudam cor, clima e logo.

|          | **Modo Ateliê**                                     | **Modo Tattoo**                                             |
| -------- | --------------------------------------------------- | ----------------------------------------------------------- |
| O que é  | Ateliê de arte urbana: telas, murais, customizações | Estúdio de tatuagem                                          |
| Clima    | Streetwear, adesivo, alta energia                    | Acolhedor, calmo, íntimo                                     |
| Base     | Papel claro `#FCF9F8`                                | Marinho `#0B2D6F`                                            |
| Ação     | Amarelo `#FFD600`                                    | Ouro `#F5B71A`                                               |
| Onde     | Home, catálogo, obra, loja, conta, back-office       | Portfólio, wizard, tatuadores e o bloco de tatuagem da home |

**Cada cor tem um dono.** Cerúleo e amarelo são do Ateliê; marinho e ouro são do Tattoo. Não
misture: um bloco de tatuagem dentro de uma página do Ateliê entra inteiro no modo Tattoo.

```html
<!-- a página é Ateliê; só este bloco vira Tattoo -->
<section data-brand="tattoo">…</section>
```

---

## 2. Paleta

### Modo Ateliê

| Token                  | Hex       | Uso                                                                                       |
| ---------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `atelie-ceruleo`       | `#0088CC` | marca, anel de foco, título grande. Texto branco por cima só a partir de 24px (3,89:1)     |
| `atelie-azul`          | `#006193` | link e texto azul sobre claro; faixa com texto corrido branco (6,71:1)                     |
| `atelie-amarelo`       | `#FFD600` | ação: fundo de botão e selo, sempre com texto grafite (12,32:1)                            |
| `atelie-amarelo-claro` | `#FFE170` | hover do amarelo                                                                            |

### Modo Tattoo

| Token                  | Hex       | Uso                                                              |
| ---------------------- | --------- | ---------------------------------------------------------------- |
| `tattoo-marinho`       | `#0B2D6F` | fundo da página                                                   |
| `tattoo-marinho-fundo` | `#082052` | rodapé e camadas mais profundas                                   |
| `tattoo-royal`         | `#0A35A0` | cards elevados, faixa do stepper, link dentro de card branco      |
| `tattoo-ouro`          | `#F5B71A` | ação, link e destaque sobre marinho (7,21:1)                      |
| `tattoo-ouro-claro`    | `#F9C846` | hover do ouro                                                     |
| `tattoo-laranja`       | `#F58A1F` | só ícone, e só sobre marinho (5,27:1)                             |
| `tattoo-vermelho`      | `#E5382B` | só ícone, sobre marinho (3,05:1) ou branco (4,26:1)               |
| `tattoo-bruma`         | `#C3D0EC` | texto secundário sobre marinho (8,37:1)                           |

### Neutros e feedback (os dois modos)

| Token                                 | Hex                              | Uso                                             |
| ------------------------------------- | -------------------------------- | ----------------------------------------------- |
| `neutro-grafite`                      | `#1A1A1A`                        | texto, contorno de 2px, rodapé do Ateliê        |
| `neutro-ardosia`                      | `#3F4850`                        | texto secundário forte (9,32:1 no branco)       |
| `neutro-cinza`                        | `#5F6872`                        | legenda, metadado (5,66:1 no branco)            |
| `neutro-linha`                        | `#E5E2E1`                        | divisória. Não use como texto                   |
| `neutro-nevoa`                        | `#F0EDED`                        | container aninhado                               |
| `neutro-gelo`                         | `#F6F8FA`                        | linha dentro de card branco                      |
| `neutro-papel`                        | `#FCF9F8`                        | fundo da página no Ateliê                       |
| `neutro-branco`                       | `#FFFFFF`                        | card, formulário                                 |
| `erro` · `erro-fundo` · `erro-forte`  | `#BA1A1A` · `#FFDAD6` · `#93000A` | mensagem de erro, sempre dentro de card          |

O verde do WhatsApp (`#25D366`) é marca de terceiro: só no ícone do botão, nunca como cor da interface.

---

## 3. Papéis (`--kolo-*`)

É isto que o componente usa. O valor troca sozinho conforme o modo.

| Papel                                             | Ateliê              | Tattoo            |
| ------------------------------------------------- | ------------------- | ----------------- |
| `--kolo-fundo` · `--kolo-texto`                   | papel · grafite     | marinho · branco  |
| `--kolo-texto-suave`                              | cinza               | bruma             |
| `--kolo-link`                                     | azul                | ouro              |
| `--kolo-foco`                                     | cerúleo             | ouro              |
| `--kolo-superficie` · `--kolo-superficie-texto`   | branco · grafite    | branco · marinho  |
| `--kolo-superficie-suave`                         | cinza               | ardósia           |
| `--kolo-superficie-link`                          | azul                | royal             |
| `--kolo-superficie-foco`                          | cerúleo             | royal             |
| `--kolo-borda-campo`                              | grafite             | cinza             |
| `--kolo-acao` · `--kolo-acao-texto`               | amarelo · grafite   | ouro · marinho    |
| `--kolo-acao-hover`                               | amarelo claro       | ouro claro        |
| `--kolo-marca` · `--kolo-marca-texto`             | azul · branco       | royal · branco    |
| `--kolo-raio-acao`                                | `0.25rem` (adesivo) | `9999px` (pílula) |
| `--kolo-sombra-acao`                              | `shadow-adesivo`    | `shadow-ouro`     |

O foco tem dois tokens porque a cor muda conforme onde o elemento está: `--kolo-foco` sobre o fundo
da página e `--kolo-superficie-foco` dentro de card branco. No Tattoo, ouro sobre branco dá 1,8:1.

---

## 4. Contraste (RNF23)

Todos os pares abaixo passam no teste automático. Valores em razão de contraste WCAG 2.1.

| Par                     | Ateliê  | Tattoo  |
| ----------------------- | ------- | ------- |
| texto / fundo           | 16,6:1  | 13,0:1  |
| texto suave / fundo     | 5,4:1   | 8,4:1   |
| link / fundo            | 6,4:1   | 7,2:1   |
| texto / superfície      | 17,4:1  | 13,0:1  |
| texto de ação / ação    | 12,3:1  | 7,2:1   |
| texto de marca / marca  | 6,7:1   | 10,4:1  |
| foco / fundo            | 3,7:1   | 7,2:1   |

### Proibido

| Combinação                            | Razão  | Por quê                                                                       |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Amarelo como texto no branco          | 1,4:1  | amarelo só como fundo                                                          |
| Ouro como texto no branco             | 1,8:1  | dentro de card, use marinho ou royal                                           |
| Amarelo sobre cerúleo                 | 2,8:1  | na faixa cerúlea, texto branco grande                                          |
| Texto pequeno branco sobre cerúleo    | 3,9:1  | só a partir de 24px, ou negrito de 19px. Texto corrido vai em `#006193`        |
| Laranja sobre branco                  | 2,5:1  | no card branco, o ícone de alerta é vermelho                                   |
| Vermelho sobre royal                  | 2,4:1  | ícone vermelho só sobre marinho ou branco                                      |

Além do contraste, o RNF23 pede foco de teclado visível (anel de 2px), texto alternativo em imagem,
alvo de toque de no mínimo 48px e nenhuma informação transmitida só pela cor: status sempre com
texto ou ícone junto.

---

## 5. Tipografia

Space Grotesk nos títulos, números, selos e botões. Plus Jakarta Sans no corpo.
Carregadas pelo `next/font` em `src/app/layout.tsx`; o corpo já herda a fonte certa.

| Classe                    | Tamanho / entrelinha | Peso | Uso                          |
| ------------------------- | -------------------- | ---- | ---------------------------- |
| `text-display`            | 52 / 58 px           | 700  | hero no desktop              |
| `text-display-mobile`     | 34 / 40 px           | 700  | hero no mobile               |
| `text-titulo-xl`          | 36 / 44 px           | 700  | título de seção              |
| `text-titulo-xl-mobile`   | 26 / 32 px           | 700  | título de seção no mobile    |
| `text-titulo-lg`          | 24 / 30 px           | 700  | subtítulo, bloco de destaque |
| `text-titulo-sm`          | 18 / 24 px           | 600  | título de card               |
| `text-corpo-lg`           | 18 / 28 px           | 400  | texto de abertura            |
| `text-corpo`              | 16 / 26 px           | 400  | padrão                       |
| `text-nota`               | 14 / 20 px           | 400  | legenda, ficha técnica       |
| `text-selo`               | 14 / 18 px           | 700  | badge em caixa-alta          |
| `text-etiqueta`           | 13 / 16 px           | 700  | etiqueta em caixa-alta       |
| `text-preco`              | 22 / 26 px           | 700  | preço em reais               |

Título vai em caixa-alta, com uma palavra em destaque: amarelo ou ouro sobre fundo escuro,
`#006193` sobre fundo claro. Preço sempre no formato `R$ 1.234,56`, em Space Grotesk.

---

## 6. Layout, cantos e sombra

- Grid de 12 colunas no desktop, 8 no tablet, 4 no mobile.
- `max-w-pagina` (1240px), `px-margem` (24px) com `md:px-margem-desktop` (48px), `gap-coluna` (20px).
- Cantos: `rounded-campo` (8px), `rounded-card` (16px), `rounded-bloco` (24px) e `rounded-full` na pílula.
- Sombras: `shadow-adesivo` e `shadow-adesivo-sm` (deslocamento sólido em grafite, sem desfoque) no
  Ateliê; `shadow-brilho` e `shadow-ouro` (halo difuso) no Tattoo.
- O botão usa `--kolo-raio-acao` e `--kolo-sombra-acao`, então muda de forma sozinho conforme o modo.

---

## 7. Logo e mascotes

|         | Ateliê                                                                      | Tattoo                                                     |
| ------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Logo    | selo amarelo com lettering de pincel "Kolô Ateliê" e a linha "Arte Urbana SP" | "KOLÔ" em ouro com "TATTOO" pequeno e espaçado abaixo      |
| Mascote | lata de tinta amarela com boné, tênis e microfone                            | tatu em ouro e laranja                                      |
| Fundos  | selo sobre claro ou grafite                                                  | wordmark sobre marinho ou royal                             |

- Área de respiro em volta do logo: a altura da letra "K".
- Tamanho mínimo: 32px de altura no selo, 24px no wordmark.
- Nunca recolorir, distorcer, inclinar além dos 2 graus do selo, nem aplicar o selo sobre foto sem contorno.
- Mascote aparece em hero, estado vazio, erro e confirmação. Nunca dentro de formulário nem como ícone de botão.

> Pendente: os arquivos vetoriais não existem no repositório. Precisamos pedir os SVGs (logo e
> mascote das duas marcas) para quem faz a arte do Instagram e guardar em `public/marca/`.
> Até lá, as telas usam o lockup em texto.

---

## 8. Tom de voz

Direto, caloroso, jovem, brasileiro. Frases curtas. O Ateliê fala mais alto, o Tattoo fala mais baixo.

- Ateliê: "Seu espaço merece mais que uma parede branca." · "Essa peça é única. Só existe uma."
- Tattoo: "Vem trocar uma ideia." · "Um espaço pra criar e tatuar com tranquilidade."

Não use jargão interno na tela: "Modo Ateliê" e "Modo Tattoo" são nomes do sistema de design, não do produto.

---

## 9. Para o PBI-10 (shadcn/ui)

O shadcn não deve entrar com o tema padrão. Aponte as variáveis dele para os papéis daqui:

| shadcn                                    | Kolô                                            |
| ----------------------------------------- | ----------------------------------------------- |
| `--background` · `--foreground`           | `--kolo-fundo` · `--kolo-texto`                 |
| `--card` · `--card-foreground`            | `--kolo-superficie` · `--kolo-superficie-texto` |
| `--muted-foreground`                      | `--kolo-texto-suave`                            |
| `--primary` · `--primary-foreground`      | `--kolo-acao` · `--kolo-acao-texto`             |
| `--secondary` · `--secondary-foreground`  | `--kolo-marca` · `--kolo-marca-texto`           |
| `--border` e `--input`                    | `--kolo-borda-campo`                            |
| `--ring`                                  | `--kolo-foco`                                   |
| `--destructive`                           | `--kolo-erro`                                   |
| `--radius`                                | `--radius-campo`                                |

---

## 10. De onde isso veio

- Instagram [@koloatelie](https://instagram.com/koloatelie) e [@kolotattoo](https://instagram.com/kolotattoo): cores, mascotes e tom.
- Projeto no Google Stitch "Plataforma Kolô Ateliê & Tattoo" (tema KOLÔ Dual Universe), com as telas de referência.
- Ajustes feitos em cima do Stitch, todos por contraste: legenda `#6F7881` para `#5F6872`; texto
  secundário do Tattoo `#92CCFF` para `#C3D0EC`; foco em card branco no Tattoo passou a royal; ícone
  laranja saiu dos fundos claros; corpo de texto de 15px para 16px.
