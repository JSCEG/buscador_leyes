"""Preserve page geometry for tabular support instruments, without fabricated articles."""
import hashlib, html, json, re, sys, uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'.local/lse-sync/python'))
import pymupdf
BASE='https://www.snieg.mx/Documentos/Normatividad/Formatos_reg/'
RULES='15e6b367-4ea3-5120-a270-7252227965d3'
CONFIG=[
 ('Formato-IIN-Estadistica','Formato_IIN_Estadistica.pdf','Formato para la presentación de Propuestas de Información Estadística de Interés Nacional','FIIN-EST','formato',15,range(2,16),
  ['Marco legal, conceptos y proponente','Temas y usuarios','Políticas públicas y fundamento legal','Programas y políticas públicas','Compromisos internacionales y emergencias','Metodología de la información propuesta','Productos y proyecto estadístico','Independencia y objetivos del proyecto','Normatividad y diseño conceptual','Diseño conceptual y muestreo','Medios y difusión','Asistencia técnica, documentación y periodo disponible','Observaciones','Persona responsable y entrega']),
 ('Instructivo-IIN-Estadistica','Instructivo_Formato_IIN_Estadistica.pdf','Instructivo de llenado del Formato para la presentación de Propuestas de Información Estadística de Interés Nacional','IFIIN-EST','manual',31,range(2,31),
  ['Introducción','Contenido','Objetivo, ámbito y estructura','Instrucciones generales','Información propuesta y proponente','Temas y usuarios','Políticas públicas','Políticas públicas · continuación','Compromisos internacionales','Emergencias','Metodología y universo','Referencia temporal y regularidad','Productos y cobertura','Confidencialidad y proyecto','Independencia y participantes','Objetivo y tipo de proyecto','Normatividad y diseño conceptual','Instrumentos y validación','Muestreo','Medios y difusión','Documentación y metadatos','Periodo disponible','Observaciones','Persona responsable y entrega','Glosario · 1','Glosario · 2','Glosario · 3','Glosario · 4','Anexo I · Diagrama de flujo'])]
instruments=[]; sources={}; mapped={}; audits=[]
for name,filename,title,siglas,kind,count,page_range,labels in CONFIG:
 pdf=Path.home()/('AppData/Local/Temp/'+name+'.pdf'); doc=pymupdf.open(pdf)
 assert len(doc)==count and len(labels)==len(page_range)
 url=BASE+filename; lawid=str(uuid.uuid5(uuid.NAMESPACE_URL,url)); sha=hashlib.sha256(pdf.read_bytes()).hexdigest()
 sid='snieg-'+siglas.lower()+'-2018-'+sha[:12]
 source=dict(id=sid,title=title+' · versión 2018',instrumentIds=[lawid],sha256=sha,transport='remote-pdf',pdfUrl='/api/reader/'+sid,
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
    if bbox[1]<76 or bbox[1]>page.rect.height-49: continue
    if re.match(r'^(?:Versión 2018|Junio de 2018)\b',text): continue
    lines.append(dict(text=text,bbox=[round(float(x),3) for x in bbox]))
  manual=False
  if kind=='manual' and page_num==9:
   # This page consists of raster examples; verify the transcription visually.
   manual=True
   texts=[
    '2.2 La información estadística propuesta debe generarse porque lo mandata:',
    '2.2.1 Ley aplicable:',
    'Si selecciona la opción “Sí”, anote: Nombre de la ley, título, capítulo, sección, artículo, fracción, párrafo, fecha de última publicación y observaciones.',
    'Nombre de la ley, título, capítulo, sección, artículo, fracción, párrafo, fecha de última publicación y observaciones:',
    'Sí. No. Limpiar.',
    '2.2.2 Otro ordenamiento jurídico (Reglamentos de ley, estatutos, otros reglamentos):',
    'Si selecciona la opción “Sí”, anote: Nombre del ordenamiento, especificaciones, fecha de última publicación y observaciones.',
    'Nombre del ordenamiento, especificaciones, fecha de última publicación y observaciones:',
    'Sí. No. Limpiar.',
    '2.2.3 El Plan Nacional de Desarrollo:',
    'Si contesta afirmativamente, especifique el Nombre del plan y eje rector, objetivos y estrategias relacionadas.',
    'Plan y Eje rector:', 'Objetivos relacionados:', 'Estrategias relacionadas:', 'Sí. No. Limpiar.',
    '2.2.4 Programa sectorial, regional o especial:',
    'Si contesta afirmativamente, especifique el nombre del (los) programa(s) y los objetivos, metas e indicadores relacionados.',
    'Nombre del programa:', 'Objetivos, metas e indicadores relacionados:',
    'Anexar el archivo y dirección electrónica donde se puede consultar el programa.',
    'Nombre del programa:', 'Objetivos, metas e indicadores relacionados:',
    'Anexar el archivo y dirección electrónica donde se puede consultar el programa.', 'Sí. No. Limpiar.'
   ]
   lines=[dict(text=t,bbox=[101.04,104.16,534.0,709.44]) for t in texts]
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
  if kind=='manual' and page_num==30: note='Anexo I: el diagrama de flujo y sus conexiones se consultan en el PDF original sincronizado. El texto siguiente es únicamente la transcripción de sus rótulos.'
  content='<section><p><strong>Nota de consulta:</strong> '+note+'</p><div class="overflow-x-auto"><pre class="whitespace-pre font-sans">'+html.escape(transcription)+'</pre></div></section>'
  aid=str(uuid.uuid5(uuid.NAMESPACE_URL,url+'#pagina-'+str(page_num)))
  article=dict(id=aid,identificador=label+' · pág. '+str(page_num),contenido=content,tipo_articulo='anexo',orden=order,
               titulo_nombre='Instrumento de apoyo · artículo 11 de las Reglas de determinación de IIN',capitulo_nombre='Formato de propuesta estadística' if kind=='formato' else 'Instructivo de llenado',seccion_nombre=label)
  articles.append(article)
  mapped[aid]=dict(sourceId=sid,label=article['identificador'],type='anexo',contentSha256=hashlib.sha256(content.encode()).hexdigest(),
                   pageNumbers=[page_num],anchors=[dict(page=page_num,bbox=l['bbox']) for l in lines])
  # Every retained PDF line is represented exactly once in the transcription.
  def norm(t): return ''.join(c for c in t if not c.isspace())
  assert norm(transcription)==norm(''.join(l['text'] for r in sorted(rows,key=lambda r:r['y']) for l in sorted(r['lines'],key=lambda l:l['bbox'][0])))
  page_audits.append(dict(pagina=page_num,fragmentId=aid,lineas=len(lines),tablaDetectada=len(page.find_tables().tables),transcripcionManual=manual,
                          nota='Los ejemplos en imagen y conexiones gráficas se conservan en el PDF oficial; no se reconstruyen como tablas automáticas.'))
 law=dict(id=lawid,titulo=title,siglas=siglas,fecha_publicacion=None,fecha_ultima_reforma=None,vigente=True,
          temas_clave=['SNIEG','INEGI','Información de Interés Nacional','Propuestas estadísticas','Formato','Instructivo'],url_original=url,tipo=kind)
 checksum=hashlib.md5('|'.join(a['id']+':'+hashlib.md5(a['contenido'].encode()).hexdigest() for a in sorted(articles,key=lambda a:a['id'])).encode()).hexdigest()
 instruments.append(dict(ley=law,articulos=articles,source=source))
 audits.append(dict(instrumentId=lawid,sourceId=sid,version='2018' if kind=='formato' else 'Junio de 2018',fechaPublicacionExactaNoDocumentada=True,
                    checksum=checksum,sha256=sha,bytes=pdf.stat().st_size,pages=count,fragmentos=len(articles),paginas=page_audits))
package=dict(instruments=instruments,sources=sources,articles=mapped,reglasRelacionadas=RULES)
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
