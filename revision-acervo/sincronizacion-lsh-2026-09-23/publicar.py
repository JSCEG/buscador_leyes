from pathlib import Path
import json
from datetime import datetime,timezone
R=Path(__file__).resolve().parent
mp=json.loads((R/'map.json').read_text(encoding='utf8'))
assert len(mp['articles'])==194
dest=R.parents[1]/'public/reader-sources/manifest.v1.json'
m=json.loads(dest.read_text(encoding='utf8'));sid=mp['source']['id']
if sid not in m['sources']:
 m['sources'][sid]=mp['source'];m['revision']+=1;m['verifiedAt']=datetime.now(timezone.utc).isoformat()
else:assert m['sources'][sid]==mp['source']
for aid,a in mp['articles'].items():
 if aid in m['articles']:assert m['articles'][aid]==a
 else:m['articles'][aid]=a
dest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(mp['articles']),'fragmentos LSH publicados en manifiesto')
