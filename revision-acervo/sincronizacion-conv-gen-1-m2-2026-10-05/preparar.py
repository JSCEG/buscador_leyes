"""Build a text and page map for the second amendment to generation call 1."""
import hashlib,html,json,re,sys,unicodedata
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python');import pymupdf
ROOT=Path(__file__).resolve().parent
PACKAGE=Path('revision-acervo/incorporacion-convocatorias-2026-09-17')
PDF=Path('tmp/conv-gen-1-m2.pdf')
PDF_URL='https://sidof.segob.gob.mx/notas/getNewsletter/10-11-2025/Matutina/324043'
INSTRUMENT='CONV-GEN-1-M2';INSTRUMENT_ID='10c059c7-bfa4-5ec0-9ae6-bf1d8a35a637'
EXPECTED_SHA256='7f5b3270512bace265139239071a007dd150e184e7a24f869055da27afba2360'
EXPECTED_PAGES=438;PAGE_NUMBER=142

def plain(v):
 v=re.sub(r'<!--.*?-->',' ',v,flags=re.S);v=re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>',' ',v,flags=re.I);return html.unescape(re.sub(r'<[^>]+>',' ',v))
def norm(v):
 v=unicodedata.normalize('NFKD',v).lower().replace('\u00ad','');return ''.join(c for c in v if c.isalnum())
def first_segment(v):
 c=[(s.strip(' \t\r\n"“”'),norm(s)) for s in re.split(r'(?:\.{3,}|…+)',plain(v))]
 return next(((s,n) for s,n in c if len(n)>=50),next(((s,n) for s,n in c if n),(None,'')))

data=json.loads((PACKAGE/f'{INSTRUMENT}-carga.json').read_text(encoding='utf-8'));assert data['ley']['id']==INSTRUMENT_ID
raw=PDF.read_bytes();sha=hashlib.sha256(raw).hexdigest();assert sha==EXPECTED_SHA256
doc=pymupdf.open(PDF);assert len(doc)==EXPECTED_PAGES
official=[a for a in data['articulos'] if not a['identificador'].lower().startswith('nota editorial')];excluded=[a for a in data['articulos'] if a not in official];assert len(official)==5
page=doc[PAGE_NUMBER-1];parts=[];spans=[];offset=0
for line_id,line in enumerate(l for b in page.get_text('dict')['blocks'] for l in b.get('lines',[])):
 token=norm(''.join(s['text'] for s in line['spans']))
 if token:spans.append({'page':PAGE_NUMBER,'lineId':line_id,'start':offset,'end':offset+len(token),'bbox':list(line['bbox'])});parts.append(token);offset+=len(token)
stream=''.join(parts);starts=[];cursor=0
for a in official:
 marker_text,marker=first_segment(a['contenido']);assert len(marker)>=10
 found=-1;used=0
 for size in (180,140,100,75,55,40,35,25,20,15,10):
  candidate=marker[:size];found=stream.find(candidate,cursor)
  if found>=0:used=len(candidate);break
 if found<0:raise ValueError(f'No se localizó el inicio: {a["identificador"]}')
 starts.append({'position':found,'article':a,'marker':marker[:used]});cursor=found+max(1,used-1)
mapped={};audit=[]
for i,item in enumerate(starts):
 a=item['article'];start=item['position']
 if i+1<len(starts):end=starts[i+1]['position']
 else:
  final=norm(plain(a['contenido']));where=stream.find(final,start);assert where>=start,f'No se localizó el cierre: {a["identificador"]}';end=where+len(final)
 anchors=[{'page':s['page'],'lineId':s['lineId'],'bbox':s['bbox']} for s in spans if s['start']<end and s['end']>start];assert anchors
 mapped[a['id']]={'sourceId':f'dof-matutina-2025-11-10-{sha[:12]}','label':a['identificador'],'type':a['tipo_articulo'],'contentSha256':hashlib.sha256(a['contenido'].encode()).hexdigest(),'pageNumbers':[PAGE_NUMBER],'anchors':anchors}
 audit.append({'id':a['id'],'fragmento':a['identificador'],'paginasPdf':[PAGE_NUMBER],'paginasImpresas':[PAGE_NUMBER],'anclas':len(anchors),'prefijoCotejado':item['marker']})
source={'id':f'dof-matutina-2025-11-10-{sha[:12]}','title':'Edición matutina del Diario Oficial de la Federación · 10 de noviembre de 2025','instrumentIds':[INSTRUMENT_ID],'sha256':sha,'transport':'remote-pdf','pdfUrl':f'/api/reader/dof-matutina-2025-11-10-{sha[:12]}','originalUrl':PDF_URL,'pageCount':len(doc),'pages':[{'number':i+1,'width':p.rect.width,'height':p.rect.height} for i,p in enumerate(doc)]}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':INSTRUMENT,'instrumentId':INSTRUMENT_ID,'fuenteInstrumento':data['ley']['url_original'],'fuenteEdicion':PDF_URL,'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(raw),'paginasPdf':len(doc),'paginasImpresasDelInstrumento':[PAGE_NUMBER],'fragmentosOficiales':len(mapped),'fragmentosExcluidos':[{'id':a['id'],'identificador':a['identificador']} for a in excluded],'anclasGeometricas':sum(len(a['anchors']) for a in mapped.values()),'fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{INSTRUMENT}: {len(mapped)} fragmentos, página impresa {PAGE_NUMBER}, SHA-256 {sha}')
for x in audit:print('-',x['fragmento'],x['anclas'],'anclas')
