"""Extrae evidencia de los PDF; no lee credenciales ni escribe en Supabase."""
import json,re,hashlib
from pathlib import Path
from collections import Counter
import fitz
root=Path(__file__).resolve().parent
for file in (root/'fuentes').glob('*.pdf'):
    pages=[]; frequency=Counter()
    with fitz.open(file) as doc:
        for n,page in enumerate(doc,1):
            spans=[s for b in page.get_text('dict')['blocks'] if 'lines' in b for line in b['lines'] for s in line['spans'] if s['text'].strip()]
            rows=[]
            for span in sorted(spans,key=lambda s:(round(s['bbox'][1]/2),s['bbox'][0])):
                if not rows or abs(rows[-1]['y']-span['bbox'][1])>2:
                    rows.append({'y':span['bbox'][1],'parts':[]})
                rows[-1]['parts'].append(span)
            lines=[]
            for row in rows:
                row['parts'].sort(key=lambda s:s['bbox'][0])
                text=' '.join(s['text'] for s in row['parts']).strip()
                line={'pagina':n,'texto':text,'y':row['y'],'margen':row['y']<page.rect.height*.10 or row['y']>page.rect.height*.93}
                lines.append(line)
            pages.append(lines)
            frequency.update(set(l['texto'] for l in lines if l['margen']))
        body=[]; removed=[]
        for lines in pages:
            for line in lines:
                if line['margen'] and (frequency[line['texto']]>=max(2,len(pages)*.6) or re.fullmatch(r'\d+\s*(?:de|/)\s*\d+',line['texto'])):
                    removed.append(line)
                else:body.append(line)
        file.with_suffix('.txt').write_text('\n'.join(x['texto'] for x in body),encoding='utf-8')
        file.with_suffix('.paginas.json').write_text(json.dumps({'paginas':len(pages),'lineas':body,'margenes_excluidos':removed},ensure_ascii=False,indent=2),encoding='utf-8')
        print(file.stem,len(pages),'páginas',len(body),'líneas')
