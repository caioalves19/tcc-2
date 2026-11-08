"""APS: ajusta o estilo dos blocos de código no .docx gerado pelo pandoc.

O modelo de estilos (APS_Kolo_Qualidade.docx) não tem estilo de código. Sem este ajuste, o pandoc
herda o parágrafo Normal: Arial 12, espaçamento 1,5, recuo de primeira linha, justificado e sem
quebra de linha, e as linhas longas saem da página. Este script troca só os estilos `Source Code`
e `Verbatim Char`: fonte monoespaçada de 8 pt, espaçamento simples, alinhado à esquerda e com
quebra de linha. Na raiz do repositório, depois do pandoc:

    python docs/aps/ferramentas/ajustar-codigo-docx.py docs/aps/APS-gerado.docx
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


def ajustar(estilos: str) -> str:
    estilos, n = re.subn(r'<w:style w:type="paragraph" w:customStyle="1" w:styleId="SourceCode">.*?</w:style>',
                         lambda _: PARAGRAFO, estilos, flags=re.S)
    if n != 1:
        sys.exit("estilo Source Code não encontrado: o documento tem bloco de código?")
    estilos = re.sub(r'<w:style w:type="character"[^>]*w:styleId="VerbatimChar">.*?</w:style>', "", estilos, flags=re.S)
    return estilos.replace("</w:styles>", CARACTERE + "</w:styles>")


def main(caminho: str) -> None:
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as temp:
        destino = temp.name
    with zipfile.ZipFile(caminho) as origem, zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as saida:
        for item in origem.infolist():
            dados = origem.read(item.filename)
            if item.filename == "word/styles.xml":
                dados = ajustar(dados.decode("utf-8")).encode("utf-8")
            saida.writestr(item, dados)
    shutil.move(destino, caminho)
    print(f"estilos de código ajustados em {caminho}")


if __name__ == "__main__":
    main(sys.argv[1])
