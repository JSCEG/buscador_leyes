"""Nuevo corte del catálogo; preserva los informes históricos del 19 de septiembre."""
from pathlib import Path
from collections import Counter
import json,csv,hashlib,re
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
v=load(R/'VERIFICACION.json');assert v['cotejo_exacto']
prior=R.parent/'inventario-radar-2026-09-19';dest=R.parent/'inventario-radar-2026-09-20';dest.mkdir(exist_ok=True)
d=load(prior/'INVENTARIO.json');assert hashlib.sha256(Path(d['fuente_radar']).read_bytes()).hexdigest()==d['sha256_radar'],'El radar cambió: revisar las novedades'
p=load(R/'PROGRAMA-CENACE-carga.json');lid=p['ley']['id']
snap=R/'despues-verificacion';a=Counter(x['ley_id']for x in load(snap/'articulos.json'));t=Counter(x['ley_id']for x in load(snap/'temas.json'))
keys=['id','titulo','siglas','tipo','fecha_publicacion','url_original']
laws=[{**{k:x[k]for k in keys},'fragmentos':a[x['id']],'temas':t[x['id']]}for x in load(snap/'leyes.json')];laws.sort(key=lambda x:x['titulo'])
for row in d['filas']:
 if row['referencia_principal']=='RAD-081':
  row.update(estado='cargado',estado_carga=d['etiquetas_estado']['cargado'],ley_id=lid,titulo_en_supabase=p['ley']['titulo'])
  row['cobertura_ids']=list(dict.fromkeys(row['cobertura_ids']+[lid]))
  row['nota']='Cobertura completada el 20 de septiembre de 2026: aviso y programa completo en fichas vinculadas. El PDF oficial de 52 páginas aporta 32 apartados, 20 tablas con 429 celdas, cinco estrategias y cuatro indicadores completos. Sus apartados están vinculados al PDF remoto; mapas y gráficos se consultan en el original. No se certifica vigencia. Evidencia: incorporacion-cenace-2026-09-20/VERIFICACION.json.'
  if not any(f['url']==p['ley']['url_original']for f in row['fuentes']):row['fuentes'].append(dict(etiqueta='Programa completo cotejado',url=p['ley']['url_original']))
unique=[r for r in d['filas']if not r['es_repeticion']];coverage={x for r in d['filas']for x in r['cobertura_ids']}
for law in laws:law['referencias_radar']=[r['id']for r in unique if law['id']in r['cobertura_ids']]
s=d['resumen'];s.update(instrumentos_cargados=len(laws),fragmentos=sum(a.values()),temas=sum(t.values()),urls_distintas=len({f['url']for r in d['filas']for f in r['fuentes']}),estados_sin_repeticiones=dict(Counter(r['estado']for r in unique)),estados_todas_las_filas=dict(Counter(r['estado']for r in d['filas'])),instrumentos_cargados_representados_en_radar=len(coverage),instrumentos_cargados_fuera_de_seccion_12=len(laws)-len(coverage),incorporaciones_2026_09_20=1)
d.update(fecha_catalogo='2026-09-20',catalogo=laws)
for f in d['familias']+d['prioridades']:
 if f['nombre']=='Electricidad, redes y mercado':
  f['detalle'if'detalle'in f else'motivo']='Bloque incorporado y cotejado. El 20 de septiembre se completó RAD-081 con el programa CENACE, sus tablas, indicadores y PDF remoto sincronizado.'
 if f['nombre']=='Desarrollo mixto de CFE':
  f['detalle']='Lineamientos y aviso incorporados. RAD-033 sigue pendiente de localizar las bases completas; el aviso no las sustituye.'
 if f['nombre']in['Convocatorias de terceros ASEA','Comité Consultivo del SISTRANGAS']:
  assert all(next(r for r in d['filas']if r['id']==rid)['estado']=='cargado'for rid in f['ids'])
  f['detalle']=str(len(f['ids']))+' convocatoria(s) incorporada(s) y cotejada(s) el 19 de septiembre de 2026.'
 if f['nombre']=='Leyes y reformas por completar':f['nombre']='Leyes y reformas incorporadas'
d['secciones']=[dict(seccion=section,filas=sum(r['seccion']==section for r in d['filas']),sin_repeticiones=sum(r['seccion']==section for r in unique),estados=dict(Counter(r['estado']for r in unique if r['seccion']==section)))for section in dict.fromkeys(r['seccion']for r in d['filas'])]
d['limites']=[
 'Radar v4.18, corte documental del 18 de septiembre de 2026; su huella permanece sin cambios. Catálogo Supabase cotejado el 20 de septiembre: 83 instrumentos y 4,561 fragmentos.',
 'CENACE: aviso y programa completo están incorporados y vinculados. Se actualizó exclusivamente la nota editorial del aviso para señalar la nueva cobertura; los demás registros anteriores permanecen idénticos.',
 'Quedan 62 referencias bibliográficas pendientes de cotejo, no 62 leyes listas para importar. RAD-033 requiere localizar las bases completas de desarrollo mixto CFE. No quedan referencias con cobertura parcial en este corte.',
 'La LCNE y los 32 apartados del programa CENACE cuentan con PDF remoto sincronizado. La nota editorial CENACE no tiene página oficial. Los otros 81 instrumentos no cuentan todavía con mapa de páginas.',
 'La ausencia como ficha propia no excluye menciones dentro de otros textos. El estatus jurídico se reproduce del radar y no certifica vigencia.',
 'Los 13 antecedentes, 10 portales, 3 publicaciones no localizadas y 4 referencias a proyectos o consultas se mantienen separados de las cargas finales.',
 'Las fuentes se consultan por liga oficial. No se incorporan PDFs ni imágenes a Git. El detalle interno de los mapas y de algunas gráficas no dispone de OCR.']
catalog=dict(fecha_consulta='2026-09-20',projectId='carmfqhcfsqbzcwptqfz',instrumentos=laws)
save(dest/'INVENTARIO.json',d);save(dest/'catalogo-actual.json',catalog)
with(dest/'INVENTARIO.csv').open('w',encoding='utf-8-sig',newline='')as stream:
 writer=csv.writer(stream);writer.writerow(['ID','Sección','Tipo','Referencia','Fecha','Estado de carga','Estatus según radar','Fuentes','Nota'])
 for r in d['filas']:writer.writerow([r['id'],r['seccion'],r['tipo_radar'],r['titulo_radar'],r['fecha_radar'],r['estado_carga'],r['estado_radar'],' | '.join(f['url']for f in r['fuentes']),r['nota']])
md=['# Inventario del acervo · 20 septiembre 2026','','**83 instrumentos · 4,561 fragmentos · 1,242 entradas de estructura.**','','RAD-081 completada con el Programa Institucional CENACE 2026-2030 y su aviso, en fichas vinculadas.','','| Estado | Referencias distintas |','|---|---:|']
md += [f"| {d['etiquetas_estado'][k]} | {n} |"for k,n in s['estados_sin_repeticiones'].items()]
md += ['','## Alcance','']+['- '+x for x in d['limites']]+['','## Pendientes de la aplicación','','Estadísticas por tipo; ampliar la correspondencia con PDFs, las relaciones verificadas de la línea del tiempo y las referencias pendientes del explorador.','','[Inventario navegable](INVENTARIO.html) · [Entrega CENACE](../incorporacion-cenace-2026-09-20/INCORPORACION.html)']
(dest/'INVENTARIO.md').write_text('\n'.join(md)+'\n',encoding='utf8')
template=(R.parent/'inventario-radar-2026-09-17/plantilla.html').read_text(encoding='utf8')
template=template.replace('v4.17','v4.18').replace('14 septiembre 2026','18 septiembre 2026').replace('14 de septiembre de 2026','18 de septiembre de 2026').replace('179 filas','180 filas').replace('164 referencias','165 referencias').replace('163 URLs',str(s['urls_distintas'])+' URLs')
template=template.replace('La tabla de relaciones regulatorias sigue pendiente.','La línea del tiempo muestra vínculos verificados; falta ampliar sus relaciones. CENACE y su aviso ya están vinculados.')
template=template.replace('También están pendientes el aviso de desarrollo mixto y sus lineamientos, siete convocatorias de terceros ASEA y una del Comité Consultivo del SISTRANGAS.','El aviso de desarrollo mixto y sus lineamientos, las siete convocatorias de terceros ASEA y la del Comité Consultivo del SISTRANGAS ya están cargados. RAD-033 sigue pendiente de localizar las bases completas.')
template=template.replace('El decreto de marzo de 2025 conserva cobertura parcial: faltan las reformas a LOAPF y Fondo Mexicano del Petróleo.','Las reformas a LOAPF y al Fondo Mexicano del Petróleo ya están incorporadas. En este corte no quedan referencias con cobertura parcial.')
template=re.sub(r'<p>Los reglamentos, las DACG de permisos,.*?</p>','<p>Los bloques de cogeneración, migración, planeación, biocombustibles, convocatorias ASEA y SISTRANGAS, reformas legales y electricidad ya están incorporados. Esta entrega completa el programa CENACE. Para continuar se revisarán las 62 referencias marcadas como pendientes, verificando fuente, anexos y correspondencia con el catálogo antes de cada carga.</p>',template)
template=re.sub(r"\$\('catalog-coverage'\)\.textContent=.*?;\n", "$('catalog-coverage').textContent=`${summary.estados_sin_repeticiones.cargado} referencias están cubiertas en el acervo y representan ${summary.instrumentos_cargados_representados_en_radar} instrumentos distintos. Los otros ${summary.instrumentos_cargados_fuera_de_seccion_12} instrumentos cargados no figuran en esta sección del radar. Una referencia puede corresponder a varias publicaciones.`;\n",template)
template=template.replace('Inventario local actualizado después de las trece publicaciones de convocatorias y modificaciones.','Corte del catálogo: 20 de septiembre. 83 instrumentos y 4,561 fragmentos. CENACE tiene cobertura completa y PDF sincronizado.')
template=template.replace('<section id="inventario">','<section class="note"><strong>Programa CENACE completo:</strong> tablas, indicadores, mapas y gráficas consultables con el PDF original. <a href="../incorporacion-cenace-2026-09-20/INCORPORACION.html">Ver entrega</a>. Quedan 62 referencias pendientes de cotejo.</section><section id="inventario">')
template=template.replace('__FECHA_CATALOGO__','2026-09-20').replace('__INVENTARIO_JSON__',json.dumps(d,ensure_ascii=False).replace('<','\\u003c'))
template=re.sub(r'<a href="\.\./(?!incorporacion-cenace-2026-09-20/)[^"]+">([^<]+)</a>',r'\1',template)
(dest/'INVENTARIO.html').write_text(template,encoding='utf8')
public=R.parents[1]/'public/revision-acervo'/dest.name;public.mkdir(parents=True,exist_ok=True)
for n in ['INVENTARIO.html','INVENTARIO.md','INVENTARIO.json','INVENTARIO.csv','catalogo-actual.json']:(public/n).write_bytes((dest/n).read_bytes())
print(json.dumps(s,ensure_ascii=False))
