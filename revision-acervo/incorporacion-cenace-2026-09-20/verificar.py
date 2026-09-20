from pathlib import Path
import json
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'))
before={t:{x['id']:x for x in load(R/'antes'/f'{t}.json')}for t in ['leyes','articulos','temas']}
after={t:{x['id']:x for x in load(R/'despues-verificacion'/f'{t}.json')}for t in before}
note=load(R/'actualizacion-nota-aviso.json');p=load(R/'PROGRAMA-CENACE-carga.json');lid=p['ley']['id']
for table in before:
 for key,value in before[table].items():
  expected={**value,'contenido':note['despues']}if table=='articulos'and key==note['id']else value
  assert after[table].get(key)==expected,(table,key)
assert set(after['leyes'])-set(before['leyes'])=={lid}
assert {k:v for k,v in after['leyes'][lid].items()if k!='created_at'}==p['ley']
for t,excluded in [('articulos',['created_at']),('temas',['id','ley_id','created_at'])]:
 current=sorted([{k:v for k,v in x.items()if k not in excluded}for x in after[t].values()if x['ley_id']==lid],key=lambda x:x['orden'])
 assert current==p[t],t
 assert all(x['ley_id']==lid for k,x in after[t].items()if k not in before[t])
result=dict(estado='CARGADO_Y_COTEJADO',fecha_local='2026-09-20',ley_id=lid,fragmentos=len(p['articulos']),estructura=len(p['temas']),cotejo_exacto=True,catalogo_antes={t:len(before[t])for t in before},catalogo_despues={t:len(after[t])for t in after},cambio_editorial_aviso=note['id'],resto_de_registros_anteriores_sin_cambios=True,fuente=load(R/'COTEJO-FUENTE.json'))
(R/'VERIFICACION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(result,ensure_ascii=False))
