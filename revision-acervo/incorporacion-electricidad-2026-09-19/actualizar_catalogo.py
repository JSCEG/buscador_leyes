"""Actualiza el inventario sólo con las cargas cotejadas, preservando las previas."""
from pathlib import Path
from collections import Counter
import json
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
dest=R.parent/'inventario-radar-2026-09-19';snapshot=R/'despues-verificacion'
a=Counter(x['ley_id']for x in load(snapshot/'articulos.json'));t=Counter(x['ley_id']for x in load(snapshot/'temas.json'))
keys=['id','titulo','siglas','tipo','fecha_publicacion','url_original']
catalog=dict(fecha_consulta='2026-09-19',projectId='carmfqhcfsqbzcwptqfz',instrumentos=[{**{k:x[k]for k in keys},'fragmentos':a[x['id']],'temas':t[x['id']]}for x in load(snapshot/'leyes.json')])
catalog['instrumentos'].sort(key=lambda x:x['titulo'])
save(dest/'catalogo-actual.json',catalog)
altas={x['ley_id']:x for x in load(dest/'altas-verificadas.json')}
verified={x['ley_id']for x in load(R/'VERIFICACION.json')['instrumentos']if x['cotejo_exacto']}
for m in load(R/'sql-manifest.json'):
 assert m['ley_id']in verified
 p=load(R/(m['name']+'-carga.json'));s=p['fuente'];law=p['ley']
 extra=''
 if s['name']=='AVISO-PROGRAMA-CENACE':extra='Sólo se incorpora el aviso. El programa de 52 páginas está localizado en https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf; faltan su texto, tablas e indicadores.'
 if s['name']=='CARGO-TRANSMISION-LEGADOS':extra='El transitorio Primero fija la entrada en vigor el 19 de octubre de 2026, posterior al corte. Se conserva el estado del radar como antecedente de la revisión, sin equipararlo a vigencia comprobada.'
 if s['name']=='CEL-INSUBSISTENCIA':extra='El título oficial dice insubsistencia; se conserva el título de la referencia original del radar para trazabilidad.'
 if s['name']=='DACG-ACCESO-REDES':extra='Es el acuerdo modificatorio A/025/2023; conserva omisiones y derogaciones del anexo, no el texto consolidado de RES/948/2015.'
 altas[law['id']]=dict(radar=s['radar'],ley_id=law['id'],titulo=law['titulo'],siglas=law['siglas'],code=s['code'],url=s['url'],sha256=s['sha256'],evidencia=R.name+'/VERIFICACION.json',cobertura=s.get('cobertura','cargado'),nota=extra)
save(dest/'altas-verificadas.json',list(altas.values()))
print(len(altas),'altas verificadas',len(catalog['instrumentos']),'instrumentos')
