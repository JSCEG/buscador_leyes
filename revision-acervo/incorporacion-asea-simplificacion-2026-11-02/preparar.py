import sys, json, re, hashlib, unicodedata, uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,r'C:/Users/User/Documents/65.-Buscador de Leyes Energía/.local/lse-sync/python')
import pymupdf
from bs4 import BeautifulSoup
pdf=Path(sys.argv[1]); raw=pdf.read_bytes(); sha=hashlib.sha256(raw).hexdigest()
assert sha=='2a1f8f61a6d07a915249bafb89f53d243010153763640168b7fa23b31453312a'
doc=pymupdf.open(pdf); assert len(doc)==156
url='https://dof.gob.mx/nota_detalle.php?codigo=5802719&fecha=02/11/2026'
pdfurl='https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=02112026-MAT.pdf&repo='
sid='dof-asea-simplificacion-20261102-'+sha[:12]; lid=str(uuid.uuid5(uuid.NAMESPACE_URL,url))
ley={'id':lid,'titulo':'Acuerdo por el que se establecen acciones de simplificación para trámites que se realizan ante la Agencia Nacional de Seguridad Industrial y de Protección al Medio Ambiente del Sector Hidrocarburos, así como se expiden y modifican los formatos que se mencionan.','siglas':'ASEA-SIMPLIFICACION-2026','tipo':'acuerdo','fecha_publicacion':'2026-11-02','fecha_ultima_reforma':None,'vigente':None,'url_original':url,'temas_clave':['ASEA','Simplificación de trámites','Hidrocarburos','Formatos']}
norm=lambda x:''.join(c for c in unicodedata.normalize('NFKD',x).lower() if c.isalnum())
lines=[];stream=''
for n in range(6,11):
 for b in doc[n-1].get_text('dict')['blocks']:
  for l in b.get('lines',[]):
   if l['bbox'][1]<50:continue
   t=norm(''.join(s['text'] for s in l['spans']))
   if t:
    a=len(stream);stream+=t;lines.append({'start':a,'end':len(stream),'page':n,'bbox':list(l['bbox'])})
draft=json.loads((ROOT/'borrador-cuerpo.json').read_text(encoding='utf8')); positions=[]
for a in draft:
 marker=norm(BeautifulSoup(a['contenido'],'html.parser').get_text(' ',strip=True))[:85]
 idx=stream.find(marker,positions[-1]+1 if positions else 0);assert idx>=0,(a['identificador'],marker);positions.append(idx)
arts=[]; maps={}
for i,a in enumerate(draft):
 label=a['identificador'];content=a['contenido'].replace('\r','');aid=str(uuid.uuid5(uuid.NAMESPACE_URL,url+'#'+label))
 kind='preambulo' if i==0 else 'transitorio' if i==6 else 'ordinario'
 arts.append({'id':aid,'ley_id':lid,'identificador':label,'contenido':content,'orden':i+1,'tipo_articulo':kind,'titulo_nombre':'Acuerdo de simplificación de trámites','capitulo_nombre':'Transitorios' if i==6 else 'Disposiciones','seccion_nombre':None})
 end=positions[i+1] if i+1<len(positions) else len(stream); selected=[l for l in lines if l['start']<end and l['end']>positions[i]];assert selected
 maps[aid]={'sourceId':sid,'label':label,'type':kind,'contentSha256':hashlib.sha256(content.encode()).hexdigest(),'pageNumbers':sorted({l['page'] for l in selected}),'anchors':[{'page':l['page'],'bbox':l['bbox']}for l in selected]}
for i,(name,first,last) in enumerate([('Anexo 1 · FF-ASEA-059',11,16),('Anexo 2 · FF-ASEA-060',17,22),('Anexo 3 · FF-ASEA-065',23,27),('Anexo 4 · FF-ASEA-023',28,39)]):
 content=f'<p><strong>{name}</strong></p><p>Formulario escaneado publicado en el DOF. Para consultar sus campos, tablas e instrucciones, abre PDF original y recorre las páginas {first} a {last}. El resaltado identifica el número de página impreso. Los campos se consultan en el original.</p>'
 aid=str(uuid.uuid5(uuid.NAMESPACE_URL,url+'#'+name));arts.append({'id':aid,'ley_id':lid,'identificador':name,'contenido':content,'orden':8+i,'tipo_articulo':'anexo','titulo_nombre':'Anexos del acuerdo','capitulo_nombre':name,'seccion_nombre':None})
 maps[aid]={'sourceId':sid,'label':name,'type':'anexo','contentSha256':hashlib.sha256(content.encode()).hexdigest(),'pageNumbers':list(range(first,last+1)),'anchors':[]}
 for n in range(first,last+1):
  folios=[w for w in doc[n-1].get_text('words') if w[4]==str(n) and w[3]<50]
  assert len(folios)==1 and doc[n-1].get_images(), n
  maps[aid]['anchors'].append({'page':n,'bbox':list(folios[0][:4])})
# La primera fila continúa en la página 8. Conservar cada columna al unirla.
tables=[t.extract() for n in range(7,11) for t in doc[n-1].find_tables().tables]
first=tables[0];first[2]=[(v or '')+(w or '') for v,w in zip(first[2],tables[1][2],strict=True)]
first+=tables[2][2:]+tables[3][2:]
checked=0
for index,rows in [(1,first),(2,tables[4])]:
 table=BeautifulSoup(draft[index]['contenido'],'html.parser').find('table')
 for row,expected in zip(table.find_all('tr'),rows,strict=True):
  for cell,value in zip(row.find_all(['th','td'],recursive=False),[v for v in expected if v is not None],strict=True):
   assert ''.join(cell.get_text().split())==''.join(value.split()), (index,value)
   checked+=1
assert checked==34
source={'id':sid,'title':'DOF · 2 de noviembre de 2026 · Acuerdo de simplificación ASEA','instrumentIds':[lid],'sha256':sha,'transport':'remote-pdf','pdfUrl':'/api/reader/'+sid,'originalUrl':pdfurl,'pageCount':len(doc),'pages':[{'number':p.number+1,'width':p.rect.width,'height':p.rect.height}for p in doc]}
for name,x in [('carga.json',{'ley':ley,'articulos':arts}),('map.json',{'source':source,'articles':maps})]: (ROOT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def lit(x):return 'NULL' if x is None else "'"+str(x).replace("'","''")+"'"
q=['BEGIN;',"DO $$ BEGIN IF EXISTS(SELECT 1 FROM leyes WHERE id="+lit(lid)+" OR siglas='ASEA-SIMPLIFICACION-2026') THEN RAISE EXCEPTION 'Instrumento ya cargado'; END IF; END $$;"]
q.append('INSERT INTO leyes ('+','.join(ley)+') VALUES ('+','.join('ARRAY['+','.join(lit(t)for t in v)+']' if isinstance(v,list) else lit(v) for v in ley.values())+');')
for a in arts:q.append('INSERT INTO articulos ('+','.join(a)+') VALUES ('+','.join(lit(v)for v in a.values())+');')
q.append('UPDATE articulos SET contenido=replace(contenido,chr(13),\'\') WHERE ley_id='+lit(lid)+';');q.append('COMMIT;');(ROOT/'aplicar.sql').write_text('\n'.join(q)+'\n',encoding='utf8')
print(json.dumps({'ley':lid,'fragmentos':len(arts),'fuente':sid}))
