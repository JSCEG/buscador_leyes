import sys, os, json, copy, hashlib, html
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'.local/lse-sync/python'))
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parent
base=root.parent/'mapeo-hiip-2026-10-14'
data=json.loads((base/'carga.json').read_text(encoding='utf-8'))
source=Path(sys.argv[1]) if len(sys.argv)>1 else Path(os.environ['TEMP'])/'hiip-oficial.html'
soup=BeautifulSoup(source.read_text(encoding='utf-8'),'html.parser')
tables=soup.find_all('table')
assert [len(t.find_all('tr')) for t in tables]==[4,54,198]
def clean(t,header_rows):
    t=copy.deepcopy(t)
    for node in t.find_all(True):
        node.attrs={k:v for k,v in node.attrs.items() if k in ('rowspan','colspan')}
    t.attrs={}
    rows=t.find_all('tr')
    head=soup.new_tag('thead');body=soup.new_tag('tbody')
    for i,row in enumerate(rows):
        if i<header_rows:
            for cell in row.find_all('td'):cell.name='th';cell['scope']='col'
            head.append(row.extract())
        else:body.append(row.extract())
    t.clear();t.append(head);t.append(body)
    return t
def cells(t):
    return [(c.get_text(' ',strip=True),c.get('colspan'),c.get('rowspan')) for c in t.find_all(['td','th'])]
audit=[];sql='BEGIN;\n'
def lit(s):return "E'"+s.replace('\\','\\\\').replace("'","''").replace('\n','\\n').replace('\r','\\r')+"'"
for a in data['articulos']:
    o=a['orden'];old=a['contenido']
    if o not in (3,4,9,10):continue
    t=copy.deepcopy(tables[0 if o==3 else 1 if o==4 else 2])
    if o in (9,10):
        for i,r in enumerate(t.find_all('tr')):
            if i and not (1<=i<=100 if o==9 else 101<=i<=197):r.decompose()
    before=cells(t);t=clean(t,2 if o==3 else 1)
    assert cells(t)==before, 'Se alteró una celda oficial'
    if o in (3,4):prefix='<p>'+html.escape(old.split('|',1)[0].strip()).replace('\n','<br>')+'</p>'
    else:prefix='<h3>ANEXO I · Reactivos eliminados '+('1–100' if o==9 else '101–197')+'</h3>'
    a['contenido']=prefix+str(t)
    assert '|' not in a['contenido']
    previous=hashlib.md5(old.encode()).hexdigest();current=hashlib.md5(a['contenido'].encode()).hexdigest()
    audit.append({'id':a['id'],'orden':o,'md5_previo':previous,'md5_nuevo':current,'celdas_identicas':len(before),'filas_datos':len(t.tbody.find_all('tr'))})
    sql+=f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM articulos WHERE id='{a['id']}' AND md5(contenido)='{previous}') THEN RAISE EXCEPTION 'Contenido cambiado'; END IF; END $$;\n"
    sql+=f"UPDATE articulos SET contenido={lit(a['contenido'])} WHERE id='{a['id']}';\n"
(root/'carga.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'cotejo.json').write_text(json.dumps({'fuente':'https://sidof.segob.gob.mx/notas/docFuente/5801172','sha256_html':hashlib.sha256(source.read_bytes()).hexdigest(),'fragmentos_corregidos':audit},ensure_ascii=False,indent=2),encoding='utf-8')
(root/'aplicar.sql').write_text(sql+'COMMIT;',encoding='utf-8')
print(json.dumps(audit,ensure_ascii=False))
