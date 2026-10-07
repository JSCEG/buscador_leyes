"""Prepare a verified consolidated LSNIEG load and page map."""
import hashlib, html, json, re, sys, unicodedata, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PDF = Path.home() / "AppData/Local/Temp/LSNIEG-oficial.pdf"
TEXT = Path.home() / "AppData/Local/Temp/LSNIEG-oficial.txt"
URL = "https://www.diputados.gob.mx/LeyesBiblio/pdf/LSNIEG.pdf"
TITLE = "Ley del Sistema Nacional de Información Estadística y Geográfica"
LAW_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, URL))
SOURCE_ID = "diputados-lsnieg-2025-11-14-" + hashlib.sha256(PDF.read_bytes()).hexdigest()[:12]
sys.path.insert(0, str(ROOT.parents[1] / ".local" / "lse-sync" / "python"))
import pymupdf

def norm(s):
    s = unicodedata.normalize("NFKD", html.unescape(re.sub(r"<[^>]+>", " ", s))).lower().replace("\u00ad", "")
    return "".join(c for c in s if c.isalnum())

def sqlq(s): return "'" + s.replace("'", "''") + "'"
def uid(key): return str(uuid.uuid5(uuid.NAMESPACE_URL, URL + "#" + key))
def to_html(raw):
    # Keep paragraph breaks from the official PDF text while joining line wraps.
    groups = re.split(r"\n\s*\n+", raw.strip())
    out=[]
    for group in groups:
        lines=[]
        for line in group.splitlines():
            line=re.sub(r"\s+", " ", line).strip()
            if not line or re.match(r"^(?:\d+\s+de\s+67|LEY DEL SISTEMA NACIONAL|CÁMARA DE DIPUTADOS|Secretaría General|Secretaría de Servicios Parlamentarios|TEXTO VIGENTE|Última Reforma DOF)\b", line, re.I):
                continue
            if re.match(r"^(?:TÍTULO|TITULO|CAPÍTULO|CAPITULO)\s+(?:[IVX]+|[0-9]+)\b", line, re.I):
                continue
            lines.append(line)
        text=" ".join(lines).strip()
        if text: out.append("<p>"+html.escape(text)+"</p>")
    return "".join(out)

raw=TEXT.read_text(encoding="utf-8")
article_re=re.compile(r"(?im)^\s*ART[IÍ]CULO\s+(\d+)\s*[-–.]\s*")
matches=list(article_re.finditer(raw))
numbers=[int(m.group(1)) for m in matches]
assert numbers == list(range(1,127)), f"Expected Articles 1–126, got {numbers[:4]}…{numbers[-4:]} ({len(numbers)})"
trans_matches=list(re.finditer(r"(?im)^\s*TRANSITORIOS?\s*$",raw))
assert len(trans_matches)>=2, "Could not distinguish original-law transitories from amendment appendices."
first_trans=next(m for m in trans_matches if m.start()>matches[-1].start())
next_trans=next(m for m in trans_matches if m.start()>first_trans.end())
assert next_trans.start()-first_trans.start()<20000, "Unexpected boundary after original-law transitories."

articles=[]
for i,m in enumerate(matches):
    stop=matches[i+1].start() if i+1<len(matches) else first_trans.start()
    body=raw[m.start():stop]
    # Remove repeated page furniture and standalone hierarchy headings; the article
    # number and clauses remain sourced verbatim from the current consolidated text.
    body=re.sub(r"(?m)^\s*\d+\s+de\s+67\s*$", "", body)
    content=to_html(body)
    assert norm(content).startswith("articulo"+str(i+1)), (i+1,content[:120])
    articles.append({"id":uid(f"articulo-{i+1}"),"orden":i+1,"identificador":f"Artículo {i+1}",
      "tipo_articulo":"ordinario","titulo_nombre":"Ley del Sistema Nacional de Información Estadística y Geográfica",
      "capitulo_nombre":None,"seccion_nombre":None,"contenido":content})

# Keep the law's original transitional provisions as a distinct section. The
# consolidated PDF also appends many transitory provisions from reform decrees;
# those are not silently represented as part of the current statute.
trans=raw[first_trans.end():next_trans.start()]
trans=re.sub(r"(?m)^\s*\d+\s+de\s+67\s*$", "", trans)
ordinal=r"(?:D[EÉ]CIMO\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO)|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO)"
trans_rows=list(re.finditer(rf"(?im)^\s*({ordinal})\s*[-.]\s*",trans))
assert len(trans_rows)==17, f"Expected 17 original transitory provisions, found {len(trans_rows)}"
for i,m in enumerate(trans_rows):
    stop=trans_rows[i+1].start() if i+1<len(trans_rows) else len(trans)
    body=trans[m.start():stop]
    if i==len(trans_rows)-1:
        body=re.split(r"(?im)^\s*(?:M[eé]xico,\s*D\.?F\.?|Ciudad de M[eé]xico),\s+a\s+\d",body,maxsplit=1)[0]
    content=to_html(body)
    label=re.sub(r"\s+"," ",m.group(1).title())
    item_id=uid("transitorios-originales") if i==0 else uid(f"transitorio-{i+1}")
    articles.append({"id":item_id,"orden":127+i,"identificador":f"Transitorio {label}",
      "tipo_articulo":"transitorio","titulo_nombre":"Transitorios","capitulo_nombre":None,
      "seccion_nombre":"Ley publicada el 16 de abril de 2008","contenido":content})

law={"id":LAW_ID,"titulo":TITLE,"siglas":"LSNIEG","fecha_publicacion":"2008-04-16",
 "fecha_ultima_reforma":"2025-11-14","vigente":True,
 "temas_clave":["SNIEG","INEGI","Información Estadística","Información Geográfica","Información de Interés Nacional","Sector Energético"],
 "url_original":URL,"tipo":"ley"}
data={"ley":law,"articulos":articles,"nota":"Texto vigente consolidado de Cámara de Diputados, última reforma DOF 14-11-2025. Los transitorios de decretos reformadores que el PDF compila en apéndices no se presentan como parte de la ley; sólo se incorpora el transitorio original."}
doc=pymupdf.open(PDF)
stream=[]; spans=[]; offset=0
for pno,page in enumerate(doc,1):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines",[]):
            value="".join(s["text"] for s in line["spans"])
            token=norm(value)
            if not token: continue
            start=offset; stream.append(token); offset+=len(token)
            spans.append({"page":pno,"bbox":[round(float(v),3) for v in line["bbox"]],"start":start,"end":offset})
stream="".join(stream)
mapped={}; audits=[]; cursor=0; starts=[]
for a in articles:
    plain=html.unescape(re.sub(r"<[^>]+>"," ",a["contenido"]))
    needle=norm(plain)
    start=-1; matched=0
    for length in (180,140,100,75,50,35,24):
        if len(needle)>=length:
            start=stream.find(needle[:length],cursor)
            if start>=0: matched=length; break
    assert start>=0, f"Unmapped start {a['identificador']}"
    starts.append((start,needle,matched,a))
    cursor=start+matched
for index,(start,needle,matched,a) in enumerate(starts):
    end=starts[index+1][0] if index+1<len(starts) else -1
    if end<0:
        # The original-law transitory section ends at the first amendment's
        # separate transitory section, not at the end of the consolidated PDF.
        marker=stream.find("transitorios",start+matched)
        end=stream.find("transitorios",marker+12) if marker>=0 else -1
    assert end>start, f"Unmapped end {a['identificador']}"
    anchors=[{"page":s["page"],"bbox":s["bbox"]} for s in spans if s["start"]<end and s["end"]>start]
    pages=sorted({x["page"] for x in anchors})
    assert anchors and pages
    entry={"sourceId":SOURCE_ID,"label":a["identificador"],"type":a["tipo_articulo"],
      "contentSha256":hashlib.sha256(a["contenido"].encode()).hexdigest(),"pageNumbers":pages,"anchors":anchors}
    mapped[a["id"]]=entry
    audits.append({"id":a["id"],"fragmento":a["identificador"],"paginasPdf":pages,"anclas":len(anchors),"prefijoCotejado":needle[:matched],"tokensTexto":len(needle)})

pdf=PDF.read_bytes(); sha=hashlib.sha256(pdf).hexdigest()
source={"id":SOURCE_ID,"title":"Texto vigente de la Ley del SNIEG · Diputados · última reforma 14 de noviembre de 2025",
 "instrumentIds":[LAW_ID],"sha256":sha,"transport":"remote-pdf","pdfUrl":"/api/reader/"+SOURCE_ID,
 "originalUrl":URL,"pageCount":len(doc),"pages":[{"number":n,"width":612,"height":792} for n in range(1,len(doc)+1)]}
manifest_path=ROOT.parents[1]/"public/reader-sources/manifest.v1.json"
manifest=json.loads(manifest_path.read_text(encoding="utf-8"))
assert SOURCE_ID not in manifest["sources"] and not any(k in manifest["articles"] for k in mapped)
assert all(max(a["paginasPdf"])<=len(doc) for a in audits)
out={"ley":law,"articulos":articles,"source":source,"mapa":{"articles":mapped},"auditoria":{"sha256":sha,"bytes":len(pdf),"paginas":len(doc),"fragmentos":audits}}
(ROOT/"LSNIEG-carga.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"source.json").write_text(json.dumps(source,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"map.json").write_text(json.dumps({"source":source,"articles":mapped},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"cotejo.json").write_text(json.dumps({"instrumento":"LSNIEG","instrumentId":LAW_ID,"fuente":"https://www.diputados.gob.mx/LeyesBiblio/pdf/LSNIEG.pdf","ultimaReforma":"2025-11-14","sha256":sha,"bytes":len(pdf),"paginas":len(doc),"fragmentos":audits,"nota":data["nota"]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

sql=["begin;",f"insert into public.leyes (id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo) values ({sqlq(LAW_ID)}::uuid,{sqlq(TITLE)},'LSNIEG','2008-04-16','2025-11-14',true,ARRAY[{','.join(sqlq(x) for x in law['temas_clave'])}]::text[],{sqlq(URL)},'ley') on conflict (id) do nothing;"]
for a in articles:
    cols=[sqlq(a['id'])+'::uuid',sqlq(LAW_ID)+'::uuid',sqlq(a['identificador']),sqlq(a['contenido']),sqlq(a['tipo_articulo']),str(a['orden']),sqlq(a['titulo_nombre']),"null",sqlq(a['seccion_nombre']) if a['seccion_nombre'] else "null"]
    sql.append("insert into public.articulos (id,ley_id,identificador,contenido,tipo_articulo,orden,titulo_nombre,capitulo_nombre,seccion_nombre) values ("+','.join(cols)+") on conflict (id) do update set identificador=excluded.identificador,contenido=excluded.contenido,tipo_articulo=excluded.tipo_articulo,orden=excluded.orden,titulo_nombre=excluded.titulo_nombre,capitulo_nombre=excluded.capitulo_nombre,seccion_nombre=excluded.seccion_nombre;")
sql.append("commit;")
(ROOT/"aplicar.sql").write_text("\n".join(sql)+"\n",encoding="utf-8")
print(json.dumps({"lawId":LAW_ID,"sourceId":SOURCE_ID,"articles":len(articles)-17,"transitories":17,"fragments":len(articles),"anchors":sum(a['anclas'] for a in audits),"pages":sorted({p for a in audits for p in a['paginasPdf']}),"sha256":sha,"pdfPages":len(doc)},ensure_ascii=False))
