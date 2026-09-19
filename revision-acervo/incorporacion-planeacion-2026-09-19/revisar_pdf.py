"""Cotejo de alcance y muestras visuales. Las figuras no se convierten en texto."""
from pathlib import Path
import json,re,unicodedata
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'revision-visual';OUT.mkdir(exist_ok=True)
norm=lambda t:re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',t.lower()))
results=[]
SCOPE={'PLADESE':(112,1215,[45,102,108,111,112]),'PROSENER-DECRETO':(6,18,[5,6]),'PROSENER':(50,473,[28,39,47,50]),'PLADESHI':(125,1522,[20,71,116,124,125])}
for s in json.loads((ROOT/'fuentes.json').read_text(encoding='utf8')):
 name=s['name'];blocks=json.loads((ROOT/f'fuentes/{name}.bloques.json').read_text(encoding='utf8'))['bloques']
 end_page,last_block,sample_pages=SCOPE[name]
 last=blocks[last_block]['texto']
 end=norm(last)[-80:];doc=pdfium.PdfDocument(ROOT/f'fuentes/{name}-edicion.pdf');texts=[];pages=[]
 for i in range(s['pagina']-1,end_page):
  page=doc[i];txt=page.get_textpage().get_text_range();texts.append(txt);pages.append(i+1)
 assert end in norm(' '.join(texts[-2:])), 'Final revisado no localizado '+name
 (ROOT/f'fuentes/{name}-pdf-texto.txt').write_text('\n'.join(texts),encoding='utf8')
 samples={pages[0],pages[-1],*sample_pages}
 for p in sorted(samples):doc[p-1].render(scale=1.2).to_pil().save(OUT/f'{name}-{p}.png')
 result=dict(instrumento=name,pagina_inicial=pages[0],pagina_final=pages[-1],paginas=len(pages),muestras_visuales=sorted(samples),final_localizado=True,limite='El contenido de las figuras se conserva como imagen oficial por liga. No se declara equivalencia OCR ni cotejo léxico integral de las imágenes.')
 results.append(result);print(json.dumps(result,ensure_ascii=False))
(ROOT/'ALCANCE-PDF.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
