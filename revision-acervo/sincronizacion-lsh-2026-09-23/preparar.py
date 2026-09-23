import sys,json,hashlib,re
from pathlib import Path
sys.path.insert(0,'.local/lse-sync/python')
import pymupdf
R=Path(__file__).resolve().parent
d=pymupdf.open('.local/lsh-sync/LSH.pdf')
norm=lambda s:re.sub(r'\s+','',s)
lines=[];text=''
for p in d:
 for b in p.get_text('dict')['blocks']:
  for l in b.get('lines',[]):
   s=''.join(x['text'] for x in l['spans']); box=l['bbox']
   if box[1]<100 or box[1]>755:continue
   n=norm(s)
   if not n or re.fullmatch(r'\d+de61',n):continue
   lines.append(dict(page=p.number+1,lineId=len(lines),bbox=list(box),start=len(text),end=len(text)+len(n)))
   text+=n
arts=json.loads((R/'articulos-verificados.json').read_text(encoding='utf8')); mapped={};missing=[]
sha=hashlib.sha256(Path('.local/lsh-sync/LSH.pdf').read_bytes()).hexdigest();sid='lsh-'+sha[:12]
for a in arts:
 n=norm(a['contenido']);start=text.find(n)
 if start<0 or text.find(n,start+1)>=0:
  missing.append({'id':a['id'],'label':a['identificador'],'length':len(n),'start':text.find(n[:100]),'end':text.find(n[-100:])});continue
 anchors=[{k:l[k] for k in ('page','lineId','bbox')} for l in lines if l['start']<start+len(n) and l['end']>start]
 mapped[a['id']]=dict(sourceId=sid,label=a['identificador'],type=a['tipo_articulo'],contentSha256=hashlib.sha256(a['contenido'].encode()).hexdigest(),pageNumbers=sorted({x['page'] for x in anchors}),anchors=anchors)
source=dict(id=sid,title='Ley del Sector Hidrocarburos',lawId=arts[0]['ley_id'],sha256=sha,transport='remote-pdf',pdfUrl='/api/reader/'+sid,originalUrl='https://www.diputados.gob.mx/LeyesBiblio/pdf/LSH.pdf',pageCount=len(d),pages=[dict(number=p.number+1,width=p.rect.width,height=p.rect.height) for p in d])
(R/'map.json').write_text(json.dumps(dict(source=source,articles=mapped),ensure_ascii=False,indent=2),encoding='utf8')
(R/'missing.json').write_text(json.dumps(missing,ensure_ascii=False,indent=2),encoding='utf8')
assert len(mapped)==194 and not missing, 'El PDF no coincide con todos los fragmentos; no publicar.'
print('Mapped',len(mapped),'missing',len(missing));print(json.dumps(missing,ensure_ascii=True))
