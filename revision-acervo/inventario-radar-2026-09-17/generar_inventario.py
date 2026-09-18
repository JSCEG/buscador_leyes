"""Reconcilia una instantánea de Supabase con las referencias del radar; no escribe en BD."""
import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

OUT = Path(__file__).resolve().parent
BASE = OUT.parent
original = json.loads((BASE / 'matriz-radar-2026-09-17.json').read_text(encoding='utf-8-sig'))
catalogo = json.loads((OUT / 'catalogo-actual.json').read_text(encoding='utf-8-sig'))
source_path = Path(original['fuente'])
source_bytes = source_path.read_bytes()
source = source_bytes.decode('utf-8-sig')
lines = source.splitlines()
section = source.split('# 12. Ligas de interés', 1)[1].split('\n# 13.', 1)[0]
source_rows = [line for line in section.splitlines() if line.startswith('|') and re.search(r'\]\(https?://', line)]
rows = original['filas']
assert len(source_rows) == len(rows), 'Cambió la sección 12; actualizar primero la matriz de origen.'
for row in rows:
    line = lines[row['linea_radar'] - 1]
    assert line in source_rows, row['id']
    assert all(f['url'] in line for f in row['fuentes']), row['id']
    assert row['titulo_radar'].replace('**', '') in line.replace('**', ''), row['id']

labels = {
    'pendiente': 'Por cotejar e incorporar',
    'cargado': 'Cargado',
    'parcial': 'Decreto con cobertura parcial',
    'antecedente': 'Antecedente o efectos limitados',
    'proyecto': 'Proyecto / consulta',
    'portal': 'Portal / colección',
    'no_localizado': 'Publicación no localizada en el radar',
}
status_map = {
    'FALTA EN CATALOGO': 'pendiente',
    'DECRETO COMPUESTO: COBERTURA PARCIAL': 'parcial',
    'YA CARGADO': 'cargado',
    'FALTA: ANTECEDENTE O EFECTOS LIMITADOS': 'antecedente',
    'PORTAL O COLECCION': 'portal',
    'PENDIENTE DE PUBLICACION VERIFICADA': 'no_localizado',
    'FALTA: PROYECTO O CONSULTA': 'proyecto',
}
laws = catalogo['instrumentos']
by_siglas = {law['siglas']: law for law in laws}
by_id = {law['id']: law for law in laws}
loaded = {
    'RAD-007': 'RISENER', 'RAD-008': 'RICNE', 'RAD-009': 'RLSH',
    'RAD-011': 'RLSE', 'RAD-013': 'RLPyTE', 'RAD-025': 'DACG-Planeación Vinculante',
    'RAD-073': 'ACUERDO-CNE-16/04/2026-DACG-SAE', 'RAD-085': 'LEPECFE', 'RAD-097': 'LEPEPM',
    'RAD-010': 'RLGeo', 'RAD-012': 'RLBio', 'RAD-015': 'RLEPECFE',
    'RAD-016': 'RLEPECFE', 'RAD-017': 'RLEPEPM',
    'RAD-069': 'DACG-PERMISOS-GA', 'RAD-075': 'FORMATOS-SAEE',
    'RAD-026': 'CONV-GEN-1', 'RAD-027': 'CONV-GEN-1-M1',
    'RAD-028': 'CONV-GEN-1-M2', 'RAD-029': 'CONV-GEN-1-M3',
    'RAD-035': 'CONV-GEN-2', 'RAD-038': 'CONV-GEN-2-M1',
    'RAD-039': 'CONV-GEN-2-M2', 'RAD-040': 'CONV-GEN-2-M3', 'RAD-041': 'CONV-GEN-2-M4',
    'RAD-036': 'CONV-ESTRATEGICOS', 'RAD-037': 'CONV-ESTRATEGICOS-M1',
    'RAD-045': 'CONV-ESTRATEGICOS-M2', 'RAD-047': 'CONV-ESTRATEGICOS-M3',
}
compound_siglas = ['LCNE', 'LSH', 'LEPECFE', 'LEPEPM', 'LBio', 'LGeo', 'LSE', 'LPTE']


def ids(*numbers):
    return [f'RAD-{n:03d}' for n in numbers]


families = [
    {'nombre': 'Primera convocatoria de generación', 'ids': ids(26, 27, 28, 29),
     'detalle': 'Texto original y tres modificaciones cargados; cuatro publicaciones con fecha y enlaces entre versiones.',
     'tratamiento': 'Conservar numerales, calendarios, formatos y anexos. Vincular cada modificación al texto base.'},
    {'nombre': 'Segunda convocatoria de generación', 'ids': ids(35, 38, 39, 40, 41),
     'detalle': 'Texto original y cuatro modificaciones cargados; cinco publicaciones, incluida la de 10 de septiembre de 2026.',
     'tratamiento': 'Incluir la cuarta modificación de 10 de septiembre de 2026; no cargar únicamente el calendario original.'},
    {'nombre': 'Proyectos estratégicos de generación y almacenamiento', 'ids': ids(36, 37, 45, 47),
     'detalle': 'Texto original y tres modificaciones cargados; se conserva la numeración repetida 17.4 del original y se distingue el calendario de generación del de SAEE.',
     'tratamiento': 'Distinguir etapas de generación y SAEE; preservar tablas, numerales y anexos de cada publicación.'},
    {'nombre': 'Almacenamiento: DACG y formatos', 'ids': ids(73, 69, 75, 66),
     'detalle': 'Integración SAEE, permisos y formatos cargados. A/113/2024 queda identificado como antecedente.',
     'tratamiento': 'No confundir las DACG de integración con las de permisos ni con los formatos. Conservar formularios y tablas completos.'},
    {'nombre': 'Desarrollo mixto de CFE', 'ids': ids(32, 33),
     'detalle': 'Lineamientos y aviso de convocatoria: dos referencias pendientes.',
     'tratamiento': 'El aviso oficial existe; el radar no acredita una nota DOF propia de la convocatoria. No presentar el aviso como texto normativo completo.'},
    {'nombre': 'Autoconsumo', 'ids': ids(67, 68, 34),
     'detalle': 'DACG, formato y Ventanilla Única: tres referencias pendientes.',
     'tratamiento': 'Mantener requisitos, formatos y procedimiento identificados por separado.'},
    {'nombre': 'Cogeneración', 'ids': ids(72, 74),
     'detalle': 'DACG y formatos: dos referencias pendientes.',
     'tratamiento': 'Revisar anexos y conservar el vínculo entre disposición y formulario.'},
    {'nombre': 'Migración de permisos', 'ids': ids(42, 43, 44),
     'detalle': 'Lineamientos, nota aclaratoria y modificación: tres referencias pendientes.',
     'tratamiento': 'Leer conjuntamente los tres textos y conservar la procedencia de cada cambio.'},
    {'nombre': 'Cuatro reglamentos incorporados', 'ids': ids(12, 10, 15, 16, 17),
     'detalle': 'Biocombustibles, Geotermia, CFE y Pemex cargados; cinco referencias cubiertas contando la fe de erratas de CFE.',
     'tratamiento': 'Procesar artículos y transitorios propios; enlazar la fe de erratas al reglamento de CFE.'},
    {'nombre': 'Convocatorias de terceros ASEA', 'ids': ids(*range(142, 149)),
     'detalle': 'Siete convocatorias pendientes, incluidas las de almacenamiento de gas LP.',
     'tratamiento': 'Son convocatorias para terceros, no siete NOM nuevas. No mezclar almacenamiento de gas LP con SAEE.'},
    {'nombre': 'Comité Consultivo del SISTRANGAS', 'ids': ids(137),
     'detalle': 'Una convocatoria pendiente para representantes de personas usuarias.',
     'tratamiento': 'Es una convocatoria institucional; separar de las convocatorias de proyectos eléctricos.'},
]
family_lookup = {}
for family in families:
    for row_id in family['ids']:
        family_lookup.setdefault(row_id, []).append(family['nombre'])

notes = {
    'RAD-003': 'Las ocho leyes expedidas están cargadas. Las reformas a LOAPF y a la Ley del Fondo Mexicano del Petróleo no están incorporadas como instrumentos propios. La URL común no acredita cobertura íntegra del decreto.',
    'RAD-033': 'Aviso oficial SENER localizado; la nota DOF propia sigue pendiente de acreditar según el radar. Registro cerrado al corte. Revisar bases completas antes de preparar la ingesta.',
    'RAD-046': 'Se corrige la clasificación histórica: es el acuerdo nuevo de formatos de 2026 el que deja sin efectos al de 2009. La frase «deja sin efectos» no convierte al acuerdo nuevo en antecedente.',
    'RAD-051': 'La liga remite a la base jurídica (LPTE), no a una publicación de la estrategia. Cargar la LPTE no cubre esta referencia.',
    'RAD-052': 'La liga remite al reglamento como base jurídica, no a una publicación de PLATEASE.',
    'RAD-053': 'La liga remite a transitorios del reglamento; no acredita la declaratoria integral del SNIE.',
    'RAD-059': 'El radar lo identifica como acto ejecutado; conservar su alcance temporal al decidir su incorporación.',
    'RAD-066': 'Antecedente identificado por el radar como sin efectos desde abril de 2026. Las DACG de integración de 2026 sí están cargadas (RAD-073).',
    'RAD-015': 'Reglamento cargado con el artículo 68 corregido según la fe de erratas y un fragmento complementario que conserva esa publicación. PDF consolidado de Diputados cotejado.',
    'RAD-016': 'Fe de erratas incorporada como documento complementario de RLEPECFE y aplicada al artículo 68. Es cobertura dentro del reglamento, no un instrumento adicional en el catálogo.',
    'RAD-069': 'Cargadas las DACG con 71 numerales, cinco transitorios y seis formatos CNE_ELECTRICIDAD_01 a 06. Se conservaron las tablas y casillas.',
    'RAD-075': 'Cargado el acuerdo de formatos SAEE con CNE_ELECTRICIDAD_09, 10 y 11, instrucciones, disposición de emisión y transitorio. Complementa RAD-073 y RAD-069.',
    'RAD-085': 'Ley individual cargada; comparte la publicación 5752329 con el decreto compuesto RAD-003. No es un duplicado documental de todo el decreto.',
    'RAD-097': 'Ley individual cargada; comparte la publicación 5752329 con el decreto compuesto RAD-003. No es un duplicado documental de todo el decreto.',
    'RAD-162': 'Esta fila agrupa dos proyectos de NOM en una edición diaria del DOF. Separar ambos proyectos al preparar su carga.',
    'RAD-163': 'Esta fila agrupa tres proyectos de NOM y tres notas oficiales. Contarlos como tres documentos al preparar la carga.',
    'RAD-164': 'Esta fila agrupa dos proyectos de NOM y dos notas oficiales. Contarlos como dos documentos al preparar la carga.',
    'RAD-166': 'La publicación es el suplemento de un programa de normalización. La modificación de la NOM está programada, no publicada como texto final según el radar; no cargarla como NOM modificada vigente.',
}
for row_id in ['RAD-026','RAD-027','RAD-028','RAD-029','RAD-035','RAD-036','RAD-037','RAD-038','RAD-039','RAD-040','RAD-041','RAD-045','RAD-047']:
    notes[row_id] = 'Publicación oficial incorporada íntegramente como versión separada, con fecha DOF y nota editorial que enlaza el original y sus modificaciones. Calendarios y anexos conservados; no es texto consolidado ni acredita plazos abiertos.'
corrections = []
for row in rows:
    row['estado_carga_anterior'] = row['estado_carga']
    row['estado'] = status_map[row['estado_carga']]
    row['familias'] = family_lookup.get(row['id'], [])
    row['cobertura_ids'] = []
    if row['id'] in loaded:
        law = by_siglas[loaded[row['id']]]
        row.update(estado='cargado', ley_id=law['id'], titulo_en_supabase=law['titulo'], cobertura_ids=[law['id']])
        row['nota'] = 'Correspondencia de instrumento verificada contra el catálogo actual; no se deduce solo de la URL.'
    if row['id'] == 'RAD-003':
        row['cobertura_ids'] = [by_siglas[s]['id'] for s in compound_siglas]
    if row['id'] == 'RAD-046':
        row['estado'] = 'pendiente'
    if row['id'] in notes:
        row['nota'] = notes[row['id']]
    row['estado_carga'] = labels[row['estado']]
    row['es_repeticion'] = bool(row['repite_fuente_de'])
    row['referencia_principal'] = row['repite_fuente_de'] or row['id']
    if row['estado'] != status_map[row['estado_carga_anterior']] or row['id'] == 'RAD-003':
        corrections.append({'id': row['id'], 'antes': row['estado_carga_anterior'], 'ahora': row['estado_carga'], 'nota': row['nota']})

by_row = {row['id']: row for row in rows}
assert len(by_row) == len(rows)
for row in rows:
    if row['es_repeticion']:
        target = by_row[row['repite_fuente_de']]
        assert not target['es_repeticion'], row['id']
        assert {f['url'] for f in row['fuentes']} & {f['url'] for f in target['fuentes']}, row['id']
        for key in ['estado', 'estado_carga', 'ley_id', 'titulo_en_supabase', 'cobertura_ids']:
            row[key] = target[key]
        row['nota'] = 'Referencia repetida de '+target['id']+'. '+target['nota']

unique = [row for row in rows if not row['es_repeticion']]
counts = Counter(row['estado'] for row in unique)
coverage = {law_id for row in unique for law_id in row['cobertura_ids']}
for law in laws:
    law['referencias_radar'] = [row['id'] for row in unique if law['id'] in row['cobertura_ids']]
groups = []
for name in dict.fromkeys(row['seccion'] for row in rows):
    group_rows = [r for r in unique if r['seccion'] == name]
    groups.append({'seccion': name, 'filas': sum(r['seccion'] == name for r in rows),
                   'sin_repeticiones': len(group_rows), 'estados': dict(Counter(r['estado'] for r in group_rows))})
metrics = {
    'instrumentos_cargados': len(laws), 'fragmentos': sum(l['fragmentos'] for l in laws),
    'temas': sum(l['temas'] for l in laws), 'filas_radar': len(rows),
    'repeticiones': len(rows) - len(unique), 'referencias_sin_repeticiones': len(unique),
    'urls_distintas': len({f['url'] for r in rows for f in r['fuentes']}),
    'estados_sin_repeticiones': dict(counts), 'estados_todas_las_filas': dict(Counter(r['estado'] for r in rows)),
    'instrumentos_cargados_representados_en_radar': len(coverage),
    'instrumentos_cargados_fuera_de_seccion_12': len(laws) - len(coverage),
    'convocatorias_generacion_originales': 3, 'modificaciones_convocatorias_generacion': 10,
    'referencias_convocatorias_generacion': sum(len(f['ids']) for f in families[:3]),
    'filas_proyectos_nom': counts['proyecto'], 'proyectos_nom_desglosados': 8,
}
data = {
    'fecha_catalogo': catalogo['fecha_consulta'], 'corte_radar': original['corte_radar'],
    'version_radar': original['version_radar'], 'fuente_radar': str(source_path),
    'sha256_radar': hashlib.sha256(source_bytes).hexdigest(),
    'alcance': 'Sección 12, Ligas de interés. Inventario bibliográfico cruzado con la instantánea actual de Supabase; no es una revisión jurídica integral ni un conteo de documentos finales de ingesta.',
    'limites': [
        'Se conserva el estatus jurídico del radar al 14 de septiembre de 2026. No se buscaron exhaustivamente publicaciones posteriores.',
        'La ausencia significa ausencia como instrumento propio en el catálogo; no prueba que el nombre o algún extracto no aparezcan en otros textos.',
        'Una fila puede agrupar documentos; una nota DOF puede contener varias leyes. Las ligas a bases jurídicas no prueban publicación del instrumento previsto.',
        'Los procesos y resultados de convocatorias por proyecto de la sección 6 quedan fuera de estos totales.',
        'Catálogo actualizado después de las trece publicaciones de convocatorias y modificaciones; se conserva el cotejo exacto de las altas y de los 25 instrumentos anteriores.',
    ],
    'etiquetas_estado': labels, 'resumen': metrics, 'secciones': groups,
    'familias': families, 'correcciones': corrections, 'catalogo': laws, 'filas': rows,
}
(OUT / 'INVENTARIO.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
with (OUT / 'INVENTARIO.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.writer(stream)
    writer.writerow(['ID', 'Sección', 'Institución', 'Tipo', 'Referencia', 'Fecha radar', 'Estado de carga', 'Estatus jurídico según radar', 'Repite', 'Familias', 'Fuentes', 'Instrumentos cargados UUID', 'Nota'])
    for r in rows:
        writer.writerow([r['id'], r['seccion'], r['institucion'], r['tipo_radar'], r['titulo_radar'], r['fecha_radar'],
                         r['estado_carga'], r['estado_radar'], r['repite_fuente_de'], ' | '.join(r['familias']),
                         ' | '.join(f['url'] for f in r['fuentes']), ' | '.join(r['cobertura_ids']), r['nota']])

md = [
    '# Inventario del radar frente al acervo actual', '',
    f"Catálogo: {data['fecha_catalogo']}. Radar: v{data['version_radar']}, corte {data['corte_radar']}. Alcance: sección 12, «Ligas de interés».", '',
    f"**{len(laws)} instrumentos, {metrics['fragmentos']:,} fragmentos y {metrics['temas']} entradas de estructura cargados.**", '',
    f"El radar contiene {len(rows)} filas, {metrics['repeticiones']} repeticiones identificadas y **{len(unique)} referencias sin repeticiones**. Hay {metrics['urls_distintas']} URLs distintas. Ninguna de estas cifras equivale al número definitivo de instrumentos o archivos por cargar.", '',
    '| Estado | Referencias sin repeticiones |', '|---|---:|',
]
md += [f'| {label} | {counts.get(status, 0)} |' for status, label in labels.items()]
md += ['', f"Las {counts['cargado']} referencias directamente cubiertas y las ocho leyes dentro del decreto compuesto corresponden a {len(coverage)} instrumentos distintos. CFE y Pemex aparecen también como leyes individuales; la fe de erratas de CFE está incorporada dentro de su reglamento. Otros cuatro instrumentos cargados están fuera de esta sección: LGEC, LGTAIP y los dos de PODECOBI. El decreto compuesto conserva cobertura parcial por LOAPF y Fondo Mexicano del Petróleo.", '',
       '## Familias y documentos relacionados', '']
for f in families:
    md += [f"### {f['nombre']}", '', f['detalle'], '', f['tratamiento'], '']
    for row_id in f['ids']:
        r = by_row[row_id]
        md.append(f"- {row_id}: {r['tipo_radar']} — [{r['titulo_radar']}]({r['fuentes'][0]['url']}) · {r['fecha_radar']} · **{r['estado_carga']}**.")
    md.append('')
md += ['## Criterio de preparación', '',
       'Los cuatro reglamentos, las DACG de permisos, los formatos SAEE y las trece publicaciones de las tres convocatorias de generación ya están incorporados. Entre los pendientes siguen autoconsumo, cogeneración, migración de permisos, desarrollo mixto, planeación y regulación de hidrocarburos/ASEA. Continuar documento por documento, conservando numerales, calendarios y formularios.', '',
       'Las convocatorias incluyen notas editoriales con enlaces al original y sus modificaciones. La tabla ley_relaciones sigue pendiente; las publicaciones se conservan por separado y no se presentan como texto consolidado. La [evidencia de las trece incorporaciones](../incorporacion-convocatorias-2026-09-17/INCORPORACION.html) conserva fuentes, tablas, gráficos y cotejo posterior.', '',
       '## Alcance y trazabilidad', '']
md += [f'- {note}' for note in data['limites']]
md += ['', 'Se corrigió RAD-046: los formatos de Biocombustibles de 2026 no son un antecedente por dejar sin efectos los de 2009. RAD-166 identifica un programa de normalización, no una modificación de NOM ya publicada. Las cuatro filas de proyectos de NOM representan ocho proyectos.', '',
       'Archivos: [inventario navegable](INVENTARIO.html), [CSV de las 179 filas](INVENTARIO.csv), [JSON con correspondencias](INVENTARIO.json), [instantánea de Supabase](catalogo-actual.json).', '',
       f"Fuente canónica: `{source_path}`. SHA-256: `{data['sha256_radar']}`.", '']
(OUT / 'INVENTARIO.md').write_text('\n'.join(md), encoding='utf-8')

template = (OUT / 'plantilla.html').read_text(encoding='utf-8')
embedded = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
(OUT / 'INVENTARIO.html').write_text(template.replace('__INVENTARIO_JSON__', embedded), encoding='utf-8')
print(json.dumps(metrics, ensure_ascii=False, indent=2))
