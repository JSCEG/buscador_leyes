"""Carga reproducible desde HTML oficial y mapas al PDF remoto. No publica PDFs."""
import sys, re, json, hashlib, uuid, unicodedata, copy
from pathlib import Path
sys.path.insert(0, str(Path.home()/'Documents/65.-Buscador de Leyes Energía/.local/lse-sync/python'))
import pymupdf
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parent
CACHE=ROOT.parents[1]/'.local/cne-sat-nov6'
norm=lambda s: ''.join(c for c in unicodedata.normalize('NFKD',s).lower() if c.isalnum())
digest=lambda s: hashlib.sha256(s.encode()).hexdigest()
def flat(name):
    soup=BeautifulSoup((CACHE/(name+'.html')).read_text(encoding='utf8'),'html.parser')
    body=soup.select_one('#DivDetalleNota').find('body')
    return [n for wrap in body.find_all(recursive=False) for n in wrap.find_all(recursive=False)]

def clean(node):
    s=BeautifulSoup(str(node),'html.parser')
    for img in s.find_all('img'):
        # Solo símbolos pequeños de opciones; las páginas escaneadas se mapean aparte.
        assert float(re.search(r'height:([\d.]+)pt',img.get('style','')).group(1))<15
        img.replace_with('○')
    for t in list(s.find_all(True)):
        if t.name=='span': t.unwrap(); continue
        t.attrs={k:v for k,v in t.attrs.items() if k in ['colspan','rowspan']}
        if t.name=='div': t.name='p'
    for table in s.find_all('table'):
        rows=table.find_all('tr')
        if not table.find(attrs={'rowspan':True}):
            first=rows[0].extract(); head=s.new_tag('thead');head.append(first);table.insert(0,head)
            for c in first.find_all('td'): c.name='th';c['scope']='col'
        else:
            # Mantener los rowspans originales, sin cruzar thead y tbody.
            for row in rows:
                if 'Descripción del código' in row.get_text():
                    for c in row.find_all('td',recursive=False):
                        c.name='th';c['scope']='rowgroup' if c.get('rowspan') else 'col'
    return str(s).replace('\r','')

def stream(doc,pages):
    text=''; lines=[]
    for n in pages:
        for b in doc[n-1].get_text('dict')['blocks']:
            for line in b.get('lines',[]):
                if line['bbox'][1]<50:continue
                t=norm(''.join(x['text'] for x in line['spans']))
                if t:
                    a=len(text);text+=t;lines.append(dict(start=a,end=len(text),page=n,bbox=list(line['bbox'])))
    return text,lines

def build(name,date,code,siglas,title,pages,segments,scans):
    pdf=Path(f'C:/Proyectos/1.-DGMESNIE/tmp/radar-{date}/{date[8:10]}{date[5:7]}{date[:4]}-MAT.pdf')
    raw=pdf.read_bytes();sha=hashlib.sha256(raw).hexdigest();doc=pymupdf.open(pdf)
    url=f'https://dof.gob.mx/nota_detalle.php?codigo={code}&fecha={date[8:10]}/{date[5:7]}/{date[:4]}'
    pdfurl=f'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo={pdf.name}&repo='
    sid=f'dof-{name}-{date.replace("-","")}-{sha[:12]}';lid=str(uuid.uuid5(uuid.NAMESPACE_URL,url+('#anexo29' if name=='sat' else '')))
    nodes=flat(name);arts=[];maps={};proof=[]
    text,lines=stream(doc,pages)
    prepared=[];cursor=0
    for label,kind,chapter,start,end in segments:
        chosen=nodes[start:end]
        content='\n'.join(clean(n)for n in chosen if n.get_text(strip=True) or n.find('table'))
        original=norm(''.join(n.get_text() for n in chosen))
        assert norm(BeautifulSoup(content,'html.parser').get_text())==original, label
        marker=original[:100];pos=text.find(marker,cursor)
        assert pos>=0,(label,marker,cursor)
        cursor=pos+len(marker)
        prepared.append((label,kind,chapter,content,pos,original))
    for i,(label,kind,chapter,content,pos,original) in enumerate(prepared):
        end=prepared[i+1][4] if i+1<len(prepared) else len(text)
        selected=[l for l in lines if l['start']<end and l['end']>pos]
        aid=str(uuid.uuid5(uuid.NAMESPACE_URL,url+'#'+label))
        arts.append(dict(id=aid,ley_id=lid,identificador=label,contenido=content,orden=len(arts)+1,tipo_articulo=kind,titulo_nombre=title if name=='sat' else 'DACG de comercialización',capitulo_nombre=chapter,seccion_nombre=None))
        maps[aid]=dict(sourceId=sid,label=label,type=kind,contentSha256=digest(content),pageNumbers=sorted({l['page']for l in selected}),anchors=[dict(page=l['page'],bbox=l['bbox'])for l in selected])
        proof.append(dict(id=aid,label=label,pages=maps[aid]['pageNumbers'],htmlTextExact=True,pdfTextExact=(original==text[pos:end]),htmlNormalizedLength=len(original),pdfNormalizedLength=end-pos))
    for roman,desc,first,last in scans:
        label=f'Anexo {roman} · {desc}'
        content=f'<p><strong>{label}</strong></p><p>Formulario e instructivo publicados como imagen en el DOF. Consulta sus campos y tablas en PDF original, páginas {first} a {last}. El resaltado identifica el folio impreso. Esta guía editorial no transcribe los campos del formulario.</p>'
        aid=str(uuid.uuid5(uuid.NAMESPACE_URL,url+'#'+label));arts.append(dict(id=aid,ley_id=lid,identificador=label,contenido=content,orden=0,tipo_articulo='anexo',titulo_nombre='Anexos de las DACG',capitulo_nombre=f'Anexo {roman}',seccion_nombre=None))
        anchors=[]
        for n in range(first,last+1):
            folios=[w for w in doc[n-1].get_text('words') if w[4]==str(n) and w[3]<50]
            assert len(folios)==1 and doc[n-1].get_images(),n
            anchors.append(dict(page=n,bbox=list(folios[0][:4])))
        maps[aid]=dict(sourceId=sid,label=label,type='anexo',contentSha256=digest(content),pageNumbers=list(range(first,last+1)),anchors=anchors)
    arts.sort(key=lambda a: min(maps[a['id']]['pageNumbers']))
    for i,a in enumerate(arts):a['orden']=i+1
    ley=dict(id=lid,titulo=title,siglas=siglas,tipo='dacg' if name=='cne' else 'acuerdo',fecha_publicacion=date,fecha_ultima_reforma=None,vigente=None,url_original=url,temas_clave=['CNE','Comercialización','Hidrocarburos','Petrolíferos'] if name=='cne' else ['SAT','CFDI','L_CNE','Hidrocarburos','Petrolíferos'])
    source=dict(id=sid,title=f'DOF · {date} · {siglas}',instrumentIds=[lid],sha256=sha,transport='remote-pdf',pdfUrl='/api/reader/'+sid,originalUrl=pdfurl,pageCount=len(doc),pages=[dict(number=p.number+1,width=p.rect.width,height=p.rect.height)for p in doc])
    folder=ROOT/name;folder.mkdir(exist_ok=True)
    table_cells=0
    if name=='cne':
        htmltables=BeautifulSoup(arts[-1]['contenido'],'html.parser').find_all('table')
        rows=[[[v for v in row if v]for row in table.extract()]for n in [90,91,92]for table in doc[n-1].find_tables().tables]
        rows[5]+=rows[6][1:];del rows[6] # continuación, sin duplicar encabezado
        cellnorm=lambda v:re.sub(r'\s+','',v).replace('○','')
        for ht,pt in zip(htmltables,rows,strict=True):
            for hr,pr in zip(ht.find_all('tr'),pt,strict=True):
                for hc,pc in zip(hr.find_all(['th','td'],recursive=False),pr,strict=True):
                    assert cellnorm(hc.get_text())==cellnorm(pc),(hc.get_text(),pc)
                    table_cells+=1
        assert table_cells==184
        assert all(p['pdfTextExact']for p in proof[:-1])
        proof[-1]['pdfDifferenceExplanation']='El PDF repite Campo, Descripción y Tipo de dato al continuar una tabla en la página 92. Las 184 celdas coinciden exactamente al quitar espacios y representar círculos de opción con ○.'
    else:
        assert all(p['pdfTextExact']for p in proof)
    for filename,obj in [('carga.json',dict(ley=ley,articulos=arts)),('map.json',dict(source=source,articles=maps)),('cotejo.json',dict(pdfBytes=len(raw),pdfSha256=sha,htmlSha256=hashlib.sha256((CACHE/(name+'.html')).read_bytes()).hexdigest(),fragments=proof,scannedAnnexes=scans,tableCellsVerified=table_cells))]:
        (folder/filename).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    def lit(v):
        if v is None:return 'NULL'
        if isinstance(v,list):return 'ARRAY['+','.join(lit(x)for x in v)+']'
        if isinstance(v,int):return str(v)
        return "'"+v.replace("'","''")+"'"
    def insert(table,obj):return 'INSERT INTO '+table+' ('+','.join(obj)+') VALUES ('+','.join(lit(v)for v in obj.values())+');'
    sql=['BEGIN;',f"DO $$ BEGIN IF EXISTS(SELECT 1 FROM leyes WHERE id='{lid}' OR siglas='{siglas}') THEN RAISE EXCEPTION 'Instrumento ya cargado'; END IF; END $$;",insert('leyes',ley)]
    sql += [insert('articulos',a)for a in arts]
    sql += ['COMMIT;']
    (folder/'aplicar.sql').write_text('\n'.join(sql)+'\n',encoding='utf8')
    print(name,len(arts),'fragmentos',len([p for p in proof if not p['pdfTextExact']]),'diferencias de texto PDF por revisar',lid)

cne=flat('cne');starts=[(0,'Preámbulo y considerandos','preambulo','Acuerdo'),(32,'Artículo único del acuerdo','ordinario','Acuerdo')]
pending=33;chapter='';trans=False
for i in range(33,609):
    t=cne[i].get_text(' ',strip=True)
    if t.startswith('CAPÍTULO '):pending=i;chapter=t+' · '+cne[i+1].get_text(' ',strip=True)
    if t=='TRANSITORIOS':trans=True;pending=i;chapter='Transitorios'
    m=re.match(r'Artículo (\d+)\.',t)
    mt=re.match(r'((?:DÉCIMO(?: PRIMERO| SEGUNDO)?|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO))\.',t) if trans else None
    if m or mt:
        start=pending if pending is not None else i
        starts.append((start,'Artículo '+m[1] if m else 'Transitorio '+mt[1].lower(),'ordinario' if m else 'transitorio',chapter));pending=None
    if i==608:starts.append((i,'Firma del acuerdo','complementario','Acuerdo'))
assert len([s for s in starts if s[1].startswith('Artículo ')])==55
segments=[(label,kind,ch,a,starts[i+1][0] if i+1<len(starts)else 609)for i,(a,label,kind,ch)in enumerate(starts)]
segments.append(('Anexo XI · Formulario electrónico de contratos de comercialización','anexo','Anexo XI',671,717))
scans=[('I','Solicitud de otorgamiento de permiso',49,57),('II','Modificación por cesión',58,62),('III','Modificación por fusión',63,66),('IV','Modificación por sucesión',67,71),('V','Modificación por escisión',72,76),('VI','Actualización por cambio de control',77,79),('VII','Autorización para suspensión de servicios',80,81),('VIII','Terminación anticipada del permiso',82,83),('IX','Notificación de inicio de operaciones',84,85),('X','Aviso de participación cruzada',86,89)]
build('cne','2026-11-05','5803022','DACG-COMERCIALIZACION-CNE','Acuerdo de la Comisión Nacional de Energía por el que se expiden las Disposiciones Administrativas de Carácter General que regulan la actividad de comercialización de gas natural, petrolíferos, gas licuado de petróleo y petroquímicos.',list(range(16,49))+[90,91,92],segments,scans)
satsegments=[('Presentación y contenido','preambulo','Segunda modificación',1282,1292),('III.1 · Listado de Contribuyentes Obligados (LCO)','ordinario','III. Descarga y consulta de listas',1292,1303),('III.2 · Lista de contribuyentes inscritos no cancelados (LRFC)','ordinario','III. Descarga y consulta de listas',1303,1314),('III.3 · Listado de la Comisión Nacional de Energía (L_CNE)','ordinario','III. Descarga y consulta de listas',1314,1351),('VI.3 · Servicio de cancelación de CFDI','ordinario','VI. Validaciones adicionales',1351,1368),('Firma de la modificación','complementario','Segunda modificación',1368,1371)]
build('sat','2026-11-06','5803159','RMF2026-ANEXO29-M2','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026',list(range(229,233)),satsegments,[])
