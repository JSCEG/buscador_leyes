"""Localiza el cierre de cada publicación y prepara muestras visuales del PDF oficial."""
from pathlib import Path
import json,re,unicodedata
import pypdfium2 as pdfium
R=Path(__file__).resolve().parent;out=R/'revision-visual';out.mkdir(exist_ok=True)
norm=lambda t:re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',t.lower()))
result=[]
for s in json.loads((R/'fuentes.json').read_text(encoding='utf8')):
 name=s['name'];b=json.loads((R/f'fuentes/{name}.bloques.json').read_text(encoding='utf8'))['bloques'];d=pdfium.PdfDocument(R/f'fuentes/{name}-edicion.pdf');start=s['pagina']
 txt=[p.get_textpage().get_text_range()for p in d]
 if name=='FORMATOS-BIOCOMBUSTIBLES':
  heading=norm(b[2929]['texto']);hits=[i for i,t in enumerate(txt)if heading in norm(t)]
  assert hits; first=hits[-1]; marker='nombreyfirmadelapersonasolicitante'
  end=next(i+1 for i in range(first,len(txt))if marker in norm(txt[i]))
 elif name=='CATALOGO-CONUEE':
  heading=norm(b[151]['texto']);hits=[i for i,t in enumerate(txt)if heading in norm(t)];assert hits
  end=hits[-1]+1
 else:
  meaningful=next(x['texto']for x in reversed(b)if len(norm(x['texto']))>8)
  tail=norm(meaningful)[-80:]
  end=next(i+1 for i in range(start-1,len(txt))if tail in norm(' '.join(txt[max(start-1,i-1):i+1])))
 (R/f'fuentes/{name}-pdf-texto.txt').write_text('\n'.join(txt[start-1:end]),encoding='utf8')
 samples={start,end}
 if name=='FORMATOS-BIOCOMBUSTIBLES':samples.update([start+3,end-1])
 if name=='CATALOGO-CONUEE':samples.update([end-4,end-2])
 for p in sorted(samples):d[p-1].render(scale=1.2).to_pil().save(out/f'{name}-{p}.png')
 item=dict(instrumento=name,pagina_inicial=start,pagina_final=end,paginas=end-start+1,muestras_visuales=sorted(samples),final_localizado=True,limite='Alcance y muestras del PDF. La comparación textual y de celdas íntegra se realiza contra el HTML oficial. Los formularios gráficos conservan sus imágenes originales.')
 result.append(item);print(json.dumps(item,ensure_ascii=False))
(R/'ALCANCE-PDF.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
