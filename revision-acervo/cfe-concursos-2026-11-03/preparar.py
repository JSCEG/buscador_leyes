"""Coteja los avisos SIDOF con el PDF del 03/11. Argumentos: PDF, carpeta de notas HTML."""
from pathlib import Path
import hashlib
import html
import json
import sys
import uuid

import pymupdf
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
PDF_URL = "https://sidof.segob.gob.mx/notas/getNewsletter/03-11-2026/Matutina/330585"
SOURCE = "dof-matutina-20261103-6ac679768636"
pdf_path, html_dir = map(Path, sys.argv[1:])
digest = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
assert digest == "6ac6797686364f04f8fe873754484b18dad23107cced42539dd8a1f351b04af9"
# Los límites incluyen el encabezado y el registro del aviso, sin el aviso vecino.
specs = [
    ("Tabasco", "CFE-0004-CACOT-0012-2026", 5802917, 131, 4, 49, "376 SLT Suministro de energía eléctrica en Tabasco"),
    ("Morelos", "CFE-0004-CACOT-0013-2026", 5802921, 132, 5, 51, "371 SLT Suministro de energía eléctrica en Morelos"),
    ("Dos Bocas", "CFE-0900-CASAT-0024-2026", 5802929, 133, 3, 43, "Medición de redes de tierra y sistemas de descargas atmosféricas en la CC Dos Bocas"),
    ("José López Portillo", "CFE-0700-CAAAT-0030-2026", 5802905, 134, 4, 41, "Compresor centrífugo para la CT José López Portillo"),
    ("Juárez", "CFE-0001-CASAT-0066-2026", 5802856, 134, 41, 83, "Sistema de control, monitoreo y protección de la unidad 2 de la Central Turbo Gas Juárez"),
    ("Emilio Portes Gil", "CFE-0001-CASAT-0069-2026", 5802902, 135, 3, 43, "Arranque estático y regulador de tensión de la unidad 4 de la CC Presidente Emilio Portes Gil"),
    ("UME 03 y 04", "CFE-0001-CASAT-0072-2026", 5802882, 135, 43, 83, "Reparación mayor de turbina de gas LM2500+SAC"),
    ("Emilio Portes Gil", "CFE-0001-CAAAT-0187-2026", 5802872, 136, 4, 54, "Módulos del recuperador de calor de la CC Presidente Emilio Portes Gil"),
    ("Altamira", "CFE-0700-CASAN-0049-2026", 5802887, 137, 22, 58, "Válvulas de estrangulamiento de las unidades 3 y 4 de la CT Altamira"),
]


def uid(key):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def text(node):
    return " ".join(node.get_text().split())


def compact(s):
    return "".join(s.split())


def table_rows(node):
    heads, body, values = [], [], []
    for i, tr in enumerate(node.find_all("tr")):
        cells = tr.find_all(["td", "th"])
        header = len(cells) == 1 and cells[0].get("colspan") == "2" and i < 2
        rendered = []
        for j, cell in enumerate(cells):
            value = text(cell)
            values.append(value)
            tag = "th" if header or j == 0 else "td"
            attrs = ' scope="row"' if not header and j == 0 else ""
            for attr in ("colspan", "rowspan"):
                if cell.has_attr(attr):
                    assert cell[attr] in ("2", "4")
                    attrs += f' {attr}="{cell[attr]}"'
            rendered.append(f"<{tag}{attrs}>{html.escape(value)}</{tag}>")
        (heads if header else body).append("<tr>" + "".join(rendered) + "</tr>")
    thead = "<thead>" + "".join(heads) + "</thead>" if heads else ""
    return "<table>" + thead + "<tbody>" + "".join(body) + "</tbody></table>", values


batch, maps, audit = [], {}, []
with pymupdf.open(pdf_path) as pdf:
    for site, folio, note, page, start, end, title in specs:
        lines = [line for block in pdf[page-1].get_text("dict")["blocks"] for line in block.get("lines", [])]
        tokens, anchors = [], []
        for index in range(start, end):
            line = lines[index]
            token = compact("".join(span["text"] for span in line["spans"]))
            if token:
                tokens.append(token)
                anchors.append(dict(page=page, bbox=list(pymupdf.Rect(line["bbox"]) * pdf[page-1].rotation_matrix)))
        source_html = (html_dir / f"{note}.html").read_bytes()
        soup = BeautifulSoup(source_html.decode("utf-8"), "html.parser")
        nodes = [node for node in soup.body.find_all(["p", "table"]) if not node.find_parent("table")
                 and (node.name == "table" or not node.find(["p", "table"])) and node.get_text(strip=True)]
        assert sum(node.name == "table" for node in nodes) == 1
        parts, cursor = [], 0
        for node in nodes:
            if node.name == "table":
                part, values = table_rows(node)
                cell_count = len(values)
            else:
                values = [text(node)]
                part = "<p>" + html.escape(values[0]) + "</p>"
            parts.append(part)
            # Coteja por separado cada párrafo y cada celda, incluidas las vacías.
            for value in values:
                expected, found = compact(value), ""
                while len(found) < len(expected) and cursor < len(tokens):
                    found += tokens[cursor]
                    cursor += 1
                assert found == expected, (site, value, found)
        content = "\n".join(parts)
        assert cursor == len(tokens) and folio in content and "(R.-" in text(nodes[-1])
        url = f"https://sidof.segob.gob.mx/notas/{note}"
        law = dict(id=uid(url+"#"+folio), siglas=folio, titulo=f"Convocatoria de contratación CFE · {folio} · {title}",
                   tipo="convocatoria", fecha_publicacion="2026-11-03", url_original=url,
                   temas_clave=["Contratación de CFE", site, title])
        aid = uid(url+"#"+folio+"/convocatoria")
        article = dict(id=aid, ley_id=law["id"], orden=1, identificador="Convocatoria · "+folio,
                       contenido=content, tipo_articulo="convocatoria", titulo_nombre=folio, capitulo_nombre=title)
        maps[aid] = dict(sourceId=SOURCE, label=article["identificador"], type="convocatoria", pageNumbers=[page],
                         anchors=anchors, contentSha256=hashlib.sha256(content.encode()).hexdigest())
        batch.append(dict(ley=law, articulos=[article]))
        audit.append(dict(folio=folio, sede=site, registro=text(nodes[-1]), pagina=page, fuente=url,
                          sha256Html=hashlib.sha256(source_html).hexdigest(), celdasCotejadas=cell_count,
                          lineas=len(anchors)))

    source = dict(id=SOURCE, title="Diario Oficial de la Federación · Edición matutina del 3 de noviembre de 2026",
                  instrumentIds=[item["ley"]["id"] for item in batch], sha256=digest, transport="remote-pdf",
                  pdfUrl="/api/reader/" + SOURCE, originalUrl=PDF_URL, pageCount=len(pdf),
                  pages=[dict(number=p.number+1, width=p.rect.width, height=p.rect.height) for p in pdf])

for name, data in [("carga", batch), ("map", {"sources": {SOURCE: source}, "articles": maps}), ("cotejo", dict(pdf=PDF_URL, sha256=digest, avisos=audit))]:
    (ROOT / (name+".json")).write_bytes((json.dumps(data, ensure_ascii=False, indent=2)+"\n").encode())
