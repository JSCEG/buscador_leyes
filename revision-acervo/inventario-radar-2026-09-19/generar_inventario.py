"""Cruza sección 12 del radar vigente con una instantánea de lectura de Supabase.

Conserva identidades RAD y decisiones de cobertura ya cotejadas. Las nuevas
referencias requieren una decisión explícita; no se equipara URL con cobertura.
No escribe en Supabase ni descarga documentos para ingesta.
"""
import csv
import hashlib
import json
import re
from collections import Counter
from copy import deepcopy
from pathlib import Path

OUT = Path(__file__).resolve().parent
PRIOR = OUT.parent / 'inventario-radar-2026-09-17'
old = json.loads((PRIOR / 'INVENTARIO.json').read_text(encoding='utf-8-sig'))
catalog = json.loads((OUT / 'catalogo-actual.json').read_text(encoding='utf-8-sig'))
source = Path(old['fuente_radar'])
source_bytes = source.read_bytes()
text = source_bytes.decode('utf-8-sig')
version = re.search(r'^version:\s*"([^"]+)"', text, re.M).group(1)
assert version == '4.18', 'Revisar novedades antes de cambiar el corte.'
laws = catalog['instrumentos']
by_id = {law['id']: law for law in laws}
assert len(by_id) == len(laws)
rows, matched, changes = [], set(), []
section = subsection = ''
active = False
for line_number, line in enumerate(text.splitlines(), 1):
    if line.startswith('# 12.'): active = True
    if line.startswith('# 13.'): active = False
    if not active: continue
    if line.startswith('## '): section, subsection = line[3:], ''
    if line.startswith('### '): subsection = line[4:]
    if not line.startswith('|') or not re.search(r'\]\(https?://', line): continue
    links = [dict(etiqueta=a, url=b) for a, b in re.findall(r'\[([^\]]+)\]\((https?://[^)]+)\)', line)]
    urls = {link['url'] for link in links}
    candidates = [r for r in old['filas'] if r['id'] not in matched and r['seccion'] == section
                  and {f['url'] for f in r['fuentes']} == urls
                  and r['titulo_radar'].replace('**', '') in line.replace('**', '')]
    cells = [c.strip() for c in line.strip('|').split('|')]
    if len(candidates) == 1:
        row = deepcopy(candidates[0])
        matched.add(row['id'])
        previous_line = row['linea_radar']
        row['linea_radar'] = line_number
        row['fuentes'] = links
        # Status is the penultimate column only in the general 5/6-column tables.
        if len(cells) in (5, 6) and row['estado_radar'] != cells[-2]:
            changes.append(dict(id=row['id'], campo='estado_radar', antes=row['estado_radar'], ahora=cells[-2]))
            row['estado_radar'] = cells[-2]
        for law_id in row['cobertura_ids']:
            assert law_id in by_id, f"Falta en Supabase una cobertura anterior: {row['id']}"
    else:
        assert not candidates and urls == {'https://sidof.segob.gob.mx/notas/5799057'}, f'Revisar nueva fila {line_number}: {line}'
        row = dict(id='RAD-180', linea_radar=line_number, seccion=section, subseccion=subsection,
                   institucion='CFE', fecha_radar=cells[0], tipo_radar=cells[1], titulo_radar=cells[2],
                   estado_radar=cells[3], fuentes=links, codigos_dof=['5799057'], estado='pendiente',
                   estado_carga=old['etiquetas_estado']['pendiente'], ley_id=None, titulo_en_supabase=None,
                   cobertura_ids=[], familias=['CFE: contratación e impedimentos'], es_repeticion=False,
                   repite_fuente_de=None, referencia_principal='RAD-180',
                   nota='Novedad del radar v4.18. Ausente como instrumento propio en el catálogo consultado. El enlace SIDOF no respondió al cotejo web del 19 de septiembre; revisar la publicación completa antes de preparar la carga. El estatus jurídico se reproduce del radar, no se certifica en esta revisión.')
        changes.append(dict(id=row['id'], campo='nueva_referencia', ahora=row['titulo_radar']))
    rows.append(row)
assert matched == {r['id'] for r in old['filas']}, 'Hay filas anteriores sin correspondencia; revisar la fuente.'
assert len(rows) == 180 and len({r['id'] for r in rows}) == 180
altas = json.loads((OUT/'altas-verificadas.json').read_text(encoding='utf8'))
for alta in altas:
    assert alta['ley_id'] in by_id
    affected = [r for r in rows if r['id']==alta['radar'] or r.get('referencia_principal')==alta['radar']]
    assert affected, alta['radar']
    for r in affected:
        r['cobertura_ids'] = list(dict.fromkeys(r['cobertura_ids']+[alta['ley_id']]))
        state=alta.get('cobertura','cargado')
        r.update(estado=state,estado_carga=old['etiquetas_estado'][state],ley_id=alta['ley_id'],titulo_en_supabase=alta['titulo'])
        r['nota']='Incorporado y cotejado con la fuente oficial el 19 de septiembre de 2026. Se conserva la publicación, no un texto consolidado; no se certifica vigencia. Evidencia: '+alta['evidencia']+'.'
        if alta.get('nota'):r['nota']+=' '+alta['nota']
        if r['id']=='RAD-003':r['nota']+=' Cobertura del decreto completada: ocho leyes en sus fichas anteriores y artículos Noveno y Décimo (FMP y LOAPF), sus transitorios y cierre común en la nueva ficha.'
        if r['id']=='RAD-014':r['nota']+=' La nota 5769158 contiene una REFORMA al reglamento, no su texto íntegro; se carga con esa identificación.'
        if r['id']=='RAD-145':r['nota']+=' La publicación es una modificación de convocatoria, no la convocatoria original íntegra.'
        if alta['code'] not in r['codigos_dof']:r['codigos_dof'].append(alta['code'])
        if not any(f['url']==alta['url']for f in r['fuentes']):r['fuentes'].append(dict(etiqueta='Texto oficial cotejado',url=alta['url']))
for r in rows:
    if r['id']=='RAD-033':r['nota']='Se revisaron el aviso de SENER y su carpeta pública el 19 de septiembre. Contiene dos formularios PDF, los lineamientos (ya cargados), dos hojas XLSX y un calendario PNG. No se identificaron bases completas ni una publicación DOF propia de la convocatoria. Se conserva pendiente; no se confunden los materiales de apoyo con las bases.'
unique = [r for r in rows if not r['es_repeticion']]
counts = Counter(r['estado'] for r in unique)
coverage = {id for r in rows for id in r['cobertura_ids']}
for law in laws:
    law['referencias_radar'] = [r['id'] for r in unique if law['id'] in r['cobertura_ids']]

def ids(*numbers): return [f'RAD-{n:03d}' for n in numbers]

priority = [
    dict(nombre='Electricidad, redes y mercado', ids=ids(54,56,57,58,59,60,61,62,64,65,70,71,76,81), motivo='Manuales, modificaciones, DACG, modelos contractuales, CEL y programa CENACE.'),
    dict(nombre='Cogeneración', ids=ids(72, 74), motivo='Siguiente carga sugerida: DACG y acuerdo de formatos. Dos publicaciones cotejadas en SIDOF; revisar sus tablas y anexos uno a uno.'),
    dict(nombre='Migración de permisos', ids=ids(42, 43, 44), motivo='Original, nota aclaratoria y modificación de septiembre; tres hitos separados en la línea del tiempo.'),
    dict(nombre='Planeación del sector', ids=ids(24, 30, 31, 48), motivo='PLADESE, decreto y texto de PROSENER, y PLADESHi. Las fichas explicativas del explorador no sustituyen la carga de estos textos.'),
    dict(nombre='Desarrollo mixto CFE', ids=ids(32, 33), motivo='Lineamientos y aviso. Localizar las bases completas; un aviso o un portal no equivale al instrumento íntegro.'),
    dict(nombre='Biocombustibles e información energética', ids=ids(46, 161), motivo='Formatos de biocombustibles y Catálogo de Equipos y Aparatos CONUEE; conservar campos, instructivos y tablas.'),
    dict(nombre='CFE: contratación e impedimentos', ids=ids(91, 180), motivo='Disposiciones de contratación de agosto y políticas reportadas el 18 de septiembre. La segunda fuente requiere reintentar el cotejo.'),
    dict(nombre='Leyes y reformas por completar', ids=ids(1, 2, 3, 4, 14), motivo='Reformas constitucionales, Ley de Ingresos sobre Hidrocarburos y su reglamento. El decreto de ocho leyes sigue parcial por las reformas a LOAPF y Fondo Mexicano del Petróleo.'),
    dict(nombre='Convocatorias ASEA y SISTRANGAS', ids=ids(*range(142, 149), 137), motivo='Siete convocatorias de terceros ASEA y una del comité SISTRANGAS; distinguir su alcance y fechas de las convocatorias eléctricas.'),
]
families = deepcopy(old['familias'])
for p in priority:
    if not any(f['nombre'] == p['nombre'] for f in families):
        families.append(dict(nombre=p['nombre'], ids=p['ids'], detalle=p['motivo'], tratamiento='Cotejar texto completo, anexos y relaciones antes de preparar la ingesta.'))
for r in rows:
    r['familias'] = [f['nombre'] for f in families if r['id'] in f['ids']]
family_by_name = {f['nombre']: f for f in families}
families = [family_by_name[p['nombre']] for p in priority] + [f for f in families if f['nombre'] not in {p['nombre'] for p in priority}]
summary = dict(old['resumen'], instrumentos_cargados=len(laws), fragmentos=sum(l['fragmentos'] for l in laws),
               temas=sum(l['temas'] for l in laws), filas_radar=len(rows), repeticiones=len(rows)-len(unique),
               referencias_sin_repeticiones=len(unique), urls_distintas=len({f['url'] for r in rows for f in r['fuentes']}),
               estados_sin_repeticiones=dict(counts), estados_todas_las_filas=dict(Counter(r['estado'] for r in rows)))
summary['instrumentos_cargados_representados_en_radar']=len(coverage)
summary['instrumentos_cargados_fuera_de_seccion_12']=len(laws)-len(coverage)
summary['incorporaciones_2026_09_19']=len(altas)
for p in priority:
    pending=[r['id'] for r in rows if r['id']in p['ids']and r['estado']!='cargado']
    p['motivo']=('Bloque incorporado y cotejado el 19 de septiembre de 2026.' if not pending else 'Bloque incorporado salvo '+', '.join(pending)+'. '+('El aviso CENACE está cargado; falta incorporar el programa completo de 52 páginas, sus tablas e indicadores.' if pending==['RAD-081'] else 'Falta localizar bases completas; el aviso y los materiales de apoyo no las sustituyen.'))
    for f in families:
        if f['nombre']==p['nombre']:f['detalle']=p['motivo']
limits = [
    f'Corte documental del radar: 18 de septiembre de 2026, versión 4.18. Catálogo Supabase verificado el 19 de septiembre después de {len(altas)} incorporaciones. Cada bloque preservó los registros anteriores sin cambios.',
    'Sección 12, Ligas de interés: los resultados por proyecto de las convocatorias en sección 6 quedan fuera de los totales. No es una búsqueda exhaustiva de todo el DOF.',
    f"Los {counts['pendiente']} pendientes del inventario ampliado son referencias bibliográficas por cotejar, no esa cantidad de leyes ni documentos finales listos para importar. Además, RAD-081 tiene cobertura parcial: aviso cargado y programa completo por incorporar. RAD-033 requiere acreditar sus bases completas.",
    'La ausencia se determina como instrumento propio del catálogo. No excluye menciones o extractos dentro de otros textos, ni equivale a falta de una ficha en Análisis.',
    'El estatus jurídico se reproduce del radar; este cruce no certifica vigencia. Las nuevas cargas conservan sus tablas y, cuando corresponde, figuras originales mediante enlaces oficiales. No se duplican PDFs ni imágenes en Git.',
    'Se conservan 13 antecedentes, 4 filas de proyectos/consulta (8 proyectos NOM), 10 portales y 3 publicaciones previstas no localizadas. No deben importarse como normas finales vigentes.',
]
data = dict(old, fecha_catalogo=catalog['fecha_consulta'], corte_radar='2026-09-18', version_radar=version,
            sha256_radar=hashlib.sha256(source_bytes).hexdigest(), resumen=summary, limites=limits,
            filas=rows, catalogo=laws, familias=families, prioridades=priority, novedades=changes)
data['secciones'] = [dict(seccion=s, filas=sum(r['seccion']==s for r in rows),
                         sin_repeticiones=sum(r['seccion']==s for r in unique),
                         estados=dict(Counter(r['estado'] for r in unique if r['seccion']==s)))
                     for s in dict.fromkeys(r['seccion'] for r in rows)]
(OUT / 'INVENTARIO.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
with (OUT / 'INVENTARIO.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.writer(stream)
    writer.writerow(['ID', 'Sección', 'Tipo', 'Referencia', 'Fecha', 'Estado de carga', 'Estatus según radar', 'Fuentes', 'Nota'])
    for r in rows:
        writer.writerow([r['id'], r['seccion'], r['tipo_radar'], r['titulo_radar'], r['fecha_radar'], r['estado_carga'],
                         r['estado_radar'], ' | '.join(f['url'] for f in r['fuentes']), r['nota']])
md = ['# Pendientes del radar frente al acervo', '', 'Radar v4.18 · corte 18 de septiembre de 2026 · consulta Supabase 19 de septiembre.', '',
      f"**{len(laws)} instrumentos y {summary['fragmentos']:,} fragmentos cargados. 180 filas del radar, 15 repeticiones y 165 referencias distintas.**", '',
      '| Situación | Referencias |', '|---|---:|']
md += [f"| {old['etiquetas_estado'][key]} | {count} |" for key, count in counts.items()]
md += ['', f"Se incorporaron {len(altas)} publicaciones en los bloques del 19 de septiembre, incluido RAD-180. Quedan {counts['pendiente']} referencias pendientes y {counts.get('parcial',0)} con cobertura parcial. RAD-033 requiere localizar las bases completas de desarrollo mixto CFE; RAD-081 contiene el aviso, no el programa completo de CENACE.", '', '## Estado del bloque prioritario', '']
lookup = {r['id']: r for r in rows}
for index, p in enumerate(priority, 1):
    md += [f"### {index}. {p['nombre']}", '', p['motivo'], '']
    for id in p['ids']:
        r = lookup[id]
        md.append(f"- {id}: [{r['titulo_radar']}]({r['fuentes'][0]['url']}) · {r['fecha_radar']} · {r['estado_carga']}.")
    md.append('')
md += ['## Ya cubierto', '', 'Almacenamiento SAEE (integración, permisos y formatos), tres instrumentos de autoconsumo y las trece publicaciones de convocatorias eléctricas (tres originales y diez modificaciones). No recargarlos.', '',
       '## Pendientes de la aplicación', '', f'Lector remoto: LCNE tiene mapa de páginas; los otros {len(laws)-1} instrumentos no cuentan con ese mapa. Las figuras y tablas de las publicaciones recién incorporadas sí se muestran dentro de sus apartados. Estadísticas por tipo: propuesta pendiente. Línea del tiempo disponible para cualquier instrumento; completar relaciones explícitas y verificadas donde aún no estén capturadas. Explorador: resolver las siete referencias documentales previamente marcadas pendientes.', '', '## Alcance', '']
md += ['- '+s for s in limits]
md += ['', '[Inventario navegable](INVENTARIO.html) · [CSV](INVENTARIO.csv) · [JSON](INVENTARIO.json)', '', f"SHA-256 del radar: `{data['sha256_radar']}`."]
(OUT / 'INVENTARIO.md').write_text('\n'.join(md)+'\n', encoding='utf-8')
template = (PRIOR / 'plantilla.html').read_text(encoding='utf-8')
template = template.replace('v4.17', 'v4.18').replace('14 septiembre 2026', '18 septiembre 2026').replace('14 de septiembre de 2026', '18 de septiembre de 2026')
template = template.replace('179 filas', '180 filas').replace('164 referencias', '165 referencias').replace('163 URLs', '164 URLs')
template = template.replace('164 URLs', str(summary['urls_distintas'])+' URLs')
template = template.replace('La tabla de relaciones regulatorias sigue pendiente.', 'La línea del tiempo ya muestra relaciones verificadas para cualquier tipo de instrumento; falta ampliar sus vínculos donde no estén documentados.')
template = template.replace('Inventario local actualizado después de las trece publicaciones de convocatorias y modificaciones.', f"Radar v4.18 actualizado tras {len(altas)} incorporaciones verificadas: {len(laws)} instrumentos y {summary['fragmentos']:,} fragmentos en Supabase.")
notice = f'<section class="note"><strong>{len(altas)} incorporaciones verificadas:</strong> tablas, formularios, planes y figuras oficiales. Nueva entrega: 14 publicaciones de electricidad. CENACE conserva cobertura parcial: aviso cargado y programa completo por incorporar. <a href="../incorporacion-electricidad-2026-09-19/INCORPORACION.html">Ver nueva entrega</a> · <a href="../incorporacion-pendientes-2026-09-19/INCORPORACION.html">Ver las 27 anteriores</a>.</section>'
template = template.replace('<section id="inventario">', notice+'<section id="inventario">')
embedded = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
(OUT / 'INVENTARIO.html').write_text(template.replace('__FECHA_CATALOGO__', data['fecha_catalogo']).replace('__INVENTARIO_JSON__', embedded), encoding='utf-8')
public = OUT.parents[1] / 'public/revision-acervo/inventario-radar-2026-09-19'
public.mkdir(parents=True, exist_ok=True)
for name in ['INVENTARIO.html', 'INVENTARIO.md', 'INVENTARIO.csv', 'INVENTARIO.json', 'catalogo-actual.json']:
    published = (OUT / name).read_text(encoding='utf-8-sig')
    if name.endswith('.html'):
        # Previous local evidence is intentionally not copied to the public build.
        published = re.sub(r'<a href="\.\./(?!incorporacion-(?:pendientes|electricidad)-2026-09-19/)[^"]+">([^<]+)</a>', r'\1', published)
    (public / name).write_text(published, encoding='utf-8-sig' if name.endswith('.csv') else 'utf-8')
print(json.dumps(dict(resumen=summary, novedades=changes), ensure_ascii=False, indent=2))
