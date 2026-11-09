# APS — Avaliação e Melhoria da Qualidade (Kolô)

| Arquivo | O que é |
|---|---|
| `2026_2_CC_SI_8.md` | Enunciado da APS (UNIP), transcrito |
| `APS_Kolo_Qualidade.docx` | Versão de 26/10 (Guilherme). Serve de **modelo de estilos** do .docx gerado; não editar |
| `APS.md` | **Documento-fonte** da APS (convertido da versão de 26/10 em 07/11). Toda edição de texto é aqui |
| `midia/` | Imagens que o `APS.md` referencia |
| `PLANO.md` | Decisões, metas e cronograma da avaliação |
| `evidencias/` | Baseline, antes/depois e saídas brutas das ferramentas |
| `ferramentas/verificar-docx.py` | Confere o .docx gerado contra a versão de 26/10 e procura defeitos de geração |
| `ferramentas/ajustar-docx.py` | Corrige no .docx o que o modelo não resolve: código, tabelas, capítulos em página própria e numeração |
| `ferramentas/renderizar-diagramas.mjs` | Gera os PNG de `midia/diagramas/` a partir dos SVG (Chromium do Playwright) |

Spec e tickets: issue #89 e sub-issues.

## Gerar o .docx

Na raiz do repositório (pandoc ≥ 2.12):

```bash
pandoc docs/aps/APS.md -o docs/aps/APS-gerado.docx --reference-doc=docs/aps/APS_Kolo_Qualidade.docx --resource-path=docs/aps
python docs/aps/ferramentas/ajustar-docx.py docs/aps/APS-gerado.docx
```

O segundo comando é necessário porque o modelo de 26/10 não define os estilos de código, de tabela e de lista que o
pandoc usa, e o pandoc copia dele a seção sem cabeçalho. Sem o ajuste, os códigos saem sem quebra de linha, as tabelas
sem grade e as páginas sem número. Depois de editar um SVG em `midia/diagramas/`, gere os PNG de novo com
`node docs/aps/ferramentas/renderizar-diagramas.mjs`.

O `APS-gerado.docx` fica fora do git. Ao abrir no Word, clique com o botão direito no sumário e escolha
**Atualizar campo → Atualizar o índice inteiro**: o sumário é um campo automático, gerado a partir dos títulos.

## Conferir

```bash
python docs/aps/ferramentas/verificar-docx.py docs/aps/APS_Kolo_Qualidade.docx docs/aps/APS-gerado.docx
```

Mostra se o sumário automático está presente e compara imagens, tabelas e títulos com a versão de 26/10; sai com erro
se faltar o sumário ou algum título, ou se o gerado tiver estilo indefinido, página sem número, capítulo fora de página
própria ou link para arquivo local. Títulos novos aparecem só no gerado; nenhum título da versão de 26/10 deve sumir sem
decisão do grupo.

## Convenções do `APS.md`

- Legendas (`Tabela N`, `Quadro N`, `Figura N`, `Código N`, `Fonte …`) ficam num bloco `::: {custom-style="Legenda"}` para sair com
  o estilo de legenda do modelo.
- Quebra de página, quebra de seção antes da Introdução e o campo de sumário são blocos ```` ```{=openxml} ```` (só valem
  no .docx). Título de nível 1 já começa em página própria: não ponha quebra antes dele.
- Número novo no texto aponta para um arquivo em `evidencias/`, citado pela referência correspondente, sem link local.
- Largura das colunas de tabela vem da quantidade de traços da linha separadora.
