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


original, gerado = ler(sys.argv[1]), ler(sys.argv[2])
print("sumário automático no gerado:", gerado["toc"])
print("imagens  original/gerado:", original["midias"], gerado["midias"])
print("tabelas  original/gerado:", original["tabelas"], gerado["tabelas"])
print("estilos de título  original/gerado:", original["estilos_titulo"], gerado["estilos_titulo"])
print("títulos  original/gerado:", len(original["titulos"]), len(gerado["titulos"]))
faltam = [t for t in original["titulos"] if t and t not in gerado["titulos"]]
print("títulos do original ausentes no gerado:", faltam or "nenhum")

# Sai com erro quando o gerado perdeu o sumário automático ou algum título da versão original.
if not gerado["toc"] or faltam:
    sys.exit(1)
