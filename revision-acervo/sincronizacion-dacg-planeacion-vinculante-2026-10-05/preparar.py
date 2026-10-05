"""Create verified location maps for the loaded DACG on binding planning."""
import hashlib,html,json,re,sys,unicodedata
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python');import pymupdf
ROOT=Path(__file__).resolve().parent;DATA=ROOT/'articulos-verificados.json';PDF=Path('tmp/dacg-planeacion.pdf')
PDF_URL='https://sidof.segob.gob.mx/notas/getNewsletter/17-10-2025/Vespertina/323603'
INSTRUMENT_ID='1a4e15a0-cb72-4195-9d96-fe1d939db0e2';SOURCE_DATE='2025-10-17';FIRST_PAGE=113;LAST_PAGE=116
EXPECTED_SHA256='82f15ac85c7de97078a578dd5e5ac6ef2c5025d6f7af9d1a9a398a5a58b56787';EXPECTED_PAGES=134

def plain(v):
 v=re.sub(r'<!--.*?-->',' ',v,flags=re.S);v=re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>',' ',v,flags=re.I);return html.unescape(re.sub(r'<[^>]+>',' ',v))
def norm(v):
 v=unicodedata.normalize('NFKD',v).lower().replace('\u00ad','');return ''.join(c for c in v if c.isalnum())
def first_segment(v):
 chunks=[(s.strip(' \t\r\n"“”'),norm(s)) for s in re.split(r'(?:\.{3,}|…+)',plain(v))]
 return next(((s,n) for s,n in chunks if len(n)>=50),next(((s,n) for s,n in chunks if n),(None,'')))

data=json.loads(DATA.read_text(encoding='utf8'));assert data['ley']['id']==INSTRUMENT_ID
pdf_bytes=PDF.read_bytes();sha=hashlib.sha256(pdf_bytes).hexdigest();assert sha==EXPECTED_SHA256
doc=pymupdf.open(PDF);assert len(doc)==EXPECTED_PAGES
articles=data['articulos'];assert len(articles)==11
parts=[];lines=[];pages=[];offset=0
for n in range(FIRST_PAGE,LAST_PAGE+1):
 page=doc[n-1];pages.append({'number':n,'width':page.rect.width,'height':page.rect.height});line_id=0
 for block in page.get_text('dict')['blocks']:
  for line in block.get('lines',[]):
   token=norm(''.join(s['text'] for s in line['spans']))
   if token:lines.append({'page':n,'lineId':line_id,'start':offset,'end':offset+len(token),'bbox':list(line['bbox'])});parts.append(token);offset+=len(token)
   line_id+=1
stream=''.join(parts);starts=[];cursor=0
for a in articles:
 marker_text,marker=first_segment(a['contenido']);assert len(marker)>=10,a['identificador'];found=-1;used=0
 for size in (180,140,100,75,55,40,35,25,20,15,10):
  candidate=marker[:size];found=stream.find(candidate,cursor)
  if found>=0:used=len(candidate);break
 if found<0:
  raise ValueError(f'No se localizó {a["identificador"]}; verificación manual requerida.')
 starts.append({'position':found,'article':a,'marker':marker[:used]});cursor=found+max(1,used-1)
source_id=f'dof-vespertina-{SOURCE_DATE}-{sha[:12]}';mapped={};audit=[]
for i,item in enumerate(starts):
 a=item['article'];start=item['position']
 if i+1<len(starts):end=starts[i+1]['position']
 else:
  final=norm(plain(a['contenido']));where=stream.find(final,start);assert where>=start,f'No se encontró el cierre de {a["identificador"]}';end=where+len(final)
 anchors=[{'page':l['page'],'lineId':l['lineId'],'bbox':l['bbox']} for l in lines if l['start']<end and l['end']>start];assert anchors,a['identificador'];page_numbers=sorted({a['page'] for a in anchors})
 mapped[a['id']]={'sourceId':source_id,'label':a['identificador'],'type':a['tipo_articulo'],'contentSha256':hashlib.sha256(a['contenido'].encode()).hexdigest(),'pageNumbers':page_numbers,'anchors':anchors}
 audit.append({'id':a['id'],'fragmento':a['identificador'],'paginasPdf':page_numbers,'paginasImpresas':page_numbers,'anclas':len(anchors),'prefijoCotejado':item['marker']})
source={'id':source_id,'title':'Edición vespertina del Diario Oficial de la Federación · 17 de octubre de 2025','instrumentIds':[INSTRUMENT_ID],'sha256':sha,'transport':'remote-pdf','pdfUrl':f'/api/reader/{source_id}','originalUrl':PDF_URL,'pageCount':len(doc),'pages':[{'number':i+1,'width':p.rect.width,'height':p.rect.height} for i,p in enumerate(doc)]}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':data['ley']['titulo'],'instrumentId':INSTRUMENT_ID,'fuenteInstrumento':data['ley']['url_original'],'fuenteEdicion':PDF_URL,'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(doc),'paginasImpresasDelInstrumento':[FIRST_PAGE,LAST_PAGE],'fragmentosOficiales':len(mapped),'anclasGeometricas':sum(len(x['anchors']) for x in mapped.values()),'notaAlcance':'El artículo 8, transitorio y firmas se cotejaron en la página 116; la convocatoria independiente que sigue empieza en la 117.','fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'DACG-PV: {len(mapped)} fragmentos; páginas impresas {FIRST_PAGE}–{LAST_PAGE}; {sum(len(x["anchors"]) for x in mapped.values())} anclas; SHA-256 {sha}')
for x in audit:print('-',x['fragmento'],x['paginasPdf'],x['anclas'],'anclas')
