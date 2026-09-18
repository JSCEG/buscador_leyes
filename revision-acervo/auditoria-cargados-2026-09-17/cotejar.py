"""Cotejo independiente: texto, identidades y ubicación de artículos sin fragmento propio."""
from pathlib import Path
import json,re,unicodedata,collections,difflib
root=Path(__file__).resolve().parent
load=lambda n:json.loads((root/n).read_text(encoding='utf-8'))
def ws(s):return re.sub(r'\s+','',s or '')
def norm(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFD',s.lower()))
def ident(s):return re.sub(r'[.\s\-:]+','',s).lower().replace('artículo','articulo')
rows=load('supabase-articulos.json');sources=load('fuentes.json');laws=load('supabase-leyes.json')
out=[]
for source in sources:
    name=source['name']; db=sorted([x for x in rows if x['ley_id']==source['ley_id']],key=lambda x:x['orden'])
    text=(root/'fuentes'/f'{name}.alcance.txt').read_text(encoding='utf-8')
    main=re.split(r'^\s*Transitorios\s*$',text,flags=re.I|re.M)[0]
    headings=list(re.finditer(r'^\s*Artículo\s+(\d+)\s*(?:\.(?:\s*[-–])?|[-–])\s*',main,re.I|re.M))
    source_articles=[]
    for i,m in enumerate(headings):
        num=int(m[1]); content=main[m.end():headings[i+1].start() if i+1<len(headings) else len(main)].strip()
        source_articles.append({'num':num,'content':content})
    seen={int(m[1]) for x in db if x['tipo_articulo']=='ordinario' and (m:=re.fullmatch(r'Artículo\s+(\d+)[.\s\-]*',x['identificador'],re.I))}
    missing=[]
    for article in source_articles:
        if article['num'] in seen:continue
        # Una firma inicial de 140 caracteres normalizados localiza contenido fusionado o mal rotulado.
        needle=norm(article['content'])[:45]
        matches=[]
        for x in db:
            body=norm(x['contenido'])
            if not needle or needle not in body:continue
            lo,hi=len(needle),min(500,len(norm(article['content'])))
            while lo<hi:
                mid=(lo+hi+1)//2
                if norm(article['content'])[:mid] in body:lo=mid
                else:hi=mid-1
            matches.append({'id':x['id'],'label':x['identificador'],'order':x['orden'],'offset_normalizado':body.find(needle),'prefijo_coincidente':lo,'first':x['contenido'][:100]})
        matches.sort(key=lambda x:x['prefijo_coincidente'],reverse=True)
        missing.append({'num':article['num'],'source_start':article['content'][:200],'matches':matches})
    candidate=load(f'fuentes/{name}.candidatos.json')['chunks']
    byid=collections.defaultdict(list)
    for c in candidate:byid[ident(c['identificador'].replace('Numeral ','').replace('Disposición ',''))].append(c)
    comparisons=[]
    for row in db:
        key=ident(row['identificador'].replace('Lineamiento ',''))
        choices=byid[key]
        body=re.sub(r'^\s*[-–]\s*','',row['contenido'] or '')
        matches=[]
        for c in choices:
            src=re.sub(r'^\s*[-–]\s*','',c['contenido'])
            d,s=ws(body),ws(src)
            if d==s:status='igual_sin_espacios'
            elif norm(d)==norm(s):status='solo_signos_o_acentos'
            elif norm(s) and norm(s) in norm(d):status='fuente_mas_texto_en_bd'
            elif norm(d) and norm(d) in norm(s):status='fragmento_parcial_en_bd'
            else:status='diferencia'
            matches.append({'status':status,'source_len':len(src),'source_first':src[:150],'source_last':src[-150:]})
        comparisons.append({'id':row['id'],'label':row['identificador'],'db_len':len(body),'matches':matches})
    result={'name':name,'source_numeric_count':len(source_articles),'source_numeric_range':[min((a['num'] for a in source_articles),default=0),max((a['num'] for a in source_articles),default=0)],'source_duplicate_numbers':[k for k,n in collections.Counter(x['num'] for x in source_articles).items() if n>1],'missing_standalone':missing,'comparisons':comparisons}
    out.append(result)
    print(name,'fuente:',result['source_numeric_count'],'sin fragmento propio:',[(x['num'],[y['label'] for y in x['matches']])for x in missing],'cotejo:',dict(collections.Counter(c['matches'][0]['status'] if c['matches'] else 'sin_candidato' for c in comparisons)))
(root/'cotejo.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
