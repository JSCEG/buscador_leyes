import hashlib,html,json,re,sys,unicodedata
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python');import pymupdf
ROOT=Path('revision-acervo/sincronizacion-reforma-simplificacion-2026-10-06')
DATA=ROOT/'articulos-verificados.json'; PDF=Path('tmp/pdfs/reforma-simplificacion-dof-2024-12-20.pdf')
PDF_URL='https://sidof.segob.gob.mx/notas/getNewsletter/20-12-2024/Vespertina/318281'
EXPECTED_SHA='878e180516f11559603f1c361026978b42ec475e50d0a3628cfae4ec61de9ee6';EXPECTED_PAGES=168
FIRST,LAST=2,10

def plain(v):
 v=re.sub(r'<!--.*?-->',' ',v,flags=re.S);v=re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>',' ',v,flags=re.I);return html.unescape(re.sub(r'<[^>]+>',' ',v))
def norm(v):
 v=unicodedata.normalize('NFKD',v).lower().replace('\u00ad','');return ''.join(c for c in v if c.isalnum())
pack=json.loads(DATA.read_text(encoding='utf-8-sig'));assert pack['ley']['id']=='6c8a912f-6ebb-5638-8d95-b53e5c4b596c'
articles=[a for a in pack['articulos'] if a['identificador']!='Nota editorial · documentos relacionados'];assert len(pack['articulos'])==30 and len(articles)==29
pdf_bytes=PDF.read_bytes();sha=hashlib.sha256(pdf_bytes).hexdigest();assert sha==EXPECTED_SHA,sha
doc=pymupdf.open(PDF);assert len(doc)==EXPECTED_PAGES
lines=[];parts=[];offset=0
for number in range(FIRST,LAST+1):
 page=doc[number-1]
 for block in page.get_text('dict')['blocks']:
  for line in block.get('lines',[]):
   token=norm(''.join(span['text'] for span in line['spans']))
   if token:lines.append({'page':number,'lineId':len(lines),'start':offset,'end':offset+len(token),'bbox':list(line['bbox'])});parts.append(token);offset+=len(token)
stream=''.join(parts);starts=[];cursor=0
for article in articles:
 text=norm(plain(article['contenido']));assert len(text)>=10,article['identificador'];found=-1;used=0
 for size in (220,180,140,100,75,55,40,30,20,12):
  marker=text[:size];found=stream.find(marker,cursor)
  if found>=0:used=min(size,len(text));break
 if found<0:raise ValueError(f'No se localizó {article["identificador"]}; prefijo={text[:160]}')
 starts.append({'position':found,'article':article,'marker':text[:used]});cursor=found+max(1,used-1)
source_id='dof-vespertina-2024-12-20-878e180516f1';mapped={};audit=[]
for index,item in enumerate(starts):
 article=item['article'];start=item['position']
 if index+1<len(starts):end=starts[index+1]['position']
 else:
  final=norm(plain(article['contenido']));where=stream.find(final,start)
  if where>=start:end=where+len(final)
  else:
   for size in (500,350,250,180,120,80,50,30):
    where=stream.find(final[-size:],start)
    if where>=start:end=where+size;break
   else:raise ValueError(f'No se encontró cierre de {article["identificador"]}')
 anchors=[{'page':line['page'],'lineId':line['lineId'],'bbox':line['bbox']} for line in lines if line['start']<end and line['end']>start]
 if not anchors:raise ValueError(f'Sin anclas: {article["identificador"]}')
 pages=sorted({a['page'] for a in anchors});mapped[article['id']]={'sourceId':source_id,'label':article['identificador'],'type':article['tipo_articulo'],'contentSha256':hashlib.sha256(article['contenido'].encode()).hexdigest(),'pageNumbers':pages,'anchors':anchors}
 audit.append({'id':article['id'],'fragmento':article['identificador'],'paginasPdf':pages,'paginasImpresas':pages,'anclas':len(anchors),'prefijoCotejado':item['marker']})
source={'id':source_id,'title':'Edición vespertina del Diario Oficial de la Federación · 20 de diciembre de 2024','instrumentIds':[pack['ley']['id']],'sha256':sha,'transport':'remote-pdf','pdfUrl':'/api/reader/'+source_id,'originalUrl':PDF_URL,'pageCount':len(doc),'pages':[{'number':i+1,'width':float(doc[i].rect.width),'height':float(doc[i].rect.height)} for i in range(len(doc))]}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':pack['ley']['titulo'],'instrumentId':pack['ley']['id'],'fuenteInstrumento':'https://sidof.segob.gob.mx/notas/docFuente/5745905','fuenteEdicion':PDF_URL,'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(doc),'paginasImpresasDelInstrumento':[FIRST,LAST],'fragmentosOficiales':len(mapped),'anclasGeometricas':sum(len(x['anchors']) for x in mapped.values()),'notaAlcance':'Se mapearon los 29 fragmentos oficiales (preámbulo, artículo único, modificaciones constitucionales, 12 transitorios y firma) contra la edición vespertina oficial del DOF del 20 de diciembre de 2024, páginas impresas 2–10. La nota editorial de Supabase se excluyó.','fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'OK {len(mapped)} mapas; {sum(len(x["anchors"]) for x in mapped.values())} anclas; páginas {FIRST}–{LAST}; SHA {sha}')
for a in audit:print(a['fragmento'],'pages',a['paginasPdf'],'anchors',a['anclas'])
