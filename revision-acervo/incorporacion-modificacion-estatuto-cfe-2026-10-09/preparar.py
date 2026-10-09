import hashlib,html,json,re,sys,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'.local/lse-sync/python'))
import pymupdf
URL='https://sidof.segob.gob.mx/notas/docFuente/5800855'
PDFURL='https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=09102026-MAT.pdf&repo='
TITLE='Modificaciones al Estatuto Orgánico de la Empresa Pública del Estado, Comisión Federal de Electricidad'
pdf=Path.home()/'AppData/Local/Temp/DOF-2026-10-09.pdf';doc=pymupdf.open(pdf);assert len(doc)==190
sha=hashlib.sha256(pdf.read_bytes()).hexdigest();sid='dof-cfe-estatuto-20261009-'+sha[:12];lawid=str(uuid.uuid5(uuid.NAMESPACE_URL,URL))
lines=[]
for n in range(97,109):
 for b in doc[n-1].get_text('dict',sort=True)['blocks']:
  for l in b.get('lines',[]):
   t=''.join(s['text'] for s in l['spans']).strip();box=list(l['bbox'])
   if t and box[1]>45: lines.append(dict(text=t,page=n,bbox=[round(float(v),3) for v in box]))
articles=[];mapped={};active=[];label='Preámbulo y disposición de modificación';kind='preambulo';key='preambulo';pending=[]
def flush():
 if not active:return
 content=''.join('<p>'+html.escape(x['text'])+'</p>' for x in active)
 aid=str(uuid.uuid5(uuid.NAMESPACE_URL,URL+'#'+key));a=dict(id=aid,identificador=label,contenido=content,tipo_articulo=kind,orden=len(articles)+1,titulo_nombre='Modificaciones al Estatuto Orgánico de CFE · DOF 9 de octubre de 2026',capitulo_nombre='Transitorios' if kind=='transitorio' else 'Texto de la modificación',seccion_nombre=None);articles.append(a)
 mapped[aid]=dict(sourceId=sid,label=label,type=kind,contentSha256=hashlib.sha256(content.encode()).hexdigest(),pageNumbers=sorted({x['page'] for x in active}),anchors=[dict(page=x['page'],bbox=x['bbox']) for x in active])
trans=re.compile(r'^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO(?: PRIMERO)?)\.')
signatures=[];structural=False
for idx,line in enumerate(lines):
 t=line['text']
 if t.startswith('En la Ciudad de México, a los seis días'):
  signatures=lines[idx:];break
 match=re.match(r'^Artículo (\d+(?: (?:Bis|Ter|Quater))?)\.',t);tr=trans.match(t)
 if t.startswith(('TÍTULO ','CAPÍTULO ')) or t=='TRANSITORIOS':
  flush();active=[];structural=True
 if structural and not match and not tr:pending.append(line);continue
 if match or tr:
  flush();active=pending;pending=[];structural=False
  label=('Artículo '+match[1]+' · modificación') if match else 'Transitorio '+tr[1].title()
  key=('articulo-'+match[1].lower().replace(' ','-')) if match else 'transitorio-'+tr[1].lower().replace(' ','-');kind='ordinario' if match else 'transitorio'
 active.append(line)
flush();assert not pending
ordinary=[a for a in articles if a['tipo_articulo']=='ordinario'];transitory=[a for a in articles if a['tipo_articulo']=='transitorio'];assert len(transitory)==11
assert sum(len(m['anchors']) for m in mapped.values())+len(signatures)==len(lines)
source=dict(id=sid,title=TITLE,instrumentIds=[lawid],sha256=sha,transport='remote-pdf',pdfUrl='/api/reader/'+sid,originalUrl=PDFURL,officialPublicationUrl=URL,pageCount=len(doc),pages=[dict(number=n,width=p.rect.width,height=p.rect.height) for n,p in enumerate(doc,1)])
law=dict(id=lawid,titulo=TITLE,siglas='CFE-ESTATUTO-MOD-2026',fecha_publicacion='2026-10-09',fecha_ultima_reforma=None,vigente=False,temas_clave=['CFE','Estatuto Orgánico','Generación','Redes Eléctricas','Política Comercial','Modificación'],url_original=URL,tipo='acuerdo')
checksum=hashlib.md5('|'.join(a['id']+':'+hashlib.md5(a['contenido'].encode()).hexdigest() for a in sorted(articles,key=lambda a:a['id'])).encode()).hexdigest()
package=dict(instruments=[dict(ley=law,articulos=articles,source=source)],sources={sid:source},articles=mapped)
audit=dict(articulos=len(ordinary),transitorios=len(transitory),fragmentos=len(articles),checksum=checksum,sha256=sha,entradaEnVigor='2026-10-10',paginasInstrumento=[97,108],firmaCertificacion=[x['text'] for x in signatures],advertencia='Modificación, no texto consolidado. Pasajes con puntos suspensivos preservados. A la fecha de carga, 9 de octubre, entrada en vigor pendiente para el día siguiente.')
for name,data in [('carga.json',package),('map.json',dict(sources=package['sources'],articles=mapped)),('cotejo.json',audit)]: (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
instruments=package['instruments']
def q(v): return 'null' if v is None else "E'"+str(v).replace('\\','\\\\').replace("'","''").replace('\r','\\r').replace('\n','\\n')+"'"
sql=['begin;']
for instrument in instruments:
 law=instrument['ley']; cols=list(law)
 vals=['ARRAY['+','.join(q(t) for t in law[c])+']::text[]' if c=='temas_clave' else ('true' if law[c] else 'false') if c=='vigente' else q(law[c]) for c in cols]
 sql.append('insert into public.leyes ('+','.join(cols)+') values ('+','.join(vals)+') on conflict(id) do nothing;')
 for a in instrument['articulos']:
  row=dict(a,ley_id=law['id']); cols=list(row); vals=[str(row[c]) if c=='orden' else q(row[c]) for c in cols]
  sql.append('insert into public.articulos ('+','.join(cols)+') values ('+','.join(vals)+') on conflict(id) do nothing;')
sql.append('commit;')
(ROOT/'aplicar.sql').write_text('\n'.join(sql)+'\n',encoding='utf8')
print(json.dumps([dict(id=i['ley']['id'],source=i['source']['id'],fragmentos=len(i['articulos'])) for i in instruments]))
