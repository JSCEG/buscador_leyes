"""Preserve page geometry for tabular support instruments, without fabricated articles."""
import hashlib, html, json, re, sys, uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'.local/lse-sync/python'))
import pymupdf
BASE='https://www.snieg.mx/Documentos/Normatividad/Vigente/'
RULES='75653b58-109e-52bb-970c-72041a77b06a'
CONFIG=[('Anexo-I-Metadatos','anexos_I_ntmppieg.pdf','Anexo I. Metadatos Referenciales de la Norma Técnica para la elaboración de Metadatos de los Procesos de Producción de Información Estadística y Geográfica','METADATOS-I','manual',1,[1],['Anexo I · 52 elementos referenciales'])]

instruments=[]; sources={}; mapped={}; audits=[]
for name,filename,title,siglas,kind,count,page_range,labels in CONFIG:
 pdf=Path.home()/('AppData/Local/Temp/'+name+'.pdf'); doc=pymupdf.open(pdf)
 assert len(doc)==count and len(labels)==len(page_range)
 url=BASE+filename; lawid=str(uuid.uuid5(uuid.NAMESPACE_URL,url)); sha=hashlib.sha256(pdf.read_bytes()).hexdigest()
 sid='snieg-'+siglas.lower()+'-version-verificada-'+sha[:12]
 source=dict(id=sid,title=title,instrumentIds=[lawid],sha256=sha,transport='remote-pdf',pdfUrl='/api/reader/'+sid,
             originalUrl=url,pageCount=count,pages=[dict(number=n,width=p.rect.width,height=p.rect.height) for n,p in enumerate(doc,1)])
 sources[sid]=source; articles=[]; page_audits=[]
 for order,(page_num,label) in enumerate(zip(page_range,labels),1):
  page=doc[page_num-1]; lines=[]
  for b in page.get_text('dict',sort=True)['blocks']:
   for line in b.get('lines',[]):
    text=''.join(s['text'] for s in line['spans']).strip()
    if not text: continue
    # Repeated header/footer, including page 30's landscape header.
    bbox=list(line['bbox'])
    if bbox[1]<0: continue
    if re.match(r'^(?:Versión 2018|Junio de 2018)\b',text): continue
    lines.append(dict(text=text,bbox=[round(float(x),3) for x in bbox]))
  manual=False
  assert lines, (name,page_num)
  # Arrange lines by physical row and column. This retains parallel column text
  # instead of concatenating a table down one column and then another.
  rows=[]
  for index,line in enumerate(sorted(lines,key=lambda l:(l['bbox'][1],l['bbox'][0]))):
   if manual: rows.append(dict(y=index,lines=[line])); continue
   row=next((r for r in reversed(rows) if abs(r['y']-line['bbox'][1])<3),None)
   if row is None: row=dict(y=line['bbox'][1],lines=[]); rows.append(row)
   row['lines'].append(line)
  rendered=[]
  for row in sorted(rows,key=lambda r:r['y']):
   out=''; left=min(l['bbox'][0] for l in lines)
   for line in sorted(row['lines'],key=lambda l:l['bbox'][0]):
    pos=max(len(out)+2 if out else 0,round((line['bbox'][0]-left)/5))
    out+=' '*max(0,pos-len(out))+line['text']
   rendered.append(out.rstrip())
  transcription='\n'.join(rendered)
  note='Transcripción para consulta y búsqueda. Las casillas, tablas y disposición visual se consultan en el PDF original sincronizado.'
  if manual: note='Transcripción manual revisada del ejemplo de formulario que aparece como imagen en esta página. Las casillas y campos de captura se consultan en el PDF original sincronizado.'
  if kind=='manual' and page_num==32: note='Anexo I: el diagrama de flujo y sus conexiones se consultan en el PDF original sincronizado. El texto siguiente es únicamente la transcripción de sus rótulos.'
  table=page.find_tables().tables[0].extract()
  fields=[]; section=apartado=''
  for row in table[4:]:
   if row[1]: section=row[1]
   if row[2]: apartado=row[2]
   assert row[3].isdigit() and row[5] in ('Obligatorio','Recomendado')
   fields.append(dict(numero=int(row[3]),seccion=section,apartado=apartado,elemento=row[4],condicion=row[5]))
  assert [f['numero'] for f in fields]==list(range(1,53))
  (ROOT/'elementos.json').write_text(json.dumps(fields,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  intro=html.escape(table[1][1]).replace('\n',' ')
  content='<section><p>'+intro+'</p><div class="overflow-x-auto"><table><thead><tr>'+''.join('<th>'+h+'</th>' for h in ['Número','Sección','Apartado','Elemento','Condición de llenado'])+'</tr></thead><tbody>'
  for f in fields: content+='<tr>'+''.join('<td>'+html.escape(str(v))+'</td>' for v in f.values())+'</tr>'
  content+='</tbody></table></div></section>'

  aid=str(uuid.uuid5(uuid.NAMESPACE_URL,url+'#pagina-'+str(page_num)))
  article=dict(id=aid,identificador=label+' · pág. '+str(page_num),contenido=content,tipo_articulo='anexo',orden=order,
               titulo_nombre='Anexo de la Norma Técnica de Metadatos',capitulo_nombre='Metadatos referenciales',seccion_nombre=label)
  articles.append(article)
  mapped[aid]=dict(sourceId=sid,label=article['identificador'],type='anexo',contentSha256=hashlib.sha256(content.encode()).hexdigest(),
                   pageNumbers=[page_num],anchors=[dict(page=page_num,bbox=l['bbox']) for l in lines])
  # Every retained PDF line is represented exactly once in the transcription.
  def norm(t): return ''.join(c for c in t if not c.isspace())
  assert norm(transcription)==norm(''.join(l['text'] for r in sorted(rows,key=lambda r:r['y']) for l in sorted(r['lines'],key=lambda l:l['bbox'][0])))
  page_audits.append(dict(pagina=page_num,fragmentId=aid,lineas=len(lines),tablaDetectada=len(page.find_tables().tables),transcripcionManual=manual,
                          nota='Los ejemplos en imagen y conexiones gráficas se conservan en el PDF oficial; no se reconstruyen como tablas automáticas.'))
 law=dict(id=lawid,titulo=title,siglas=siglas,fecha_publicacion=None,fecha_ultima_reforma=None,vigente=True,
          temas_clave=['SNIEG','INEGI','Información de Interés Nacional','Metadatos referenciales','Condición de llenado','DDI','SDMX'],url_original=url,tipo=kind)
 checksum=hashlib.md5('|'.join(a['id']+':'+hashlib.md5(a['contenido'].encode()).hexdigest() for a in sorted(articles,key=lambda a:a['id'])).encode()).hexdigest()
 instruments.append(dict(ley=law,articulos=articles,source=source))
 audits.append(dict(instrumentId=lawid,sourceId=sid,version='PDF listado en normatividad vigente; sin fecha de emisión explícita verificada',fechaPublicacionExactaNoDocumentada=True,
                    checksum=checksum,sha256=sha,bytes=pdf.stat().st_size,pages=count,fragmentos=len(articles),paginas=page_audits))
package=dict(instruments=instruments,sources=sources,articles=mapped,normaRelacionada=RULES)
for name,obj in [('carga.json',package),('map.json',dict(sources=sources,articles=mapped)),('cotejo.json',dict(instruments=audits,fuente='https://www.snieg.mx/scn-vigente/'))]:
 (ROOT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def q(v): return 'null' if v is None else "E'"+str(v).replace('\\','\\\\').replace("'","''").replace('\r','\\r').replace('\n','\\n')+"'"
sql=['begin;']
for instrument in instruments:
 law=instrument['ley']; cols=list(law)
 vals=['ARRAY['+','.join(q(t) for t in law[c])+']::text[]' if c=='temas_clave' else 'true' if c=='vigente' else q(law[c]) for c in cols]
 sql.append('insert into public.leyes ('+','.join(cols)+') values ('+','.join(vals)+') on conflict(id) do nothing;')
 for a in instrument['articulos']:
  row=dict(a,ley_id=law['id']); cols=list(row); vals=[str(row[c]) if c=='orden' else q(row[c]) for c in cols]
  sql.append('insert into public.articulos ('+','.join(cols)+') values ('+','.join(vals)+') on conflict(id) do nothing;')
sql.append('commit;')
(ROOT/'aplicar.sql').write_text('\n'.join(sql)+'\n',encoding='utf8')
print(json.dumps([dict(id=i['ley']['id'],source=i['source']['id'],fragmentos=len(i['articulos'])) for i in instruments]))
