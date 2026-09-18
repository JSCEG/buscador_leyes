"""Cotejo exacto posterior de las 13 altas y conservación de los 25 instrumentos previos."""
from pathlib import Path
import json,collections
ROOT=Path(__file__).resolve().parent
load=lambda n:json.loads((ROOT/n).read_text(encoding='utf-8'))
before={t:{v['id']:v for v in load('antes-verificado/'+t+'.json')}for t in ['leyes','articulos','temas']}
after={t:{v['id']:v for v in load('despues-verificado/'+t+'.json')}for t in before}
for t in before:assert all(after[t].get(k)==v for k,v in before[t].items()),t+' anterior alterado'
assert [len(before[t])for t in before]==[25,3044,644]
assert [len(after[t])for t in after]==[38,3237,831]
summary=[];manifest=load('sql-manifest.json')
for m in manifest:
 p=load(m['name']+'-carga.json');review=load(m['name']+'-revisado.json');lid=m['ley_id']
 assert lid not in before['leyes'] and {k:v for k,v in after['leyes'][lid].items()if k!='created_at'}==p['ley']
 rows=sorted([{k:v for k,v in a.items()if k!='created_at'}for a in after['articulos'].values()if a['ley_id']==lid],key=lambda a:a['orden'])
 themes=sorted([{k:v for k,v in t.items()if k not in ['id','ley_id','created_at']}for t in after['temas'].values()if t['ley_id']==lid],key=lambda t:t['orden'])
 assert rows==p['articulos'] and themes==p['temas'],m['name']
 assert rows[0]['identificador']=='Nota editorial · versiones relacionadas'
 assert len(rows)==len(review['chunks'])+1
 assert [a['contenido']for a in rows[1:]]==[c['contenido']for c in review['chunks']]
 assert [a['orden']for a in rows]==list(range(len(rows))) and len({a['identificador']for a in rows})==len(rows)
 assert all(a['contenido'].strip()for a in rows)
 if m['name']=='CONV-ESTRATEGICOS':assert len([a for a in rows if a['identificador'].startswith('Numeral 17.4 ·')])==2
 summary.append(dict(siglas=m['name'],ley_id=lid,titulo=p['ley']['titulo'],fecha_publicacion=p['ley']['fecha_publicacion'],familia=p['fuente']['familia'],modificacion=p['fuente']['modificacion'],fragmentos=len(rows),fragmentos_fuente=len(review['chunks']),notas_editoriales=1,estructura=len(themes),tipos=dict(collections.Counter(a['tipo_articulo']for a in rows)),cotejo_exacto=True,control_fuente=review['control'],fuente=p['fuente']))
assert set(after['leyes'])-set(before['leyes'])=={m['ley_id']for m in manifest}
assert sum(s['fragmentos']for s in summary)==193 and sum(s['estructura']for s in summary)==187
out=dict(estado='CARGADOS_Y_COTEJADOS',fecha_local='2026-09-17',project='carmfqhcfsqbzcwptqfz',catalogo_antes={t:len(v)for t,v in before.items()},catalogo_despues={t:len(v)for t,v in after.items()},registros_anteriores_sin_cambios={t:len(v)for t,v in before.items()},instrumentos=summary,cotejo_fuentes=load('COTEJO-FUENTES.json'),integridad_sql=dict(textos_vacios=0,fts_vacios=0,etiquetas_duplicadas=0,ordenes_duplicados=0),alcance='Tres convocatorias y diez modificaciones del radar v4.17; versiones publicadas, no texto consolidado. Incluye 13 notas editoriales separadas del texto oficial.')
(ROOT/'VERIFICACION.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in out.items()if k not in ['instrumentos','cotejo_fuentes']},ensure_ascii=False))
