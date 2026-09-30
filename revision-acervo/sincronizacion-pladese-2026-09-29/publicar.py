"""Validate and add reviewed PLADESE page mappings to the reader manifest."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
DATA_PATH = Path("revision-acervo/incorporacion-planeacion-2026-09-19/PLADESE-carga.json")
MANIFEST_PATH = Path("public/reader-sources/manifest.v1.json")
mapping = json.loads((ROOT / "map.json").read_text(encoding="utf-8"))
missing = json.loads((ROOT / "missing.json").read_text(encoding="utf-8"))
data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
raw = MANIFEST_PATH.read_bytes().decode("utf-8")
manifest = json.loads(raw)
source = mapping["source"]
assert data["ley"]["id"] == source["lawId"]
assert source["sha256"] == "82f15ac85c7de97078a578dd5e5ac6ef2c5025d6f7af9d1a9a398a5a58b56787"
assert source["pageCount"] == 134 and source["originalUrl"].endswith("17102025-VES.pdf&repo=")
expected = {article["id"]: article for article in data["articulos"]
            if not article["identificador"].startswith("Nota editorial")}
assert len(expected) == 88 and set(mapping["articles"]) == set(expected)
assert len(missing) == 1 and missing[0]["label"].startswith("Nota editorial")

for article_id, entry in mapping["articles"].items():
    article = expected[article_id]
    assert entry["sourceId"] == source["id"] and entry["type"] == article["tipo_articulo"]
    assert entry["contentSha256"] == hashlib.sha256(article["contenido"].encode()).hexdigest()
    assert entry["anchors"] and entry["pageNumbers"] == sorted(set(entry["pageNumbers"]))
    assert all(2 <= page <= 112 for page in entry["pageNumbers"])
    for anchor in entry["anchors"]:
        x0, y0, x1, y1 = anchor["bbox"]
        assert anchor["page"] in entry["pageNumbers"]
        assert 0 <= x0 < x1 <= 612 and 0 <= y0 < y1 <= 792
notes = next(article for article in data["articulos"] if article["identificador"] == "Notas del plan")
assert mapping["articles"][notes["id"]]["pageNumbers"] == [20, 22, 36, 43, 56, 57, 58, 65, 75]

new_articles = {}
current_source = manifest["sources"].get(source["id"])
assert current_source is None or current_source == source
current_map_source_articles = {
    key: value for key, value in manifest["articles"].items()
    if value.get("sourceId") == source["id"]
}
assert not current_map_source_articles or current_map_source_articles == mapping["articles"]
for article_id, article in mapping["articles"].items():
    current = manifest["articles"].get(article_id)
    assert current is None or current == article, f"conflicting mapping: {article_id}"
    if current is None:
        new_articles[article_id] = article
new_sources = {} if current_source else {source["id"]: source}

if new_sources or new_articles:
    newline = "\r\n" if "\r\n" in raw else "\n"
    marker = raw.index('  "articles":')
    source_close = raw.rfind("  },", 0, marker)
    assert source_close >= 0
    source_json = json.dumps(new_sources, ensure_ascii=False, indent=2)
    source_json = newline.join("  " + line for line in source_json.splitlines()[1:-1])
    raw = raw[:source_close] + "," + newline + source_json + newline + raw[source_close:]

    article_close = [match.start() for match in re.finditer(r"\r?\n  }\r?\n}", raw)][-1]
    article_json = json.dumps(new_articles, ensure_ascii=False, indent=2)
    article_json = newline.join("  " + line for line in article_json.splitlines()[1:-1])
    raw = raw[:article_close] + "," + newline + article_json + raw[article_close:]

    revision = manifest["revision"] + 1
    raw = raw.replace(f'"revision": {manifest["revision"]}', f'"revision": {revision}', 1)
    raw = re.sub(r'("verifiedAt":\s*)"[^"]+"',
                 lambda match: match.group(1) + json.dumps(datetime.now(timezone.utc).isoformat()),
                 raw, count=1)
    MANIFEST_PATH.write_bytes(raw.encode("utf-8"))
else:
    revision = manifest["revision"]

print(f"manifest revision {revision}; 88 PLADESE fragments mapped; 1 editorial note excluded")
