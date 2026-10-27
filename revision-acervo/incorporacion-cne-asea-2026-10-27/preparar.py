"""Cotejo reproducible DOF HTML/PDF, sin publicar los binarios oficiales."""
import collections
import hashlib
import html
import json
import re
import sys
import unicodedata
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / '.local/lse-sync/python'))
import pymupdf
from bs4 import BeautifulSoup, Tag

PDF = Path(sys.argv[1])
SHA = '5043e1a11443c1b4c12ccc47d4bbc32e5dfe16d16ec1ba89f950e46bac6663ca'
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == SHA
doc = pymupdf.open(PDF)
assert len(doc) == 208
PDF_URL = 'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=27102026-MAT.pdf&repo='
SOURCE_ID = 'dof-cne-asea-20261027-' + SHA[:12]

def norm(t):
    return ''.join(c for c in unicodedata.normalize('NFKD', t).lower() if c.isalnum())

def compact(t):
    return re.sub(r'\s+', '', t)

def text(n):
    return ' '.join(n.get_text(' ', strip=True).split())

def nodes_for(key):
    soup = BeautifulSoup((ROOT / f'{key}-fuente.html').read_text(encoding='utf-8'), 'html.parser')
    nodes = []
    def walk(t):
        if not isinstance(t, Tag):
            return
        if t.name == 'table' or (t.name in ['div', 'p', 'h1', 'h2'] and not t.find(['div', 'p', 'table', 'h1', 'h2'])):
            if t.get_text(strip=True):
                nodes.append(t)
            return
        for child in t.children:
            walk(child)
    walk(soup.select_one('#DivDetalleNota'))
    return [n for n in nodes if 'En el documento que usted' not in n.get_text()]

def clean(ns):
    soup = BeautifulSoup('\n'.join(str(n) for n in ns), 'html.parser')
    allowed = {'div', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'sup', 'sub', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'h1', 'h2'}
    for n in list(soup.find_all(True)):
        if n.name not in allowed:
            n.unwrap()
        else:
            n.attrs = {k: v for k, v in n.attrs.items() if k in ['colspan', 'rowspan']}
    # El portal divide en dos la misma relación de 132 permisos. Unir sin duplicar datos.
    tables = soup.find_all('table')
    if tables:
        assert len(tables) == 2
        rows = [row.extract() for table in tables for row in table.find_all('tr')]
        assert len(rows) == 133
        merged = soup.new_tag('table')
        head = soup.new_tag('thead')
        for c in rows[0].find_all('td', recursive=False):
            c.name = 'th'
            c['scope'] = 'col'
        head.append(rows[0])
        merged.append(head)
        body = soup.new_tag('tbody')
        for row in rows[1:]:
            body.append(row)
        merged.append(body)
        tables[0].replace_with(merged)
        tables[1].decompose()
    return str(soup).replace('\r', '')

CONFIG = [
    ('asea', '5802182', 'ASEA-DELEGACION-2026', 23, 26,
     [(0, 'Preámbulo', 'preambulo'), (4, 'Considerandos', 'preambulo'),
      (33, 'PRIMERO', 'ordinario'), (35, 'SEGUNDO', 'ordinario'), (36, 'TERCERO', 'ordinario'),
      (37, 'CUARTO', 'ordinario'), (38, 'QUINTO', 'ordinario'), (39, 'SEXTO', 'ordinario'),
      (40, 'SÉPTMO', 'ordinario'), (41, 'OCTAVO', 'ordinario'), (42, 'Transitorio ÚNICO', 'transitorio')]),
    ('cne', '5802184', 'CNE-INICIO-CADUCIDAD-132-2026', 27, 36,
     [(0, 'Preámbulo', 'preambulo'), (4, 'Considerandos', 'preambulo'),
      (37, 'PRIMERO', 'ordinario'), (46, 'SEGUNDO', 'ordinario'), (49, 'TERCERO', 'ordinario'),
      (50, 'CUARTO', 'ordinario'), (52, 'Transitorio ÚNICO', 'transitorio')]),
]

payload, maps, audits, metadata = [], {}, [], []
for key, code, siglas, first, last, sections in CONFIG:
    nodes = nodes_for(key)
    url = f'https://dof.gob.mx/nota_detalle.php?codigo={code}&fecha=27/10/2026'
    lid = str(uuid.uuid5(uuid.NAMESPACE_URL, url))
    title = text(nodes[0])
    title = 'Acuerdo' + title[len('ACUERDO'):]
    ley = {'id': lid, 'titulo': title, 'siglas': siglas, 'tipo': 'acuerdo',
           'fecha_publicacion': '2026-10-27', 'fecha_ultima_reforma': None,
           'vigente': None, 'url_original': url,
           'temas_clave': ['Hidrocarburos', 'Delegación de facultades', 'ASEA'] if key == 'asea' else
                         ['Hidrocarburos', 'Comercialización', 'Inicio de procedimiento de caducidad', 'CNE']}
    # Índice de líneas del PDF en orden, excluyendo los encabezados de página.
    lines, stream = [], ''
    for num in range(first, last + 1):
        for b in doc[num - 1].get_text('dict')['blocks']:
            for line in b.get('lines', []):
                if line['bbox'][1] < 50:
                    continue
                token = norm(''.join(s['text'] for s in line['spans']))
                if token:
                    begin = len(stream)
                    stream += token
                    lines.append({'page': num, 'start': begin, 'end': len(stream), 'bbox': list(line['bbox'])})
    starts, previous = [], -1
    for start, label, kind in sections:
        marker = norm(text(nodes[start]))
        if len(marker) < 40:
            marker += norm(text(nodes[start + 1]))
        marker = marker[:85]
        pos = stream.find(marker, previous + 1)
        assert pos >= 0, (key, label, marker)
        starts.append(pos)
        previous = pos
    # Cotejo de todos los párrafos completos, no sólo los marcadores del mapa.
    cursor = 0
    checked_paragraphs = 0
    for node in nodes:
        if node.name == 'table':
            continue
        token = norm(text(node))
        found = stream.find(token, cursor)
        assert found >= 0, (key, 'Párrafo HTML ausente o fuera de orden en PDF', text(node)[:90])
        cursor = found + len(token)
        checked_paragraphs += 1
    if key == 'cne':
        end_of_document = stream.index(norm('AVISO por el que se da a conocer el Código de Conducta'))
    else:
        end_of_document = len(stream)
    articles, section_audit = [], []
    for i, (start, label, kind) in enumerate(sections):
        end = sections[i + 1][0] if i + 1 < len(sections) else len(nodes)
        content = clean(nodes[start:end])
        aid = str(uuid.uuid5(uuid.NAMESPACE_URL, url + '#' + label))
        a = {'id': aid, 'ley_id': lid, 'identificador': label, 'contenido': content,
             'orden': i + 1, 'tipo_articulo': kind,
             'titulo_nombre': 'Acuerdo',
             'capitulo_nombre': 'Disposiciones transitorias' if kind == 'transitorio' else
                                'Identificación y fundamentos' if kind == 'preambulo' else 'Disposiciones del acuerdo',
             'seccion_nombre': None}
        articles.append(a)
        finish = starts[i + 1] if i + 1 < len(starts) else end_of_document
        selected = [l for l in lines if l['start'] < finish and l['end'] > starts[i]]
        pages = sorted({l['page'] for l in selected})
        assert pages
        maps[aid] = {'sourceId': SOURCE_ID, 'label': label, 'type': kind,
                     'contentSha256': hashlib.sha256(content.encode()).hexdigest(),
                     'pageNumbers': pages, 'anchors': [{'page': l['page'], 'bbox': l['bbox']} for l in selected]}
        section_audit.append({'id': aid, 'identificador': label, 'paginas': pages, 'anclas': len(selected)})
    # Identidad textual integral con la publicación HTML, incluidos firmas y títulos.
    original = compact(''.join(n.get_text() for n in nodes))
    result = compact(BeautifulSoup(''.join(a['contenido'] for a in articles), 'html.parser').get_text())
    assert original == result, (key, 'Integridad textual HTML')
    table_audit = {'tablas': 0, 'celdas_cotejadas': 0}
    if key == 'cne':
        original_rows = [[c.get_text(' ', strip=True) for c in r.find_all(['td', 'th'], recursive=False)]
                         for table in [nodes[39], nodes[40]] for r in table.find_all('tr')]
        pdf_rows = []
        for num in range(30, 36):
            table = doc[num - 1].find_tables().tables[0]
            pdf_rows.extend([r[:5] for r in table.extract()[1:]])
        assert len(original_rows) == 133 and len(pdf_rows) == 132
        assert [int(r[0]) for r in original_rows[1:]] == list(range(1, 133))
        for h, p in zip(original_rows[1:], pdf_rows, strict=True):
            assert [compact(v) for v in h] == [compact(v) for v in p], (h, p)
        assert [compact(v) for v in original_rows[0]] == [compact(v) for v in doc[29].find_tables().tables[0].extract()[0][:5]]
        table_audit = {'tablas': 1, 'filas_de_datos': 132, 'columnas': 5,
                       'celdas_cotejadas': 660, 'encabezados_cotejados': 5,
                       'cotejo_por_celda_html_pdf_sin_espacios': True}
    payload.append({'ley': ley, 'articulos': articles})
    audits.append({'siglas': siglas, 'fuente_html': url, 'paginas': [first, last],
                   'integridad_textual_html': True, 'caracteres_sin_espacios': len(original),
                   'parrafos_html_pdf_cotejados': checked_paragraphs,
                   'criterio_parrafos_pdf': 'Texto alfanumérico normalizado completo, en orden; HTML íntegro preservado sin normalizar.',
                   **table_audit, 'fragmentos': section_audit})
    metadata.append({'ley_id': lid, 'publicacion': '2026-10-27',
                     'fecha_efectos': '2026-10-28' if key == 'asea' else '2026-10-27',
                     'alcance': 'Delegación de facultades; ejercicio directo e indelegable' if key == 'asea' else
                                'Inicio de procedimientos individuales; no resolución final de caducidad',
                     'firma_integrada_en_transitorio': True,
                     'observacion': 'Se conserva la errata oficial SÉPTMO.' if key == 'asea' else
                                    '132 permisos en una tabla continua, sin alterar sus cinco columnas.'})

source = {'id': SOURCE_ID, 'title': 'DOF · 27 de octubre de 2026 · Acuerdos CNE y ASEA',
          'instrumentIds': [p['ley']['id'] for p in payload], 'sha256': SHA, 'transport': 'remote-pdf',
          'pdfUrl': '/api/reader/' + SOURCE_ID, 'originalUrl': PDF_URL, 'pageCount': len(doc),
          'pages': [{'number': p.number + 1, 'width': p.rect.width, 'height': p.rect.height} for p in doc]}
for name, data in [('carga.json', payload), ('map.json', {'source': source, 'articles': maps}),
                   ('cotejo.json', {'pdf_sha256': SHA, 'pdf_bytes': PDF.stat().st_size,
                                    'fuente_pdf': PDF_URL, 'instrumentos': audits}), ('metadatos.json', metadata)]:
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def lit(v):
    return 'NULL' if v is None else "'" + str(v).replace("'", "''") + "'"

sql = ['BEGIN;']
for item in payload:
    ley = item['ley']
    sql.append('DO $$ BEGIN IF EXISTS (SELECT 1 FROM leyes WHERE id=' + lit(ley['id']) + ' OR siglas=' + lit(ley['siglas']) + ") THEN RAISE EXCEPTION 'Acuerdo ya cargado'; END IF; END $$;")
    sql.append('INSERT INTO leyes (' + ','.join(ley) + ') VALUES (' + ','.join('ARRAY[' + ','.join(lit(t) for t in v) + ']' if isinstance(v, list) else lit(v) for v in ley.values()) + ');')
    for a in item['articulos']:
        sql.append('INSERT INTO articulos (' + ','.join(a) + ') VALUES (' + ','.join(lit(v) for v in a.values()) + ');')
    sql.append('UPDATE articulos SET contenido=replace(contenido,chr(13),\'\') WHERE ley_id=' + lit(ley['id']) + ' AND position(chr(13) in contenido)>0;')
sql.append('COMMIT;')
(ROOT / 'aplicar.sql').write_text('\n'.join(sql) + '\n', encoding='utf-8')
print(json.dumps({'instrumentos': len(payload), 'fragmentos': len(maps), 'fuente': SOURCE_ID, 'ids': [p['ley']['id'] for p in payload]}))
