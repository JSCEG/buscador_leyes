"""Map PROSENER and its approval decree to the official DOF issue PDF."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import sys
import unicodedata

sys.path.insert(0, ".local/lse-sync/python")
import pymupdf

ROOT = Path(__file__).resolve().parent
WORK = Path(".local/prosener-sync")
PDF = WORK / "22122025-MAT.pdf"
BASE = Path("revision-acervo/incorporacion-planeacion-2026-09-19")
PDF_URL = "https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=22122025-MAT.pdf&repo="
PROGRAM_ID = "ff6459a0-eaeb-51ed-a578-73de837b3de1"
DECREE_ID = "237a4ba0-c4b0-51e9-8931-d3d6433ba94a"
RANGES = {PROGRAM_ID: (6, 50), DECREE_ID: (5, 6)}


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


program = json.loads((BASE / "PROSENER-carga.json").read_text(encoding="utf-8"))
decree = json.loads((BASE / "PROSENER-DECRETO-carga.json").read_text(encoding="utf-8"))
assert program["ley"]["id"] == PROGRAM_ID and len(program["articulos"]) == 51
assert decree["ley"]["id"] == DECREE_ID and len(decree["articulos"]) == 9
document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(document) == 278

pages = []
for page in document:
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            token = norm("".join(span["text"] for span in line["spans"]))
            if token:
                lines.append({"text": token, "bbox": line["bbox"]})
    pages.append(lines)

sources = {}
mapped = {}
missing = []
deferred_notes = None
for dataset, source_key in [(decree, "decree"), (program, "program")]:
    law_id = dataset["ley"]["id"]
    first_page, last_page = RANGES[law_id]
    slug = "prosener-decreto" if source_key == "decree" else "prosener"
    source_id = f"{slug}-{pdf_sha[:12]}"
    sources[source_id] = {
        "id": source_id,
        "title": ("Decreto de aprobación del Programa Sectorial de Energía 2025-2030"
                  if source_key == "decree" else "Programa Sectorial de Energía 2025-2030"),
        "lawId": law_id,
        "sha256": pdf_sha,
        "transport": "remote-pdf",
        "pdfUrl": f"/api/reader/{source_id}",
        "originalUrl": PDF_URL,
        "officialPublicationUrl": dataset["ley"]["url_original"],
        "pageCount": len(document),
        "pages": [{"number": page.number + 1, "width": page.rect.width,
                    "height": page.rect.height} for page in document],
    }

    source_articles = []
    last_match = (first_page - 1, -1)
    for article in dataset["articulos"]:
        label = article["identificador"]
        if label.startswith("Nota editorial"):
            missing.append({"id": article["id"], "label": label,
                            "reason": "editorial-not-part-of-official-publication"})
            continue
        if law_id == PROGRAM_ID and label == "Notas del programa":
            deferred_notes = (article, source_id)
            continue
        body = norm(plain(article["contenido"]))
        match = None
        for size in (180, 130, 90, 60, 35):
            needle = body[:size]
            for page_index in range(max(first_page - 1, last_match[0]), last_page):
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
        page_index, line_index, _ = match
        source_articles.append({"article": article, "pageIndex": page_index,
                                "lineIndex": line_index})
        last_match = (page_index, line_index)

    for index, start in enumerate(source_articles):
        article = start["article"]
        next_start = source_articles[index + 1] if index + 1 < len(source_articles) else {
            "pageIndex": last_page - 1, "lineIndex": len(pages[last_page - 1])}
        per_page = {}
        for page_index in range(start["pageIndex"], next_start["pageIndex"] + 1):
            first_line = start["lineIndex"] if page_index == start["pageIndex"] else 0
            stop_line = next_start["lineIndex"] if page_index == next_start["pageIndex"] else len(pages[page_index])
            visible = [line for line in pages[page_index][first_line:stop_line]
                       if line["bbox"][1] >= 65
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

# These 21 notes are printed as footnotes on separate pages, rather than as a
# contiguous appendix. Anchor each numbered note where it appears in the DOF.
if deferred_notes:
    article, source_id = deferred_notes
    note_pages = {
        1: 9, 2: 9, 3: 9, 4: 9, 5: 11, 6: 12, 7: 14, 8: 15, 9: 18,
        10: 20, 11: 20, 12: 20, 13: 22, 14: 23, 15: 24, 16: 25,
        17: 26, 18: 27, 19: 27, 20: 27, 21: 34,
    }
    blocks = DivExtractor()
    blocks.feed(article["contenido"])
    anchors = []
    found_numbers = set()
    for block in blocks.blocks:
        import re
        found = re.match(r"\s*(\d+)\s+(.*)", block)
        if not found:
            continue
        number, text = int(found.group(1)), norm(found.group(2))
        if number not in note_pages:
            continue
        page_number = note_pages[number]
        needle = text[:22]
        candidates = [line for line in pages[page_number - 1]
                      if line["text"].startswith(str(number)) and needle[:12] in line["text"]]
        if not candidates:
            raise ValueError(f"footnote {number} not found on official page {page_number}")
        line = candidates[0]
        anchors.append({"page": page_number, "bbox": line["bbox"]})
        found_numbers.add(number)
    if found_numbers != set(note_pages):
        raise ValueError(f"incomplete footnote coverage: {sorted(found_numbers)}")
    mapped[article["id"]] = {
        "sourceId": source_id,
        "label": article["identificador"],
        "type": article["tipo_articulo"],
        "contentSha256": hashlib.sha256(article["contenido"].encode("utf-8")).hexdigest(),
        "pageNumbers": sorted({anchor["page"] for anchor in anchors}),
        "anchors": anchors,
    }

(ROOT / "map.json").write_text(json.dumps({"sources": sources, "articles": mapped},
                                           ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "missing.json").write_text(json.dumps(missing, ensure_ascii=False, indent=2) + "\n",
                                       encoding="utf-8")
print(f"pages={len(document)} sources={len(sources)} mapped={len(mapped)} missing={len(missing)} "
      f"anchors={sum(len(entry['anchors']) for entry in mapped.values())}")
for item in missing:
    print(item["label"], item["reason"])
