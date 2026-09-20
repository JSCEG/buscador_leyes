from pathlib import Path
import json
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'))
mp=load(R/'mapa-cenace.json');dest=R.parents[1]/'public/reader-sources/manifest.v1.json';m=load(dest)
sid=mp['source']['id'];already=sid in m['sources']
if already:assert m['sources'][sid]==mp['source']
else:m['sources'][sid]=mp['source'];m['revision']+=1;m['verifiedAt']='2026-09-20T15:46:30Z'
for aid,a in mp['articles'].items():
 if aid in m['articles']:assert m['articles'][aid]==a
 else:m['articles'][aid]=a
dest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(m['sources']),'fuentes',len(m['articles']),'fragmentos mapeados')
