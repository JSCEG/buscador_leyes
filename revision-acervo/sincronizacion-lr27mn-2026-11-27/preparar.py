"""Genera el mapa con el PDF oficial y las filas de artículos exportadas de Supabase."""
import hashlib
import json
import sys
from pathlib import Path

import pymupdf


LAW_ID = "c4211492-f47a-4d37-8b23-1d8354e782c8"
PDF_URL = "https://www.diputados.gob.mx/LeyesBiblio/pdf/207.pdf"
PDF_SHA = "547158ef75d8c668bfe91b1f6673f265d17dd89d807b9cbba3b37a1313835ce8"
SOURCE_ID = "lr27mn-" + PDF_SHA[:12]
folder = Path(__file__).resolve().parent
pdf, snapshot = map(Path, sys.argv[1:])
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == PDF_SHA
rows = json.loads(snapshot.read_bytes())
assert len(rows) == len({row["id"] for row in rows}) == 61
assert all(row["ley_id"] == LAW_ID for row in rows)
assert sum(row["tipo_articulo"] == "ordinario" for row in rows) == 52
assert sum(row["tipo_articulo"] == "transitorio" for row in rows) == 9


def compact(text):
    return "".join(text.split())


with pymupdf.open(pdf) as document:
    pages = []
    lines = []
    stream = ""
    for page in document:
        number = page.number + 1
        pages.append(dict(number=number, width=page.rect.width, height=page.rect.height))
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                bbox = line["bbox"]
                # En esta edición el membrete y el folio quedan fuera del cuerpo.
                if not 100 < bbox[1] < 740:
                    continue
                text = compact("".join(span["text"] for span in line["spans"]))
                if text:
                    start = len(stream)
                    stream += text
                    lines.append((start, len(stream), dict(page=number, bbox=bbox)))

mapped = {}
for row in rows:
    content = row["contenido"]
    body = compact(content)
    start = stream.find(body)
    assert body and start >= 0 and stream.find(body, start + 1) < 0, row["identificador"]
    end = start + len(body)
    selected = [(a, b, anchor) for a, b, anchor in lines if a < end and start < b]
    assert selected[0][0] == start and selected[-1][1] == end, row["identificador"]
    anchors = [anchor for _, _, anchor in selected]
    mapped[row["id"]] = dict(sourceId=SOURCE_ID, label=row["identificador"],
                             type=row["tipo_articulo"], pageNumbers=sorted({a["page"] for a in anchors}),
                             contentSha256=hashlib.sha256(content.encode("utf-8")).hexdigest(),
                             anchors=anchors)

source = dict(id=SOURCE_ID, title="Ley Reglamentaria del Artículo 27 Constitucional en Materia Nuclear",
              instrumentIds=[LAW_ID], sha256=PDF_SHA, transport="remote-pdf",
              pdfUrl="/api/reader/" + SOURCE_ID, originalUrl=PDF_URL, pageCount=len(pages), pages=pages)
mapping = dict(sources={SOURCE_ID: source}, articles=mapped)
(folder / "map.json").write_text(json.dumps(mapping, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
