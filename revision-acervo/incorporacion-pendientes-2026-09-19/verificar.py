"""Verifica cada alta contra su payload y todos los registros preexistentes."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
load=lambda n:json.loads((ROOT/n).read_text(encoding='utf8'))
before={t:{v['id']:v for v in load('antes/'+t+'.json')}for t in ['leyes','articulos','temas']}
after={t:{v['id']:v for v in load('despues-bloque1/'+t+'.json')}for t in before}
for table in before:assert all(after[table].get(k)==v for k,v in before[table].items()),table+' anterior alterada'
summary=[]
for m in load('sql-manifest.json'):
 p=load(m['name']+'-carga.json');lid=m['ley_id']
 assert {k:v for k,v in after['leyes'][lid].items()if k!='created_at'}==p['ley']
 articles=sorted([{k:v for k,v in a.items()if k!='created_at'}for a in after['articulos'].values()if a['ley_id']==lid],key=lambda a:a['orden'])
 themes=sorted([{k:v for k,v in a.items()if k not in ['id','ley_id','created_at']}for a in after['temas'].values()if a['ley_id']==lid],key=lambda a:a['orden'])
 assert articles==p['articulos'] and themes==p['temas']
 assert [a['orden']for a in articles]==list(range(len(articles)))
 summary.append(dict(siglas=m['name'],ley_id=lid,fragmentos=len(articles),estructura=len(themes),cotejo_exacto=True))
assert set(after['leyes'])-set(before['leyes'])=={m['ley_id']for m in load('sql-manifest.json')}
result=dict(estado='CARGADOS_Y_COTEJADOS',fecha_local='2026-09-19',catalogo_antes={t:len(before[t])for t in before},catalogo_despues={t:len(after[t])for t in after},registros_anteriores_sin_cambios=True,instrumentos=summary,cotejo_fuentes=load('COTEJO-FUENTES.json'),cotejo_pdf=load('COTEJO-PDF.json'))
(ROOT/'VERIFICACION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in result.items()if k not in ['instrumentos','cotejo_fuentes','cotejo_pdf']},ensure_ascii=False))
