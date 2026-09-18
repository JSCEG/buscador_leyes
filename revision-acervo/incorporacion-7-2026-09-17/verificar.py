"""Coteja el respaldo posterior contra las cargas y todos los registros anteriores."""
from pathlib import Path
import json,collections,re
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
manifest=load(ROOT/'sql-manifest.json');before={};after={};unchanged={}
for table in ['leyes','articulos','temas']:
    before[table]={x['id']:x for x in load(ROOT/'antes'/f'{table}.json')}
    after[table]={x['id']:x for x in load(ROOT/'despues'/f'{table}.json')}
    assert all(after[table].get(k)==v for k,v in before[table].items()),(table,'cambió un registro anterior')
    unchanged[table]=len(before[table])
summary=[]
for m in manifest:
    n=m['name'];p=load(ROOT/f'{n}-carga.json');j=load(ROOT/f'{n}-revisado.json');lid=m['ley_id']
    actual_law={k:v for k,v in after['leyes'][lid].items()if k!='created_at'}
    assert actual_law==p['ley']
    rows=sorted([{k:v for k,v in a.items()if k!='created_at'}for a in after['articulos'].values()if a['ley_id']==lid],key=lambda a:a['orden'])
    assert rows==p['articulos'],(n,'diferencia textual o estructural')
    themes=sorted([{k:v for k,v in t.items()if k not in ['id','ley_id','created_at']}for t in after['temas'].values()if t['ley_id']==lid],key=lambda t:t['orden'])
    assert themes==p['temas'],(n,'estructura diferente')
    assert [a['orden']for a in rows]==list(range(len(rows)))
    assert len({a['identificador']for a in rows})==len(rows)
    counts=collections.Counter(a['tipo_articulo']for a in rows)
    assert [int(a['identificador'].split()[1])for a in rows if a['tipo_articulo']=='ordinario']==list(range(1,counts['ordinario']+1))
    own=sum(a['tipo_articulo']=='transitorio'and 'Transitorios de la ley'in(a['titulo_nombre']or'')for a in rows)
    decree=sum(a['tipo_articulo']=='transitorio'and 'Transitorios del decreto'in(a['titulo_nombre']or'')for a in rows)
    assert own+decree==counts['transitorio'],(n,'clasificación de transitorios en el informe')
    summary.append(dict(siglas=n,titulo=p['ley']['titulo'],ley_id=lid,fragmentos=len(rows),ordinarios=counts['ordinario'],transitorios_ley=own,transitorios_decreto=decree,complementos=len(rows)-counts['ordinario']-counts['transitorio'],estructura=len(themes),cotejo_exacto=True,fuente=p['fuente']))
assert sum(x['fragmentos']for x in summary)==len(after['articulos'])-len(before['articulos'])
assert len(after['leyes'])==19 and len(after['articulos'])==2527 and len(after['temas'])==494
result=dict(estado='CARGADOS_Y_COTEJADOS',fecha_local='2026-09-17',project='carmfqhcfsqbzcwptqfz',catalogo_antes={t:len(v)for t,v in before.items()},catalogo_despues={t:len(v)for t,v in after.items()},registros_anteriores_sin_cambios=unchanged,instrumentos=summary)
(ROOT/'VERIFICACION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in result.items()if k!='instrumentos'},ensure_ascii=False,indent=2))
