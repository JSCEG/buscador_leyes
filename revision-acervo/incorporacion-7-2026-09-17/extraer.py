"""Extrae las seis fuentes de Diputados conservando coordenadas y márgenes."""
from pathlib import Path
import json,re,hashlib
import pymupdf
ROOT=Path(__file__).resolve().parent
for name in ['LCNE','LSH','LEPECFE','LEPEPM','LBio','LGeo']:
    doc=pymupdf.open(ROOT/'fuentes'/f'{name}.pdf');lines=[];excluded=[]
    for pn,page in enumerate(doc,1):
        physical=[]
        for block in page.get_text('dict')['blocks']:
            for ln in block.get('lines',[]):
                value=''.join(s['text'] for s in sorted(ln['spans'],key=lambda s:s['bbox'][0])).strip()
                if not value:continue
                box=list(ln['bbox']);entry=dict(pagina=pn,texto=value,bbox=box)
                if box[1]<90 or box[1]>=735:excluded.append(entry)
                else:physical.append(entry)
        physical.sort(key=lambda x:(round(x['bbox'][1],1),x['bbox'][0]));grouped=[]
        for ln in physical:
            if grouped and abs(ln['bbox'][1]-grouped[-1][0]['bbox'][1])<2:grouped[-1].append(ln)
            else:grouped.append([ln])
        for group in grouped:
            group.sort(key=lambda x:x['bbox'][0]);boxes=[x['bbox']for x in group]
            value=re.sub(r'\s+',' ',' '.join(x['texto']for x in group)).strip()
            lines.append(dict(id=len(lines),pagina=pn,texto=value,bbox=[min(x[0]for x in boxes),min(x[1]for x in boxes),max(x[2]for x in boxes),max(x[3]for x in boxes)]))
    data=dict(paginas=len(doc),lineas=lines,excluidas=excluded)
    (ROOT/'fuentes'/f'{name}.lineas.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
    (ROOT/'fuentes'/f'{name}.txt').write_text('\n'.join(x['texto']for x in lines),encoding='utf8')
    print(name,'pages',len(doc),'lines',len(lines),'margins',sorted(set(x['texto']for x in excluded))[:10])
    print('  article markers',len([x for x in lines if re.match(r'^Artículo \d+\s*[.-]',x['texto'])]),'trans',[(x['pagina'],x['id'])for x in lines if re.fullmatch('Transitorios',x['texto'],re.I)])
