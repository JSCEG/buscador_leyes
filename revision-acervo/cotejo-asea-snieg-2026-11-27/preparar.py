"""Coteja cinco fragmentos con las líneas completas de los PDF oficiales.

Argumentos: carpeta con asea.pdf y snieg.pdf, JSON de filas actuales de Supabase.
"""
import hashlib
import json
import sys
from pathlib import Path

import pymupdf
from bs4 import BeautifulSoup


HERE = Path(__file__).resolve().parent
ARCHIVE = HERE.parent
pdf_dir, snapshot = map(Path, sys.argv[1:])
rows = {r["id"]: r for r in json.loads(snapshot.read_bytes())}
asea46 = "41b2fa38-fce1-5930-8162-2dcd84145e44"
asea51 = "000a3eec-1230-53f6-8c9a-9abc99e81d1f"
preamble = "0d632032-ea82-560a-87f8-d34c89e50852"
indicators = "14c4d1b6-207b-5444-adc3-ef804be67395"
transitory = "c1ad6c39-ed03-51b3-9c16-f3a8c92698b2"
ids = [asea46, asea51, preamble, indicators, transitory]
assert set(rows) == set(ids)
def sha(value):
    return hashlib.sha256(value).hexdigest()


def plain(html):
    tree = BeautifulSoup(html, "html.parser")
    # get_text omite los marcadores que el navegador genera para una lista.
    for ordered in tree.select('ol[type="I"]'):
        items = ordered.find_all("li", recursive=False)
        assert len(items) == 3
        for numeral, item in zip(("I.", "II.", "III."), items):
            item.insert(0, numeral)
    return "".join(tree.get_text().split())


entries = {}
audit = []
sql = ["BEGIN;", "DO $repair$", "DECLARE n integer;", "BEGIN"]
for file, package, group in [
    ("asea.pdf", "incorporacion-nom-em-009-asea-2026-10-05", ids[:2]),
    ("snieg.pdf", "incorporacion-acuerdo-cni-energia-2024-2026-10-06", ids[2:]),
]:
    original = json.loads((ARCHIVE / package / "map.json").read_bytes())
    source = json.loads((ARCHIVE / package / "source.json").read_bytes()) if file == "snieg.pdf" else original["source"]
    path = pdf_dir / file
    assert sha(path.read_bytes()) == source["sha256"]
    with pymupdf.open(path) as pdf:
        for id in group:
            entry = original["articles"][id].copy()
            content = rows[id]["contenido"]
            expected = content
            if id == asea46:
                entry["anchors"] = entry["anchors"][:-2]
            elif id == asea51:
                entry["anchors"] = original["articles"][asea46]["anchors"][-2:] + entry["anchors"]
            else:
                assert "\r\n" in content, "Se requiere la exportación anterior a la corrección"
                expected = content.replace("\r\n", "\n")
                # El PDF enumera las tres fracciones con números romanos.
                expected = expected.replace("<ol>", '<ol type="I">') if id == preamble else expected
                if id == transitory:
                    expected = expected.replace("<div>TRANSITORIO</div>", "<div>Transitorio.</div>").replace("fracción IV del artículo 46", "fracción IV, del artículo 46")

            highlighted = []
            for page in entry["pageNumbers"]:
                lines = {tuple(line["bbox"]): "".join(s["text"] for s in line["spans"])
                         for block in pdf[page-1].get_text("dict")["blocks"] for line in block.get("lines", [])}
                highlighted.extend(lines[tuple(anchor["bbox"])] for anchor in entry["anchors"] if anchor["page"] == page)
            assert plain(expected) == "".join("".join(highlighted).split()), rows[id]["identificador"]
            digest = sha(expected.encode())
            entry["contentSha256"] = digest
            entries[id] = entry
            audit.append(dict(id=id, apartado=entry["label"], pdf=source["originalUrl"], sha256Pdf=source["sha256"],
                              paginas=entry["pageNumbers"], lineas=len(highlighted), sha256Texto=digest))
            if content != expected:
                assert "$text$" not in expected
                sql.extend([
                    f"  UPDATE public.articulos SET contenido = $text${expected}$text$",
                    f"  WHERE id = '{id}' AND ley_id = '{rows[id]['ley_id']}'",
                    f"    AND encode(sha256(convert_to(contenido, 'UTF8')), 'hex') = '{sha(content.encode())}';",
                    "  GET DIAGNOSTICS n = ROW_COUNT;",
                    f"  IF n <> 1 THEN RAISE EXCEPTION 'El fragmento {id} cambió'; END IF;",
                ])

sql.extend(["END;", "$repair$;", "COMMIT;"])
for name, value in [("map.json", {"articles": entries}), ("cotejo.json", audit)]:
    (HERE / name).write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode())
(HERE / "aplicar.sql").write_bytes(("\n".join(sql) + "\n").encode())
