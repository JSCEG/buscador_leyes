"""Validate the prepared PND traceability map and update the reader manifest."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
WORK = Path(".local/pnd-sync")
MAP = json.loads((ROOT / "map.json").read_text(encoding="utf-8"))
MISSING = json.loads((ROOT / "missing.json").read_text(encoding="utf-8"))
ARTICLES = json.loads(Path("revision-acervo/incorporacion-pnd-2026-09-22/PND-carga.json").read_text(encoding="utf-8"))["articulos"]
PDF = WORK / "15042025-VES.pdf"
MANIFEST_PATH = Path("public/reader-sources/manifest.v1.json")
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
source = MAP["source"]

assert source["sha256"] == hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(ARTICLES) == 98 and len(MAP["articles"]) == 98 and not MISSING
current = {article["id"]: article for article in ARTICLES}
assert set(MAP["articles"]) == set(current)
existing_source = manifest["sources"].get(source["id"])
assert existing_source is None or (existing_source["sha256"] == source["sha256"]
                                    and existing_source["lawId"] == source["lawId"])
assert all(article_id not in manifest["articles"] or manifest["articles"][article_id]["sourceId"] == source["id"]
           for article_id in MAP["articles"])

for article_id, trace in MAP["articles"].items():
    article = current[article_id]
    assert trace["contentSha256"] == hashlib.sha256(article["contenido"].encode("utf-8")).hexdigest()
    assert trace["sourceId"] == source["id"] and trace["anchors"] and trace["pageNumbers"]
    assert trace["pageNumbers"] == sorted(set(trace["pageNumbers"]))
    assert all(1 <= number <= source["pageCount"] for number in trace["pageNumbers"])
    assert all(anchor["page"] in trace["pageNumbers"] for anchor in trace["anchors"])
    for anchor in trace["anchors"]:
        page = source["pages"][anchor["page"] - 1]
        x0, y0, x1, y1 = anchor["bbox"]
        assert 0 <= x0 < x1 <= page["width"] and 0 <= y0 < y1 <= page["height"]

changed = existing_source != source or any(manifest["articles"].get(article_id) != trace
                                             for article_id, trace in MAP["articles"].items())
if changed:
    manifest["sources"][source["id"]] = source
    manifest["articles"].update(MAP["articles"])
    manifest["revision"] += 1
    manifest["verifiedAt"] = datetime.now(timezone.utc).isoformat()
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Manifiesto {manifest['revision']}: {len(MAP['articles'])} fragmentos PND validados.")
