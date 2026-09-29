"""Coteja los fragmentos de LGEC con el PDF vigente oficial de Diputados."""
from pathlib import Path
import hashlib
import json
import re
import sys

sys.path.insert(0, ".local/lse-sync/python")
import pymupdf

ROOT = Path(__file__).resolve().parent
PDF = Path(".local/lgec-sync/LGEC.pdf")
LAW_ID = "552fdbe9-91d1-4c6b-b1d2-4de35ad51f0c"
PDF_URL = "https://www.diputados.gob.mx/LeyesBiblio/pdf/LGEC.pdf"
DOF_URL = "https://sidof.segob.gob.mx/notas/docFuente/5778439"

def compact(value):
    return "".join(value.split())

document = pymupdf.open(PDF)
articles = json.loads((Path(".local/lgec-sync") / "articulos.json").read_text(encoding="utf-8"))
assert len(articles) == 58
assert all(item["ley_id"] == LAW_ID for item in articles)

lines = []
stream = ""
for page in document:
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            x0, y0, x1, y1 = line["bbox"]
            key = compact(text).upper()
            # El PDF imprime folios y el título corrido fuera del cuerpo normativo.
            if y0 < 100 or y0 > 740 or key == "LEYGENERALDEECONOM\uFFFDA CIRCULAR".replace(" ", ""):
                continue
            normalized = compact(text)
            if not normalized:
                continue
            start = len(stream)
            stream += normalized
            lines.append({"page": page.number + 1, "bbox": [x0, y0, x1, y1], "start": start, "end": len(stream)})

pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
source_id = f"lgec-{pdf_sha[:12]}"
mapped = {}
missing = []
for item in articles:
    body = compact(item["contenido"])
    position = stream.find(body)
    if not body or position < 0 or stream.find(body, position + 1) >= 0:
        missing.append({"id": item["id"], "label": item["identificador"], "reason": "fragment-not-found-uniquely-in-current-law-pdf"})
        continue
    anchors = [
        {"page": line["page"], "bbox": line["bbox"]}
        for line in lines if line["start"] < position + len(body) and line["end"] > position
    ]
    pages = sorted({anchor["page"] for anchor in anchors})
    mapped[item["id"]] = {
        "sourceId": source_id,
        "label": item["identificador"],
        "type": item["tipo_articulo"],
        "contentSha256": hashlib.sha256(item["contenido"].encode("utf-8")).hexdigest(),
        "pageNumbers": pages,
        "anchors": anchors,
    }

source = {
    "id": source_id,
    "title": "Ley General de Economía Circular",
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
print(f"mapped={len(mapped)} missing={len(missing)} pages={len(document)} source={source_id}")
for item in missing:
    print(item["label"], item["reason"])
