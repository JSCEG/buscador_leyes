"""Controles léxicos con diferencias de edición identificadas, nunca ignoradas."""
from pathlib import Path
from collections import Counter
import re,json,unicodedata
ROOT=Path(__file__).resolve().parent
tokens=lambda text:Counter(re.findall(r'\w+',unicodedata.normalize('NFKC',text).lower()))
results=[]
for s in json.loads((ROOT/'fuentes.json').read_text(encoding='utf8')):
 name=s['name'];blocks=json.loads((ROOT/f'fuentes/{name}.bloques.json').read_text(encoding='utf8'))['bloques']
 text=(ROOT/f'fuentes/{name}-pdf-texto.txt').read_text(encoding='utf8')
 text='\n'.join(l for l in text.splitlines()if not re.search(r'(?:DIARIO OFICIAL.*\d{4}|\d{4}.*DIARIO OFICIAL)',l) and l.strip()not in ['PODER EJECUTIVO','SECRETARIA DE ENERGIA'])
 observations=[]
 if name=='MIGRACION-ACLARACION':
  # The bottom of page 107 contains an unrelated DOF pricing notice.
  text=text.split('\nAVISO')[0]
  # The second repeated heading differs in HTML vs PDF. Preserve HTML verbatim
  # and document the discrepancy; compare all remaining paragraphs and cells.
  text=re.sub(r'\s+',' ',text)
  prefix,tail=text.split('se emite la siguiente:',1)
  heading,body=tail.split('En la publicación del 18 de junio',1)
  assert heading.strip().startswith('NOTA ACLARATORIA AL ACUERDO POR EL QUE SE EMITEN')
  text=prefix+'se emite la siguiente: En la publicación del 18 de junio'+body
  html=' '.join(b['texto']for b in blocks if b['id']!=4)
  observations.append('Se conserva íntegro el HTML oficial. Su segundo encabezado (bloque 4) tiene redacción distinta del PDF; ambos identifican la misma nota. El cuerpo, ambas tablas y firma coinciden. Se excluye del cotejo el aviso de precios del DOF situado después de la firma, ajeno a esta nota.')
 else:html=' '.join(b['texto']for b in blocks)
 missing,extra=tokens(html)-tokens(text),tokens(text)-tokens(html)
 expected={'etapa':2,'fechas':2}if name=='MIGRACION-MODIFICACION'else{}
 assert not missing and dict(extra)==expected,(name,missing,extra)
 if expected:observations.append('El PDF repite los encabezados Etapa y Fechas al continuar las dos tablas entre páginas. La versión HTML conserva cada tabla completa con un encabezado.')
 results.append(dict(instrumento=name,cotejo_aprobado=True,cuerpo_sin_omisiones_detectadas=True,observaciones=observations,limite='El cotejo léxico se complementa con comparación exacta de celdas, bloques, numeración y muestras visuales.'))
(ROOT/'COTEJO-PDF.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(results,ensure_ascii=False))
