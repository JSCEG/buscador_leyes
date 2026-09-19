from pathlib import Path
from collections import Counter
import json
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'))
dest=R.parent/'inventario-radar-2026-09-19';snapshot=R/'despues-cierre'
a=Counter(x['ley_id']for x in load(snapshot/'articulos.json'));t=Counter(x['ley_id']for x in load(snapshot/'temas.json'))
keys=['id','titulo','siglas','tipo','fecha_publicacion','url_original']
catalog=dict(fecha_consulta='2026-09-19',projectId='carmfqhcfsqbzcwptqfz',instrumentos=[{**{k:x[k]for k in keys},'fragmentos':a[x['id']],'temas':t[x['id']]}for x in load(snapshot/'leyes.json')])
catalog['instrumentos'].sort(key=lambda x:x['titulo'])
(dest/'catalogo-actual.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
altas=[]
for folder in [R,R.parent/'incorporacion-planeacion-2026-09-19',R.parent/'incorporacion-complementos-2026-09-19',R.parent/'incorporacion-cierre-prioridades-2026-09-19']:
 verified={x['ley_id']for x in load(folder/'VERIFICACION.json')['instrumentos']if x['cotejo_exacto']}
 for m in load(folder/'sql-manifest.json'):
  assert m['ley_id']in verified
  p=load(folder/(m['name']+'-carga.json'));s=p['fuente'];law=p['ley']
  altas.append(dict(radar=s['radar'],ley_id=law['id'],titulo=law['titulo'],siglas=law['siglas'],code=s['code'],url=s['url'],sha256=s['sha256'],evidencia=str(folder.relative_to(R.parent))+'/VERIFICACION.json'))
(dest/'altas-verificadas.json').write_text(json.dumps(altas,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(altas),'altas verificadas',len(catalog['instrumentos']),'instrumentos')
