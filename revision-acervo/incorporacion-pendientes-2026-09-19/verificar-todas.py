"""Verificación acumulada de todas las incorporaciones de esta sesión."""
from pathlib import Path
import json
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'))
before={t:{x['id']:x for x in load(R/'antes'/f'{t}.json')}for t in ['leyes','articulos','temas']}
after={t:{x['id']:x for x in load(R/'despues-cierre'/f'{t}.json')}for t in before}
for t in before:assert all(after[t].get(k)==v for k,v in before[t].items()),t
all_ids=set();summary=[]
for folder in [R,R.parent/'incorporacion-planeacion-2026-09-19',R.parent/'incorporacion-complementos-2026-09-19',R.parent/'incorporacion-cierre-prioridades-2026-09-19']:
 entries=[]
 for m in load(folder/'sql-manifest.json'):
  p=load(folder/(m['name']+'-carga.json'));lid=m['ley_id'];all_ids.add(lid)
  assert {k:v for k,v in after['leyes'][lid].items()if k!='created_at'}==p['ley']
  for t,excluded in [('articulos',['created_at']),('temas',['id','ley_id','created_at'])]:
   current=sorted([{k:v for k,v in x.items()if k not in excluded}for x in after[t].values()if x['ley_id']==lid],key=lambda x:x['orden'])
   assert current==p[t],m['name']+t
  entries.append(dict(siglas=m['name'],ley_id=lid,fragmentos=len(p['articulos']),estructura=len(p['temas']),cotejo_exacto=True))
 summary+=entries
 result=dict(estado='CARGADOS_Y_COTEJADOS',fecha_local='2026-09-19',instrumentos=entries,registros_anteriores_sin_cambios=True,catalogo_global={t:len(after[t])for t in after},cotejo_fuentes=load(folder/'COTEJO-FUENTES.json'))
 if (folder/'ALCANCE-PDF.json').exists():result['alcance_pdf']=load(folder/'ALCANCE-PDF.json')
 (folder/'VERIFICACION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert set(after['leyes'])-set(before['leyes'])==all_ids
print(json.dumps(dict(incorporados=len(all_ids),catalogo_antes={t:len(before[t])for t in before},catalogo_despues={t:len(after[t])for t in after},cotejo_exacto=True),ensure_ascii=False))
