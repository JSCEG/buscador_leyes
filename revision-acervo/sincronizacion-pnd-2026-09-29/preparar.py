"""Map PND fragments to visible text in the official DOF evening issue PDF."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re
import sys
import unicodedata

sys.path.insert(0, ".local/lse-sync/python")
import pymupdf

ROOT = Path(__file__).resolve().parent
WORK = Path(".local/pnd-sync")
PDF = WORK / "15042025-VES.pdf"
ARTICLES = Path("revision-acervo/incorporacion-pnd-2026-09-22/PND-carga.json")
LAW_ID = "2c8c7e74-a842-5e50-8d07-2558480ee262"
PDF_URL = "https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=15042025-VES.pdf&repo="
DOF_URL = "https://sidof.segob.gob.mx/notas/docFuente/5755162"


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain(html):
    parser = TextExtractor()
    parser.feed(html)
    return " ".join(" ".join(parser.parts).split())


def norm(value):
    value = unicodedata.normalize("NFKD", value).lower()
    return "".join(char for char in value if char.isalnum())


articles = json.loads(ARTICLES.read_text(encoding="utf-8"))["articulos"]
assert len(articles) == 98 and all(row["ley_id"] == LAW_ID for row in articles)
document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
source_id = f"pnd-{pdf_sha[:12]}"

# Keep normalized text and coordinates in reading order. A fragment begins
# where its own opening text first appears after the previous fragment.
pages = []
for page in document:
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            token = norm(text)
            if token:
                lines.append({"text": token, "bbox": line["bbox"]})
    pages.append(lines)

starts = []
missing = []
last_page, last_line = 0, -1
for article in articles:
    body = plain(article["contenido"])
    normalized = norm(body)
    # Opening paragraphs are much more distinctive than the section title,
    # which can also appear in the issue's index. Shorten only as needed.
    match = None
    for size in (180, 130, 90, 60, 35):
        needle = normalized[:size]
        for page_index in range(last_page, len(pages)):
            stream = "".join(line["text"] for line in pages[page_index])
            at = stream.find(needle)
            if at < 0:
                continue
            cursor = 0
            line_index = 0
            while line_index < len(pages[page_index]) and cursor + len(pages[page_index][line_index]["text"]) <= at:
                cursor += len(pages[page_index][line_index]["text"])
                line_index += 1
            if page_index == last_page and line_index <= last_line:
                continue
            match = (page_index, line_index, size)
            break
        if match:
            break
    if not match:
        missing.append({"id": article["id"], "label": article["identificador"],
                        "reason": "opening-text-not-found-in-official-pdf"})
        continue
    page_index, line_index, matched_chars = match
    starts.append({"article": article, "pageIndex": page_index,
                   "lineIndex": line_index, "matchedChars": matched_chars})
    last_page, last_line = page_index, line_index

mapped = {}
for index, start in enumerate(starts):
    article = start["article"]
    next_start = starts[index + 1] if index + 1 < len(starts) else {
        "pageIndex": len(pages) - 1, "lineIndex": len(pages[-1])}
    per_page = {}
    for page_index in range(start["pageIndex"], next_start["pageIndex"] + 1):
        first = start["lineIndex"] if page_index == start["pageIndex"] else 0
        stop = next_start["lineIndex"] if page_index == next_start["pageIndex"] else len(pages[page_index])
        visible = [line for line in pages[page_index][first:stop]
                   if line["bbox"][1] >= 65 and line["bbox"][3] <= document[page_index].rect.height - 32]
        if visible:
            per_page[page_index + 1] = visible[:5]
    if not per_page:
        missing.append({"id": article["id"], "label": article["identificador"],
                        "reason": "no-visible-lines-in-fragment-range"})
        continue
    mapped[article["id"]] = {
        "sourceId": source_id,
        "label": article["identificador"],
        "type": article["tipo_articulo"],
        "contentSha256": hashlib.sha256(article["contenido"].encode("utf-8")).hexdigest(),
        "pageNumbers": list(per_page),
        "anchors": [{"page": number, "bbox": line["bbox"]}
                    for number, lines in per_page.items() for line in lines],
    }

# The five endnotes are printed as page footnotes in the official issue,
# interspersed through the plan, rather than as a single final section.
notes = next(article for article in articles if article["identificador"] == "Notas y referencias del plan")
footnotes = {
    75: "genericosseleccionados",
    81: "inventarionacionaldeemisiones",
    85: "hastalafechadeelaboracion",
    94: "diagnosticonacionaldearmonizacionjuridica",
    98: "hastalafechadeelaboracion",
}
note_anchors = []
for page_number, needle in footnotes.items():
    candidates = [line for line in pages[page_number - 1]
                  if line["bbox"][1] >= 680 and needle in line["text"]]
    assert candidates, f"No se encontró la nota {page_number} en el PDF oficial"
    note_anchors.append({"page": page_number, "bbox": candidates[0]["bbox"]})
mapped[notes["id"]] = {
    "sourceId": source_id,
    "label": notes["identificador"],
    "type": notes["tipo_articulo"],
    "contentSha256": hashlib.sha256(notes["contenido"].encode("utf-8")).hexdigest(),
    "pageNumbers": list(footnotes),
    "anchors": note_anchors,
}
missing = [item for item in missing if item["id"] != notes["id"]]

source = {
    "id": source_id,
    "title": "Plan Nacional de Desarrollo 2025-2030",
    "lawId": LAW_ID,
    "sha256": pdf_sha,
    "transport": "remote-pdf",
    "pdfUrl": f"/api/reader/{source_id}",
    "originalUrl": PDF_URL,
    "officialPublicationUrl": DOF_URL,
    "pageCount": len(document),
    "pages": [{"number": page.number + 1, "width": page.rect.width,
                "height": page.rect.height} for page in document],
}
(ROOT / "map.json").write_text(json.dumps({"source": source, "articles": mapped},
                                           ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "missing.json").write_text(json.dumps(missing, ensure_ascii=False, indent=2) + "\n",
                                       encoding="utf-8")
print(f"source={source_id} pages={len(document)} mapped={len(mapped)} missing={len(missing)} "
      f"anchors={sum(len(entry['anchors']) for entry in mapped.values())}")
for item in missing:
    print(item["label"], item["reason"])
