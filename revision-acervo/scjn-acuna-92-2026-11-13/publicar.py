"""Añade al manifiesto los apartados de Acuña, reutilizando la edición del 13 de noviembre."""
from pathlib import Path
import hashlib,json,re
from datetime import datetime,timezone
root=Path(__file__).resolve().parent
path=root.parents[1]/'public/reader-sources/manifest.v1.json'
raw=path.read_bytes().decode()
manifest=json.loads(raw)
mapping=json.loads((root/'map.json').read_bytes())
pack=json.loads((root/'carga.json').read_bytes())[0]
sid,source=next(iter(mapping['sources'].items()))
existing=manifest['sources'][sid]
assert {k:v for k,v in existing.items() if k!='instrumentIds'}=={k:v for k,v in source.items() if k!='instrumentIds'}
law=pack['ley']['id']
entries=mapping['articles']
assert law not in existing['instrumentIds'] and not (entries.keys() & manifest['articles'].keys())
assert entries.keys()=={a['id'] for a in pack['articulos']}
for a in pack['articulos']:
    m=entries[a['id']]
    assert m['sourceId']==sid and m['contentSha256']==hashlib.sha256(a['contenido'].encode()).hexdigest()
    assert m['pageNumbers']==sorted({x['page'] for x in m['anchors']})
    for anchor in m['anchors']:
        page=anchor['page'];x,y,X,Y=anchor['bbox'];geom=source['pages'][page-1]
        assert 148<=page<=175 and 0<=x<X<=geom['width'] and 0<=y<Y<=geom['height']
# Mantener la representación existente del JSON y las asociaciones fiscales.
start=raw.index('"'+sid+'":')
start=raw.index('[',raw.index('"instrumentIds"',start))
end=raw.index(']',start)
assert json.loads(raw[start:end+1])==existing['instrumentIds']
raw=raw[:end]+','+json.dumps(law)+raw[end:]
end=raw.rindex('}',0,raw.rindex('}'))
raw=raw[:end]+','+json.dumps(entries,ensure_ascii=False,separators=(',',':'))[1:-1]+raw[end:]
raw=re.sub(r'("revision":\s*)\d+',lambda m:m[1]+str(manifest['revision']+1),raw,count=1)
raw=re.sub(r'("verifiedAt":\s*)"[^"]+"',lambda m:m[1]+json.dumps(datetime.now(timezone.utc).isoformat()),raw,count=1)
updated=json.loads(raw)
assert updated['sources']==manifest['sources']|{sid:existing|{'instrumentIds':existing['instrumentIds']+[law]}}
assert updated['articles']==manifest['articles']|entries
path.write_bytes(raw.encode())
for a in pack['articulos']:
    if a['identificador'].startswith(('Resolutivo','Voto concurrente')):print(a['identificador'],a['id'],entries[a['id']]['pageNumbers'])
