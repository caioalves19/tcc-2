import re
import sys
import zipfile


def ler(caminho):
    with zipfile.ZipFile(caminho) as z:
        xml = z.read("word/document.xml").decode("utf-8")
        midias = [n for n in z.namelist() if n.startswith("word/media/")]
    estilos = re.findall(r'<w:pStyle w:val="([^"]+)" ?/>', xml)
    titulos = []
    for par in re.findall(r"<w:p[ >].*?</w:p>", xml, flags=re.S):
        m = re.search(r'<w:pStyle w:val="(Heading\d|Ttulo\d|Titulo\d)" ?/>', par)
        if m:
            titulos.append("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", par)).strip())
    return {
        "toc": "TOC \\o" in xml,
        "midias": len(midias),
        "tabelas": xml.count("<w:tbl>"),
        "titulos": titulos,
        "estilos_titulo": sorted({e for e in estilos if re.match(r"(Heading|Ttulo|Titulo)\d", e)}),
    }


def defeitos(caminho):
    """Defeitos que o pandoc não avisa e que só aparecem ao abrir o documento."""
    with zipfile.ZipFile(caminho) as z:
        xml = z.read("word/document.xml").decode("utf-8")
        notas = z.read("word/footnotes.xml").decode("utf-8") if "word/footnotes.xml" in z.namelist() else ""
        estilos = z.read("word/styles.xml").decode("utf-8")
        relacoes = z.read("word/_rels/document.xml.rels").decode("utf-8")

    # Estilo citado e não definido cai no Normal: Arial 12, espaçamento 1,5 e recuo de primeira linha.
    definidos = set(re.findall(r'w:styleId="([^"]+)"', estilos))
    usados = set(re.findall(r'<w:(?:pStyle|rStyle|tblStyle) w:val="([^"]+)"', xml + notas))
    achados = [f"estilo usado e não definido: {estilo}" for estilo in sorted(usados - definidos)]

    secoes = re.findall(r"<w:sectPr.*?</w:sectPr>", xml, flags=re.S)
    if not secoes or "<w:headerReference" not in secoes[-1]:
        achados.append("a última seção não tem cabeçalho: as páginas saem sem número")

    titulo = next((s for s in re.findall(r"<w:style .*?</w:style>", estilos, flags=re.S)
                   if '<w:name w:val="heading 1"' in s), "")
    if "<w:pageBreakBefore" not in titulo:
        achados.append("os capítulos não começam em página própria")

    # O professor recebe só o .docx: link para arquivo do repositório fica quebrado.
    for relacao in re.findall(r'<Relationship [^>]*TargetMode="External"[^>]*>', relacoes):
        alvo = re.search(r'Target="([^"]+)"', relacao).group(1)
        if not re.match(r"(https?:|mailto:)", alvo):
            achados.append(f"link para arquivo local: {alvo}")
    return achados


original, gerado = ler(sys.argv[1]), ler(sys.argv[2])
print("sumário automático no gerado:", gerado["toc"])
print("imagens  original/gerado:", original["midias"], gerado["midias"])
print("tabelas  original/gerado:", original["tabelas"], gerado["tabelas"])
print("estilos de título  original/gerado:", original["estilos_titulo"], gerado["estilos_titulo"])
print("títulos  original/gerado:", len(original["titulos"]), len(gerado["titulos"]))
faltam = [t for t in original["titulos"] if t and t not in gerado["titulos"]]
print("títulos do original ausentes no gerado:", faltam or "nenhum")

achados = defeitos(sys.argv[2])
print("defeitos de geração:", achados or "nenhum")

# Sai com erro quando o gerado perdeu o sumário ou um título da versão original, ou tem defeito de geração.
if not gerado["toc"] or faltam or achados:
    sys.exit(1)
