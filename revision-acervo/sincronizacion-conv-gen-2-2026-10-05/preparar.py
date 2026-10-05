"""Build page and geometry maps for the official second generation call."""
import hashlib, html, json, re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT=Path(__file__).resolve().parent
PACKAGE=Path('revision-acervo/incorporacion-convocatorias-2026-09-17')
PDF=Path('tmp/conv-gen-2.pdf')
PDF_URL='https://sidof.segob.gob.mx/notas/getNewsletter/11-05-2026/Vespertina/327245'
INSTRUMENT='CONV-GEN-2'
INSTRUMENT_ID='2dde9c74-5c23-507b-a0ae-5d3b4722d927'
EXPECTED_SHA256='f441289bcfc269955d8f63020cb1c25e8cd3bdfa9b65eefd6061a7481bce7a2f'
EXPECTED_PAGES=30
FIRST_PDF_PAGE=2
LAST_PDF_PAGE=19

def plain(value):
    value=re.sub(r'<!--.*?-->',' ',value,flags=re.S)
    value=re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>',' ',value,flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>',' ',value))

def norm(value):
    value=unicodedata.normalize('NFKD',value).lower().replace('\u00ad','')
    return ''.join(c for c in value if c.isalnum())

def first_segment(content):
    segments=re.split(r'(?:\.{3,}|…+)',plain(content))
    candidates=[(s.strip(' \t\r\n"“”'),norm(s)) for s in segments]
    return next(((s,n) for s,n in candidates if len(n)>=50),next(((s,n) for s,n in candidates if n),(None,'')))

data=json.loads((PACKAGE/f'{INSTRUMENT}-carga.json').read_text(encoding='utf-8'))
assert data['ley']['id']==INSTRUMENT_ID
pdf_bytes=PDF.read_bytes();sha=hashlib.sha256(pdf_bytes).hexdigest();assert sha==EXPECTED_SHA256
document=pymupdf.open(PDF);assert len(document)==EXPECTED_PAGES
official=[a for a in data['articulos'] if not a['identificador'].lower().startswith('nota editorial') and a['identificador'].lower()!='índice de la publicación']
excluded=[a for a in data['articulos'] if a not in official]
assert len(official)==34 and len(excluded)==2

parts=[];spans=[];pages=[];offset=0
for n in range(FIRST_PDF_PAGE,LAST_PDF_PAGE+1):
    page=document[n-1];pages.append({'number':n,'width':page.rect.width,'height':page.rect.height});line_id=0
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            text=''.join(s['text'] for s in line['spans']);token=norm(text)
            if token:
                spans.append({'page':n,'lineId':line_id,'start':offset,'end':offset+len(token),'bbox':list(line['bbox'])})
                parts.append(token);offset+=len(token)
            line_id+=1
    # This edition embeds the 14.4 performance graph as a single raster image.
    if n==19:
        parts.append('graficalmacenamientodeenergia')
        offset+=len('graficalmacenamientodeenergia')
stream=''.join(parts)

starts=[];cursor=0
for article in official:
    marker_text,marker=first_segment(article['contenido']);assert len(marker)>=10,article['identificador']
    found=-1;used=0
    for size in (180,140,100,75,55,40,35,25,20,15,10):
        candidate=marker[:size];found=stream.find(candidate,cursor)
        if found>=0:used=len(candidate);break
    if found<0:
        page_hits=[n for n in range(FIRST_PDF_PAGE,LAST_PDF_PAGE+1) if marker[:25] in norm(document[n-1].get_text())]
        print('DEBUG',article['identificador'],marker[:120],page_hits)
        raise ValueError(f'No se localizó el inicio del fragmento: {article["identificador"]}')
    starts.append({'position':found,'article':article,'marker':marker[:used]})
    cursor=found+max(1,used-1)

mapped={};audit=[]
for index,item in enumerate(starts):
    article=item['article'];start=item['position']
    if index+1<len(starts):end=starts[index+1]['position']
    else:
        final=norm(plain(article['contenido']));where=stream.find(final,start)
        assert where>=start,f'No se localizó el cierre de {article["identificador"]}'
        end=where+len(final)
    anchors=[{'page':s['page'],'lineId':s['lineId'],'bbox':s['bbox']} for s in spans if s['start']<end and s['end']>start]
    if article['identificador']=='Numeral 14.4':
        anchors.append({'page':19,'lineId':-1,'bbox':[84.96,316.56,527.28,502.62],'kind':'graphic'})
    assert anchors,article['identificador']
    page_numbers=sorted({a['page'] for a in anchors})
    mapped[article['id']]={'sourceId':f'dof-vespertina-2026-05-11-{sha[:12]}','label':article['identificador'],'type':article['tipo_articulo'],
        'contentSha256':hashlib.sha256(article['contenido'].encode()).hexdigest(),'pageNumbers':page_numbers,'anchors':anchors}
    audit.append({'id':article['id'],'fragmento':article['identificador'],'paginasPdf':page_numbers,'paginasImpresas':page_numbers,'anclas':len(anchors),'prefijoCotejado':item['marker']})

source={'id':f'dof-vespertina-2026-05-11-{sha[:12]}','title':'Edición vespertina del Diario Oficial de la Federación · 11 de mayo de 2026',
    'instrumentIds':[INSTRUMENT_ID],'sha256':sha,'transport':'remote-pdf','pdfUrl':f'/api/reader/dof-vespertina-2026-05-11-{sha[:12]}',
    'originalUrl':PDF_URL,'pageCount':len(document),'pages':[{'number':i+1,'width':p.rect.width,'height':p.rect.height} for i,p in enumerate(document)]}
(ROOT/'map.json').write_text(json.dumps({'source':source,'articles':mapped},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'cotejo.json').write_text(json.dumps({'instrumento':INSTRUMENT,'instrumentId':INSTRUMENT_ID,'fuenteInstrumento':data['ley']['url_original'],'fuenteEdicion':PDF_URL,
    'archivoTemporal':str(PDF),'sha256':sha,'bytes':len(pdf_bytes),'paginasPdf':len(document),'paginasImpresasDelInstrumento':[FIRST_PDF_PAGE,LAST_PDF_PAGE],
    'fragmentosOficiales':len(mapped),'fragmentosExcluidos': [{'id':a['id'],'identificador':a['identificador']} for a in excluded],
    'anclasGeometricas':sum(len(a['anchors']) for a in mapped.values()),'grafica':{'fragmento':'Numeral 14.4','paginaPdf':19,'bbox':[84.96,316.56,527.28,502.62]},
    'fragmentos':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{INSTRUMENT}: {len(mapped)} fragmentos, {sum(len(x["anchors"]) for x in mapped.values())} anclas; páginas impresas 2–19; SHA-256 {sha}')
for row in audit:print('-',row['fragmento'],row['paginasPdf'],row['anclas'],'anclas')
