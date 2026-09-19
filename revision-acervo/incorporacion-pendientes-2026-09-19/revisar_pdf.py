"""Localiza la firma final de cada nota; extrae y renderiza sólo sus páginas."""
from pathlib import Path
import json,re,unicodedata,collections
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'revision-visual';OUT.mkdir(exist_ok=True)
norm=lambda t:re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',t.lower()))
tokens=lambda t:collections.Counter(re.findall(r'\w+',unicodedata.normalize('NFKC',t).lower()))
reports=[]
for s in json.loads((ROOT/'fuentes.json').read_text(encoding='utf8')):
 name=s['name'];blocks=json.loads((ROOT/f'fuentes/{name}.bloques.json').read_text(encoding='utf8'))['bloques']
 doc=pdfium.PdfDocument(ROOT/f'fuentes/{name}-edicion.pdf');first=s['pagina'];end=norm(blocks[-1]['texto'])[-90:];texts=[];pages=[]
 for i in range(first-1,min(len(doc),first+100)):
  page=doc[i];txt=page.get_textpage().get_text_range();texts.append(txt);pages.append(i+1)
  (ROOT/f'fuentes/{name}-pdf-pagina-{i+1}.txt').write_text(txt,encoding='utf8')
  if end in norm(txt):break
 else:raise AssertionError('No se localizó el final: '+name)
 full='\n'.join(texts);(ROOT/f'fuentes/{name}-pdf-texto.txt').write_text(full,encoding='utf8')
 # Render every page of the selected note for visual checks, never the entire daily edition.
 for number in pages:doc[number-1].render(scale=1.25).to_pil().save(OUT/f'{name}-{number}.png')
 clean='\n'.join(l for l in full.splitlines()if 'DIARIO OFICIAL'not in l and l.strip()not in ['PODER EJECUTIVO','SECRETARIA DE ENERGIA'])
 a=tokens(' '.join(b['texto']for b in blocks));z=tokens(clean)
 result=dict(instrumento=name,paginas=pages,html_no_pdf=dict(a-z),pdf_no_html=dict(z-a))
 reports.append(result);print(json.dumps(result,ensure_ascii=False))
(ROOT/'COTEJO-PDF-diferencias.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
