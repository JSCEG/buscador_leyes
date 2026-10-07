"""Build reviewed SNIEG metadata standard fragments and official PDF map."""
import hashlib, html, json, re, subprocess, unicodedata, uuid
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PDF = Path.home() / "AppData/Local/Temp/snieg-metadatos-2025-oficial.pdf"
ISSUE = "https://sidof.segob.gob.mx/notas/getNewsletter/17-09-2025/Matutina/323103"
NOTE = "https://sidof.segob.gob.mx/notas/docFuente/5768007"
TITLE = "Norma Técnica para la elaboración de Metadatos de los Procesos de Producción de Información Estadística y Geográfica"
LAW_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, NOTE))
SOURCE_ID = "snieg-metadatos-2025-09-17-" + hashlib.sha256(ISSUE.encode()).hexdigest()[:12]

def uid(key): return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{NOTE}#{key}"))
def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)
def tokens(s): return [norm(x) for x in re.findall(r"[\wÀ-ÿ]+", html.unescape(re.sub(r"<[^>]+>", " ", s)), re.UNICODE) if norm(x)]
def quoted(s): return "'" + s.replace("'", "''") + "'"
def html_paragraphs(s):
    s = re.sub(r"(?im)^\s*Cap[ií]tulo\s+[IVX]+\s*$", "", s)
    s = re.sub(r"(?im)^\s*(?:Disposiciones generales|Disposiciones espec[ií]ficas|Implementaci[oó]n de la Norma T[eé]cnica|Vigilancia e interpretaci[oó]n)\s*$", "", s)
    if re.search(r"(?i)art[ií]culo\s+3\s*[-.]", s):
        romans = r"(?:XXIV|XXIII|XXII|XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)"
        s = re.sub(rf"\s+(?={romans}\.\s+)", "\n\n", s)
        s = re.sub(r"\s+(?=[a-e]\)\s+(?:Las|Los|entidades|organismos|tribunales))", "\n\n", s)
    if re.search(r"(?i)^\s*TRANSITORIOS?", s):
        s = re.sub(r"(?<!^)\s+(?=(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO)\s*\.)", "\n\n", s)
    bits = [re.sub(r"\s+", " ", x).strip() for x in re.split(r"\n\s*\n+", s)]
    return "\n".join(f"<p>{html.escape(x)}</p>" for x in bits if x)

def poppler(*args): return subprocess.check_output(["pdftotext", *args, str(PDF), "-"], text=True, encoding="utf-8")

text = poppler("-f", "161", "-l", "165", "-layout", "-enc", "UTF-8")
text = re.sub(r"(?m)^.*Mi[eé]rcoles\s+17\s+de\s+septiembre\s+de\s+2025.*$\n?", "", text)
text = re.sub(r"(?m)^\s*DIARIO OFICIAL\s*$\n?", "", text)
text = re.sub(r"(?m)^\s*(?:161|162|163|164|165)\s*$\n?", "", text)
start = text.lower().find("norma técnica para la elaboración de metadatos")
end = re.search(r"\(R\.-\s*568483\)", text[start:], re.I)
assert start >= 0 and end, "No se encontró el cuerpo oficial íntegro de la norma."
body = text[start:start + end.end()]
art_re = re.compile(r"(?im)^\s*Art[ií]culo\s+(\d+)\s*[-.]\s*")
arts = list(art_re.finditer(body))
assert [int(m.group(1)) for m in arts] == list(range(1,17)), "Secuencia oficial distinta de artículos 1–16."
trans_m = re.search(r"(?im)^\s*TRANSITORIOS?\s*$", body)
assert trans_m

data = {"ley": {"id": LAW_ID, "titulo": TITLE, "siglas": "NT-METADATOS-SNIEG-2025",
    "fecha_publicacion": "2025-09-17", "fecha_ultima_reforma": None, "vigente": True,
    "temas_clave": ["SNIEG", "Metadatos", "Información Estadística", "Información Geográfica", "INEGI"],
    "url_original": NOTE, "tipo": "norma"}, "articulos": []}

# Exclude the preceding INEGI agreement and start exactly at this norm's heading.
preamble = body[:arts[0].start()]
preamble = re.sub(r"(?is)\bCap[ií]tulo\s+I\b.*$", "", preamble).strip()
data["articulos"].append({"id": uid("preambulo"), "orden": 0, "identificador": "Preámbulo y considerandos",
    "tipo_articulo": "preambulo", "titulo_nombre": "Preámbulo", "capitulo_nombre": None,
    "seccion_nombre": None, "contenido": html_paragraphs(preamble)})
chapter = {1:"Capítulo I · Disposiciones generales",2:"Capítulo I · Disposiciones generales",3:"Capítulo I · Disposiciones generales",
4:"Capítulo II · Disposiciones específicas",5:"Capítulo II · Disposiciones específicas",6:"Capítulo II · Disposiciones específicas",7:"Capítulo II · Disposiciones específicas",8:"Capítulo II · Disposiciones específicas",
9:"Capítulo III · Implementación de la Norma Técnica",10:"Capítulo III · Implementación de la Norma Técnica",11:"Capítulo III · Implementación de la Norma Técnica",12:"Capítulo III · Implementación de la Norma Técnica",13:"Capítulo III · Implementación de la Norma Técnica",14:"Capítulo III · Implementación de la Norma Técnica",15:"Capítulo III · Implementación de la Norma Técnica",16:"Capítulo IV · Vigilancia e interpretación"}
for i,m in enumerate(arts):
    n=int(m.group(1)); stop=arts[i+1].start() if i+1<len(arts) else trans_m.start()
    raw=body[m.start():stop]
    raw=re.sub(r"(?im)^\s*Cap[ií]tulo\s+[IVX]+\s*$.*?(?=Art[ií]culo\s+\d+)","",raw,flags=re.S)
    data["articulos"].append({"id":uid(f"articulo-{n}"),"orden":n,"identificador":f"Artículo {n}","tipo_articulo":"ordinario",
        "titulo_nombre":"Disposiciones","capitulo_nombre":chapter[n],"seccion_nombre":None,"contenido":html_paragraphs(raw)})
trans=body[trans_m.start():]
trans=re.sub(r"(?m)^\s*\(R\.-\s*568483\).*$", "", trans).strip()
data["articulos"].append({"id":uid("transitorios"),"orden":17,"identificador":"Transitorios","tipo_articulo":"transitorio",
    "titulo_nombre":"Transitorios","capitulo_nombre":None,"seccion_nombre":None,"contenido":html_paragraphs(trans)})

class Parser(HTMLParser):
    def __init__(self): super().__init__(); self.page=160; self.line=None; self.lines=[]; self.word=None; self.buf=[]; self.inword=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="page": self.page+=1
        elif tag=="line": self.line=[float(a[k]) for k in ("xmin","ymin","xmax","ymax")]; self.parts=[]
        elif tag=="word": self.word=[float(a[k]) for k in ("xmin","ymin","xmax","ymax")]; self.buf=[]; self.inword=True
    def handle_data(self,d):
        if self.inword:self.buf.append(d)
    def handle_endtag(self,tag):
        if tag=="word" and self.inword:
            s="".join(self.buf); t=norm(s)
            if t:self.parts.append((t,self.word))
            self.inword=False
        elif tag=="line" and self.line is not None:
            if self.parts:self.lines.append({"page":self.page,"bbox":self.line,"tokens":[x[0] for x in self.parts]})
            self.line=None

bboxfile=Path.home()/"AppData/Local/Temp/snieg-metadatos-2025-bbox.html"
subprocess.check_call(["pdftotext","-f","161","-l","165","-bbox-layout","-enc","UTF-8",str(PDF),str(bboxfile)])
p=Parser(); p.feed(bboxfile.read_text(encoding="utf-8"))
stream=[(t,line) for line in p.lines for t in line["tokens"]]; all_tokens=[x[0] for x in stream]
mapped=[]; cursor=0; audits=[]
for a in data["articulos"]:
    needle=tokens(a["contenido"]); assert len(needle)>8,a["identificador"]
    match=-1; prefix=min(24,len(needle))
    for size in (prefix,min(12,len(needle)),8):
        for j in range(cursor,len(all_tokens)-size+1):
            if all_tokens[j:j+size]==needle[:size]:match=j;break
        if match>=0:break
    assert match>=0,f"No se localizó inicio PDF: {a['identificador']}"
    end=-1; tail=needle[-min(16,len(needle)):]
    end_low=max(match+1,match+len(needle)-40)
    end_high=min(len(all_tokens)-len(tail)+1,match+len(needle)+120)
    for j in range(end_low,end_high):
        if all_tokens[j:j+len(tail)]==tail and j>match:end=j+len(tail)
    assert end>match,f"No se localizó cierre PDF: {a['identificador']}"
    selected=[]; seen=set()
    for _,line in stream[match:end]:
        marker=id(line)
        if marker not in seen:selected.append(line);seen.add(marker)
    anchors=[{"page":x["page"],"bbox":x["bbox"]} for x in selected]
    pages=sorted({x["page"] for x in anchors})
    assert anchors and pages and all(161<=n<=165 for n in pages),(a["identificador"],pages)
    mapped.append((a,{"sourceId":SOURCE_ID,"label":a["identificador"],"type":a["tipo_articulo"],
        "contentSha256":hashlib.sha256(a["contenido"].encode("utf-8")).hexdigest(),"pageNumbers":pages,"anchors":anchors}))
    source_tokens=end-match
    assert abs(source_tokens-len(needle)) <= max(45, int(len(needle)*0.08)), (a["identificador"],len(needle),source_tokens)
    audits.append({"id":a["id"],"fragmento":a["identificador"],"paginasPdf":pages,"paginasImpresas":pages,
        "anclas":len(anchors),"tokensTexto":len(needle),"tokensPdf":source_tokens})
    cursor=end

pdf=PDF.read_bytes(); sha=hashlib.sha256(pdf).hexdigest()
source={"id":SOURCE_ID,"title":"Edición matutina del Diario Oficial de la Federación · 17 de septiembre de 2025","instrumentIds":[LAW_ID],
    "sha256":sha,"transport":"remote-pdf","pdfUrl":f"/api/reader/{SOURCE_ID}","originalUrl":ISSUE,"pageCount":534,
    "pages":[{"number":n,"width":612,"height":792} for n in range(1,535)]}
article_map={a["id"]:v for a,v in mapped}
(ROOT/"NT-METADATOS-SNIEG-2025-carga.json").write_text(json.dumps({**data,"fuenteEdicion":ISSUE},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"source.json").write_text(json.dumps(source,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"map.json").write_text(json.dumps({"source":source,"articles":article_map},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"cotejo.json").write_text(json.dumps({"instrumento":data["ley"]["siglas"],"instrumentId":LAW_ID,"fuenteInstrumento":NOTE,"fuenteEdicion":ISSUE,
    "archivoTemporal":"TEMP/snieg-metadatos-2025-oficial.pdf","sha256":sha,"bytes":len(pdf),"paginasPdf":534,"paginasImpresasNorma":[161,165],"fragmentos":audits,
    "totalAnclas":sum(x["anclas"] for x in audits),"nota":"Los anexos I–III se publican como instrumentos complementarios en el Portal SNIEG; no aparecen en el texto del DOF."},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
law=data["ley"]; sql=["begin;",f"insert into public.leyes (id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo) values ({quoted(LAW_ID)}::uuid,{quoted(TITLE)},{quoted(law['siglas'])},'2025-09-17',null,true,ARRAY[{','.join(quoted(t) for t in law['temas_clave'])}]::text[],{quoted(NOTE)},'norma') on conflict (id) do nothing;"]
for a in data["articulos"]:
    sql.append("insert into public.articulos (id,ley_id,identificador,contenido,tipo_articulo,orden,titulo_nombre,capitulo_nombre,seccion_nombre) values ("+",".join([quoted(a["id"])+"::uuid",quoted(LAW_ID)+"::uuid",quoted(a["identificador"]),quoted(a["contenido"]),quoted(a["tipo_articulo"]),str(a["orden"]),quoted(a["titulo_nombre"]),"null" if a["capitulo_nombre"] is None else quoted(a["capitulo_nombre"]),"null"])+") on conflict (id) do nothing;")
sql.append(f"update public.articulos set contenido = replace(contenido, E'\\r\\n', E'\\n') where ley_id = {quoted(LAW_ID)}::uuid;")
sql.append("commit;");(ROOT/"aplicar.sql").write_text("\n".join(sql)+"\n",encoding="utf-8")
print(json.dumps({"lawId":LAW_ID,"sourceId":SOURCE_ID,"fragments":len(mapped),"anchors":sum(x["anclas"] for x in audits),"sha256":sha,"bytes":len(pdf),"pages":sorted({n for a in audits for n in a["paginasPdf"]})},ensure_ascii=False))
