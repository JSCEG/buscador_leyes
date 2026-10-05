"""Generate page and geometry anchors for the loaded CNE interconnection model."""
import hashlib,html,json,re,sys,unicodedata
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python');import pymupdf
ROOT=Path(__file__).resolve().parent;DATA=ROOT/'articulos-verificados.json';PDF=Path('tmp/modelos-interconexion-2026-03-17.pdf')
PDF_URL='https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=17032026-MAT.pdf&repo='
INSTRUMENT_ID='e8d9d3e6-bad0-5b76-a957-eade6279cfe5';SOURCE_DATE='2026-03-17';FIRST_PAGE=4;LAST_PAGE=20
EXPECTED_SHA256='3ae8c9b91d329d0508aafcd558e552fa7361c90c01d8ca3ac839a721175dcc34';EXPECTED_PAGES=186

def plain(value):
 value=re.sub(r'<!--.*?-->',' ',value,flags=re.S);value=re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>',' ',value,flags=re.I);return html.unescape(re.sub(r'<[^>]+>',' ',value))
def norm(value):
 value=unicodedata.normalize('NFKD',value).lower().replace('\u00ad','');return ''.join(c for c in value if c.isalnum())

data=json.loads(DATA.read_text(encoding='utf8'));assert data['ley']['id']==INSTRUMENT_ID and len(data['articulos'])==47
pdf_bytes=PDF.read_bytes();sha=hashlib.sha256(pdf_bytes).hexdigest();assert sha==EXPECTED_SHA256,f'Cambió el PDF oficial: {sha}'
doc=pymupdf.open(PDF);assert len(doc)==EXPECTED_PAGES
lines=[];parts=[];offset=0;pages=[]
for number in range(FIRST_PAGE,LAST_PAGE+1):
 page=doc[number-1];pages.append({'number':number,'width':page.rect.width,'height':page.rect.height});line_id=0
 for block in page.get_text('dict')['blocks']:
  for line in block.get('lines',[]):
   token=norm(''.join(span['text'] for span in line['spans']))
   if token:lines.append({'page':number,'lineId':line_id,'start':offset,'end':offset+len(token),'bbox':list(line['bbox'])});parts.append(token);offset+=len(token)
   line_id+=1
stream=''.join(parts);starts=[];cursor=0
for article in data['articulos']:
 text=norm(plain(article['contenido']));assert len(text)>=50,article['identificador'];found=-1;used=0
 for size in (180,140,100,75,55,40,35,25,20,15,10):
  found=stream.find(text[:size],cursor)
  if found>=0:used=min(size,len(text));break
 if found<0:raise ValueError(f'No se localizó {article["identificador"]}; cotejo manual requerido.')
 starts.append({'position':found,'article':article,'marker':text[:used]});cursor=found+max(1,used-1)
source_id=f'dof-matutina-{SOURCE_DATE}-{sha[:12]}';mapped={};audit=[]
for index,item in enumerate(starts):
 article=item['article'];start=item['position']
 if index+1<len(starts):end=starts[index+1]['position']
 else:
  final=norm(plain(article['contenido']));where=stream.find(final,start)
  if where<start:
   for size in (500,350,250,180,120,80,50):
    where=stream.find(final[-size:],start)
    if where>=start:end=where+size;break
   else:raise ValueError(f'No se encontró el cierre de {article["identificador"]}')
  else:end=where+len(final)
 anchors=[{'page':line['page'],'lineId':line['lineId'],'bbox':line['bbox']} for line in lines if line['start']<end and line['end']>start]
 assert anchors,article['identificador'];page_numbers=sorted({anchor['page'] for anchor in anchors})
 mapped[article['id']]={'sourceId':source_id,'label':article['identificador'],'type':article['tipo_articulo'],'contentSha256':hashlib.sha256(article['contenido'].encode()).hexdigest(),'pageNumbers':page_numbers,'anchors':anchors}
 audit.append({'id':article['id'],'fragmento':article['identificador'],'paginasPdf':page_numbers,'paginasImpresas':page_numbers,'anclas':len(anchors),'prefijoCotejado':item['marker']})
source={'id':source_id,'title':'Diario Oficial de la Federación · edición matutina del 17 de marzo de 2026','instrumentIds':[INSTRUMENT_ID],'sha256':sha,'transport':'remote-pdf','pdfUrl':f'/api/reader/{source_id}','originalUrl':PDF_URL,'pageCount':len(doc),'pages':[{'number':i+1,'width':page.rect.width,'height':page.rect.height} for i,page in enumerate(doc)]}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':data['ley']['title'],'instrumentId':INSTRUMENT_ID,'fuenteInstrumento':data['ley']['source'],'fuenteEdicion':PDF_URL,'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(doc),'paginasImpresasDelInstrumento':[FIRST_PAGE,LAST_PAGE],'fragmentosOficiales':len(mapped),'anclasGeometricas':sum(len(value['anchors']) for value in mapped.values()),'notaAlcance':'El acuerdo, el modelo de contrato, las cláusulas, firmas, artículos y transitorios se cotejaron en las páginas impresas 4–20. Una publicación independiente empieza en la página 21. El PDF sólo se descargó temporalmente para cotejar.','fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'MODELOS-INTERCONEXION: {len(mapped)} fragmentos; páginas impresas {FIRST_PAGE}–{LAST_PAGE}; {sum(len(value["anchors"]) for value in mapped.values())} anclas; SHA-256 {sha}')
for item in audit:print('-',item['fragmento'],item['paginasPdf'],item['anclas'],'anclas')
