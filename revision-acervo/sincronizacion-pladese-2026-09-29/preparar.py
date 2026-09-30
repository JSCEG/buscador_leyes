"""Build reviewed page anchors for the loaded PLADESE using its official DOF PDF."""
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
PDF = Path(".local/pladese-sync/17102025-VES.pdf")
DATA = Path("revision-acervo/incorporacion-planeacion-2026-09-19/PLADESE-carga.json")
PDF_URL = "https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=17102025-VES.pdf&repo="
SIDOF_URL = "https://sidof.segob.gob.mx/notas/docFuente/5770297"
LAW_ID = "c30cb5dd-e944-52fd-8818-518a56b57fae"
FIRST_PAGE, LAST_PAGE = 2, 112


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


class DivExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.current = []
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        if tag == "div":
            self.depth += 1
            if self.depth == 1:
                self.current = []

    def handle_endtag(self, tag):
        if tag == "div" and self.depth:
            self.depth -= 1
            if self.depth == 0:
                self.blocks.append(" ".join(" ".join(self.current).split()))

    def handle_data(self, data):
        if self.depth:
            self.current.append(data)


def plain(value):
    parser = TextExtractor()
    parser.feed(value)
    return " ".join(" ".join(parser.parts).split())


def norm(value):
    value = unicodedata.normalize("NFKD", value).lower()
    return "".join(char for char in value if char.isalnum())


data = json.loads(DATA.read_text(encoding="utf-8"))
assert data["ley"]["id"] == LAW_ID and len(data["articulos"]) == 89
document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(document) == 134

pages = []
for page in document:
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            token = norm("".join(span["text"] for span in line["spans"]))
            if token:
                lines.append({"text": token, "bbox": line["bbox"]})
    pages.append(lines)

source_id = f"pladese-{pdf_sha[:12]}"
source = {
    "id": source_id,
    "title": "Plan de Desarrollo del Sector Eléctrico 2025–2039",
    "lawId": LAW_ID,
    "sha256": pdf_sha,
    "transport": "remote-pdf",
    "pdfUrl": f"/api/reader/{source_id}",
    "originalUrl": PDF_URL,
    "officialPublicationUrl": SIDOF_URL,
    "pageCount": len(document),
    "pages": [{"number": page.number + 1, "width": page.rect.width,
               "height": page.rect.height} for page in document],
}

mapped = {}
missing = []
deferred_notes = None
source_articles = []
last_match = (FIRST_PAGE - 1, -1)
for article in data["articulos"]:
    label = article["identificador"]
    if label.startswith("Nota editorial"):
        missing.append({"id": article["id"], "label": label,
                        "reason": "editorial-not-part-of-official-publication"})
        continue
    if label == "Notas del plan":
        deferred_notes = article
        continue
    body = norm(plain(article["contenido"]))
    match = None
    for size in (180, 130, 90, 60, 35):
        needle = body[:size]
        for page_index in range(max(FIRST_PAGE - 1, last_match[0]), LAST_PAGE):
            stream = "".join(line["text"] for line in pages[page_index])
            at = stream.find(needle)
            if at < 0:
                continue
            cursor, line_index = 0, 0
            while line_index < len(pages[page_index]) and cursor + len(pages[page_index][line_index]["text"]) <= at:
                cursor += len(pages[page_index][line_index]["text"])
                line_index += 1
            if page_index == last_match[0] and line_index <= last_match[1]:
                continue
            match = (page_index, line_index, size)
            break
        if match:
            break
    if not match:
        missing.append({"id": article["id"], "label": label,
                        "reason": "opening-text-not-found-in-official-pdf"})
        continue
    page_index, line_index, match_size = match
    source_articles.append({"article": article, "pageIndex": page_index,
                            "lineIndex": line_index, "matchSize": match_size})
    last_match = (page_index, line_index)

for index, start in enumerate(source_articles):
    article = start["article"]
    next_start = source_articles[index + 1] if index + 1 < len(source_articles) else {
        "pageIndex": LAST_PAGE - 1, "lineIndex": len(pages[LAST_PAGE - 1])}
    per_page = {}
    for page_index in range(start["pageIndex"], next_start["pageIndex"] + 1):
        first_line = start["lineIndex"] if page_index == start["pageIndex"] else 0
        stop_line = next_start["lineIndex"] if page_index == next_start["pageIndex"] else len(pages[page_index])
        visible = [line for line in pages[page_index][first_line:stop_line]
                   if line["bbox"][1] >= 60
                   and line["bbox"][3] <= document[page_index].rect.height - 32]
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

# The plan's 14 numbered notes are footnotes distributed throughout the PDF.
if deferred_notes:
    note_pages = {1: 20, 2: 20, 3: 22, 4: 36, 5: 43, 6: 43, 7: 56,
                  8: 57, 9: 58, 10: 58, 11: 58, 12: 58, 13: 65, 14: 75}
    blocks = DivExtractor()
    blocks.feed(deferred_notes["contenido"])
    anchors = []
    found_numbers = set()
    for block in blocks.blocks:
        found = re.match(r"\s*(\d+)\s+(.*)", block)
        if not found:
            continue
        number, text = int(found.group(1)), norm(found.group(2))
        if number not in note_pages:
            continue
        page_number = note_pages[number]
        needle = text[:20]
        candidates = [line for line in pages[page_number - 1]
                      if line["text"].startswith(str(number)) and needle[:12] in line["text"]]
        if not candidates:
            raise ValueError(f"footnote {number} not found on official page {page_number}")
        anchors.append({"page": page_number, "bbox": candidates[0]["bbox"]})
        found_numbers.add(number)
    if found_numbers != set(note_pages):
        raise ValueError(f"incomplete footnote coverage: {sorted(found_numbers)}")
    mapped[deferred_notes["id"]] = {
        "sourceId": source_id,
        "label": deferred_notes["identificador"],
        "type": deferred_notes["tipo_articulo"],
        "contentSha256": hashlib.sha256(deferred_notes["contenido"].encode("utf-8")).hexdigest(),
        "pageNumbers": sorted({anchor["page"] for anchor in anchors}),
        "anchors": anchors,
    }

(ROOT / "map.json").write_text(json.dumps({"source": source, "articles": mapped},
                                           ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "missing.json").write_text(json.dumps(missing, ensure_ascii=False, indent=2) + "\n",
                                   encoding="utf-8")
(ROOT / "coincidencias.json").write_text(json.dumps([
    {"id": row["article"]["id"], "label": row["article"]["identificador"],
     "page": row["pageIndex"] + 1, "line": row["lineIndex"], "prefixLength": row["matchSize"]}
    for row in source_articles
], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"pages={len(document)} sourcePages={FIRST_PAGE}-{LAST_PAGE} mapped={len(mapped)} "
      f"missing={len(missing)} anchors={sum(len(row['anchors']) for row in mapped.values())}")
for item in missing:
    print(item["label"], item["reason"])
