"""Coteja los avisos SIDOF con el PDF del 17/11. Argumentos: PDF, carpeta de notas HTML."""
from pathlib import Path
import hashlib
import html
import json
import sys
import uuid

import pymupdf
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
PDF_URL = "https://sidof.segob.gob.mx/notas/getNewsletter/17-11-2026/Matutina/330845"
SOURCE = "dof-matutina-20261117-0ab540b3ca7a"
pdf_path, html_dir = map(Path, sys.argv[1:])
digest = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
assert digest == "0ab540b3ca7ac1366020051bfe46ea81263040425c1cd88b39fdded07f3d8f55"
# Los límites incluyen el encabezado y el registro del aviso, sin el aviso vecino.
specs = [
    ("Centro", "CFE-0400-CASAT-0003-2026", 5804011, 169, 3, 43, "Control TOSMAP de la Central Ciclo Combinado Centro"),
    ("Villa Reyes", "CFE-0001-CASAT-0077-2026", 5804060, 170, 4, 41, "Transformador de la unidad 1 de la Central Termoeléctrica Villa Reyes"),
    ("Dos Bocas", "CFE-0001-CAAAT-0199-2026", 5804062, 172, 4, 56, "Rotor de vapor de la unidad 5 de la Central Ciclo Combinado Dos Bocas"),
    ("Matapionche", "LA-18-TON-018TON999-N-74-2026", 5803973, 138, 35, 97, "Adquisición, integración, pruebas y puesta en operación en la EM Matapionche"),
]


def uid(key):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def text(node):
    return " ".join(node.get_text().split())


def compact(s):
    return "".join(s.split())


def table_rows(node, site):
    heads, body, values = [], [], []
    for i, tr in enumerate(node.find_all("tr")):
        cells = tr.find_all(["td", "th"])
        header = site in ("Villa Reyes", "Dos Bocas") and i < 2
        if site == "Dos Bocas":
            # El original comparte el rótulo izquierdo entre ambos procedimientos.
            assert len(cells) == (2 if i == 1 else 3)
            cells = [cells[-1]] if i == 1 else [cells[0], cells[-1]]
        rendered = []
        for j, cell in enumerate(cells):
            value = text(cell)
            values.append(value)
            tag = "th" if header or j == 0 else "td"
            attrs = ' scope="row"' if not header and j == 0 else ""
            for attr in ("colspan", "rowspan"):
                if cell.has_attr(attr):
                    assert cell[attr] == "2"
                    attrs += f' {attr}="2"'
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
            if site == "Dos Bocas" and 14 <= index <= 42 and 200 <= line["bbox"][0] < 380:
                continue  # columna de Lerma
            if token:
                tokens.append(token)
                anchors.append(dict(page=page, bbox=line["bbox"]))
        source_html = (html_dir / f"{note}.html").read_bytes()
        soup = BeautifulSoup(source_html.decode("utf-8"), "html.parser")
        nodes = [node for node in soup.body.find_all(["p", "table"]) if not node.find_parent("table")
                 and (node.name == "table" or not node.find(["p", "table"])) and node.get_text(strip=True)]
        assert sum(node.name == "table" for node in nodes) == 1
        parts, cursor = [], 0
        for node in nodes:
            if node.name == "table":
                part, values = table_rows(node, site)
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
        org = "CENAGAS" if site == "Matapionche" else "CFE"
        law = dict(id=uid(url+"#"+folio), siglas=folio, titulo=f"Convocatoria de contratación {org} · {folio} · {title}",
                   tipo="convocatoria", fecha_publicacion="2026-11-17", url_original=url,
                   temas_clave=[f"Contratación de {org}", site, title])
        aid = uid(url+"#"+folio+"/convocatoria")
        article = dict(id=aid, ley_id=law["id"], orden=1, identificador="Convocatoria · "+folio,
                       contenido=content, tipo_articulo="convocatoria", titulo_nombre=folio, capitulo_nombre=title)
        maps[aid] = dict(sourceId=SOURCE, label=article["identificador"], type="convocatoria", pageNumbers=[page],
                         anchors=anchors, contentSha256=hashlib.sha256(content.encode()).hexdigest())
        batch.append(dict(ley=law, articulos=[article]))
        audit.append(dict(folio=folio, sede=site, registro=text(nodes[-1]), pagina=page, fuente=url,
                          sha256Html=hashlib.sha256(source_html).hexdigest(), celdasCotejadas=cell_count,
                          lineas=len(anchors)))

for name, data in [("carga", batch), ("map", {"articles": maps}), ("cotejo", dict(pdf=PDF_URL, sha256=digest, avisos=audit))]:
    (ROOT / (name+".json")).write_bytes((json.dumps(data, ensure_ascii=False, indent=2)+"\n").encode())
