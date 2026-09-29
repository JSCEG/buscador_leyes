"""Relaciona cada fragmento vigente de PLADESHi con su encabezado en el PDF oficial del DOF."""
from datetime import date
from pathlib import Path
import hashlib
import html
import json
import re
import sys
import unicodedata

sys.path.insert(0, ".local/lse-sync/python")
import pymupdf

ROOT = Path(__file__).resolve().parent
WORK = Path(".local/pladeshi-sync")
PDF = WORK / "07092026-MAT.pdf"
ARTICLES = WORK / "articulos.json"
LAW_ID = "48e6158c-c1a3-5b6d-811d-16e85b05ab64"
PDF_URL = "https://www.dof.gob.mx/abrirPDF.php?anio=2026&archivo=07092026-MAT.pdf&repo="
DOF_URL = "https://sidof.segob.gob.mx/notas/docFuente/5798065"


def norm(value):
    value = unicodedata.normalize("NFKD", value).lower()
    return "".join(char for char in value if char.isalnum())


def target_for(article):
    label = article["identificador"]
    if label.startswith("Nota editorial"):
        return None, None, "editorial-not-part-of-official-publication"
    if label.startswith("Preámbulo"):
        return norm("ACUERDO por el que la Secretaría de Energía emite el Plan de Desarrollo del Sector Hidrocarburos"), (17, 17), None
    if label.startswith("Artículo Único"):
        return norm("ARTÍCULO ÚNICO"), (17, 17), None
    if label.startswith("Transitorio"):
        return norm("TRANSITORIO ÚNICO"), (17, 17), None
    if label.startswith("Firma"):
        return norm("Ciudad de México, a 4 de agosto de 2026"), (17, 17), None
    if label.startswith("Presentación e índices"):
        return norm("Plan de Desarrollo del Sector Hidrocarburos"), (18, 18), None
    if label.startswith("Apartado "):
        if label == "Apartado 1.1 Marco jurídico":
            return norm("1 Introducción"), (24, 24), None
        if label == "Apartado 2.1.4.1 Recursos Prospectivos":
            return norm("2.1.4 Potencial Petrolero"), (36, 36), None
        if label == "Apartado 3.1 Exploración e Incorporación de reservas":
            return norm("3 Escenarios 2025-2039"), (93, 93), None
        return norm(label.removeprefix("Apartado ")), (23, 124), None
    if label == "Referencias bibliográficas":
        return norm("5. Referencias"), (117, 117), None
    if label == "Glosario":
        return norm("Glosario"), (117, 117), None
    if label == "Siglas y acrónimos":
        return norm("Siglas y Acrónimos"), (122, 122), None
    if label == "Unidades":
        return norm("Unidades"), (123, 123), None
    if label == "Notas del plan":
        return norm("Notas"), (124, 124), None
    return norm(label), None, "unclassified-fragment-label"


articles = json.loads(ARTICLES.read_text(encoding="utf-8"))
assert len(articles) == 81 and all(row["ley_id"] == LAW_ID for row in articles)
document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
source_id = f"pladeshi-{pdf_sha[:12]}"

# Keep text order and line geometry together. The DOF PDF mixes headings, tables,
# figures and columns, so full-fragment byte matching is not a safe page locator.
lines = []
stream_parts = []
cursor = 0
for page in document:
    page_height = page.rect.height
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            token = norm(text)
            if not token:
                continue
            x0, y0, x1, y1 = line["bbox"]
            start = cursor
            cursor += len(token)
            lines.append({"page": page.number + 1, "bbox": [x0, y0, x1, y1],
                          "start": start, "end": cursor, "body": 70 <= y0 and y1 <= page_height - 35})
            stream_parts.append(token)
stream = "".join(stream_parts)

starts = []
missing = []
previous_offset = -1
for article in articles:
    target, page_range, reason = target_for(article)
    if reason:
        missing.append({"id": article["id"], "label": article["identificador"], "reason": reason})
        continue
    low, high = page_range
    candidates = []
    offset = 0
    while (offset := stream.find(target, offset)) >= 0:
        line_index = next((i for i, line in enumerate(lines) if line["start"] <= offset < line["end"]), None)
        if line_index is not None and low <= lines[line_index]["page"] <= high and offset > previous_offset:
            candidates.append((offset, line_index))
        offset += 1
    if not candidates:
        missing.append({"id": article["id"], "label": article["identificador"], "reason": "official-heading-not-found-in-expected-pages"})
        continue
    # The appendix headings Glosario and similar also appear in the index. The
    # page range restricts them to their actual appendix pages.
    selected_offset, selected_line = candidates[-1] if article["identificador"] == "Referencias bibliográficas" else candidates[0]
    starts.append({"article": article, "offset": selected_offset, "lineIndex": selected_line})
    previous_offset = selected_offset

mapped = {}
for index, start in enumerate(starts):
    article = start["article"]
    end = starts[index + 1]["lineIndex"] if index + 1 < len(starts) else len(lines)
    selected_lines = [line for line in lines[start["lineIndex"]:end]
                      if line["body"] and line["page"] <= 124]
    # Keep the visible heading anchor for every page containing this fragment.
    per_page = {}
    for line in selected_lines:
        boxes = per_page.setdefault(line["page"], [])
        # A few exact line boxes per page keep the jump legible and avoid drawing
        # thousands of highlights on a long technical plan.
        if len(boxes) < 5:
            boxes.append(line["bbox"])
    if not per_page:
        missing.append({"id": article["id"], "label": article["identificador"], "reason": "no-visible-text-lines-in-mapped-fragment"})
        continue
    page_numbers = sorted(per_page)
    anchors = [{"page": number, "bbox": bbox}
               for number, boxes in per_page.items() for bbox in boxes]
    mapped[article["id"]] = {
        "sourceId": source_id,
        "label": article["identificador"],
        "type": article["tipo_articulo"],
        "contentSha256": hashlib.sha256(article["contenido"].encode("utf-8")).hexdigest(),
        "pageNumbers": page_numbers,
        "anchors": anchors,
    }

source = {
    "id": source_id,
    "title": "Acuerdo por el que se emite el PLADESHi y Plan de Desarrollo del Sector Hidrocarburos",
    "lawId": LAW_ID,
    "sha256": pdf_sha,
    "transport": "remote-pdf",
    "pdfUrl": f"/api/reader/{source_id}",
    "originalUrl": PDF_URL,
    "officialPublicationUrl": DOF_URL,
    "pageCount": len(document),
    "pages": [{"number": page.number + 1, "width": page.rect.width, "height": page.rect.height} for page in document],
}
(ROOT / "map.json").write_text(json.dumps({"source": source, "articles": mapped}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "missing.json").write_text(json.dumps(missing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"source={source_id} pages={len(document)} mapped={len(mapped)} missing={len(missing)} anchors={sum(len(x['anchors']) for x in mapped.values())}")
for item in missing:
    print(item["label"], item["reason"])
