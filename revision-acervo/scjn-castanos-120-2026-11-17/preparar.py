from pathlib import Path
import sys,json,hashlib,uuid,re,unicodedata
from bs4 import BeautifulSoup,Tag
import pymupdf

root=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
uid=lambda key:str(uuid.uuid5(uuid.NAMESPACE_URL,key))
pdf=Path(sys.argv[1])
digest=sha(pdf.read_bytes())
assert digest=='0ab540b3ca7ac1366020051bfe46ea81263040425c1cd88b39fdded07f3d8f55'
assert sha((root/'fuente.html').read_bytes())=='a65c8afc93ab970561bd19fa6edc32cb9c16c454538fc15c2d5392ee1804f88c'
url='https://sidof.segob.gob.mx/notas/5803873'
remote='https://sidof.segob.gob.mx/notas/getNewsletter/17-11-2026/Matutina/330845'
sourceid='dof-matutina-20261117-'+digest[:12]
doc=pymupdf.open(pdf)
soup=BeautifulSoup((root/'fuente.html').read_text('utf8'),'html.parser')
nodes=[]
def walk(n):
    if not isinstance(n,Tag): return
    if n.name=='table' or n.name in ['div','p','h1','h2'] and not n.find(['div','p','h1','h2','table']):
        if n.get_text(strip=True):nodes.append(n)
    else:
        for el in n.children:walk(el)
walk(soup.body)
def text(n):return ' '.join(n.get_text(' ',strip=True).split())
def norm(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if c.isalnum())
sections={0:'Ficha y problemas jurídicos',12:'Índice temático',14:'Identificación y presentación de la sentencia'}
for i in [25,47,49,52,58,69,73,96,118,131,167,171,180,199,204]:sections[i]=text(nodes[i])
sections.update({206:'Resolutivo PRIMERO',207:'Resolutivo SEGUNDO',208:'Resolutivo TERCERO',209:'Notificaciones, votación y firmas',215:'Certificación de la sentencia',216:'Voto concurrente de la ministra Lenia Batres Guadarrama',231:'Certificación del voto concurrente',232:'Notas al pie de la sentencia'})
def clean(group):
    local=BeautifulSoup('\n'.join(str(n) for n in group),'html.parser')
    for n in list(local.find_all(True)):
        if n.name not in ['div','p','h1','h2','br','em','strong','i','b','u','sup','sub','table','tr','td','th']:n.unwrap()
        else:n.attrs={k:v for k,v in n.attrs.items() if k in ['colspan','rowspan']}
    for t in local.find_all('table'):
        rows=t.find_all('tr')
        h=local.new_tag('thead');body=local.new_tag('tbody')
        for j,r in enumerate(rows):
            if j==0:
                for cell in r.find_all('td'):cell.name='th'
            (h if j==0 else body).append(r.extract())
        t.append(h);t.append(body)
    return str(local).replace('\r','')
law=dict(id=uid(url),siglas='SCJN-CC-120-2026',titulo=text(nodes[0]).replace('120/ 2026','120/2026'),tipo='sentencia',fecha_publicacion='2026-11-17',vigente=None,url_original=url,temas_clave=['Castaños, Coahuila','SCJN','Competencias federales','Cobros municipales','Energía eléctrica','Hidrocarburos'])
# El cuerpo y las notas tienen flujos de lectura independientes. Los superíndices
# de 6 puntos numeran las notas y el texto al pie usa tipografía de 7 puntos.
lines=[];foot=[];footnums=[];stream=''
for pn in range(83,110):
    for b in doc[pn-1].get_text('dict')['blocks']:
        for line in b.get('lines',[]):
            box=line['bbox']
            if box[1]<50:continue
            spans=[s for s in line['spans'] if s['text'].strip()]
            token=norm(''.join(s['text'] for s in spans))
            if not token:continue
            if 85<=pn<=108 and max(round(s['size']) for s in spans)<=7:
                foot.append(dict(page=pn,bbox=box))
                if round(spans[0]['size'])==6 and spans[0]['text'].strip().isdigit():footnums.append(int(spans[0]['text']))
                continue
            offset=len(stream);stream+=token
            lines.append((offset,len(stream),dict(page=pn,bbox=box)))
assert footnums==list(range(1,67)),footnums
positions=[];prev=-1
for i in list(sections)[:-1]:
    marker=norm(text(nodes[i]))
    if len(marker)<28:marker+=norm(text(nodes[i+1]))
    for length in [90,65,40,25]:
        pos=next((a for a,b,anchor in lines if a>prev and stream.startswith(marker[:length],a)),-1)
        if pos>=0:break
    assert pos>=0,(i,marker[:90])
    prev=pos;positions.append(pos)
keys=list(sections);articles=[];maps={}
for j,(i,label) in enumerate(sections.items()):
    group=nodes[i:keys[j+1] if j+1<len(keys) else len(nodes)]
    content=clean(group);aid=uid(url+'#'+str(j+1))
    anchors=foot if i==232 else [an for a,b,an in lines if b>positions[j] and a<(positions+[len(stream)])[j+1]]
    assert anchors
    articles.append(dict(id=aid,ley_id=law['id'],identificador=label,contenido=content,orden=j+1,tipo_articulo='apartado',capitulo_nombre=label,titulo_nombre='Controversia constitucional 120/2026'))
    maps[aid]=dict(sourceId=sourceid,label=label,type='apartado',contentSha256=sha(content.encode()),pageNumbers=sorted({v['page'] for v in anchors}),anchors=anchors)
# Comprobar todo el texto de cada resolutivo y del voto dentro de sus propias anclas.
for article in articles:
    if article['identificador'].startswith(('Resolutivo', 'Voto concurrente')):
        entry = maps[article['id']]
        coords = {(a['page'], tuple(a['bbox'])) for a in entry['anchors']}
        highlighted = ''.join(span['text'] for page in entry['pageNumbers']
                              for block in doc[page-1].get_text('dict')['blocks']
                              for line in block.get('lines', []) if (page, tuple(line['bbox'])) in coords
                              for span in line['spans'])
        assert norm(highlighted) == norm(BeautifulSoup(article['contenido'], 'html.parser').get_text()), article['identificador']
compact=lambda n:re.sub(r'\s+','',n.get_text())
output=BeautifulSoup(''.join(a['contenido'] for a in articles),'html.parser')
assert compact(output)==compact(soup.body)
cells=lambda n:[(compact(c),c.get('colspan'),c.get('rowspan')) for c in n.find_all(['th','td'])]
assert cells(output)==cells(soup.body)
source=dict(id=sourceid,title='DOF · 17 de noviembre de 2026',instrumentIds=[law['id']],sha256=digest,transport='remote-pdf',pdfUrl='/api/reader/'+sourceid,originalUrl=remote,pageCount=len(doc),pages=[dict(number=p.number+1,width=p.rect.width,height=p.rect.height) for p in doc])
for name,obj in [('carga',[dict(ley=law,articulos=articles)]),('map',dict(sources={sourceid:source},articles=maps)),('cotejo',dict(nota_dof='5803873',pdf=remote,sha256=digest,paginas=[83,109],notas_al_pie=len(footnums),tablas=len(output.find_all('table')),celdas=len(cells(output)),apartados=[dict(id=a['id'],apartado=a['identificador'],paginas=maps[a['id']]['pageNumbers']) for a in articles]))]:
    (root/(name+'.json')).write_text(json.dumps(obj,ensure_ascii=False,indent=1),'utf8')
def lit(v):
    if v is None:return 'NULL'
    if isinstance(v,list):return 'ARRAY['+','.join(map(lit,v))+']'
    return "'"+str(v).replace("'","''")+"'"
def insert(table,obj):return 'INSERT INTO public.'+table+' ('+','.join(obj)+') VALUES ('+','.join(lit(v) for v in obj.values())+');'
sql=['BEGIN;', "DO $$ BEGIN IF EXISTS (SELECT FROM leyes WHERE siglas='SCJN-CC-120-2026' OR url_original="+lit(url)+") THEN RAISE EXCEPTION 'Sentencia duplicada'; END IF; END $$;",insert('leyes',law)]+[insert('articulos',a) for a in articles]+['COMMIT;']
(root/'aplicar.sql').write_text('\n'.join(sql)+'\n','utf8')
print(law['id'],len(articles))

