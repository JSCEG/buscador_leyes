"""Map the second amendment of the second generation call to the official DOF issue."""
import hashlib,html,json,re,sys,unicodedata
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python');import pymupdf
ROOT=Path(__file__).resolve().parent;DATA=ROOT/'articulos-verificados.json';PDF=Path('tmp/conv-estrategicos-m1.pdf')
PDF_URL='https://sidof.segob.gob.mx/notas/getNewsletter/26-05-2026/Matutina/327526'
INSTRUMENT_ID='f7419b4e-49eb-5425-a439-562f25a4d581';SOURCE_DATE='2026-05-26';FIRST_PAGE=46;LAST_PAGE=49
EXPECTED_SHA256='1a28d5fb75ec9451422ff890b18ba71cec4a3cd92b2d4c47b90fde9c6253ed38';EXPECTED_PAGES=620
def plain(value):
 value=re.sub(r'<!--.*?-->',' ',value,flags=re.S);value=re.sub(r'<br\\s*/?>|</(?:div|p|li|tr|h[1-6])\\s*>',' ',value,flags=re.I);return html.unescape(re.sub(r'<[^>]+>',' ',value))
def norm(value):
 value=unicodedata.normalize('NFKD',value).lower().replace('\\u00ad','');return ''.join(c for c in value if c.isalnum())
data=json.loads(DATA.read_text(encoding='utf8'));assert data['ley']['id']==INSTRUMENT_ID and len(data['articulos'])==5
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
 article=item['article'];start=item['position'];end=starts[index+1]['position'] if index+1<len(starts) else offset
 anchors=[{'page':line['page'],'lineId':line['lineId'],'bbox':line['bbox']} for line in lines if line['start']<end and line['end']>start];assert anchors,article['identificador']
 page_numbers=sorted({a['page'] for a in anchors});mapped[article['id']]={'sourceId':source_id,'label':article['identificador'],'type':article['tipo_articulo'],'contentSha256':hashlib.sha256(article['contenido'].encode()).hexdigest(),'pageNumbers':page_numbers,'anchors':anchors}
 audit.append({'id':article['id'],'fragmento':article['identificador'],'paginasPdf':page_numbers,'paginasImpresas':page_numbers,'anclas':len(anchors),'prefijoCotejado':item['marker']})
manifest=json.loads((ROOT/'../../public/reader-sources/manifest.v1.json').resolve().read_text(encoding='utf8'));existing=manifest['sources'].get(source_id);assert existing and existing['sha256']==sha and existing['pageCount']==len(doc) and existing['originalUrl']==PDF_URL
source={**existing,'instrumentIds':list(dict.fromkeys([*existing['instrumentIds'],INSTRUMENT_ID]))}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':data['ley']['title'],'instrumentId':INSTRUMENT_ID,'fuenteInstrumento':data['ley']['source'],'fuenteEdicion':PDF_URL,'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(doc),'paginasImpresasDelInstrumento':[FIRST_PAGE,LAST_PAGE],'fragmentosOficiales':len(mapped),'anclasGeometricas':sum(len(v['anchors']) for v in mapped.values()),'notaAlcance':'Los cinco fragmentos oficiales cotejados ocupan las páginas 46–49 del ejemplar matutino. El mapa reutiliza la edición oficial ya registrada para CONV-ESTRATEGICOS-M1; no se incorpora copia del PDF al repositorio.','fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'CONV-GEN-2-M1: {len(mapped)} fragmentos; páginas impresas {FIRST_PAGE}–{LAST_PAGE}; {sum(len(v["anchors"]) for v in mapped.values())} anclas; SHA-256 {sha}')
for x in audit:print('-',x['fragmento'],x['paginasPdf'],x['anclas'],'anclas')


