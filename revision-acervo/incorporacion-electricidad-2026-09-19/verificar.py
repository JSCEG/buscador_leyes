"""Cotejo exacto posterior y preservación de todos los registros anteriores."""
from pathlib import Path
import json
R=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
before={t:{x['id']:x for x in load(R/'antes'/f'{t}.json')}for t in ['leyes','articulos','temas']}
after={t:{x['id']:x for x in load(R/'despues-verificacion'/f'{t}.json')}for t in before}
for t in before:assert all(after[t].get(k)==v for k,v in before[t].items()),t
entries=[];new_ids=set()
for m in load(R/'sql-manifest.json'):
 p=load(R/(m['name']+'-carga.json'));lid=m['ley_id'];new_ids.add(lid)
 assert {k:v for k,v in after['leyes'][lid].items()if k!='created_at'}==p['ley']
 for t,excluded in [('articulos',['created_at']),('temas',['id','ley_id','created_at'])]:
  current=sorted([{k:v for k,v in x.items()if k not in excluded}for x in after[t].values()if x['ley_id']==lid],key=lambda x:x['orden'])
  assert current==p[t],m['name']+t
 entries.append(dict(siglas=m['name'],ley_id=lid,fragmentos=len(p['articulos']),estructura=len(p['temas']),cotejo_exacto=True,cobertura=p['fuente'].get('cobertura','cargado')))
assert set(after['leyes'])-set(before['leyes'])==new_ids
for t in ['articulos','temas']:
 assert all(x['ley_id']in new_ids for k,x in after[t].items()if k not in before[t])
result=dict(estado='CARGADOS_Y_COTEJADOS',fecha_local='2026-09-19',instrumentos=entries,registros_anteriores_sin_cambios=True,catalogo_antes={t:len(before[t])for t in before},catalogo_global={t:len(after[t])for t in after},cotejo_fuentes=load(R/'COTEJO-FUENTES.json'),alcance_pdf=load(R/'ALCANCE-PDF.json'))
(R/'VERIFICACION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in result.items()if k not in ['instrumentos','cotejo_fuentes','alcance_pdf']},ensure_ascii=False))
