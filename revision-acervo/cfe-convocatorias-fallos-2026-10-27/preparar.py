"""Coteja los avisos SIDOF con el PDF del 27/10. Argumentos: PDF, carpeta de notas HTML."""
from pathlib import Path
import hashlib
import html
import json
import sys
import uuid

import pymupdf
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
PDF_URL = "https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=27102026-MAT.pdf&repo="
SOURCE = "dof-cne-asea-20261027-5043e1a11443"
pdf_path, html_dir = map(Path, sys.argv[1:])
digest = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
assert digest == "5043e1a11443c1b4c12ccc47d4bbc32e5dfe16d16ec1ba89f950e46bac6663ca"
# Los límites incluyen el encabezado y el registro del aviso, sin el aviso vecino.
specs = [
    ('Cables de potencia de las unidades 1 y 3 de Chicoasén', 'CFE-0001-CAAAA-0014-2026', 5802336, 145, 41, 78),
    ('Incremento de capacidad de transformación en la zona Tijuana', 'CFE-0004-CACOT-0006-2026', 5802255, 146, 5, 51),
    ('Modernización de líneas subterráneas en la zona de carga Veracruz', 'CFE-0004-CACOT-0007-2026', 5802305, 147, 5, 50),
    ('Barras y transformación de la SE Panamericana Pot', 'CFE-0004-CACOT-0008-2026', 5802242, 148, 5, 51),
    ('Banco 3 de la SE Francisco Villa', 'CFE-0004-CACOT-0009-2026', 5802246, 149, 5, 50),
    ('Banco 2 de la SE Nueva Rosita', 'CFE-0004-CACOA-0010-2026', 5802328, 150, 5, 51),
    ('Modernización de la SE Tijuana I', 'CFE-0004-CACOA-0011-2026', 5802275, 151, 5, 51),
    ('Soporte de tensión en la red de 115 kV de Durango', 'CFE-0004-CACOA-0012-2026', 5802241, 152, 5, 50),
    ('Soporte de tensión en la red de 115 kV de La Laguna', 'CFE-0004-CACOA-0013-2026', 5802252, 153, 5, 50),
    ('Precalentadores de aire de la unidad 6 de la CT Presidente Adolfo López Mateos', 'CFE-0900-CASAT-0023-2026', 5802262, 156, 61, 101),
    ('Modernización y rehabilitación de grúas de los edificios del reactor', 'CFE-0001-CASAT-0065-2026', 5802266, 157, 4, 40),
    ('Compresor y secador de aire de instrumentos para la CT Francisco Villa', 'CFE-0001-CAAAT-0177-2026', 5802329, 157, 40, 79),
    ('Paredes del generador de vapor y del economizador de la unidad 4 de la CC Valle de México', 'CFE-0001-CAAAT-0180-2026', 5802272, 158, 4, 41),
    ('Interruptores de presión con calificación nuclear RMC-018', 'CFE-0001-CAAAT-0182-2026', 5802318, 158, 41, 80),
    ('Refacciones para sopladores de hollín de la CT Francisco Pérez Ríos', 'CFE-0001-CAAAT-0183-2026', 5802292, 159, 4, 44),
    ('Regulador automático de voltaje para la unidad 7 de la CC Valle de México', 'CFE-0001-CAAAT-0184-2026', 5802254, 159, 44, 98),
    ('Bienes para mantenimiento de la turbina principal y equipos asociados', 'CFE-0001-CAAAT-0071-2026', 5802293, 160, 4, 24),
    ('Pruebas de diagnosis a válvulas nucleares de la CNLV', 'CFE-0001-CASAT-0031-2026', 5802306, 160, 24, 43),
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
        header = len(cells) == 1 and cells[0].get("colspan") in ("2", "3") and i < 2
        rendered = []
        for j, cell in enumerate(cells):
            value = text(cell)
            values.append(value)
            tag = "th" if header or j == 0 else "td"
            attrs = ' scope="row"' if not header and j == 0 else ""
            for attr in ("colspan", "rowspan"):
                if cell.has_attr(attr):
                    assert cell[attr] in ("2", "3", "4")
                    attrs += f' {attr}="{cell[attr]}"'
            rendered.append(f"<{tag}{attrs}>{html.escape(value)}</{tag}>")
        (heads if header else body).append("<tr>" + "".join(rendered) + "</tr>")
    thead = "<thead>" + "".join(heads) + "</thead>" if heads else ""
    return "<table>" + thead + "<tbody>" + "".join(body) + "</tbody></table>", values


batch, maps, audit = [], {}, []
with pymupdf.open(pdf_path) as pdf:
    for title, folio, note, page, start, end in specs:
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
        award = any(text(node) == "AVISO DE ADJUDICACION DE CONTRATO" for node in nodes)
        assert sum(node.name == "table" for node in nodes) == (0 if award else 1)
        cell_count = 0
        label = "Fallo" if award else "Convocatoria"
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
                assert found == expected, (folio, value, found)
        content = "\n".join(parts)
        assert cursor == len(tokens) and folio in content and "(R.-" in text(nodes[-1])
        url = f"https://sidof.segob.gob.mx/notas/{note}"
        law = dict(id=uid(url+"#"+folio), siglas=folio, titulo=f"{label} de contratación CFE · {folio} · {title}",
                   tipo="aviso" if award else "convocatoria", fecha_publicacion="2026-10-27", url_original=url,
                   temas_clave=["Contratación de CFE", title])
        aid = uid(url+"#"+folio+"/"+label.lower())
        article = dict(id=aid, ley_id=law["id"], orden=1, identificador=label+" · "+folio,
                       contenido=content, tipo_articulo="fallo" if award else "convocatoria", titulo_nombre=folio, capitulo_nombre=title)
        maps[aid] = dict(sourceId=SOURCE, label=article["identificador"], type=article["tipo_articulo"], pageNumbers=[page],
                         anchors=anchors, contentSha256=hashlib.sha256(content.encode()).hexdigest())
        batch.append(dict(ley=law, articulos=[article]))
        audit.append(dict(folio=folio, objeto=title, registro=text(nodes[-1]), pagina=page, fuente=url,
                          sha256Html=hashlib.sha256(source_html).hexdigest(), celdasCotejadas=cell_count,
                          lineas=len(anchors)))

        if folio == "CFE-0001-CAAAT-0180-2026":
            audit[-1]["observacion"] = (
                "El aviso imprime 28/20/2026 para aclaraciones y 12/10/2026 para el límite de ofertas "
                "y la apertura técnica, anteriores a la publicación en el micrositio (23/10/2026). "
                "Las tres celdas se conservan como aparecen en la página 158."
            )

assert len(batch) == len(maps) == 18
assert sum(item["ley"]["tipo"] == "aviso" for item in batch) == 2
for name, data in [("carga", batch), ("map", {"articles": maps}), ("cotejo", dict(pdf=PDF_URL, sha256=digest, avisos=audit))]:
    (ROOT / (name+".json")).write_bytes((json.dumps(data, ensure_ascii=False, indent=2)+"\n").encode())
