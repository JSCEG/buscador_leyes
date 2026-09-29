"""Integra el mapa cotejado de LGEC al manifiesto versionado del lector."""
from pathlib import Path
import hashlib
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
MAP_PATH = ROOT / "map.json"
ARTICLES_PATH = Path(".local/lgec-sync/articulos.json")
PDF_PATH = Path(".local/lgec-sync/LGEC.pdf")
MANIFEST_PATH = Path("public/reader-sources/manifest.v1.json")

mapping = json.loads(MAP_PATH.read_text(encoding="utf-8"))
database_articles = json.loads(ARTICLES_PATH.read_text(encoding="utf-8"))
missing = json.loads((ROOT / "missing.json").read_text(encoding="utf-8"))
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
source = mapping["source"]

assert source["id"] not in manifest["sources"]
assert source["sha256"] == hashlib.sha256(PDF_PATH.read_bytes()).hexdigest()
assert len(database_articles) == 58
assert len(mapping["articles"]) == 57
assert len(missing) == 1 and missing[0]["label"].startswith("Pre") and missing[0]["label"].endswith("mbulo")
assert not (set(mapping["articles"]) & set(manifest["articles"]))
current = {article["id"]: article for article in database_articles}
assert set(mapping["articles"]).issubset(current)
for article_id, trace in mapping["articles"].items():
    assert trace["contentSha256"] == hashlib.sha256(current[article_id]["contenido"].encode("utf-8")).hexdigest()
    assert trace["sourceId"] == source["id"] and trace["anchors"] and trace["pageNumbers"]
    assert all(1 <= number <= source["pageCount"] for number in trace["pageNumbers"])
    for anchor in trace["anchors"]:
        page = source["pages"][anchor["page"] - 1]
        x0, y0, x1, y1 = anchor["bbox"]
        assert 0 <= x0 < x1 <= page["width"] and 0 <= y0 < y1 <= page["height"]

manifest["sources"][source["id"]] = source
manifest["articles"].update(mapping["articles"])
manifest["revision"] += 1
manifest["verifiedAt"] = datetime.now(timezone.utc).isoformat()
MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Manifiesto {manifest['revision']}: fuente {source['id']}, {len(mapping['articles'])} fragmentos publicados; preámbulo conserva fuente oficial sin mapa.")
