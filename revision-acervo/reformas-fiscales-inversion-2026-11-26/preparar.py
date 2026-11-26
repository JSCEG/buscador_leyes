"""Generar paquete a partir de los HTML docFuente/{codigo} y los PDF del DOF."""
import hashlib, json, re, sys, unicodedata, uuid
from pathlib import Path
import pymupdf
from bs4 import BeautifulSoup, Tag
ROOT=Path(__file__).resolve().parent
D=Path(sys.argv[1])
def uid(s): return str(uuid.uuid5(uuid.NAMESPACE_URL,s))
def sha(b): return hashlib.sha256(b).hexdigest()
def norm(s): return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if c.isalnum())
def txt(n): return ' '.join(n.get_text(' ',strip=True).split())
def nodes(path):
    soup=BeautifulSoup(path.read_text('utf8'),'html.parser')
    result=[]
    def walk(n):
        if not isinstance(n,Tag): return
        if n.name=='table' or n.name in ['p','div','h1','h2'] and not n.find(['div','p','h1','h2','table']):
            if n.get_text(strip=True): result.append(n)
        else:
            for child in n.children: walk(child)
    walk(soup.body)
    return result
def clean(ns):
    local=BeautifulSoup('\n'.join(str(n) for n in ns),'html.parser')
    for tag in list(local.find_all(True)):
        if tag.name not in ['table','tr','td','th','thead','tbody','p','div','br','b','strong','i','em','sup','sub','h1','h2']:
            tag.unwrap()
        else: tag.attrs={k:v for k,v in tag.attrs.items() if k in ['rowspan','colspan']}
    tables=local.find_all('table')
    if len(tables)==3 and txt(tables[0]).startswith('CONCEPTO'):
        for t in tables[1:]:
            for row in t.find_all('tr'): tables[0].append(row.extract())
            t.decompose()
    for table in local.find_all('table'):
        rows=table.find_all('tr')
        count=2 if '% Deducción' in txt(rows[0]) else 1
        head=local.new_tag('thead');body=local.new_tag('tbody')
        for i,r in enumerate(rows):
            if i<count:
                for c in r.find_all('td'): c.name='th'
            (head if i<count else body).append(r.extract())
        table.append(head);table.append(body)
    return str(local).replace('\r','')
def record(url,title,code,date,kind):
    return dict(id=uid(url),titulo=title,siglas=code,fecha_publicacion=date,url_original=url,tipo=kind,vigente=None)
def article(law,label,content,order,kind):
    return dict(id=uid(law['url_original']+'#'+label),ley_id=law['id'],identificador=label,contenido=content,orden=order,tipo_articulo=kind)
docs=[('5803757','LIF-2027',13,4,51),('5803758','REF-LISR-2026',13,52,87),('5804310','REF-INVERSION-EXTRANJERA-2026',19,4,7)]
pdfs={13:('330805','5bedfcf10bb26db9b32fa25f6c6be5d067d651ff5ddb918bf1a4352a336251fa'),19:('330927','a44ff18afa678868edfa4d98aa9a6f85139135df190226585635c75671dce395')}
bases={'5803758':('LISR','Ley del Impuesto sobre la Renta','2013-12-11','lisr/LISR_orig_11dic13.pdf'),'5804310':('LIE','Ley de Inversión Extranjera','1993-12-27','lie/LIE_orig_27dic93_ima.pdf')}
sources={};maps={};packs=[];audits=[]
for code,sig,day,first,last in docs:
    pdf=D/f'{day}.pdf'; ref,digest=pdfs[day]; assert sha(pdf.read_bytes())==digest
    doc=pymupdf.open(pdf); sid=f'dof-matutina-202611{day}-{digest[:12]}'
    url='https://sidof.segob.gob.mx/notas/'+code
    ns=nodes(D/(code+'.html'))
    law=record(url,txt(ns[0]) if code!='5803757' else 'Ley de Ingresos de la Federación para el Ejercicio Fiscal de 2027',sig,f'2026-11-{day}','ley' if code=='5803757' else 'decreto')
    source=sources.setdefault(sid,dict(id=sid,title=f'DOF · {day} de noviembre de 2026',transport='remote-pdf',instrumentIds=[],sha256=digest,pdfUrl='/api/reader/'+sid,originalUrl=f'https://sidof.segob.gob.mx/notas/getNewsletter/{day}-11-2026/Matutina/{ref}',pageCount=len(doc),pages=[dict(number=p.number+1,width=p.rect.width,height=p.rect.height) for p in doc]))
    source['instrumentIds'].append(law['id'])
    sections=[(0,'Decreto de publicación','preambulo')]
    for i,n in enumerate(ns):
        t=txt(n)
        m=re.match(r'^artículo\s+(\d+(?:-[A-Z]|o)?(?:\s+(?:bis|ter|quater|quinquies|sexies))?|primero|segundo|tercero|único)\s*\.',t,re.I)
        if m: sections.append((i,'Artículo '+m[1].removesuffix('o') if m[1][0].isdigit() else 'Artículo '+m[1],'ordinario'))
        elif code=='5803757' and 208<i<344 and (m:=re.match(r'^([IVXL]+)\.\s',t)): sections.append((i,'Artículo 25 · Fracción '+m[1],'ordinario'))
        elif re.fullmatch(r'(?:capítulo|título) [IVXL]+(?: bis)?',t,re.I):sections.append((i,t,'ordinario'))
        elif i>0 and (t.lower() in ['transitorio','transitorios']):sections.append((i,'Disposiciones transitorias','transitorio'))
        elif (code=='5803757' and 407<=i<=530 or code=='5804310' and 64<=i<=67 or code=='5803758' and i==549) and not re.match(r'^[IVXL]+\.',t) and (m:=re.match(r'^([^.,]{2,23})\.(?:-|\s)',t)):sections.append((i,'Transitorio '+m[1],'transitorio'))
    assert len({label for _,label,_ in sections})==len(sections),sections
    lines=[];stream=''
    for pn in range(first,last+1):
        for b in doc[pn-1].get_text('dict')['blocks']:
            for l in b.get('lines',[]):
                if l['bbox'][1]<50: continue
                token=norm(''.join(s['text'] for s in l['spans']))
                if token:
                    st=len(stream);stream+=token;lines.append((st,len(stream),pn,l['bbox']))
    starts=[];prev=-1
    for j,(i,label,kind) in enumerate(sections):
        token=norm(txt(ns[i]));stop=sections[j+1][0] if j+1<len(sections) else len(ns)
        if len(token)<40 and i+1<stop:token+=norm(txt(ns[i+1]))
        for size in [90,70,45,30,20]:
            pos=next((st for st,_,_,_ in lines if st>prev and stream.startswith(token[:size],st)), -1)
            if pos>=0:break
        assert pos>=0,(code,i,label,token[:90])
        starts.append(pos);prev=pos
    articles=[];checked=0
    for j,(i,label,kind) in enumerate(sections):
        stop=sections[j+1][0] if j+1<len(sections) else len(ns)
        group=ns[i:stop];content=clean(group)
        assert re.sub(r'\s+','',''.join(n.get_text() for n in group))==re.sub(r'\s+','',BeautifulSoup(content,'html.parser').get_text())
        end=starts[j+1] if j+1<len(starts) else len(stream)
        scope=stream[starts[j]:end]
        for n in group:
            pars=[n] if n.name!='table' else n.find_all(['td','th'])
            for p in pars:
                token=norm(txt(p))
                if token and token not in scope: raise ValueError((code,i,label,txt(p)[:120]))
                elif token:checked+=1
        a=article(law,label,content,j+1,kind);articles.append(a)
        selected=[dict(page=pn,bbox=bb) for begin,e,pn,bb in lines if e>starts[j] and begin<end]
        maps[a['id']]=dict(sourceId=sid,label=label,type=kind,contentSha256=sha(content.encode()),pageNumbers=sorted({x['page'] for x in selected}),anchors=selected)
    audits.append(dict(siglas=sig,html=url.replace('/notas/','/notas/docFuente/'),fuente_sha256=sha((D/(code+'.html')).read_bytes()),paginas=[first,last],fragmentos=len(articles),parrafos_celdas_cotejados=checked))
    if code in bases:
        acronym,title,date,path=bases[code];base=record('https://www.diputados.gob.mx/LeyesBiblio/ref/'+path,title+' · Ficha de referencia',acronym,date,'ley')
        basecontent=f'<p>Publicación original de la {title}. Consulta el decreto de reforma del {day} de noviembre de 2026 y sus disposiciones en el acervo.</p><p><a href="#ley-{law["id"]}">Reforma publicada el {day} de noviembre de 2026</a></p>'
        packs.append(dict(ley=base,articulos=[article(base,'Nota editorial · Reforma de noviembre de 2026',basecontent,1,'complementario')]))
        articles.append(article(law,'Nota editorial · Ley de origen',f'<p><a href="#ley-{base["id"]}">Texto original · {title}</a></p>',len(articles)+1,'complementario'))
    packs.append(dict(ley=law,articulos=articles))
for file,val in [('carga',packs),('map',dict(sources=sources,articles=maps)),('cotejo',audits)]:
    (ROOT/(file+'.json')).write_text(json.dumps(val,ensure_ascii=False,indent=1),'utf8')
print([(p['ley']['siglas'],p['ley']['id'],len(p['articulos'])) for p in packs])




def literal(value):
    return 'NULL' if value is None else "'" + str(value).replace("'", "''") + "'"
def insert(table,row):
    return f"INSERT INTO public.{table} ({','.join(row)}) VALUES ({','.join(literal(v) for v in row.values())});"
sql=['BEGIN;']
for pack in packs:
    law=pack['ley']
    sql.append(f"DO $$ BEGIN IF EXISTS (SELECT FROM public.leyes WHERE siglas={literal(law['siglas'])} OR url_original={literal(law['url_original'])}) THEN RAISE EXCEPTION 'Instrumento ya registrado'; END IF; END $$;")
    sql.append(insert('leyes',law))
    sql.extend(insert('articulos',a) for a in pack['articulos'])
sql.append('COMMIT;')
(ROOT/'aplicar.sql').write_text('\n'.join(sql)+'\n','utf8')
