# APS — Avaliação e Melhoria da Qualidade (Kolô)

| Arquivo | O que é |
|---|---|
| `2026_2_CC_SI_8.md` | Enunciado da APS (UNIP), transcrito |
| `APS_Kolo_Qualidade.docx` | Versão de 26/10 (Guilherme). Serve de **modelo de estilos** do .docx gerado; não editar |
| `APS.md` | **Documento-fonte** da APS (convertido da versão de 26/10 em 07/11). Toda edição de texto é aqui |
| `midia/` | Imagens que o `APS.md` referencia |
| `PLANO.md` | Decisões, metas e cronograma da avaliação |
| `evidencias/` | Baseline, antes/depois e saídas brutas das ferramentas |
| `ferramentas/verificar-docx.py` | Confere o .docx gerado contra a versão de 26/10 |

Spec e tickets: issue #89 e sub-issues.

## Gerar o .docx

Na raiz do repositório (pandoc ≥ 2.12):

```bash
pandoc docs/aps/APS.md -o docs/aps/APS-gerado.docx --reference-doc=docs/aps/APS_Kolo_Qualidade.docx --resource-path=docs/aps
```

O `APS-gerado.docx` fica fora do git. Ao abrir no Word, clique com o botão direito no sumário e escolha
**Atualizar campo → Atualizar o índice inteiro**: o sumário é um campo automático, gerado a partir dos títulos.

## Conferir

```bash
python docs/aps/ferramentas/verificar-docx.py docs/aps/APS_Kolo_Qualidade.docx docs/aps/APS-gerado.docx
```

Mostra se o sumário automático está presente e compara imagens, tabelas e títulos com a versão de 26/10; sai com erro
se faltar o sumário ou algum título. Enquanto as
seções forem sendo completadas, títulos novos aparecem só no gerado; nenhum título da versão de 26/10 deve sumir sem
decisão do grupo.

## Convenções do `APS.md`

- Legendas (`Tabela N`, `Quadro N`, `Figura N`, `Fonte …`) ficam num bloco `::: {custom-style="Legenda"}` para sair com
  o estilo de legenda do modelo.
- Quebra de página e o campo de sumário são blocos ```` ```{=openxml} ```` (só valem no .docx).
- Número novo no texto aponta para um arquivo em `evidencias/`.
