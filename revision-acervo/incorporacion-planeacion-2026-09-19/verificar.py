"""Cotejo de los cuatro instrumentos y conservación íntegra de los 46 anteriores."""
from pathlib import Path
import json
r=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
base=r.parent/'incorporacion-pendientes-2026-09-19'
before={t:{x['id']:x for x in load(base/'despues-bloque1'/f'{t}.json')} for t in ['leyes','articulos','temas']}
after={t:{x['id']:x for x in load(base/'despues-planeacion'/f'{t}.json')}for t in before}
for t in before:assert all(after[t].get(k)==v for k,v in before[t].items()),t
summary=[]
for m in load(r/'sql-manifest.json'):
 p=load(r/(m['name']+'-carga.json'));lid=m['ley_id']
 assert {k:v for k,v in after['leyes'][lid].items() if k!='created_at'}==p['ley']
 for t,exclude in [('articulos',['created_at']),('temas',['id','ley_id','created_at'])]:
  a=sorted([{k:v for k,v in x.items()if k not in exclude}for x in after[t].values()if x['ley_id']==lid],key=lambda x:x['orden'])
  assert a==p[t],m['name']+t
 summary.append(dict(siglas=m['name'],ley_id=lid,fragmentos=len(p['articulos']),estructura=len(p['temas']),cotejo_exacto=True))
assert set(after['leyes'])-set(before['leyes'])=={m['ley_id']for m in load(r/'sql-manifest.json')}
result=dict(estado='CARGADOS_Y_COTEJADOS',fecha_local='2026-09-19',catalogo_antes={t:len(before[t])for t in before},catalogo_despues={t:len(after[t])for t in after},registros_anteriores_sin_cambios=True,instrumentos=summary,cotejo_fuentes=load(r/'COTEJO-FUENTES.json'),alcance_pdf=load(r/'ALCANCE-PDF.json'),observaciones=['PLADESE: la tabla A2.1 y su título aparentemente discordante coinciden con el PDF oficial, p. 108; se conserva y se explica en la nota editorial.','Las figuras se sirven desde dof.gob.mx; no se declara extracción OCR de texto interno de figuras.'])
(r/'VERIFICACION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in result.items()if k not in ['cotejo_fuentes','alcance_pdf','instrumentos']},ensure_ascii=False))
