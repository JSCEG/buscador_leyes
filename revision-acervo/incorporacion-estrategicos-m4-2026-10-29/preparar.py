import sys, json, re, hashlib, uuid, unicodedata
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(Path(sys.argv[2])))
import pymupdf
from bs4 import BeautifulSoup, Tag

PDF = Path(sys.argv[1])
SHA = '2f30744f130e1bf501a1ae5e5ca4b754f7e34fa2f80ccbcf5db52ac6bb9febad'
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == SHA
doc = pymupdf.open(PDF)
assert len(doc) == 184
URL = 'https://dof.gob.mx/nota_detalle.php?codigo=5802463&fecha=29/10/2026'
PDFURL = 'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=29102026-MAT.pdf&repo='
sourceid = 'dof-estrategicos-m4-20261029-' + SHA[:12]
s = BeautifulSoup((ROOT/'fuente.html').read_text(encoding='utf8'), 'html.parser')
nodes = []
def walk(t):
    if not isinstance(t, Tag): return
    if t.name == 'table' or (t.name in ['div','p','h1','h2'] and not t.find(['div','p','h1','h2','table'])):
        if t.get_text(strip=True) and 'En el documento que usted' not in t.get_text(): nodes.append(t)
        return
    for c in t.children: walk(c)
walk(s.select_one('#DivDetalleNota'))
assert len(nodes) == 19
norm = lambda t: ''.join(c for c in unicodedata.normalize('NFKD',t).lower() if c.isalnum())
compact = lambda t: re.sub(r'\s+', '', unicodedata.normalize('NFKC',t).replace('…','...'))
text = lambda n: n.get_text(' ',strip=True)
def clean(ns):
    soup = BeautifulSoup('\n'.join(str(n) for n in ns),'html.parser')
    allowed = {'div','p','br','b','strong','em','i','u','table','thead','tbody','tr','td','th','sup','sub','h1','h2'}
    for n in list(soup.find_all(True)):
        if n.name not in allowed: n.unwrap()
        else: n.attrs = {k:v for k,v in n.attrs.items() if k in ['colspan','rowspan']}
    for table in soup.find_all('table'):
        rows = table.find_all('tr'); head = soup.new_tag('thead'); body = soup.new_tag('tbody')
        first = rows[0].extract()
        for c in first.find_all('td',recursive=False): c.name='th'; c['scope']='col'
        head.append(first)
        for r in rows[1:]: body.append(r.extract())
        table.clear(); table.append(head); table.append(body)
    return str(soup).replace('\r','')

page=doc[48]; stream=''; lines=[]
for b in page.get_text('dict')['blocks']:
    for l in b.get('lines',[]):
        if l['bbox'][1]<65:continue
        token=norm(''.join(sp['text']for sp in l['spans']))
        if token:
            start=len(stream);stream+=token;lines.append({'start':start,'end':len(stream),'bbox':list(l['bbox'])})
cursor=0
for n in nodes:
    if n.name=='table':continue
    token=norm(text(n));found=stream.find(token,cursor)
    assert found>=0, text(n)[:80]
    cursor=found+len(token)
htmlrows=[[c.get_text(' ',strip=True)for c in r.find_all(['td','th'],recursive=False)]for r in nodes[14].find_all('tr')]
detected=page.find_tables().tables[0].extract()
assert len(detected)==3 and len(detected[0])==6
# El detector divide «No. de / Etapa» e introduce dos columnas vacías.
pdfrows=[[detected[0][1]+' '+detected[1][1],*detected[0][3:]],
         [detected[2][0],*detected[2][3:]]]
assert len(htmlrows)==len(pdfrows)==2
for h,p in zip(htmlrows,pdfrows,strict=True):
    p=[v for v in p if v is not None]
    assert [compact(v) for v in h]==[compact(v) for v in p],(h,p)
lid=str(uuid.uuid5(uuid.NAMESPACE_URL,URL))
ley={'id':lid,'titulo':'Acuerdo'+text(nodes[0])[len('ACUERDO'):], 'siglas':'CONV-ESTRATEGICOS-M4',
     'fecha_publicacion':'2026-10-29','fecha_ultima_reforma':None,'vigente':None,'tipo':'acuerdo','url_original':URL,
     'temas_clave':['Planeación vinculante','Proyectos estratégicos','Almacenamiento de energía eléctrica','SAEE','Modificación de convocatoria']}
arts=[];maps={};positions=[]
sections=[(0,7,'Preámbulo y considerandos','preambulo'),(7,16,'Acuerdo ÚNICO','ordinario'),(16,19,'Transitorio ÚNICO','transitorio')]
for begin,end,label,kind in sections:
    positions.append(stream.index(norm(text(nodes[begin]))[:90], positions[-1]+1 if positions else 0))
for i,(begin,end,label,kind) in enumerate(sections):
    content=clean(nodes[begin:end]);aid=str(uuid.uuid5(uuid.NAMESPACE_URL,URL+'#'+label))
    arts.append({'id':aid,'ley_id':lid,'identificador':label,'contenido':content,'orden':i+1,'tipo_articulo':kind,
                 'titulo_nombre':'Cuarta modificación a la convocatoria de proyectos estratégicos','capitulo_nombre':label,'seccion_nombre':None})
    finish=positions[i+1]if i+1<len(positions)else len(stream)
    chosen=[l for l in lines if l['start']<finish and l['end']>positions[i]]
    maps[aid]={'sourceId':sourceid,'label':label,'type':kind,'contentSha256':hashlib.sha256(content.encode()).hexdigest(),
               'pageNumbers':[49],'anchors':[{'page':49,'bbox':l['bbox']}for l in chosen]}
assert compact(''.join(n.get_text()for n in nodes))==compact(BeautifulSoup(''.join(a['contenido']for a in arts),'html.parser').get_text())
family=[('24110e92-4d4c-5434-b02a-6a1794ee65ff','Texto original','15/05/2026'),('373ce6df-4e78-59d9-aae5-54007a446c59','Modificación 1','26/05/2026'),('29886758-c194-5db4-86eb-8c96347f7aba','Modificación 2','10/07/2026'),('372339cc-7ed9-5e5c-8023-647e1a12c3b6','Modificación 3','02/09/2026'),(lid,'Modificación 4','29/10/2026')]
links='<ul>'+''.join(f'<li><a href="/#ley-{id}">{name} · {date}</a></li>'for id,name,date in family)+'</ul>'
notice='<p><strong>Nota editorial · versiones relacionadas</strong></p><p>Este registro reproduce la cuarta modificación publicada el 29 de octubre de 2026. Modifica la fracción II del numeral 3.1 y la etapa 2 del numeral 17.1 de la convocatoria existente; no crea una convocatoria nueva ni reabre el registro de generación.</p><p>El plazo para manifestaciones de interés y solicitudes de estudios de conexión de SAEE se amplía hasta el 1 de marzo de 2027. Las fechas de las actuaciones pueden corresponder a 2027. Entra en vigor el día de su publicación.</p>'+links+'<p>Esta nota es información editorial del buscador y no forma parte de la publicación oficial. No es un texto consolidado.</p>'
arts.insert(0,{'id':str(uuid.uuid5(uuid.NAMESPACE_URL,URL+'#nota')),'ley_id':lid,'identificador':'Nota editorial · versiones relacionadas','contenido':notice,'orden':0,'tipo_articulo':'complementario','titulo_nombre':'Versiones relacionadas','capitulo_nombre':'Nota editorial','seccion_nombre':None})
source={'id':sourceid,'title':'DOF · 29 de octubre de 2026 · Cuarta modificación a proyectos estratégicos','instrumentIds':[lid],'sha256':SHA,
        'transport':'remote-pdf','pdfUrl':'/api/reader/'+sourceid,'originalUrl':PDFURL,'pageCount':len(doc),
        'pages':[{'number':p.number+1,'width':p.rect.width,'height':p.rect.height}for p in doc]}
updates=[]
for old in json.loads((ROOT/'antes-notas.json').read_text(encoding='utf8')):
    addition=f'<p>Actualización editorial al 29/10/2026: <a href="/#ley-{lid}">Modificación 4 · 29/10/2026</a>. Amplía el registro de SAEE hasta el 1 de marzo de 2027; no reabre el registro de generación. <a href="{URL}">Fuente oficial</a>.</p>'
    updates.append({'id':old['id'],'antes_md5':hashlib.md5(old['contenido'].encode()).hexdigest(),'contenido':old['contenido']+'\n'+addition})
for name,value in [('carga.json',{'ley':ley,'articulos':arts}),('map.json',{'source':source,'articles':maps}),('actualizacion-notas.json',updates),('cotejo.json',{'fuente_html':URL,'fuente_pdf':PDFURL,'sha256':SHA,'bytes':PDF.stat().st_size,'paginas_pdf':len(doc),'pagina_acuerdo':49,'integridad_textual_html':True,'parrafos_pdf_cotejados':18,'tabla':{'filas':2,'columnas':4,'celdas_cotejadas':8},'pdf_remoto':True})]:
    (ROOT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def lit(v):return 'NULL'if v is None else "'"+str(v).replace("'","''")+"'"
sql=['BEGIN;',"DO $$ BEGIN IF EXISTS(SELECT 1 FROM leyes WHERE id="+lit(lid)+" OR siglas='CONV-ESTRATEGICOS-M4') THEN RAISE EXCEPTION 'Instrumento ya cargado'; END IF; END $$;"]
sql.append('INSERT INTO leyes ('+','.join(ley)+') VALUES ('+','.join('ARRAY['+','.join(lit(t)for t in v)+']'if isinstance(v,list)else lit(v)for v in ley.values())+');')
for a in arts:sql.append('INSERT INTO articulos ('+','.join(a)+') VALUES ('+','.join(lit(v)for v in a.values())+');')
sql.append('UPDATE articulos SET contenido=replace(contenido,chr(13),\'\') WHERE ley_id='+lit(lid)+';')
for u in updates:
    sql.append("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM articulos WHERE id="+lit(u['id'])+' AND md5(contenido)='+lit(u['antes_md5'])+") THEN RAISE EXCEPTION 'Nota editorial cambio desde cotejo'; END IF; END $$;")
    sql.append('UPDATE articulos SET contenido=replace('+lit(u['contenido'])+",chr(13),'') WHERE id="+lit(u['id'])+';')
sql.append('COMMIT;');(ROOT/'aplicar.sql').write_text('\n'.join(sql)+'\n',encoding='utf8')
print(json.dumps({'ley':lid,'fragmentos':len(arts),'mapas':len(maps),'resolutivo':arts[2]['id']}))
