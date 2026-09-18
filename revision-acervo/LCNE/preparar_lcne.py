"""Preparación local y reproducible de la LCNE. No contiene acceso a Supabase.

Parser específico del PDF oficial fijado por SHA-256; falla si cambia la fuente.
Conserva todas las líneas del cuerpo del PDF mediante asignación exhaustiva.
"""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent
PDF = ROOT / 'LCNE_oficial.pdf'
SHA = '7c13fd20564f1e7230268a0943cc226368b24c44886d6738c479f4c42cbe77de'
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == SHA, 'La fuente cambió: requiere otra revisión.'
doc = pymupdf.open(PDF)
assert len(doc) == 20

# Retirar únicamente las franjas verificadas de encabezado y folio.
# La nota de invalidez de la página 11 permanece dentro del cuerpo.
lines = []
discarded = []
for page_num, page in enumerate(doc, 1):
    physical = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            spans = sorted(line['spans'], key=lambda s: s['bbox'][0])
            value = ''.join(s['text'] for s in spans).strip()
            if not value:
                continue
            box = list(line['bbox'])
            entry = dict(pagina=page_num, texto=value, bbox=box)
            if box[1] < 90 or box[1] >= 735:
                discarded.append(entry)
                continue
            physical.append(entry)
    physical.sort(key=lambda x: (round(x['bbox'][1], 1), x['bbox'][0]))
    grouped = []
    for line in physical:
        if grouped and abs(line['bbox'][1] - grouped[-1][0]['bbox'][1]) < 2:
            grouped[-1].append(line)
        else:
            grouped.append([line])
    for group in grouped:
        group.sort(key=lambda x: x['bbox'][0])
        value = re.sub(r'\s+', ' ', ' '.join(x['texto'] for x in group)).strip()
        boxes = [x['bbox'] for x in group]
        lines.append(dict(id=len(lines), pagina=page_num, texto=value,
                          bbox=[min(x[0] for x in boxes), min(x[1] for x in boxes),
                                max(x[2] for x in boxes), max(x[3] for x in boxes)]))

def compact(value):
    return re.sub(r'\s+', '', value)

def join_lines(items):
    """Reflujo solo de espacios; conserva literalmente letras y puntuación."""
    out = ''
    prev = None
    for line in items:
        s = line['texto']
        paragraph = prev is not None and (
            (line['pagina'] == prev['pagina'] and line['bbox'][1] - prev['bbox'][3] > 6)
            or re.match(r'^(?:[IVXLCDM]+\.|[a-z]\))\s', s)
            or s.startswith('Fracción declarada inválida')
            or (line['pagina'] != prev['pagina'] and prev['texto'].endswith('.'))
        )
        out += ('\n\n' if paragraph else ' ' if prev else '') + s
        prev = line
    assert compact(out) == compact(''.join(x['texto'] for x in items))
    return out

ordinal_names = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto',
                 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Décimo Primero',
                 'Décimo Segundo', 'Décimo Tercero']
ordinals = {name: i + 1 for i, name in enumerate(ordinal_names)}
trans_re = re.compile(r'^(' + '|'.join(sorted(ordinals, key=len, reverse=True)) + r')\.(?:-)?\s')
article_re = re.compile(r'^Artículo (\d+)\.-\s')
title_re = re.compile(r'^TÍTULO (PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO)$')
chapter_re = re.compile(r'^Capítulo (?:Único|[IVX]+)$')
ownership = {}
chunks, extras, headings = [], [], []
title = chapter = None
region = 'preambulo'
current = dict(id='LCNE-Preambulo', articulo_label='Preámbulo y expedición',
               grupo='decreto', tipo_articulo='preambulo', lineas=[])

def flush():
    global current
    if current is None or not current['lineas']:
        current = None
        return
    items = current.pop('lineas')
    current['texto'] = join_lines(items)
    current['paginas'] = list(dict.fromkeys(x['pagina'] for x in items))
    current['lineas_origen'] = [x['id'] for x in items]
    current['palabras'] = len(current['texto'].split())
    current['fuente_pdf'] = 'LCNE_oficial.pdf'
    if current['grupo'] == 'ley':
        chunks.append(current)
    else:
        extras.append(current)
    for line in items:
        assert line['id'] not in ownership
        ownership[line['id']] = current['id']
    current = None

def start(identifier, label, group, kind, **fields):
    global current
    flush()
    current = dict(id=identifier, articulo_label=label, grupo=group,
                   tipo_articulo=kind, lineas=[], **fields)

i = 0
while i < len(lines):
    line = lines[i]
    value = line['texto']
    if title_re.fullmatch(value):
        flush()
        region = 'articulado'
        title = dict(numero=value, nombre=lines[i+1]['texto'])
        chapter = None
        h = dict(nivel='titulo', numero=value, nombre=title['nombre'],
                 pagina=line['pagina'], lineas_origen=[i, i+1], orden=len(headings))
        headings.append(h)
        for n in [i, i+1]: ownership[n] = f'ESTRUCTURA-{h["orden"]}'
        i += 2
        continue
    if region == 'articulado' and chapter_re.fullmatch(value):
        flush()
        next_value = lines[i+1]['texto']
        has_name = not article_re.match(next_value)
        chapter = dict(numero=value, nombre=next_value if has_name else None)
        indices = [i, i+1] if has_name else [i]
        h = dict(nivel='capitulo', numero=value, nombre=chapter['nombre'],
                 titulo=title['numero'], pagina=line['pagina'],
                 lineas_origen=indices, orden=len(headings))
        headings.append(h)
        for n in indices: ownership[n] = f'ESTRUCTURA-{h["orden"]}'
        i += len(indices)
        continue
    if region == 'articulado' and article_re.match(value):
        number = int(article_re.match(value).group(1))
        start(f'LCNE-Art-{number:03}', f'Artículo {number}', 'ley', 'ordinario',
              articulo_num=number, transitorio_num=None, titulo_num=title['numero'],
              titulo_nombre=title['nombre'], capitulo_num=chapter['numero'],
              capitulo_nombre=chapter['nombre'])
    elif value == 'Transitorios':
        flush()
        region = 'transitorios_ley' if region == 'articulado' else 'transitorios_decreto'
        ownership[i] = region.upper()
        i += 1
        continue
    elif value.startswith('ARTÍCULO NOVENO Y ARTÍCULO DÉCIMO'):
        start('LCNE-Decreto-Enlace', 'Referencia a otros artículos del decreto', 'decreto', 'referencia')
        region = 'enlace_decreto'
    elif region in ['transitorios_ley', 'transitorios_decreto'] and trans_re.match(value):
        ordinal = trans_re.match(value).group(1)
        number = ordinals[ordinal]
        own = region == 'transitorios_ley'
        start(f'LCNE-{ "Trans" if own else "Decreto-Trans"}-{number:02}',
              f'Transitorio {ordinal}' + ('' if own else ' del decreto'),
              'ley' if own else 'decreto', 'transitorio', articulo_num=None,
              transitorio_num=number, transitorio_ordinal=ordinal,
              titulo_num='TRANSITORIOS', titulo_nombre='Transitorios de la ley' if own else 'Transitorios del decreto',
              capitulo_num=None, capitulo_nombre=None)
    elif region == 'transitorios_decreto' and value.startswith('Ciudad de México, a 12 de marzo de 2025'):
        start('LCNE-Decreto-Cierre', 'Firmas y promulgación del decreto', 'decreto', 'cierre')
        region = 'cierre'
    elif value == 'RESOLUTIVOS DE SENTENCIA DE LA SCJN':
        start('LCNE-SCJN-Resolutivos', 'Resolutivos de la SCJN · AI 51/2025', 'scjn', 'resolutivos')
        region = 'scjn'
    elif value.startswith('SENTENCIA dictada por el Tribunal Pleno'):
        start('LCNE-SCJN-Sentencia', 'Sentencia de la SCJN · AI 51/2025', 'scjn', 'sentencia')
        region = 'scjn'
    assert current is not None, (i, value)
    current['lineas'].append(line)
    i += 1
flush()

assert set(ownership) == set(range(len(lines))), 'Hay líneas sin asignar o duplicadas.'
ordinary = [x for x in chunks if x['tipo_articulo'] == 'ordinario']
trans = [x for x in chunks if x['tipo_articulo'] == 'transitorio']
assert [x['articulo_num'] for x in ordinary] == list(range(1, 29))
assert [x['transitorio_num'] for x in trans] == list(range(1, 14))
assert len([x for x in extras if x['tipo_articulo'] == 'transitorio']) == 2
assert len({x['id'] for x in chunks + extras}) == len(chunks + extras)
assert len([x for x in headings if x['nivel'] == 'titulo']) == 5
assert len([x for x in headings if x['nivel'] == 'capitulo']) == 8
assert 'Fracción declarada inválida' in ordinary[21]['texto']
assert '04-11-2025' in ordinary[21]['texto'] and '26-12-2025' in ordinary[21]['texto']
assert 'Transitorios' not in ordinary[27]['texto']
assert 'ARTÍCULO NOVENO' not in trans[-1]['texto']
assert not any(re.search(r'\b\d+ de 20\b|CÁMARA DE DIPUTADOS|Nueva Ley DOF', x['texto']) for x in chunks)

for n, chunk in enumerate(chunks):
    chunk['orden'] = n
    chunk['ley'] = 'Ley de la Comisión Nacional de Energía'
    chunk['fecha_publicacion'] = '2025-03-18'
    chunk['notas_revision'] = []
ordinary[21]['notas_revision'] = ['Se conserva entre corchetes la fracción III y la nota de invalidez del PDF oficial. Los documentos de la SCJN están separados y vinculados.']
ordinary[21]['documentos_relacionados'] = ['LCNE-SCJN-Resolutivos', 'LCNE-SCJN-Sentencia']
ordinary[27]['notas_revision'] = ['El artículo termina antes del encabezado de transitorios. No incorpora referencias al artículo 89 constitucional.']
trans[-1]['notas_revision'] = ['Termina antes de ARTÍCULO NOVENO Y ARTÍCULO DÉCIMO del decreto.']

baseline = json.loads((ROOT/'extraccion_automatica_sin_corregir.json').read_text(encoding='utf-8'))
issues = [
    {'problema':'Artículo ajeno al cuerpo de la LCNE', 'automatico':'29 ordinarios; incluyó Artículo 89 de la fórmula promulgatoria.', 'corregido':'28 ordinarios, secuencia 1–28.'},
    {'problema':'Artículo 28 absorbía material posterior', 'automatico':f'{len(next(x for x in baseline["articulos"] if x["articulo_num"] == 28)["texto"]):,} caracteres, con transitorios y firmas.', 'corregido':f'{len(ordinary[-1]["texto"]):,} caracteres; cierra antes de Transitorios.'},
    {'problema':'Capítulos únicos no reconocidos', 'automatico':'5 capítulos detectados.', 'corregido':'8 capítulos; títulos y capítulos asignados a cada artículo.'},
    {'problema':'Fin del transitorio Décimo Tercero', 'automatico':'Incluía el encabezado de otros artículos del decreto.', 'corregido':'Texto propio separado de la referencia al decreto.'},
    {'problema':'Folios y encabezados', 'automatico':'Persistían folios de página dentro de los fragmentos.', 'corregido':'Franjas de encabezado y folio excluidas por coordenadas; nota de invalidez preservada.'},
]
metadata = dict(ley='Ley de la Comisión Nacional de Energía', siglas='LCNE', tipo='ley',
    fecha_publicacion='2025-03-18', fecha_consulta='2026-09-17',
    fuente='Cámara de Diputados / Diario Oficial de la Federación',
    url_original='https://www.diputados.gob.mx/LeyesBiblio/pdf/LCNE.pdf',
    pdf_sha256=SHA, paginas_pdf=20, total_articulos=41, articulos_ordinarios=28,
    total_transitorios=13, total_titulos=5, total_capitulos=8,
    estado_preparacion='Revisión técnica local terminada; pendiente de revisión del usuario. No cargado en Supabase.',
    resumen=('La ley crea la Comisión Nacional de Energía y regula su organización, funcionamiento, competencias, facultades y atribuciones. Establece su coordinación con la Secretaría de Energía y sus funciones en los sectores eléctrico y de hidrocarburos.\n\n'
             'Su articulado aborda la Dirección General, el Comité Técnico, los requisitos y funciones de sus integrantes, el presupuesto y los medios de defensa. Fue publicada el 18 de marzo de 2025; su segundo transitorio abroga la Ley de los Órganos Reguladores Coordinados en Materia Energética. Esta preparación conserva la nota de invalidez del artículo 22, fracción III, y separa los transitorios generales del decreto y el material de la SCJN.'))
result = dict(metadata=metadata, articulos=chunks, estructura=headings, material_complementario=extras,
              incidencias_corregidas=issues)
qa = dict(pdf_sha256=SHA, lineas_cuerpo_pdf=len(lines), lineas_asignadas=len(ownership),
          lineas_excluidas_encabezados_folios=len(discarded),
          cobertura_lineas_sin_huecos=True, unicidad_asignacion=True, secuencia_ordinarios='1–28',
          secuencia_transitorios_ley='1–13', transitorios_decreto=2,
          documentos_scjn=2, nota_invalidez_preservada=True,
          cotejo_textual='Cada fragmento coincide carácter por carácter con sus líneas del PDF al excluir espacios. No demuestra por sí solo fidelidad visual del extractor.',
          revision_visual_paginas=[1,11,13,15,17,19], no_escrituras_supabase=True)

def save(name, value):
    (ROOT/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

save('LCNE_chunks_revisados.json', result)
save('LCNE_control_calidad.json', qa)
save('LCNE_trazabilidad.json', dict(lineas=lines, asignacion=ownership, excluidas=discarded))
# Solo cuerpo de la ley: material complementario no se convierte silenciosamente en artículos.
save('LCNE_preparacion_supabase.json', dict(estado='BORRADOR_LOCAL_NO_CARGADO',
    ley={k:metadata[k] for k in ['tipo','siglas','fecha_publicacion','url_original']} | {'titulo':metadata['ley']},
    articulos=[dict(identificador=c['articulo_label'], contenido=c['texto'],
                   tipo_articulo=c['tipo_articulo'], orden=c['orden'],
                   titulo_nombre=' — '.join(filter(None,[c['titulo_num'],c['titulo_nombre']])),
                   capitulo_nombre=' — '.join(filter(None,[c['capitulo_num'],c['capitulo_nombre']])),
                   seccion_nombre=None) for c in chunks],
    temas=[dict(nivel=h['nivel'], nombre=' — '.join(filter(None,[h['numero'],h['nombre']])),orden=h['orden']) for h in headings],
    pendiente='Definir representación de transitorios generales y material SCJN al cargar; conservados completos en el archivo revisado.'))

md = ['# LCNE: fragmentos para revisión', '', metadata['estado_preparacion'], '',
      '28 artículos ordinarios + 13 transitorios de la ley. Complementos conservados aparte.', '',
      '## Incidencias corregidas', '']
for issue in issues:
    md.append(f'- **{issue["problema"]}:** {issue["automatico"]} → {issue["corregido"]}')
for group, collection in [('Cuerpo de la ley', chunks), ('Documentos complementarios', extras)]:
    md += ['', '## '+group, '']
    for c in collection:
        md += ['### '+c['articulo_label'], '',
               'ID: '+c['id']+' · Páginas: '+', '.join(map(str,c['paginas'])), '']
        if c.get('titulo_num'):
            md += [' / '.join(filter(None,[c.get('titulo_num'),c.get('titulo_nombre'),c.get('capitulo_num'),c.get('capitulo_nombre')])), '']
        md += [c['texto'], '']
(ROOT/'LCNE_revision_completa.md').write_text('\n'.join(md),encoding='utf-8')

images = ROOT/'paginas'
images.mkdir(exist_ok=True)
for n, page in enumerate(doc,1):
    target = images/f'pagina-{n:02}.png'
    if not target.exists(): page.get_pixmap(matrix=pymupdf.Matrix(1.45,1.45)).save(target)
preview = result | {'trazabilidad':lines, 'pdf_size':list(doc[0].rect)[2:]}
template=(ROOT/'vista_previa.template.html').read_text(encoding='utf-8')
(ROOT/'LCNE_vista_previa.html').write_text(template.replace('__DATOS__',json.dumps(preview,ensure_ascii=False).replace('</','<\\/')),encoding='utf-8')
print(json.dumps({'articulos':len(ordinary),'transitorios_ley':len(trans),'titulos':5,'capitulos':8,
                  'complementos':len(extras),'lineas_asignadas':len(ownership),'cobertura':'100% del texto corporal extraído',
                  'estructura':[{k:h[k] for k in ['numero','nombre','pagina']} for h in headings]},ensure_ascii=False,indent=2))
