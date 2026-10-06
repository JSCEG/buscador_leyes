"""Prepare and validate the CNI Energy Agreement package and PDF page map."""
import hashlib
import html
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PDF = Path(os.environ.get("CNI_2024_PDF", str(Path(os.getenv("TEMP", "/tmp")) / "buscador-cni-2024" / "dof-2024-04-08.pdf")))
MANIFEST = ROOT.parents[1] / "public" / "reader-sources" / "manifest.v1.json"
EXPECTED_SHA256 = "fd0f00ae1f140ae00bca0e33184f51904b2522221f7d27e82219a9b952c942e8"
SOURCE_ID = "dof-matutina-2024-04-08-fd0f00ae1f14"
LAW_ID = "6140ced6-da1b-5e8f-9124-9db9a94bb4c5"

sys.path.insert(0, str(ROOT.parents[1] / ".local" / "lse-sync" / "python"))
import pymupdf


def normalize(value):
    value = unicodedata.normalize("NFKD", value).lower().replace("\u00ad", "")
    return "".join(char for char in value if char.isalnum())


def plain(value):
    value = re.sub(r"<!--.*?-->", " ", value, flags=re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    return html.unescape(value)


def sql_string(value):
    return "'" + value.replace("'", "''") + "'"


data = json.loads((ROOT / "CNI-ENERGIA-2024-carga.json").read_text(encoding="utf-8"))
assert data["ley"]["id"] == LAW_ID
assert len(data["articulos"]) == 4
assert "<table>" in data["articulos"][1]["contenido"]
assert data["articulos"][1]["contenido"].count("<tr>") == 3
assert "Indicador clave" in data["articulos"][1]["contenido"]

pdf_bytes = PDF.read_bytes()
sha = hashlib.sha256(pdf_bytes).hexdigest()
assert sha == EXPECTED_SHA256, f"La edición oficial cambió: {sha}"
document = pymupdf.open(PDF)
assert len(document) == 202

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
existing_source = manifest["sources"][SOURCE_ID]
assert existing_source["sha256"] == EXPECTED_SHA256
assert existing_source["pageCount"] == len(document)
source = dict(existing_source)
source["instrumentIds"] = list(dict.fromkeys([*source["instrumentIds"], LAW_ID]))

# The source agreement begins on PDF page 146 and the complete operative text
# and signature end on PDF page 147. Retain line-level PDF geometry for the map.
stream_parts, line_spans = [], []
offset = 0
for page_number in (146, 147):
    page = document[page_number - 1]
    line_id = 0
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            token = normalize(text)
            if not token:
                continue
            start = offset
            stream_parts.append(token)
            offset += len(token)
            line_spans.append({"page": page_number, "lineId": line_id, "start": start,
                               "end": offset, "bbox": list(line["bbox"])})
            line_id += 1
stream = "".join(stream_parts)

starts = []
cursor = 0
for article in data["articulos"]:
    marker = normalize(plain(article["contenido"]))[:160]
    position = -1
    matched = 0
    for length in (160, 120, 90, 70, 55, 40):
        if len(marker) < length:
            continue
        position = stream.find(marker[:length], cursor)
        if position >= 0:
            matched = length
            break
    assert position >= 0, f"No se localizó en orden: {article['identificador']}"
    starts.append({"position": position, "article": article, "marker": marker[:matched]})
    cursor = position + min(matched, 40)

mapped, audit = {}, []
for index, row in enumerate(starts):
    article = row["article"]
    start = row["position"]
    next_start = starts[index + 1]["position"] if index + 1 < len(starts) else len(stream)
    tail = normalize(plain(article["contenido"]))[-120:]
    end = -1
    for length in (120, 100, 80, 60, 45, 35):
        if len(tail) < length:
            continue
        found = stream.rfind(tail[-length:], start, next_start)
        if found >= 0:
            end = found + length
            break
    assert end > start, f"No se localizó el cierre oficial: {article['identificador']}"
    anchors = [{"page": line["page"], "lineId": line["lineId"], "bbox": line["bbox"]}
               for line in line_spans if line["start"] < end and line["end"] > start]
    assert anchors, f"Fragmento sin anclas: {article['identificador']}"
    pages = sorted({anchor["page"] for anchor in anchors})
    mapped[article["id"]] = {
        "sourceId": SOURCE_ID,
        "label": article["identificador"],
        "type": article["tipo_articulo"],
        "contentSha256": hashlib.sha256(article["contenido"].encode("utf-8")).hexdigest(),
        "pageNumbers": pages,
        "anchors": anchors,
    }
    audit.append({"id": article["id"], "fragmento": article["identificador"],
                  "paginasPdf": pages, "paginasImpresas": pages,
                  "anclas": len(anchors), "prefijoCotejado": row["marker"]})
    assert set(pages) <= {146, 147}

(ROOT / "source.json").write_text(json.dumps(source, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "map.json").write_text(json.dumps({"source": source, "articles": mapped}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "cotejo.json").write_text(json.dumps({
    "instrumento": "CNI-ENERGIA-2024",
    "instrumentId": LAW_ID,
    "fuenteInstrumento": data["ley"]["url_original"],
    "fuenteEdicion": source["originalUrl"],
    "archivoTemporal": str(PDF),
    "sha256": sha,
    "bytes": len(pdf_bytes),
    "paginasPdf": len(document),
    "paginasImpresasDelAcuerdo": [146, 147],
    "fragmentosOficiales": len(mapped),
    "anclasGeometricas": sum(len(item["anchors"]) for item in mapped.values()),
    "tablasPreservadas": 1,
    "filasDeDatosEnTabla": 2,
    "fragmentos": audit,
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

law = data["ley"]
topics = ", ".join(sql_string(topic) for topic in law["temas_clave"])
sql = [
    "begin;",
    "insert into public.leyes (id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo)",
    f"values ({sql_string(law['id'])}::uuid,{sql_string(law['titulo'])},{sql_string(law['siglas'])},{sql_string(law['fecha_publicacion'])}::date,null,true,array[{topics}],{sql_string(law['url_original'])},{sql_string(law['tipo'])})",
    "on conflict (id) do update set titulo=excluded.titulo,siglas=excluded.siglas,fecha_publicacion=excluded.fecha_publicacion,fecha_ultima_reforma=excluded.fecha_ultima_reforma,vigente=excluded.vigente,temas_clave=excluded.temas_clave,url_original=excluded.url_original,tipo=excluded.tipo;",
    "insert into public.articulos (id,ley_id,identificador,contenido,tipo_articulo,orden,titulo_nombre,capitulo_nombre,seccion_nombre) values",
]
rows = []
for article in data["articulos"]:
    vals = [sql_string(article["id"]) + "::uuid", sql_string(law["id"]) + "::uuid",
            sql_string(article["identificador"]), sql_string(article["contenido"]),
            sql_string(article["tipo_articulo"]), str(article["orden"]),
            sql_string(article["titulo_nombre"]) if article["titulo_nombre"] else "null",
            "null", "null"]
    rows.append("(" + ",".join(vals) + ")")
sql.append(",\n".join(rows))
sql.append("on conflict (id) do update set ley_id=excluded.ley_id,identificador=excluded.identificador,contenido=excluded.contenido,tipo_articulo=excluded.tipo_articulo,orden=excluded.orden,titulo_nombre=excluded.titulo_nombre,capitulo_nombre=excluded.capitulo_nombre,seccion_nombre=excluded.seccion_nombre;")
sql.append("commit;")
(ROOT / "aplicar.sql").write_text("\n".join(sql) + "\n", encoding="utf-8")

print(f"Preparado {len(mapped)} fragmentos; tabla íntegra (2 filas de indicadores); PDF {len(document)} páginas, SHA-256 {sha}; páginas 146–147; {sum(len(x['anchors']) for x in mapped.values())} anclas.")
