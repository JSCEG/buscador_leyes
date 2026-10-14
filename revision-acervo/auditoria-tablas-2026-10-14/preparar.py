import sys,os,json,re,unicodedata,hashlib,html,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'.local/lse-sync/python'))
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parent
rows=json.loads((root/'antes.json').read_text(encoding='utf-8'))
def norm(t):return ''.join(c for c in unicodedata.normalize('NFKD',t).lower() if c.isalnum())
sources={}
for a in rows:
    if a['ley_id'] not in sources:
        text=(Path(os.environ['TEMP'])/('audittabla-'+a['ley_id']+'.html')).read_text(encoding='utf-8')
        soup=BeautifulSoup(text,'html.parser')
        tables=soup.find_all('table')
        lookup={}
        for t in tables:lookup.setdefault(norm(t.get_text()),[]).append(t)
        sources[a['ley_id']]=(soup,tables,lookup)
changes=[];audit=[]
for a in rows:
    old=a['contenido'];s=BeautifulSoup(old,'html.parser');source,tables,lookup=sources[a['ley_id']]
    report={'id':a['id'],'instrumento':a['siglas'],'fragmento':a['identificador'],'tablas_cotejadas':0,'tablas_sin_correspondencia':0,'spans_restaurados':0,'encabezados':0,'anidadas_oficiales':0}
    for t in s.find_all('table'):
        key=norm(t.get_text())
        matched=lookup.get(key,[])
        if not matched:report['tablas_sin_correspondencia']+=1;continue
        o=matched[0];localcells=t.find_all(['td','th']);officialcells=o.find_all(['td','th'])
        if len(localcells)!=len(officialcells) or any(norm(l.get_text())!=norm(r.get_text()) for l,r in zip(localcells,officialcells)):
            report['tablas_sin_correspondencia']+=1;continue
        report['tablas_cotejadas']+=1
        if o.find('table'):report['anidadas_oficiales']+=1
        for l,r in zip(localcells,officialcells):
            for attr in ('colspan','rowspan'):
                v=r.get(attr)
                if v and l.get(attr)!=v:l[attr]=v;report['spans_restaurados']+=1
        # Encabezados de columnas: texto en negritas en la fila oficial inicial.
        first=o.find('tr');cells=first.find_all(['td','th'],recursive=False) if first else []
        def bold(c):
            return bool(c.find(['b','strong']) or c.find(style=re.compile(r'font-weight\s*:\s*bold',re.I)))
        localfirst=t.find('tr')
        numbered_header = a['siglas']=='FORMATOS-BIOCOMBUSTIBLES' and cells and norm(cells[0].get_text()) in ('no','n','numero') and len(cells)>2
        if cells and len(cells)>1 and (all(bold(c) for c in cells) or numbered_header) and localfirst and not t.find('thead',recursive=False):
            head=s.new_tag('thead')
            count=max([int(c.get('rowspan',1)) for c in cells]) if numbered_header else 1
            for row in t.find_all('tr')[:count]:
                row.extract()
                for c in row.find_all(['td','th'],recursive=False):c.name='th';c['scope']='col'
                head.append(row)
            t.insert(0,head);report['encabezados']+=1
    if a['id']=='ec823410-ad59-4080-95d9-b21f24324621':
        # Dos tablas de una columna; el original no contiene el encabezado añadido «Norma».
        assert [norm(t.get_text()) for t in tables]==['iec62619iec6293351iec6293352','ul1973ul9540']
        content=html.escape(old)
        blocks=re.findall(r'\| Norma\s*\|\s*\n\| [- ]+\|(?:\s*\n\|[^\n]+\|)+',content)
        assert len(blocks)==2
        for block,t in zip(blocks,tables):
            clean=copy.deepcopy(t)
            for n in clean.find_all(True):n.attrs={k:v for k,v in n.attrs.items() if k in ('colspan','rowspan')}
            clean.attrs={}
            content=content.replace(block,str(clean),1)
        a['contenido']='<div>'+content.replace('\n','<br>')+'</div>'
        assert '|' not in a['contenido'];report['tablas_cotejadas']=2
    elif report['spans_restaurados'] or report['encabezados']:
        a['contenido']=str(s)
        assert s.get_text()==BeautifulSoup(old,'html.parser').get_text() or norm(s.get_text())==norm(BeautifulSoup(old,'html.parser').get_text())
    if a['contenido']!=old:
        report['md5_previo']=hashlib.md5(old.encode()).hexdigest();report['sha256_previo']=hashlib.sha256(old.encode()).hexdigest()
        report['sha256_nuevo']=hashlib.sha256(a['contenido'].encode()).hexdigest();changes.append(a)
    audit.append(report)
(root/'carga.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'cotejo.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
def lit(s):return "E'"+s.replace('\\','\\\\').replace("'","''").replace('\n','\\n').replace('\r','\\r')+"'"
sql='BEGIN;\n'
for a in changes:
    r=next(r for r in audit if r['id']==a['id'])
    sql+=f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM articulos WHERE id='{a['id']}' AND md5(contenido)='{r['md5_previo']}') THEN RAISE EXCEPTION 'Contenido cambiado'; END IF; END $$;\n"
    sql+=f"UPDATE articulos SET contenido={lit(a['contenido'])} WHERE id='{a['id']}';\n"
(root/'aplicar.sql').write_text(sql+'COMMIT;',encoding='utf-8')
print(json.dumps({'fragmentos_revisados':len(rows),'fragmentos_corregidos':len(changes),'spans':sum(r['spans_restaurados'] for r in audit),'encabezados':sum(r['encabezados'] for r in audit),'tablas_sin_correspondencia':sum(r['tablas_sin_correspondencia'] for r in audit)},ensure_ascii=False))
