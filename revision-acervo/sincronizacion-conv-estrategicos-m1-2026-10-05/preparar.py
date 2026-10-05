"""Build precise page anchors for the first strategic-projects call amendment."""
import hashlib, html, json, re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path(__file__).resolve().parent
PACKAGE = Path('revision-acervo/incorporacion-convocatorias-2026-09-17')
PDF = Path('tmp/conv-estrategicos-m1.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/26-05-2026/Matutina/327526'
INSTRUMENT = 'CONV-ESTRATEGICOS-M1'
INSTRUMENT_ID = '373ce6df-4e78-59d9-aae5-54007a446c59'
EXPECTED_SHA256 = '1a28d5fb75ec9451422ff890b18ba71cec4a3cd92b2d4c47b90fde9c6253ed38'
EXPECTED_PAGES = 620
FIRST_PDF_PAGE = LAST_PDF_PAGE = 45

def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', ' ', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))

def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())

def first_segment(content):
    segments = re.split(r'(?:\.{3,}|…+)', plain(content))
    candidates = [(s.strip(' \t\r\n"“”'), norm(s)) for s in segments]
    return next(((s,n) for s,n in candidates if len(n)>=50), next(((s,n) for s,n in candidates if n), (None,'')))

data = json.loads((PACKAGE / f'{INSTRUMENT}-carga.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
pdf_bytes = PDF.read_bytes(); sha = hashlib.sha256(pdf_bytes).hexdigest()
assert sha == EXPECTED_SHA256
document = pymupdf.open(PDF); assert len(document) == EXPECTED_PAGES
official = [a for a in data['articulos'] if not a['identificador'].lower().startswith('nota editorial')]
assert len(official) == 5
page = document[FIRST_PDF_PAGE - 1]
pages = [{'number': FIRST_PDF_PAGE, 'width': page.rect.width, 'height': page.rect.height}]
stream_parts, spans, offset = [], [], 0
for line_id, line in enumerate(l for block in page.get_text('dict')['blocks'] for l in block.get('lines', [])):
    text = ''.join(span['text'] for span in line['spans']); token = norm(text)
    if token:
        spans.append({'page': FIRST_PDF_PAGE, 'lineId': line_id, 'start': offset, 'end': offset+len(token), 'bbox': list(line['bbox'])})
        stream_parts.append(token); offset += len(token)
stream = ''.join(stream_parts)
starts=[]; cursor=0
for article in official:
    marker_text, marker = first_segment(article['contenido'])
    assert len(marker)>=10, article['identificador']
    found=-1; used=0
    for size in (180,140,100,75,55,40,35,25,20,15,10):
        candidate=marker[:size]; found=stream.find(candidate,cursor)
        if found>=0: used=len(candidate); break
    if found<0: raise ValueError(f'No se localizó el inicio: {article["identificador"]}')
    starts.append({'position':found,'article':article,'marker':marker[:used]})
    cursor=found+max(1,used-1)

mapped={}; audit=[]
for i,item in enumerate(starts):
    article=item['article']; start=item['position']
    if i+1<len(starts): end=starts[i+1]['position']
    else:
        end_text=norm(plain(article['contenido'])); end_start=stream.find(end_text,start)
        assert end_start>=start, f'No se localizó el cierre: {article["identificador"]}'
        end=end_start+len(end_text)
    anchors=[{'page':s['page'],'lineId':s['lineId'],'bbox':s['bbox']} for s in spans if s['start']<end and s['end']>start]
    assert anchors, article['identificador']
    mapped[article['id']]={'sourceId':f'dof-matutina-2026-05-26-{sha[:12]}','label':article['identificador'],'type':article['tipo_articulo'],
        'contentSha256':hashlib.sha256(article['contenido'].encode()).hexdigest(),'pageNumbers':[45],'anchors':anchors}
    audit.append({'id':article['id'],'fragmento':article['identificador'],'paginasPdf':[45],'paginasImpresas':[45],'anclas':len(anchors),'prefijoCotejado':item['marker']})

source={'id':f'dof-matutina-2026-05-26-{sha[:12]}','title':'Edición matutina del Diario Oficial de la Federación · 26 de mayo de 2026',
    'instrumentIds':[INSTRUMENT_ID],'sha256':sha,'transport':'remote-pdf','pdfUrl':f'/api/reader/dof-matutina-2026-05-26-{sha[:12]}',
    'originalUrl':PDF_URL,'pageCount':len(document),'pages':[{'number':i+1,'width':p.rect.width,'height':p.rect.height} for i,p in enumerate(document)]}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':INSTRUMENT,'instrumentId':INSTRUMENT_ID,'fuenteInstrumento':data['ley']['url_original'],
    'fuenteEdicion':PDF_URL,'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(document),'paginasImpresasDelInstrumento':[45],
    'fragmentosOficiales':len(mapped),'anclasGeometricas':sum(len(m['anchors']) for m in mapped.values()),'fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{INSTRUMENT}: {len(mapped)} fragmentos, páginas impresas 45, SHA-256 {sha}')
for row in audit: print('-',row['fragmento'],row['anclas'],'anclas')
