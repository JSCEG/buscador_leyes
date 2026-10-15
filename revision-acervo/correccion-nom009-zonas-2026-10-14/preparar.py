import sys,json,re,html,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent
sys.path.insert(0,str(root.parents[1]/'.local/lse-sync/python'))
import pymupdf
from bs4 import BeautifulSoup
base=json.loads((root.parent/'auditoria-tablas-2026-10-14/antes.json').read_text(encoding='utf-8'))
pdf=Path(sys.argv[1]) if len(sys.argv)>1 else root.parents[1]/'tmp/pdfs/nom-em-009-asea-2026-10-05.pdf'
doc=pymupdf.open(pdf)
assert hashlib.sha256(pdf.read_bytes()).hexdigest()=='83c8aaff9f1162268aebcc63cf38106e82c5242d9a9f8dc101575bc5849eec49'
def municipalities(page,rect):
    x0,y0,x1,y1=rect;mid=(x0+x1)/2;parts=[]
    for left,right in [(x0,mid),(mid,x1)]:
        text=page.get_text('text',clip=pymupdf.Rect(left,y0,right,y1),sort=True)
        parts.extend(' '.join(s.split()) for s in re.split('[\u2022\u00b7\uf0b7]',text) if s.strip())
    return parts
mapped=[[],[]]
for n,idx,dest in [(71,0,0),(72,0,0),(72,1,1)]:
    page=doc[n-1];t=page.find_tables().tables[idx]
    for row,cells in zip(t.rows,t.extract()):
        if not cells[0] or cells[0] in ('ZONA','METROPOLITANA'):continue
        rect=next(c for c in reversed(row.cells) if c)
        names=municipalities(page,rect)
        assert names and len(set(names))==len(names)
        mapped[dest].append({'zona':cells[0].strip(),'municipios':names,'pagina':n})
changes=[];audit=[]
for index,id in enumerate(['8f2b0fdf-1a61-584d-a677-6b6dee8a2eb2','296956d5-a195-566b-8c97-02507bf39ddf']):
    a=next(dict(a) for a in base if a['id']==id);old=a['contenido'];s=BeautifulSoup(old,'html.parser')
    table='<table><thead><tr><th scope="col">ZONA METROPOLITANA</th><th scope="col">MUNICIPIOS O ALCALDÍAS QUE CONFORMAN LA ZONA METROPOLITANA</th></tr></thead><tbody>'
    for r in mapped[index]:
        table+='<tr><td>'+html.escape(r['zona'])+'</td><td><ul>'+''.join('<li>'+html.escape(n)+'</li>' for n in r['municipios'])+'</ul></td></tr>'
    table+='</tbody></table>'
    old_tables=s.find_all('table')
    old_tables[0].replace_with(BeautifulSoup(table,'html.parser').table)
    for extra in old_tables[1:]:
        if extra.parent:extra.decompose()
    a['contenido']=str(s)
    changes.append(a);audit.append({'id':id,'md5_previo':hashlib.md5(old.encode()).hexdigest(),'sha256_previo':hashlib.sha256(old.encode()).hexdigest(),'sha256_nuevo':hashlib.sha256(a['contenido'].encode()).hexdigest(),'filas':mapped[index]})
(root/'carga.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'cotejo.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
def lit(s):return "E'"+s.replace('\\','\\\\').replace("'","''").replace('\n','\\n').replace('\r','\\r')+"'"
for i,a in enumerate(changes):
    q=f"UPDATE articulos SET contenido={lit(a['contenido'])} WHERE id='{a['id']}' AND md5(contenido)='{audit[i]['md5_previo']}' RETURNING id,md5(contenido);"
    (root/f'aplicar-{i+1}.sql').write_text(q,encoding='utf-8')
print(json.dumps([[(r['zona'],len(r['municipios'])) for r in rows] for rows in mapped],ensure_ascii=False))
