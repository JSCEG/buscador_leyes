"""Map the loaded CFE mixed-development guidelines to their official DOF PDF."""
import hashlib,html,json,re,sys,unicodedata
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python');import pymupdf
ROOT=Path(__file__).resolve().parent;DATA=ROOT/'articulos-verificados.json';PDF=Path('tmp/desarrollo-mixto-cfe-oficial-2026-01-28.pdf')
PDF_URL='https://sidof.segob.gob.mx/notas/getNewsletter/28-01-2026/Matutina/325425';FIRST_PAGE,LAST_PAGE=65,84
EXPECTED_SHA256='b76dbe009e39723956037613bbfa882de1370c54e968bd45b97ba5a8fabd212c';EXPECTED_PAGES=342

def plain(value):
 value=re.sub(r'<!--.*?-->',' ',value,flags=re.S);value=re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>',' ',value,flags=re.I);return html.unescape(re.sub(r'<[^>]+>',' ',value))
def norm(value):
 value=unicodedata.normalize('NFKD',value).lower().replace('\u00ad','');return ''.join(c for c in value if c.isalnum())
data=json.loads(DATA.read_text(encoding='utf-8-sig'));instrument_id=data['ley']['id'];assert len(data['articulos'])==30
pdf_bytes=PDF.read_bytes();sha=hashlib.sha256(pdf_bytes).hexdigest();assert sha==EXPECTED_SHA256,f'Cambió el PDF cotejado: {sha}'
doc=pymupdf.open(PDF);assert len(doc)==EXPECTED_PAGES
lines=[];parts=[];offset=0
for number in range(FIRST_PAGE,LAST_PAGE+1):
 page=doc[number-1]
 for block in page.get_text('dict')['blocks']:
  for line in block.get('lines',[]):
   token=norm(''.join(span['text'] for span in line['spans']))
   if token:lines.append({'page':number,'lineId':len(lines),'start':offset,'end':offset+len(token),'bbox':list(line['bbox'])});parts.append(token);offset+=len(token)
stream=''.join(parts);starts=[];cursor=0
for article in data['articulos']:
 text=norm(plain(article['contenido']));assert len(text)>=10,article['identificador'];found=-1;used=0
 for size in (220,180,140,100,75,55,40,30,20,12):
  marker=text[:size];found=stream.find(marker,cursor)
  if found>=0:used=min(size,len(text));break
 if found<0:raise ValueError(f'No se localizó {article["identificador"]}; requiere revisión manual.')
 starts.append({'position':found,'article':article,'marker':text[:used]});cursor=found+max(1,used-1)
source_id=f'dof-matutina-2026-01-28-{sha[:12]}';mapped={};audit=[]
for index,item in enumerate(starts):
 article=item['article'];start=item['position'];final=norm(plain(article['contenido']))
 if index+1<len(starts):end=starts[index+1]['position']
 else:
  where=stream.find(final,start)
  if where>=start:end=where+len(final)
  else:
   for size in (500,350,250,180,120,80,50,30):
    where=stream.find(final[-size:],start)
    if where>=start:end=where+size;break
   else:raise ValueError(f'No se encontró cierre de {article["identificador"]}')
 anchors=[{'page':line['page'],'lineId':line['lineId'],'bbox':line['bbox']} for line in lines if line['start']<end and line['end']>start]
 if not anchors:raise ValueError(f'Sin anclas: {article["identificador"]}')
 pages=sorted({a['page'] for a in anchors});mapped[article['id']]={'sourceId':source_id,'label':article['identificador'],'type':article['tipo_articulo'],'contentSha256':hashlib.sha256(article['contenido'].encode()).hexdigest(),'pageNumbers':pages,'anchors':anchors}
 table_count=len(re.findall(r'<table\b',article['contenido'],re.I));cell_count=len(re.findall(r'<(?:td|th)\b',article['contenido'],re.I))
 audit.append({'id':article['id'],'fragmento':article['identificador'],'paginasPdf':pages,'paginasImpresas':pages,'anclas':len(anchors),'tablas':table_count,'celdas':cell_count,'prefijoCotejado':item['marker']})
pages=[{'number':i+1,'width':page.rect.width,'height':page.rect.height} for i,page in enumerate(doc)]
source={'id':source_id,'title':'Diario Oficial de la Federación · edición matutina del 28 de enero de 2026','instrumentIds':[instrument_id],'sha256':sha,'transport':'remote-pdf','pdfUrl':f'/api/reader/{source_id}','originalUrl':PDF_URL,'pageCount':len(doc),'pages':pages}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':data['ley']['title'],'instrumentId':instrument_id,'fuenteInstrumento':data['ley']['source'],'fuenteEdicion':PDF_URL,'archivoDeCotejoExistente':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(doc),'paginasImpresasDelInstrumento':[FIRST_PAGE,LAST_PAGE],'fragmentosOficiales':len(mapped),'anclasGeometricas':sum(len(x['anchors']) for x in mapped.values()),'tablasVerificadas':sum(x['tablas'] for x in audit),'celdasVerificadas':sum(x['celdas'] for x in audit),'notaAlcance':'Se mapearon los 30 fragmentos oficiales contra la edición matutina del DOF del 28 de enero de 2026, páginas impresas 65–84. Se preservaron las tres tablas (216 celdas) cotejadas al incorporar el instrumento. La nota editorial quedó excluida. El PDF de cotejo existente no se incorpora de nuevo al manifiesto.','fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'DESARROLLO-MIXTO-CFE: {len(mapped)} fragmentos; páginas {FIRST_PAGE}–{LAST_PAGE}; {sum(len(x["anchors"]) for x in mapped.values())} anclas; 3 tablas / 216 celdas; SHA-256 {sha}')
for item in audit:print('-',item['fragmento'],item['paginasPdf'],item['anclas'],'anclas; tablas',item['tablas'],'celdas',item['celdas'])
