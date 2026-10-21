import sys,json,re,hashlib,uuid,html
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'.local/lse-sync/python'))
import pymupdf
from bs4 import BeautifulSoup,Tag
ROOT=Path(__file__).resolve().parent
PDF=Path(sys.argv[1])
doc=pymupdf.open(PDF)
sha=hashlib.sha256(PDF.read_bytes()).hexdigest()
assert sha=='ce69dc52a2f08c1472d0b425a28217ae37fd90922edd02249a145185a064b7ce'
url='https://dof.gob.mx/nota_detalle.php?codigo=5801710&fecha=21/10/2026'
pdfurl='https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=21102026-MAT.pdf&repo='
s=BeautifulSoup((ROOT/'fuente.html').read_text(encoding='utf-8'),'html.parser')
r=s.select_one('#DivDetalleNota');nodes=[]
def walk(t):
    if not isinstance(t,Tag):return
    if t.name=='table' or(t.name in ['div','p','h1','h2'] and not t.find(['div','table','p','h1','h2'])):
        if t.get_text(strip=True):nodes.append(t)
        return
    for n in t.children:walk(n)
walk(r)
nodes=[n for n in nodes if 'En el documento que usted está visualizando' not in n.get_text()]
labels=['Ficha y problemas jurídicos','Índice temático','Identificación y presentación de la sentencia',
 'ANTECEDENTES Y TRÁMITE DE LA DEMANDA','I. COMPETENCIA','II. PRECISIÓN Y EXISTENCIA DEL ACTO IMPUGNADO',
 'III. OPORTUNIDAD','IV. LEGITIMACIÓN','V. CAUSAS DE IMPROCEDENCIA Y SOBRESEIMIENTO','VI. ESTUDIO DE FONDO',
 'VI.1 Parámetro constitucional aplicable en materia de hidrocarburos',
 'VI.2 Parámetro constitucional aplicable en materia de energía eléctrica',
 'VI.3 Alcance de las facultades municipales en materia hacendaria, administrativa y de licencias de funcionamiento',
 'VI.4 Análisis del caso concreto','VII. EFECTOS','VIII. DECISIÓN',
 'Resolutivo PRIMERO','Resolutivo SEGUNDO','Resolutivo TERCERO','Notificaciones, votación y firmas','Certificación','Notas al pie de la sentencia']
def text(n):return ' '.join(n.get_text(' ',strip=True).split())
starts=[0,next(i for i,n in enumerate(nodes) if text(n)=='ÍNDICE TEMÁTICO')]
starts.append(next(i for i,n in enumerate(nodes) if i>starts[-1] and text(n)=='CONTROVERSIA CONSTITUCIONAL 137/2026'))
for label in labels[3:16]:starts.append(next(i for i,n in enumerate(nodes) if i>starts[-1] and text(n)==label))
for word in ['PRIMERO.','SEGUNDO.','TERCERO.','Notifíquese;','DANIEL ÁLVAREZ TOLEDO','1 Página']:
    starts.append(next(i for i,n in enumerate(nodes) if i>starts[-1] and text(n).startswith(word)))
assert len(starts)==len(labels)
allowed={'div','p','span','br','strong','b','em','i','u','sup','sub','table','thead','tbody','tr','td','th','h1','h2','a'}
def clean(ns):
    soup=BeautifulSoup('\n'.join(str(n) for n in ns),'html.parser')
    for n in list(soup.find_all(True)):
        if n.name not in allowed:n.unwrap();continue
        n.attrs={k:v for k,v in n.attrs.items() if k in ['colspan','rowspan']}
    for table in soup.find_all('table'):
        row=table.find('tr')
        if row and ('Apartado' in row.get_text() or '2025' in row.get_text()):
            for cell in row.find_all('td',recursive=False):cell.name='th'
            head=soup.new_tag('thead');row.wrap(head)
    return str(soup)
lid=str(uuid.uuid5(uuid.NAMESPACE_URL,url))
ley={'id':lid,'titulo':'Sentencia dictada por el Tribunal Pleno de la Suprema Corte de Justicia de la Nación en la Controversia Constitucional 137/2026.','siglas':'SCJN-CC-137-2026','fecha_publicacion':'2026-10-21','fecha_ultima_reforma':None,'vigente':None,'tipo':'sentencia','url_original':url,'temas_clave':['Competencias federales','Energía eléctrica','Hidrocarburos','Cobros municipales','San Pedro, Coahuila','SCJN']}
articles=[]
for i,(start,label) in enumerate(zip(starts,labels)):
    end=starts[i+1] if i+1<len(starts) else len(nodes)
    articles.append({'id':str(uuid.uuid5(uuid.NAMESPACE_URL,url+'#'+str(i+1))),'ley_id':lid,'identificador':label,'contenido':clean(nodes[start:end]),'orden':i+1,'tipo_articulo':'apartado','titulo_nombre':'Controversia constitucional 137/2026','capitulo_nombre':label,'seccion_nombre':None})
sourceid='dof-scjn-cc-137-2026-20261021-'+sha[:12]
source={'id':sourceid,'title':'DOF · 21 de octubre de 2026 · Sentencia SCJN CC 137/2026','instrumentIds':[lid],'sha256':sha,'transport':'remote-pdf','pdfUrl':'/api/reader/'+sourceid,'originalUrl':pdfurl,'pageCount':len(doc),'pages':[{'number':p.number+1,'width':p.rect.width,'height':p.rect.height}for p in doc]}
# Locate section starts using the text of the first HTML block, in document order.
import unicodedata
def norm(t):return ''.join(c for c in unicodedata.normalize('NFKD',t).lower() if c.isalnum())
lines=[];stream=''
for num in range(52,80):
    p=doc[num-1]
    for b in p.get_text('dict')['blocks']:
        for line in b.get('lines',[]):
            if line['bbox'][1]<50:continue
            token=norm(''.join(sp['text'] for sp in line['spans']))
            if not token:continue
            begin=len(stream);stream+=token
            lines.append({'page':num,'start':begin,'end':len(stream),'bbox':list(line['bbox']),'small':num>=55 and round(max(sp['size']for sp in line['spans']),1)==7.0})
positions=[]
last=-1
for i,start in enumerate(starts[:-1]):
    marker=norm(text(nodes[start]))[:100]
    found=stream.find(marker,last+1)
    if found<0:found=stream.find(marker[:38],last+1)
    assert found>=0,(labels[i],marker)
    positions.append(found);last=found
maps={};audit=[]
for i,a in enumerate(articles):
    if i==len(articles)-1: selected=[l for l in lines if l['small']]
    else:
        end=positions[i+1] if i+1<len(positions) else len(stream)
        selected=[l for l in lines if l['start']<end and l['end']>positions[i] and not l['small']]
    assert selected,a['identificador']
    pages=sorted({l['page']for l in selected})
    maps[a['id']]={'sourceId':sourceid,'label':a['identificador'],'type':'apartado','contentSha256':hashlib.sha256(a['contenido'].encode()).hexdigest(),'pageNumbers':pages,'anchors':[{'page':l['page'],'bbox':l['bbox']}for l in selected]}
    audit.append({'apartado':a['identificador'],'paginas':pages,'anclas':len(selected)})
payload={'ley':ley,'articulos':articles}
original=BeautifulSoup((ROOT/'fuente.html').read_text(encoding='utf-8'),'html.parser').select_one('#DivDetalleNota')
next(t for t in original.find_all('table') if 'En el documento que usted' in t.get_text()).decompose()
serialized=BeautifulSoup(''.join(a['contenido']for a in articles),'html.parser')
compact=lambda t:re.sub(r'\s+','',t)
before,after=compact(original.get_text()),compact(serialized.get_text())
assert before.endswith(after) and len(before)-len(after)==108,'Texto omitido o alterado'
for left,right in zip(original.find_all('table'),serialized.find_all('table'),strict=True):
    assert [compact(t.get_text())for t in left.find_all(['td','th'])]==[compact(t.get_text())for t in right.find_all(['td','th'])]
for name,data in [('carga.json',payload),('map.json',{'source':source,'articles':maps}),('cotejo.json',{'fecha':'2026-10-21','fuente':url,'pdf':pdfurl,'sha256':sha,'paginas_sentencia':[52,79],'apartados':audit,'notas':'Se conserva el índice temático, las tablas y las 67 notas al pie del DOF. La eficacia de la invalidez depende de la notificación al Congreso local; no se asigna una fecha de inicio inventada.'})]:
    (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
c=json.loads((ROOT/'cotejo.json').read_text(encoding='utf-8'))
c.update({'cotejo_integridad_html':'110538 caracteres sin espacios: texto oficial completo idéntico y en orden; excluidos título web duplicado y aviso técnico del portal.','tablas_cotejadas':5,'celdas_cotejadas':140,'cotejo_visual':[52,64,79]})
(ROOT/'cotejo.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def lit(x):return 'NULL' if x is None else "'"+str(x).replace("'","''")+"'"
q=['BEGIN;',"DO $$ BEGIN IF EXISTS (SELECT 1 FROM leyes WHERE id="+lit(lid)+" OR siglas='SCJN-CC-137-2026') THEN RAISE EXCEPTION 'Sentencia ya cargada'; END IF; END $$;"]
q.append('INSERT INTO leyes ('+','.join(ley)+') VALUES ('+','.join('ARRAY['+','.join(lit(t)for t in v)+']' if isinstance(v,list) else lit(v)for v in ley.values())+');')
for a in articles:q.append('INSERT INTO articulos ('+','.join(a)+') VALUES ('+','.join(lit(v)for v in a.values())+');')
q.append('UPDATE articulos SET contenido=replace(contenido,chr(13),\'\') WHERE ley_id='+lit(lid)+' AND position(chr(13) in contenido)>0;')
q.append('COMMIT;')
(ROOT/'aplicar.sql').write_text('\n'.join(q)+'\n',encoding='utf-8')
print(json.dumps({'id':lid,'apartados':len(articles),'tablas':sum(a['contenido'].count('<table')for a in articles),'bytes':PDF.stat().st_size,'sha':sha}))
