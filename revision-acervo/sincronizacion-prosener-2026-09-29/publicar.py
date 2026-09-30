"""Validate and add reviewed PROSENER mappings to the reader source manifest."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
BASE = Path("revision-acervo/incorporacion-planeacion-2026-09-19")
MANIFEST_PATH = Path("public/reader-sources/manifest.v1.json")
raw = MANIFEST_PATH.read_bytes().decode("utf-8")
manifest = json.loads(raw)
mapping = json.loads((ROOT / "map.json").read_text(encoding="utf-8"))
missing = json.loads((ROOT / "missing.json").read_text(encoding="utf-8"))
datasets = [
    json.loads((BASE / "PROSENER-carga.json").read_text(encoding="utf-8")),
    json.loads((BASE / "PROSENER-DECRETO-carga.json").read_text(encoding="utf-8")),
]
expected = {
    article["id"]: article
    for dataset in datasets
    for article in dataset["articulos"]
    if not article["identificador"].startswith("Nota editorial")
}
assert len(expected) == 58 and set(mapping["articles"]) == set(expected)
assert len(missing) == 2 and all("Nota editorial" in row["label"] for row in missing)

for source in mapping["sources"].values():
    assert source["pageCount"] == 278
    assert source["sha256"] == "8718317c5f2fd17c881067bc428b66cb2d1a5dd21ae17052a62937b0ce511196"
for article_id, entry in mapping["articles"].items():
    article = expected[article_id]
    assert entry["contentSha256"] == hashlib.sha256(article["contenido"].encode()).hexdigest()
    assert entry["type"] == article["tipo_articulo"]
    assert entry["sourceId"] in mapping["sources"] and entry["anchors"]
    for anchor in entry["anchors"]:
        x0, y0, x1, y1 = anchor["bbox"]
        assert anchor["page"] in entry["pageNumbers"]
        assert 0 <= x0 < x1 <= 612 and 0 <= y0 < y1 <= 792

new_sources = {}
for source_id, source in mapping["sources"].items():
    current = manifest["sources"].get(source_id)
    assert current is None or current == source, f"conflicting source: {source_id}"
    if current is None:
        new_sources[source_id] = source
new_articles = {}
for article_id, article in mapping["articles"].items():
    current = manifest["articles"].get(article_id)
    assert current is None or current == article, f"conflicting article mapping: {article_id}"
    if current is None:
        new_articles[article_id] = article

if new_sources or new_articles:
    newline = "\r\n" if "\r\n" in raw else "\n"
    marker = raw.index('  "articles":')
    source_close = raw.rfind("  },", 0, marker)
    assert source_close >= 0
    source_json = json.dumps(new_sources, ensure_ascii=False, indent=2)
    source_json = newline.join("  " + line for line in source_json.splitlines()[1:-1])
    raw = raw[:source_close] + "," + newline + source_json + newline + raw[source_close:]

    import re
    articles_close = [match.start() for match in re.finditer(r"\r?\n  }\r?\n}", raw)][-1]
    assert articles_close >= 0
    article_json = json.dumps(new_articles, ensure_ascii=False, indent=2)
    article_json = newline.join("  " + line for line in article_json.splitlines()[1:-1])
    raw = raw[:articles_close] + "," + newline + article_json + raw[articles_close:]

    manifest["revision"] += 1
    raw = raw.replace(f'"revision": {manifest["revision"] - 1}', f'"revision": {manifest["revision"]}', 1)
    raw = __import__("re").sub(
        r'("verifiedAt":\s*)"[^"]+"',
        lambda match: match.group(1) + json.dumps(datetime.now(timezone.utc).isoformat()),
        raw, count=1,
    )
    MANIFEST_PATH.write_bytes(raw.encode("utf-8"))
print(f"manifest revision {manifest['revision']}; 58 official fragments mapped; 2 editorials excluded")
