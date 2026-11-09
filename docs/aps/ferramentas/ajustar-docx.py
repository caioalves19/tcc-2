"""APS: corrige no .docx gerado pelo pandoc o que o modelo de estilos não resolve.

O modelo (APS_Kolo_Qualidade.docx) foi feito à mão no Word e não define vários estilos que o pandoc
usa. Sem eles, o texto cai no parágrafo Normal: Arial 12, espaçamento 1,5 e recuo de primeira linha.
Este script:

- troca os estilos de código por fonte monoespaçada de 8 pt, espaçamento simples e quebra de linha;
- define os estilos ausentes de tabela, lista, primeiro parágrafo, citação e nota de rodapé;
- faz os capítulos começarem em página própria, como na monografia;
- liga o cabeçalho com o número da página à última seção (o pandoc copia a seção sem cabeçalho).

Na raiz do repositório, depois do pandoc:

    python docs/aps/ferramentas/ajustar-docx.py docs/aps/APS-gerado.docx
"""

import re
import shutil
import sys
import tempfile
import zipfile

FONTE = '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas" /><w:sz w:val="16" /><w:szCs w:val="16" />'
PARAGRAFO = (
    '<w:style w:type="paragraph" w:customStyle="1" w:styleId="SourceCode"><w:name w:val="Source Code" />'
    '<w:basedOn w:val="Normal" /><w:link w:val="VerbatimChar" /><w:pPr><w:wordWrap w:val="on" />'
    '<w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto" /><w:ind w:firstLine="0" />'
    f'<w:jc w:val="left" /></w:pPr><w:rPr>{FONTE}</w:rPr></w:style>'
)
CARACTERE = (
    '<w:style w:type="character" w:customStyle="1" w:styleId="VerbatimChar"><w:name w:val="Verbatim Char" />'
    f'<w:rPr>{FONTE}</w:rPr></w:style>'
)

DEZ_PONTOS = '<w:sz w:val="20" /><w:szCs w:val="20" />'
SIMPLES = '<w:spacing w:line="240" w:lineRule="auto" />'
SEM_RECUO = '<w:ind w:firstLine="0" />'


def paragrafo(identificador: str, nome: str, propriedades: str, fonte: str = "") -> str:
    return (
        f'<w:style w:type="paragraph" w:customStyle="1" w:styleId="{identificador}"><w:name w:val="{nome}" />'
        f'<w:basedOn w:val="Normal" /><w:qFormat /><w:pPr>{propriedades}</w:pPr><w:rPr>{fonte}</w:rPr></w:style>'
    )


# O pandoc usa `Compact` nas células e nas listas curtas; o texto das células ganha estilo próprio.
AUSENTES = {
    "Compact": paragrafo("Compact", "Compact", SEM_RECUO),
    "TextoDeTabela": paragrafo(
        "TextoDeTabela",
        "Texto de Tabela",
        '<w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto" />'
        f'{SEM_RECUO}<w:jc w:val="left" />',
        DEZ_PONTOS,
    ),
    "FirstParagraph": paragrafo("FirstParagraph", "First Paragraph", '<w:spacing w:after="120" />'),
    # Natureza do trabalho na folha de rosto: do meio da página para a direita.
    "BlockText": paragrafo("BlockText", "Block Text", f'{SIMPLES}<w:ind w:left="4536" w:firstLine="0" />', DEZ_PONTOS),
    "FootnoteText": paragrafo("FootnoteText", "footnote text", SIMPLES + SEM_RECUO, DEZ_PONTOS),
    "FootnoteReference": (
        '<w:style w:type="character" w:customStyle="1" w:styleId="FootnoteReference">'
        '<w:name w:val="footnote reference" /><w:rPr><w:vertAlign w:val="superscript" /></w:rPr></w:style>'
    ),
    # A mesma grade e o mesmo cabeçalho cinza das tabelas feitas à mão no modelo.
    "Table": (
        '<w:style w:type="table" w:customStyle="1" w:styleId="Table"><w:name w:val="Table" />'
        '<w:basedOn w:val="Tabelacomgrade" /><w:tblPr><w:tblCellMar><w:left w:w="70" w:type="dxa" />'
        '<w:right w:w="70" w:type="dxa" /></w:tblCellMar></w:tblPr><w:tblStylePr w:type="firstRow"><w:tcPr>'
        '<w:shd w:val="clear" w:color="auto" w:fill="EDEDED" /></w:tcPr></w:tblStylePr></w:style>'
    ),
}


def ajustar_codigo(estilos: str) -> str:
    estilos, n = re.subn(r'<w:style w:type="paragraph" w:customStyle="1" w:styleId="SourceCode">.*?</w:style>',
                         lambda _: PARAGRAFO, estilos, flags=re.S)
    if n != 1:
        sys.exit("estilo Source Code não encontrado: o documento tem bloco de código?")
    estilos = re.sub(r'<w:style w:type="character"[^>]*w:styleId="VerbatimChar">.*?</w:style>', "", estilos, flags=re.S)
    return estilos.replace("</w:styles>", CARACTERE + "</w:styles>")


def capitulos_em_pagina_propria(estilos: str) -> str:
    def incluir(estilo: re.Match) -> str:
        if "<w:pageBreakBefore" in estilo.group(0):
            return estilo.group(0)
        return re.sub(r"<w:keepLines ?/>", r"\g<0><w:pageBreakBefore />", estilo.group(0), count=1)

    estilos, n = re.subn(r'<w:style [^>]*>(?:(?!</w:style>).)*?<w:name w:val="heading 1" ?/>.*?</w:style>',
                         incluir, estilos, flags=re.S)
    if n != 1:
        sys.exit("estilo de título 1 não encontrado: o modelo mudou?")
    return estilos


def ajustar_estilos(estilos: str) -> str:
    estilos = capitulos_em_pagina_propria(ajustar_codigo(estilos))
    for identificador, estilo in AUSENTES.items():
        if f'w:styleId="{identificador}"' not in estilos:
            estilos = estilos.replace("</w:styles>", estilo + "</w:styles>")
    return estilos


def ajustar_documento(documento: str, relacoes: str) -> str:
    documento = re.sub(
        r"<w:tbl>.*?</w:tbl>",
        lambda tabela: re.sub(r'<w:pStyle w:val="Compact" ?/>', '<w:pStyle w:val="TextoDeTabela" />', tabela.group(0)),
        documento,
        flags=re.S,
    )
    relacao = re.search(r'<Relationship [^>]*Target="header1\.xml"[^>]*>', relacoes)
    if relacao is None:
        sys.exit("cabeçalho não encontrado: o modelo mudou?")
    identificador = re.search(r'Id="([^"]+)"', relacao.group(0)).group(1)
    inicio = documento.rindex("<w:sectPr")
    if "<w:headerReference" in documento[inicio:]:
        return documento
    fim = documento.index(">", inicio) + 1
    return f'{documento[:fim]}<w:headerReference w:type="default" r:id="{identificador}" />{documento[fim:]}'


def main(caminho: str) -> None:
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as temp:
        destino = temp.name
    with zipfile.ZipFile(caminho) as origem, zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as saida:
        relacoes = origem.read("word/_rels/document.xml.rels").decode("utf-8")
        for item in origem.infolist():
            dados = origem.read(item.filename)
            if item.filename == "word/styles.xml":
                dados = ajustar_estilos(dados.decode("utf-8")).encode("utf-8")
            elif item.filename == "word/document.xml":
                dados = ajustar_documento(dados.decode("utf-8"), relacoes).encode("utf-8")
            saida.writestr(item, dados)
    shutil.move(destino, caminho)
    print(f"estilos, capítulos e numeração ajustados em {caminho}")


if __name__ == "__main__":
    main(sys.argv[1])
