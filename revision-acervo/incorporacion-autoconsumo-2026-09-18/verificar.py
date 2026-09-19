"""Cotejo exacto posterior y conservación de los 38 instrumentos anteriores."""
from pathlib import Path
import json, collections
ROOT = Path(__file__).resolve().parent
load = lambda name: json.loads((ROOT / name).read_text(encoding='utf-8'))
before = {t: {v['id']: v for v in load('antes-validado/'+t+'.json')} for t in ['leyes','articulos','temas']}
after = {t: {v['id']: v for v in load('despues-verificado/'+t+'.json')} for t in before}
for table in before:
    assert all(after[table].get(k) == v for k, v in before[table].items()), table+' anterior alterada'
assert [len(before[t]) for t in before] == [38,3237,831]
assert [len(after[t]) for t in after] == [41,3300,904]
summary = []
manifest = load('sql-manifest.json')
for m in manifest:
    p, review = load(m['name']+'-carga.json'), load(m['name']+'-revisado.json')
    lid = m['ley_id']
    assert lid not in before['leyes']
    assert {k:v for k,v in after['leyes'][lid].items() if k != 'created_at'} == p['ley']
    articles = sorted([{k:v for k,v in a.items() if k != 'created_at'} for a in after['articulos'].values() if a['ley_id'] == lid], key=lambda a:a['orden'])
    themes = sorted([{k:v for k,v in t.items() if k not in ['id','ley_id','created_at']} for t in after['temas'].values() if t['ley_id'] == lid], key=lambda t:t['orden'])
    assert articles == p['articulos'] and themes == p['temas']
    assert [a['contenido'] for a in articles[1:]] == [c['contenido'] for c in review['chunks']]
    assert [a['orden'] for a in articles] == list(range(len(articles)))
    assert len({a['identificador'] for a in articles}) == len(articles)
    summary.append(dict(siglas=m['name'], ley_id=lid, fragmentos=len(articles), fragmentos_fuente=len(review['chunks']), notas_editoriales=1,
                        estructura=len(themes), tipos=dict(collections.Counter(a['tipo_articulo'] for a in articles)), cotejo_exacto=True, control=review['control']))
assert set(after['leyes']) - set(before['leyes']) == {m['ley_id'] for m in manifest}
result = dict(estado='CARGADOS_Y_COTEJADOS', fecha_local='2026-09-18', project='carmfqhcfsqbzcwptqfz',
              catalogo_antes={t:len(before[t]) for t in before}, catalogo_despues={t:len(after[t]) for t in after},
              registros_anteriores_sin_cambios={t:len(before[t]) for t in before}, instrumentos=summary,
              cotejo_fuentes=load('COTEJO-FUENTES.json'), cotejo_pdf=load('COTEJO-PDF.json'))
(ROOT / 'VERIFICACION.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in ['instrumentos','cotejo_fuentes','cotejo_pdf']}, ensure_ascii=False))
