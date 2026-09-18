"""Cotejo posterior exacto y conservación de los 19 instrumentos anteriores."""
from pathlib import Path
import json,collections
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest=load(ROOT/'sql-manifest.json');before={};after={}
for table in ['leyes','articulos','temas']:
 before[table]={v['id']:v for v in load(ROOT/'antes-verificado'/f'{table}.json')}
 after[table]={v['id']:v for v in load(ROOT/'despues-verificado'/f'{table}.json')}
 assert all(after[table].get(k)==v for k,v in before[table].items()),(table,'registro previo alterado')
summary=[]
for item in manifest:
 name=item['name'];p=load(ROOT/f'{name}-carga.json');j=load(ROOT/f'{name}-revisado.json');lid=item['ley_id']
 assert lid not in before['leyes']
 assert {k:v for k,v in after['leyes'][lid].items()if k!='created_at'}==p['ley']
 rows=sorted([{k:v for k,v in a.items()if k!='created_at'}for a in after['articulos'].values()if a['ley_id']==lid],key=lambda a:a['orden'])
 themes=sorted([{k:v for k,v in t.items()if k not in ['id','ley_id','created_at']}for t in after['temas'].values()if t['ley_id']==lid],key=lambda t:t['orden'])
 assert rows==p['articulos'] and themes==p['temas'],name
 assert len({a['identificador']for a in rows})==len(rows) and [a['orden']for a in rows]==list(range(len(rows)))
 assert all(a['contenido'].strip()for a in rows)
 counts=dict(collections.Counter(a['tipo_articulo']for a in rows))
 if name.startswith('RL'):
  assert [int(a['identificador'].split()[1])for a in rows if a['tipo_articulo']=='ordinario']==list(range(1,j['control']['ordinarios']+1))
 if name=='RLEPECFE':
  body=next(a['contenido']for a in rows if a['identificador']=='Artículo 68')
  assert 'Petróleos Mexicanos'not in body and 'solicite Comisión Federal de Electricidad'in body
 summary.append(dict(siglas=name,ley_id=lid,titulo=p['ley']['titulo'],fecha_publicacion=p['ley']['fecha_publicacion'],fragmentos=len(rows),estructura=len(themes),tipos=counts,cotejo_exacto=True,control_fuente=j['control'],fuente=p['fuente']))
assert set(after['leyes'])-set(before['leyes'])=={m['ley_id']for m in manifest}
assert sum(s['fragmentos']for s in summary)==len(after['articulos'])-len(before['articulos'])==517
assert sum(s['estructura']for s in summary)==len(after['temas'])-len(before['temas'])==150
assert [len(after[t])for t in ['leyes','articulos','temas']]==[25,3044,644]
result=dict(estado='CARGADOS_Y_COTEJADOS',fecha_local='2026-09-17',project='carmfqhcfsqbzcwptqfz',catalogo_antes={t:len(v)for t,v in before.items()},catalogo_despues={t:len(v)for t,v in after.items()},registros_anteriores_sin_cambios={t:len(v)for t,v in before.items()},instrumentos=summary,tablas=load(ROOT/'COTEJO-TABLAS.json'),alcance='Cuatro reglamentos y dos instrumentos de permisos/formatos de almacenamiento. El resto del inventario continúa pendiente.')
save(ROOT/'VERIFICACION.json',result);print(json.dumps({k:v for k,v in result.items()if k not in ['instrumentos','tablas']},ensure_ascii=False,indent=2))
