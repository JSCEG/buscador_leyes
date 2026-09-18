"""Conserva UUID, verifica cobertura y escribe un plan local; nunca aplica cambios."""
from preparar import *

def normalize_map(s):
    chars=[];offsets=[]
    for i,c in enumerate(s):
        for v in norm(c):chars.append(v);offsets.append(i)
    return ''.join(chars),offsets

def clean_old(s,name):
    # Elimina sólo pies editoriales identificados, preservando cualquier otro texto.
    titles=['Ley General de Economía Circular','Ley General de Transparencia y Acceso a la Información Pública','Ley de Planeación y Transición Energética','Ley del Sector Eléctrico','Reglamento de la Ley del Sector Eléctrico']
    pattern='(?:'+'|'.join(norm(t)for t in titles)+r')camaradediputadosdelhcongresodelaunionsecretariageneralsecretariadeserviciosparlamentarios(?:nuevaley|nuevoreglamento)dof\d{8}\d+de(?:71|56|23|64|20)'
    for pat in [pattern]:
        ns,mp=normalize_map(s)
        for m in reversed(list(re.finditer(pat,ns))):s=s[:mp[m.start()]]+' '+s[mp[m.end()-1]+1:]
    s=re.sub(r'\d{1,2}/\d{1,2}/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?\s+DOF\s*-\s*Diario Oficial de la Federación\s*https?://www\.dof\.gob\.mx/nota_detalle\.php\?codigo=\d+&fecha=[\d/]+&print=true\s+\d+/\d+',' ',s,flags=re.I)
    return s.strip()

fix_ids={'RLSE':{32:'61f924c5-16e0-4510-ac1e-c33317b98119'},'LGTAIP':{'Transitorio Décimo Séptimo':'aeb089ab-04ef-4c9c-860e-ce2cbf77c947'}}
audit=load(AUD/'hallazgos-confirmados.json')
for r in audit['instrumentos']:
    if r['instrumento']=='RLSE':
        for e in r['evidencias']:
            m=re.match(r'Artículo (32|45|123|287) ',e['hallazgo'])
            if m:fix_ids['RLSE'][int(m[1])]=e['id']
merges={'671132d4-7f16-4622-910a-18a90832cc79':('RLSE','Transitorio Octavo'),
        'd574ce36-1a91-48f5-8bfd-0ce28b0e8103':('LGTAIP','Transitorio Décimo Quinto'),
        '6b1e977c-ba0e-4e78-b396-68776945925c':('SAEE','3.13.'),
        '3961528a-0292-47c4-a5b2-9cf99d653261':('RLSH','Transitorio Segundo'),
        '40752873-fa9e-4dd2-a872-6f4ae0f382c3':('RLSH','Transitorio Décimo Segundo')}
plans=[];issues=[]
for name in PROFILE:
    source=next(s for s in sources if s['name']==name);law=next(l for l in laws if l['id']==source['ley_id'])
    db=sorted([a for a in rows if a['ley_id']==law['id']],key=lambda a:a['orden'])
    data=load(ROOT/f'{name}-fuente-revisada.json');chunks=data['chunks'];used=set();matches=[]
    if name=='LSE':chunks[0]['contenido']=clean_old(db[0]['contenido'],name)
    for order,c in enumerate(chunks):
        label=c['identificador'];k=key(label.split(' · ')[0]);choices=[];forced=None
        m=re.fullmatch(r'Artículo (\d+)',label)
        if m:forced=fix_ids.get(name,{}).get(int(m[1]))
        forced=forced or fix_ids.get(name,{}).get(label)
        if forced:choices=[a for a in db if a['id']==forced]
        elif label=='Preámbulo':choices=[db[0]]
        elif label=='Fundamento y considerandos':choices=[a for a in db if key(a['identificador'])=='articulo89']
        elif label=='Referencia a otros artículos del decreto':choices=[a for a in db if key(a['identificador']).startswith('transitorioarticulo')]
        else:choices=[a for a in db if key(a['identificador'])==k and a['id']not in merges and a['id']not in set(fix_ids.get(name,{}).values())]
        choices=[a for a in choices if a['id']not in used]
        if len(choices)>1:
            nc=norm(c['contenido'])
            choices.sort(key=lambda a:len(__import__('os').path.commonprefix([norm(clean_old(a['contenido'],name)),nc])),reverse=True)
        old=choices[0]if choices else None
        if old:used.add(old['id'])
        if name=='SAEE' and label=='2.12.':
            assert 'IEC 62619' in c['contenido'] and 'IEC 62819' in old['contenido']
            # Conservar las tablas legibles; corregir el número contra el DOF.
            c['contenido']=old['contenido'].replace('IEC 62819','IEC 62619')
        c['id']=old['id']if old else uid(name,label);c['ley_id']=law['id'];c['orden']=order
        if old:
            # Ventanas de texto: indican dónde hay que cotejar, nunca autorizan cambios por sí solas.
            before=norm(clean_old(old['contenido'],name));after=norm(c['contenido'])
            score='igual'if before==after else 'incluido'if before in after or after in before else 'diferente'
            matches.append({'id':c['id'],'label':label,'match':score,'before_chars':len(before),'after_chars':len(after)})
    removed=[a for a in db if a['id']not in used]
    assert all(a['id']in merges for a in removed),(name,'filas sin correspondencia',[(a['identificador'],a['id'])for a in removed])
    redirects={a['id']:next(c['id']for c in chunks if c['identificador']==merges[a['id']][1])for a in removed}
    # Toda disposición de la fuente debe tener texto e identidad únicos.
    assert len({key(c['identificador'])for c in chunks})==len(chunks),(name,'identificador duplicado')
    assert all(c['contenido'].strip() for c in chunks)
    assert all(not re.search('print=true|Secretaría de Servicios Parlamentarios',c['contenido'],re.I)for c in chunks),(name,'pie editorial')
    # Verificar que cada línea de la fuente, salvo etiquetas, esté en el texto o la jerarquía conservados.
    texts=[norm(c['contenido'])for c in chunks]+[norm(t['nombre'])for t in data['temas']]
    texts.append(''.join(norm(c['contenido'])for c in chunks if c['tipo_articulo']=='preambulo'))
    source_text=parse(name)[2]
    uncovered=[]
    for i,line in enumerate(source_text.splitlines(),1):
        value=line.strip()
        value=ARTICLE.sub('',value);value=TRANS.sub('',value)
        value=re.sub(r'^ARTÍCULO ÚNICO\.\s*','',value,flags=re.I)
        if name=='PODECOBI-LIN':value=re.sub(r'^\d+\.\s+','',value)
        if name=='SAEE':value=re.sub(r'^\d+\.\d+(?:\.\d+)*\.\s+','',value)
        if name=='PODECOBI-DEC':value=re.sub(r'^Artículo\s+'+ORPAT+r'\.\s+','',value,flags=re.I)
        n=norm(value)
        if n and n not in ['transitorios','transitorio','referenciaaotrosarticulosdeldecreto'] and not any(n in t for t in texts):uncovered.append({'line':i,'text':value})
    if uncovered:issues.append({'name':name,'source_lines_not_matched':uncovered})
    old_by_id={a['id']:a for a in db}
    changes=[{'before':old_by_id.get(c['id']),'after':c}for c in chunks if c!=old_by_id.get(c['id'])]
    date={'LGEC':'2026-01-19','DACG-PV':'2025-10-17','RISENER':'2025-04-17'}.get(name)
    plan={'name':name,'ley_id':law['id'],'before':db,'after':chunks,'changes':changes,'remove':removed,'redirects':redirects,'matches':matches,'themes_before':[t for t in oldthemes if t['ley_id']==law['id']],'themes_after':data['temas'],'date_before':law['fecha_publicacion'],'date_after':date or law['fecha_publicacion']}
    save(ROOT/f'{name}-plan.json',plan);plans.append({'name':name,'before':len(db),'after':len(chunks),'insert':sum(c['before']is None for c in changes),'update':sum(c['before']is not None for c in changes),'remove':len(removed),'themes':len(data['temas']),'matches':dict(collections.Counter(x['match']for x in matches))})
    print(name,plans[-1])
save(ROOT/'cobertura-pendiente.json',issues);save(ROOT/'resumen-plan.json',plans)
print('Líneas fuente por cotejar:',sum(len(x['source_lines_not_matched'])for x in issues))
assert not issues,'Falta conservar líneas de la fuente'
