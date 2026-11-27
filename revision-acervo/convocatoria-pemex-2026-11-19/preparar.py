"""Prepara la nota SIDOF 5804408 a partir del HTML y el PDF matutino oficiales."""
import hashlib
import html
import json
import sys
import uuid
from pathlib import Path

import pymupdf
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
URL = "https://sidof.segob.gob.mx/notas/5804408"
PDF_URL = "https://sidof.segob.gob.mx/notas/getNewsletter/19-11-2026/Matutina/330927"
SOURCE = "dof-matutina-20261119-a44ff18afa67"
FOLIOS = ["DEE-CAT-B-GCEE-500-106688-26-1", "DEE-CAT-S-GCEE-500-106680-26-1"]
pdf, source_html = map(Path, sys.argv[1:])


def sha(data):
    return hashlib.sha256(data).hexdigest()


def compact(text):
    return "".join(text.split()).replace("·", "•")


def write(name, value):
    (ROOT / name).write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode())


pdf_hash = sha(pdf.read_bytes())
assert pdf_hash == "a44ff18afa678868edfa4d98aa9a6f85139135df190226585635c75671dce395"
assert sha(source_html.read_bytes()) == "e1ebdf0f432582d365101b744312226ecc3a4707cdb821f57725513bbf724d84"
soup = BeautifulSoup(source_html.read_bytes().decode("utf-8"), "html.parser")
nodes = [n for n in soup.body.find_all(["p", "table"]) if not n.find_parent("table")
         and (n.name == "table" or not n.find(["table", "p"])) and n.get_text(strip=True)]
assert [i for i, n in enumerate(nodes) if n.name == "table"] == [8, 10]


def text(node):
    return " ".join(node.get_text().split())


def render(node):
    if node.name != "table":
        return "<p>" + html.escape(text(node)) + "</p>"
    rows = []
    for i, tr in enumerate(node.find_all("tr")):
        tag = "td" if i else "th"
        cells = []
        for cell in tr.find_all(["td", "th"]):
            span = ' colspan="2"' if cell.get("colspan") == "2" else ""
            cells.append(f"<{tag}{span}>" + html.escape(text(cell)) + f"</{tag}>")
        rows.append("<tr>" + "".join(cells) + "</tr>")
    return "<table><thead>" + rows[0] + "</thead><tbody>" + "".join(rows[1:]) + "</tbody></table>"


def uid(key):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


law = dict(id=uid(URL), siglas="PEMEX-JUJO-RTS-2026", tipo="convocatoria",
           titulo="Convocatoria de PEMEX para motobombas en la Batería Jujo y mantenimiento de equipos de extracción en la Región Terrestre Sur",
           fecha_publicacion="2026-11-19", url_original=URL, temas_clave=["Contratación de PEMEX", "Extracción", *FOLIOS])
groups = [
    ("Convocatoria y fundamento", nodes[:7], 101, 40, 56),
    (FOLIOS[0], nodes[7:9], 101, 57, 72),
    (FOLIOS[1], nodes[9:11], 102, 3, 16),
    ("Condiciones comunes y firma", nodes[11:], 102, 17, 63),
]
articles, maps, audit = [], {}, []
with pymupdf.open(pdf) as doc:
    for order, (label, group, page, first, end) in enumerate(groups, start=1):
        lines = [line for block in doc[page-1].get_text("dict")["blocks"] for line in block.get("lines", [])]
        anchors, tokens = [], []
        for line in lines[first:end]:
            token = compact("".join(s["text"] for s in line["spans"]))
            if token:
                tokens.append(token)
                anchors.append(dict(page=page, bbox=line["bbox"]))
        content = "\n".join(render(n) for n in group)
        assert compact(BeautifulSoup(content, "html.parser").get_text()) == "".join(tokens), label
        if label in FOLIOS:
            assert label in text(group[0])
            # Cada celda, en orden, debe cubrir líneas completas del PDF.
            cursor = 3  # las primeras tres líneas identifican el concurso
            for cell in group[1].find_all("td"):
                expected, found = compact(text(cell)), ""
                while len(found) < len(expected):
                    found += tokens[cursor]
                    cursor += 1
                assert found == expected, (label, text(cell))
            assert cursor == len(tokens)
        aid = uid(URL + "#" + label)
        articles.append(dict(id=aid, ley_id=law["id"], orden=order, identificador=label,
                             titulo_nombre=law["titulo"], tipo_articulo="convocatoria", contenido=content))
        maps[aid] = dict(sourceId=SOURCE, label=label, type="convocatoria", contentSha256=sha(content.encode()),
                         pageNumbers=[page], anchors=anchors)
        audit.append(dict(id=aid, apartado=label, pagina=page, lineas=len(anchors),
                          celdas=sum(len(n.find_all("td")) for n in group if n.name == "table")))
write("carga.json", {"ley": law, "articulos": articles})
write("map.json", {"articles": maps})
write("cotejo.json", dict(nota=URL, pdf=PDF_URL, sha256=pdf_hash, apartados=audit))
