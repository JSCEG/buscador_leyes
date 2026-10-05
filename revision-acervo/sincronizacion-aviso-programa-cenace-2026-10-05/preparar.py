"""Map the official CENACE program notice to its DOF page."""
import hashlib,html,json,re,sys,unicodedata
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python');import pymupdf
ROOT=Path(__file__).resolve().parent;DATA=ROOT/'articulos-verificados.json';PDF=Path('tmp/dof-2026-04-30-matutina.pdf')
PDF_URL='https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=30042026-MAT.pdf&repo='
INSTRUMENT_ID='f17cb3b7-0f09-5a97-8c90-47812c921dbd';SOURCE_DATE='2026-04-30';PAGE=189
EXPECTED_SHA256='8c7956f18f1e1c92ae928fba2e72ab33ca5a86565116b83cf869a39ab1b2de8b';EXPECTED_PAGES=314
def plain(value):
 value=re.sub(r'<!--.*?-->',' ',value,flags=re.S);value=re.sub(r'<br\\s*/?>|</(?:div|p|li|tr|h[1-6])\\s*>',' ',value,flags=re.I);return html.unescape(re.sub(r'<[^>]+>',' ',value))
def norm(value):
 value=unicodedata.normalize('NFKD',value).lower().replace('\\u00ad','');return ''.join(c for c in value if c.isalnum())
data=json.loads(DATA.read_text(encoding='utf8'));assert data['ley']['id']==INSTRUMENT_ID and len(data['articulos'])==4
pdf_bytes=PDF.read_bytes();sha=hashlib.sha256(pdf_bytes).hexdigest();assert sha==EXPECTED_SHA256,f'Cambió el PDF oficial: {sha}'
doc=pymupdf.open(PDF);assert len(doc)==EXPECTED_PAGES
page=doc[PAGE-1];pages=[{'number':i+1,'width':p.rect.width,'height':p.rect.height} for i,p in enumerate(doc)]
lines=[];parts=[];offset=0;line_id=0
for block in page.get_text('dict')['blocks']:
 for line in block.get('lines',[]):
  token=norm(''.join(span['text'] for span in line['spans']))
  if token:lines.append({'page':PAGE,'lineId':line_id,'start':offset,'end':offset+len(token),'bbox':list(line['bbox'])});parts.append(token);offset+=len(token)
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
 anchors=[{'page':PAGE,'lineId':line['lineId'],'bbox':line['bbox']} for line in lines if line['start']<end and line['end']>start];assert anchors,article['identificador']
 mapped[article['id']]={'sourceId':source_id,'label':article['identificador'],'type':article['tipo_articulo'],'contentSha256':hashlib.sha256(article['contenido'].encode()).hexdigest(),'pageNumbers':[PAGE],'anchors':anchors}
 audit.append({'id':article['id'],'fragmento':article['identificador'],'paginasPdf':[PAGE],'paginasImpresas':[PAGE],'anclas':len(anchors),'prefijoCotejado':item['marker']})
source={'id':source_id,'title':'Diario Oficial de la Federación · edición matutina del 30 de abril de 2026','instrumentIds':[INSTRUMENT_ID],'sha256':sha,'transport':'remote-pdf','pdfUrl':f'/api/reader/{source_id}','originalUrl':PDF_URL,'pageCount':len(doc),'pages':pages}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':data['ley']['title'],'instrumentId':INSTRUMENT_ID,'fuenteInstrumento':data['ley']['source'],'fuenteEdicion':PDF_URL,'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(doc),'paginasImpresasDelInstrumento':[PAGE,PAGE],'fragmentosOficiales':len(mapped),'anclasGeometricas':sum(len(v['anchors']) for v in mapped.values()),'notaAlcance':'Los cuatro fragmentos oficiales se cotejaron con la página impresa 189 de la edición matutina. Se excluyó la nota editorial del buscador. El PDF temporal no se incluye en el repositorio.','fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'AVISO-PROGRAMA-CENACE: {len(mapped)} fragmentos; página {PAGE}; {sum(len(v["anchors"]) for v in mapped.values())} anclas; SHA-256 {sha}')
for x in audit:print('-',x['fragmento'],x['paginasPdf'],x['anclas'],'anclas')

