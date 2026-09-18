"""Preparación local con perfiles explícitos y cotejo. No tiene acceso de escritura remota."""
from pathlib import Path
import json,re,unicodedata,uuid,collections,difflib,hashlib
ROOT=Path(__file__).resolve().parent
AUD=ROOT.parent/'auditoria-cargados-2026-09-17'
load=lambda p:json.loads(p.read_text(encoding='utf8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFD',s.lower()))
def key(s):return norm(s).replace('numeral','').replace('lineamiento','')
def uid(name,label):return str(uuid.uuid5(uuid.NAMESPACE_URL,'buscador-sener/reparacion-2026-09-17/'+name+'/'+label))
ORD=['Único','Primero','Segundo','Tercero','Cuarto','Quinto','Sexto','Séptimo','Octavo','Noveno','Décimo']
ORD+=['Décimo '+s for s in ORD[1:10]]+['Vigésimo']+['Vigésimo '+s for s in ORD[1:10]]+['Trigésimo','Trigésimo Primero','Trigésimo Segundo']
ORPAT='(?:'+'|'.join(re.escape(s).replace(r'\ ',r'\s+')for s in sorted(ORD,key=len,reverse=True))+')'
ARTICLE=re.compile(r'^Artículo\s+(\d+)\s*(?:\.(?:\s*[-–])?|[-–])\s*',re.I|re.M)
TRANS=re.compile(r'^('+ORPAT+r')\s*\.(?:\s*[-–])?\s*',re.I|re.M)
HEAD=re.compile(r'^(TÍTULO|CAPÍTULO|SECCIÓN)\s+([A-ZÁÉÍÓÚÑ]+|[IVXLCDM]+|\d+)(?:\s+([A-ZÁÉÍÓÚÑ]+))?(.*)$',re.I)
PROFILE={'RLSE':(306,[27]),'LSE':(188,[14,2]),'LPTE':(100,[8,2]),'LGTAIP':(216,[20]),'LGEC':(49,[7]),'RISENER':(78,[7]),'RLPTE':(136,[13]),'RLSH':(336,[32]),'DACG-PV':(8,[1]),'PODECOBI-LIN':(39,[1]),'PODECOBI-DEC':(13,[3]),'SAEE':(143,[9])}
rows=load(ROOT/'antes-verificado/articulos.json');laws=load(ROOT/'antes-verificado/leyes.json');sources=load(AUD/'fuentes.json');oldthemes=load(ROOT/'antes-verificado/temas.json')
for a in rows:a.pop('created_at',None)

def clean_source(name,text):
    # Encabezados/pies del DOF en el PDF original del decreto, ausentes del articulado.
    if name=='LSE':
        text='\n'.join(l for l in text.splitlines() if not ('DIARIO OFICIAL' in l and ('Martes 18 de marzo de 2025' in l or 'Edición Vespertina' in l)))
    return text.strip()

def tail_structure(text):
    lines=text.splitlines(); found=[]
    # Sólo una sucesión de encabezados al final del intervalo entre disposiciones.
    for i,line in enumerate(lines):
        if not HEAD.match(line.strip()):continue
        tail=[l.strip() for l in lines[i:] if l.strip()]
        if len(tail)>18 or any(len(l)>240 or re.search(r'[;!?]$|\.["”]?$',l) for l in tail):continue
        if any(ARTICLE.match(l) or TRANS.match(l) for l in tail):continue
        # Una cita como «Capítulo I del presente Título» no es un encabezado.
        if any(re.search(r'\b(?:presente|anterior|siguiente|señalado|referido|artículo)\b',l,re.I) for l in tail):continue
        groups=[]
        for line in tail:
            if HEAD.match(line):groups.append([line])
            elif groups:groups[-1].append(line)
        if not groups:continue
        found=[' '.join(g) for g in groups]
        return '\n'.join(lines[:i]).strip(),found
    return text.strip(),[]

def parse(name):
    text=clean_source(name,(AUD/'fuentes'/f'{name}.alcance.txt').read_text(encoding='utf8'))
    if name=='LSE':
        full=clean_source(name,(AUD/'fuentes/LSE.txt').read_text(encoding='utf8'))
        text+='\nReferencia a otros artículos del decreto\nARTÍCULO CUARTO A ARTÍCULO DÉCIMO.- ………\n'+full[full.rfind('\nTransitorios'):]
    # La referencia editorial entre la ley y los transitorios del decreto es contexto.
    marker=re.compile(r'^ARTÍCULO (?:SEXTO|CUARTO) A ARTÍCULO DÉCIMO\..*$',re.M)
    if name=='LPTE':text=marker.sub(lambda m:'Referencia a otros artículos del decreto\n'+m[0],text)
    trans_markers=list(re.finditer(r'^TRANSITORIOS?\s*$',text,re.I|re.M))
    assert len(trans_markers)==len(PROFILE[name][1]),(name,'bloques transitorios',len(trans_markers))
    main=text[:trans_markers[0].start()]
    if name=='PODECOBI-LIN': pattern=re.compile(r'^(\d+)\.\s+',re.M)
    elif name=='PODECOBI-DEC':pattern=re.compile(r'^Artículo\s+('+ORPAT+r')\s*\.\s*',re.M|re.I)
    elif name=='SAEE':pattern=re.compile(r'^(\d+\.\d+(?:\.\d+)*)\.\s+',re.M)
    else:pattern=ARTICLE
    boundaries=list(pattern.finditer(main))
    expected=PROFILE[name][0]
    assert len(boundaries)==expected,(name,'articulado',len(boundaries),expected)
    numbers=[m[1] for m in boundaries]
    assert len(set(numbers))==len(numbers),(name,'numeración repetida')
    if name not in ['PODECOBI-DEC','SAEE']:assert list(map(int,numbers))==list(range(1,expected+1)),name
    if name=='PODECOBI-DEC':assert [norm(n)for n in numbers]==[norm(n)for n in ORD[1:14]]
    chunks=[];themes=[];state={'titulo_nombre':None,'capitulo_nombre':None,'seccion_nombre':None}
    def structure(headings):
        for h in headings:
            typ=norm(h.split()[0]);level={'titulo':'titulo','capitulo':'capitulo','seccion':'seccion'}[typ]
            if level=='titulo':state.update(titulo_nombre=h,capitulo_nombre=None,seccion_nombre=None)
            elif level=='capitulo':state.update(capitulo_nombre=h,seccion_nombre=None)
            else:state['seccion_nombre']=h
            themes.append({'nivel':level,'nombre':h,'orden':len(themes)})
    def chunk(label,kind,body,**extra):
        assert body.strip(),(name,'vacío',label)
        chunks.append({'identificador':label,'tipo_articulo':kind,'contenido':body.strip(),**state,**extra})
    pre_raw=main[:boundaries[0].start()]
    pre,heads=tail_structure(pre_raw)
    # El índice de SAEE se conserva en el preámbulo; la jerarquía empieza en su Capítulo I real.
    if name=='SAEE':
        at=pre_raw.rfind('Capítulo I\n')
        assert at>=0,'Capítulo I real de SAEE'
        pre=pre_raw[:at].strip();_,heads=tail_structure(pre_raw[at:])
    # Mantener la fórmula de expedición separada donde ya tiene UUID propio.
    unique=re.search(r'^ARTÍCULO ÚNICO\.\s*',pre,re.M|re.I) if name in ['RISENER','RLPTE','RLSH'] else None
    if unique:
        chunk('Preámbulo','preambulo',pre[:unique.start()]);chunk('ARTÍCULO ÚNICO','preambulo',pre[unique.end():])
    elif name=='PODECOBI-DEC':
        at=re.search(r'artículo 89',pre,re.I).start()
        chunk('Preámbulo','preambulo',pre[:at]);chunk('Fundamento y considerandos','preambulo',pre[at:])
    else:chunk('Preámbulo','preambulo',pre)
    structure(heads)
    for i,m in enumerate(boundaries):
        body=main[m.end():boundaries[i+1].start()if i+1<len(boundaries)else len(main)]
        body,heads=tail_structure(body)
        label=f'Lineamiento {m[1]}' if name=='PODECOBI-LIN' else m[1]+'.' if name=='SAEE' else f'Artículo {m[1]}'
        chunk(label,'ordinario',body);structure(heads)
    for bi,tm in enumerate(trans_markers):
        part=text[tm.end():trans_markers[bi+1].start()if bi+1<len(trans_markers)else len(text)].strip()
        # El cierre y las referencias de edición no son transitorios.
        cut=re.search(r'^(?:Ciudad de México, a |Dado en |En cumplimiento de lo dispuesto|Referencia a otros artículos del decreto)',part,re.M)
        extra=part[cut.start():].strip() if cut else '';part=part[:cut.start()].strip()if cut else part
        ts=list(TRANS.finditer(part));count=PROFILE[name][1][bi]
        assert len(ts)==count,(name,'transitorios',bi,len(ts),count)
        assert [norm(m[1])for m in ts]==[norm(x)for x in ([ORD[0]]if count==1 else ORD[1:count+1])],(name,'ordinales')
        block='Transitorios de la ley'if len(trans_markers)>1 and bi==0 else 'Transitorios del decreto'if len(trans_markers)>1 or name=='LGTAIP' else 'Transitorios'
        state.update(titulo_nombre=block,capitulo_nombre=None,seccion_nombre=None)
        for i,m in enumerate(ts):
            label='Transitorio '+re.sub(r'\s+',' ',m[1]).title()
            if len(trans_markers)>1:label+=' · '+('ley'if bi==0 else 'decreto')
            chunk(label,'transitorio',part[m.end():ts[i+1].start()if i+1<len(ts)else len(part)])
        if extra:
            state.update(titulo_nombre='Documentos complementarios',capitulo_nombre=None,seccion_nombre=None)
            label='Referencia a otros artículos del decreto'if extra.startswith('Referencia')else 'Firmas y promulgación'
            if extra.startswith(label):extra=extra[len(label):].strip()
            chunk(label,'complementario',extra)
    return chunks,themes,text

out=[]
for name in PROFILE:
    c,t,source=parse(name)
    save(ROOT/f'{name}-fuente-revisada.json',{'instrumento':name,'chunks':c,'temas':t})
    print(name,dict(collections.Counter(x['tipo_articulo']for x in c)),len(t),'temas')
    out.append({'name':name,'chunks':len(c),'themes':t})
save(ROOT/'estructuras.json',out)
