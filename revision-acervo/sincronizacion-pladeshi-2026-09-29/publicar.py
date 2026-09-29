"""Valida el mapa de PLADESHi y lo integra al manifiesto versionado."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
WORK = Path(".local/pladeshi-sync")
MAP = json.loads((ROOT / "map.json").read_text(encoding="utf-8"))
MISSING = json.loads((ROOT / "missing.json").read_text(encoding="utf-8"))
ARTICLES = json.loads((WORK / "articulos.json").read_text(encoding="utf-8"))
PDF = WORK / "07092026-MAT.pdf"
MANIFEST_PATH = Path("public/reader-sources/manifest.v1.json")
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
source = MAP["source"]

assert source["sha256"] == hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(ARTICLES) == 81 and len(MAP["articles"]) == 80 and len(MISSING) == 1
assert MISSING[0]["reason"] == "editorial-not-part-of-official-publication"
current = {article["id"]: article for article in ARTICLES}
assert set(MAP["articles"]).issubset(current)
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
    assert all(number in trace["pageNumbers"] for number in [anchor["page"] for anchor in trace["anchors"]])
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
print(f"Manifiesto {manifest['revision']}: {len(MAP['articles'])} fragmentos mapeados; la nota editorial conserva su fuente sin mapa.")
