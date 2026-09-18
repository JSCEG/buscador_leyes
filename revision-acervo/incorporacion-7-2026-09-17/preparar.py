"""Perfiles cerrados para las seis fuentes restantes. Conserva cada línea del cuerpo.

No es un parser universal ni realiza escrituras remotas. Los conteos y hashes fijan
las fuentes revisadas; cualquier versión nueva exige cotejo de nuevo.
"""
from pathlib import Path
import re,json,collections,hashlib,unicodedata
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
PROFILE={'LSH':(166,[23,2],'1405f36fd836ff74d059ebe7e50ae439cbb9e5e291a317514667f34a26f72a23'),'RICNE':(38,[8],'3c81e568b264cc282daafe8cb0b6f736d4fa94c423ba7720b2b52f9b5f36fd50'),'LEPECFE':(131,[18,2],'6e45ab84a076cbd9cfd5fbd8abbe5f2d88fbd767229f21f5e7327aaf692b22a5'),'LEPEPM':(126,[21,2],'e090d2278f98a33ce43b69070c3bbbec5e3b7177f0ffdbee8d4c9bf29c36c317'),'LBio':(46,[13,2],'c1870db657a6564bbeb692a1778472db811a920626822de553ff5ca5194f95b4'),'LGeo':(66,[8,2],'67309bf186af42de0f9e98010d38c89598676faea7f2b558ac9c9e6736d64d35')}
ORD=['Primero','Segundo','Tercero','Cuarto','Quinto','Sexto','Séptimo','Octavo','Noveno','Décimo']
ORD+=['Décimo '+x for x in ORD[:9]]+['Vigésimo']+['Vigésimo '+x for x in ORD[:9]]
ARTICLE=re.compile(r'^Artículo\s+(\d+)\s*\.(?:\s*[-–])?\s*',re.I)
TRANS=re.compile(r'^('+'|'.join(sorted(ORD,key=len,reverse=True))+r')\s*\.(?:\s*[-–])?\s*',re.I)
HEAD=re.compile(r'^(TÍTULO|CAPÍTULO|SECCIÓN)\s+(?:[IVXLCDM]+|ÚNIC[OA]|PRIMER[OA]|SEGUND[OA]|TERCER[OA]|CUART[OA]|QUINT[OA]|SEXT[OA]|SÉPTIM[OA]|OCTAV[OA]|NOVEN[OA]|DÉCIM[OA])$',re.I)
compact=lambda s:re.sub(r'\s+','',s)
norm=lambda s:''.join(x for x in unicodedata.normalize('NFD',s.lower())if not unicodedata.combining(x))
def join(items):
    out='';prev=None
    for ln in items:
        s=ln['texto']
        paragraph=prev is not None and ('bbox'not in ln or (ln['pagina']==prev['pagina']and ln['bbox'][1]-prev['bbox'][3]>6) or re.match(r'^(?:[IVXLCDM]+\.|[a-z]\))\s',s) or (ln.get('pagina')!=prev.get('pagina')and prev['texto'].endswith('.')))
        out+=('\n\n'if paragraph else' 'if prev else'')+s;prev=ln
    assert compact(out)==compact(''.join(x['texto']for x in items))
    return out
def parse(name):
    expected,counts,sha=PROFILE[name]
    if name=='RICNE':
        assert hashlib.sha256((ROOT/'fuentes/RICNE.html').read_bytes()).hexdigest()==sha
        lines=[dict(id=i,texto=t.strip(),linea_html=i+1)for i,t in enumerate((ROOT/'fuentes/RICNE.txt').read_text(encoding='utf8').splitlines())if t.strip()]
        for i,ln in enumerate(lines):ln['id']=i
    else:
        assert hashlib.sha256((ROOT/'fuentes'/f'{name}.pdf').read_bytes()).hexdigest()==sha
        data=load(ROOT/'fuentes'/f'{name}.lineas.json');lines=data['lineas']
        assert all(re.match(r'^\d+ de \d+$|^LEY |^CÁMARA|^Secretaría |^Nueva Ley',x['texto'])for x in data['excluidas']),'Exclusión distinta de márgenes'
    markers=[i for i,x in enumerate(lines)if re.fullmatch('Transitorios',x['texto'],re.I)]
    assert len(markers)==len(counts),(name,'bloques transitorios')
    articles=[(i,ARTICLE.match(x['texto']))for i,x in enumerate(lines[:markers[0]])if ARTICLE.match(x['texto'])]
    assert [int(m[1])for i,m in articles]==list(range(1,expected+1)),(name,'secuencia ordinaria')
    chunks=[];themes=[];ownership={};state=dict(titulo_nombre=None,capitulo_nombre=None,seccion_nombre=None)
    def own(items,owner):
        for x in items:assert x['id']not in ownership;ownership[x['id']]=owner
    def add(items,label,kind,prefix=''):
        if not items:return
        text=join(items);assert text.startswith(prefix)
        body=text[len(prefix):].strip();assert body
        row=dict(identificador=label,tipo_articulo=kind,contenido=body,**state,prefijo_fuente=prefix,lineas_origen=[x['id']for x in items],paginas=sorted({x['pagina']for x in items if 'pagina'in x}))
        assert compact(prefix+body)==compact(''.join(x['texto']for x in items))
        chunks.append(row);own(items,label)
    def split_heads(items):
        positions=[i for i,x in enumerate(items)if HEAD.fullmatch(x['texto'])]
        if not positions:return items,[]
        start=positions[0];tail=items[start:]
        assert len(tail)<=18 and all(len(x['texto'])<240 and not re.search(r'[.;!?]$',x['texto'])for x in tail),(name,'encabezado dudoso',tail)
        return items[:start],tail
    def structure(items):
        groups=[]
        for ln in items:
            if HEAD.fullmatch(ln['texto']):groups.append([ln])
            else:assert groups;groups[-1].append(ln)
        for group in groups:
            level=norm(group[0]['texto'].split()[0]);h=' — '.join([group[0]['texto'],' '.join(x['texto']for x in group[1:])]).rstrip(' —')
            if level=='titulo':state.update(titulo_nombre=h,capitulo_nombre=None,seccion_nombre=None)
            elif level=='capitulo':state.update(capitulo_nombre=h,seccion_nombre=None)
            else:state['seccion_nombre']=h
            theme=dict(nivel=level,nombre=h,orden=len(themes));themes.append(theme);own(group,'estructura:'+str(theme['orden']))
    pre,heads=split_heads(lines[:articles[0][0]]);add(pre,'Preámbulo y expedición','preambulo');structure(heads)
    for n,(at,match)in enumerate(articles):
        end=articles[n+1][0]if n+1<len(articles)else markers[0]
        body,heads=split_heads(lines[at:end]);add(body,f'Artículo {match[1]}','ordinario',match[0]);structure(heads)
    for bi,at in enumerate(markers):
        own([lines[at]],'encabezado:transitorios:'+str(bi))
        end=markers[bi+1]if bi+1<len(markers)else len(lines)
        part=lines[at+1:end]
        cut=next((i for i,x in enumerate(part)if re.match(r'^(?:ARTÍCULO [A-ZÁÉÍÓÚÑ]+ (?:A |Y )ARTÍCULO|Ciudad de México, a |Dado en )',x['texto'])),len(part))
        body=part[:cut];extras=part[cut:]
        boundaries=[(i,TRANS.match(x['texto']))for i,x in enumerate(body)if TRANS.match(x['texto'])]
        assert boundaries[0][0]==0
        assert [norm(m[1])for i,m in boundaries]==[norm(x)for x in ORD[:counts[bi]]],(name,'ordinales',bi)
        block='Transitorios del decreto'if name=='RICNE'or bi==1 else'Transitorios de la ley'
        state.update(titulo_nombre=block,capitulo_nombre=None,seccion_nombre=None)
        for n,(start,m)in enumerate(boundaries):
            stop=boundaries[n+1][0]if n+1<len(boundaries)else len(body)
            label='Transitorio '+ORD[n]+' · '+('decreto'if name=='RICNE'or bi==1 else'ley')
            add(body[start:stop],label,'transitorio',m[0])
        if extras:
            state.update(titulo_nombre='Documentos complementarios',capitulo_nombre=None,seccion_nombre=None)
            add(extras,'Referencia a otros artículos del decreto'if extras[0]['texto'].startswith('ARTÍCULO')else'Firmas y promulgación','complementario')
    assert set(ownership)==set(range(len(lines))),(name,'huecos o solapamiento')
    assert len({x['identificador']for x in chunks})==len(chunks)
    assert not any(ARTICLE.search(line)for c in chunks if c['tipo_articulo']=='ordinario'for line in c['contenido'].splitlines()),'Artículo absorbido'
    assert not any(HEAD.fullmatch(line.strip())for c in chunks for line in c['contenido'].splitlines()),'Encabezado absorbido'
    result=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=sha,lineas_cuerpo=len(lines),lineas_asignadas=len(ownership),cobertura_total=True,sin_solapamientos=True,ordinarios=expected,transitorios=counts),asignacion=ownership)
    save(ROOT/f'{name}-revisado.json',result)
    print(name,dict(collections.Counter(x['tipo_articulo']for x in chunks)),len(themes),'temas',len(ownership),'líneas cotejadas')
    return result
if __name__=='__main__':
    for name in PROFILE:parse(name)
