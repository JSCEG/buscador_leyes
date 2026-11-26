"""NOM-023: preserva HTML/figuras, coteja cada párrafo y genera mapa del PDF remoto.

Uso: python preparar.py ruta/al/25112026-MAT.pdf
El PDF es insumo temporal; nunca se copia al repositorio.
"""
import bisect
import copy
import hashlib
import json
import re
import sys
import unicodedata
import uuid
from pathlib import Path

import pymupdf
from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parent
PDF = Path(sys.argv[1])
SHA = '7a9687317718bf15311a476c77e8522016e30b1778bfa6499f1172823a818186'
HTML_SHA = '0d33b51b1d09c4fe95d627b33e6e1522984a79fd77b176e93a2dde29d78c36bb'
URL = 'https://sidof.segob.gob.mx/notas/5805253'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/25-11-2026/Matutina/331125'
SOURCE = 'dof-nom023-asea-20261125-' + SHA[:12]
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == SHA
assert hashlib.sha256((ROOT / 'fuente.html').read_bytes()).hexdigest() == HTML_SHA
doc = pymupdf.open(PDF)
assert len(doc) == 552


def norm(t):
    return ''.join(c for c in unicodedata.normalize('NFKD', t).lower() if c.isalnum())


def text(n):
    return ' '.join(n.get_text(' ', strip=True).split())


soup = BeautifulSoup((ROOT / 'fuente.html').read_text('utf8'), 'html.parser')
nodes = []


def walk(n):
    if not isinstance(n, Tag):
        return
    if n.name in ['table', 'img'] or n.name in ['div', 'p', 'h1', 'h2'] and not n.find(['div', 'p', 'h1', 'h2', 'table']):
        if n.get_text(strip=True) or n.find('img') or n.name == 'img':
            nodes.append(n)
        return
    for child in n.children:
        walk(child)


walk(soup.body)
assert len(nodes) == 1871
assert len([n for n in nodes if n.name == 'table']) == 28

# Tres defectos del HTML oficial. El PDF firmado/publicado es la evidencia;
# no se corrige redacción jurídica ni se normalizan erratas del documento.
corrections = []
replacements = {
    'di鳥l': 'diésel',
    'est鮠realizando': 'estén realizando',
    'Estaci����e': 'Estación de',
    'ignici����ercanas': 'ignición cercanas',
    'Ქa': 'área',
    'propagaci����e': 'propagación de',
    'propagaci����el': 'propagación del',
    'absorci����specializados': 'absorción especializados',
    'alguna o algunas de las condiciones siguientes: alguna o algunas de las condiciones siguientes:':
        'alguna o algunas de las condiciones siguientes:',
}
# Replace longer overlapping tokens first (propagaci...el before ...e).
for leaf in list(nodes[1660].find_all(string=True)):
    original = str(leaf)
    fixed = original
    for old in sorted(replacements, key=len, reverse=True):
        fixed = fixed.replace(old, replacements[old])
    if fixed != original:
        corrections.append({'antes': original, 'despues': fixed, 'fuente': 'PDF oficial, cuadro 9.4'})
        leaf.replace_with(fixed)

# El HTML desplazó cinco incisos fuera de la tabla. En el PDF p.221 son
# parte del criterio 8.8.1.2.5, columna de aceptación, no un apéndice suelto.
target = next(d for d in nodes[1660].find_all('div') if text(d).startswith('8.8.1.2.5. Cumple'))
assert target.parent.name == 'td'
for n in reversed(nodes[1661:1666]):
    target.insert_after(copy.copy(n))
corrections.append({'accion': 'Reintegrar los incisos a–e en la celda del criterio 8.8.1.2.5',
                    'nodos_html': list(range(1661, 1666)), 'pagina_pdf': 221})
omitted = set(range(1661, 1666))  # ya dentro de la celda, no duplicar

# Un bloque dañado llegó como párrafo único con saltos de línea. Recuperar
# sus párrafos, sin alterar texto, permite cotejo exacto antes/después de página.
for d in list(nodes[1660].find_all('div')):
    if '\n\n' in d.get_text() and '8.6.5.' in d.get_text() and '\ufffd' not in d.get_text():
        pieces = re.split(r'\n\s*\n', d.get_text())
        if len(pieces) > 1:
            for piece in pieces:
                if piece.strip():
                    p = soup.new_tag('div')
                    p.string = piece.strip()
                    d.insert_before(p)
            d.decompose()

# Los inicios y los textos íntegros se localizan en el mismo ejemplar.
lines, stream = [], ''
for pn in range(35, 253):
    for block in doc[pn - 1].get_text('dict')['blocks']:
        for line in block.get('lines', []):
            if line['bbox'][1] < 50:
                continue
            token = norm(''.join(s['text'] for s in line['spans']))
            if token:
                begin = len(stream)
                stream += token
                lines.append({'page': pn, 'start': begin, 'end': len(stream), 'bbox': list(line['bbox'])})

sections = [(0, 'Portada y fundamentos', 'preambulo'), (3, 'Considerandos', 'preambulo'),
            (27, 'Prefacio', 'preambulo'), (48, 'Índice del contenido', 'complementario')]
chapter_names = {}
for i in range(66, 1670):
    if nodes[i].name == 'table' or i == 741:  # 741 es la nota al pie 1, no un numeral
        continue
    m = re.match(r'^(\d+(?:\.\d+)*)(?:\.)?\s', text(nodes[i]))
    if m:
        sections.append((i, 'Numeral ' + m[1], 'ordinario'))
        if '.' not in m[1]:
            chapter_names[m[1]] = text(nodes[i])
sections += [(1670, 'Transitorio PRIMERO', 'transitorio')]
sections += [(i, 'Transitorio ' + text(nodes[i]).split('.')[0], 'transitorio') for i in range(1672, 1679)]
sections += [(1679, 'Apéndice A · Planos', 'anexo'), (1689, 'Apéndice B · Señales y avisos', 'anexo'),
             (1706, 'Apéndice C · Expediente de integridad mecánica', 'anexo'),
             (1766, 'Apéndice D · Esquemas de accesorios', 'anexo'), (1788, 'Bibliografía', 'complementario')]
assert len(sections) == 887 and len(chapter_names) == 11
starts, marker_audit, previous = [], [], -1
for start, label, kind in sections:
    token = norm(text(nodes[start]))
    if len(token) < 50:
        token += norm(text(nodes[start + 1]))
    for length in [85, 65, 45, 30]:
        marker = token[:length]
        position = stream.find(marker, previous + 1)
        if position >= 0:
            break
    assert position >= 0, (label, 'Marcador ausente del PDF')
    starts.append(position)
    marker_audit.append({'identificador': label, 'caracteres_marcador': len(marker), 'offset': position})
    previous = position

def clean(ns):
    local = BeautifulSoup('\n'.join(str(n) for n in ns), 'html.parser')
    allowed = {'div', 'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'table', 'thead', 'tbody',
               'tr', 'th', 'td', 'h1', 'h2', 'img', 'a'}
    for n in list(local.find_all(True)):
        if n.name not in allowed:
            n.unwrap()
        else:
            n.attrs = {k: v for k, v in n.attrs.items() if k in ['rowspan', 'colspan', 'src', 'alt', 'href']}
    for table in local.find_all('table'):
        rows = table.find_all('tr', recursive=False)
        assert rows
        first = text(rows[0])
        # La lista de abreviaturas comienza por ALARP: no tiene encabezados.
        if first.startswith('ALARP'):
            count = 0
        elif first.startswith('Del elemento') and ('Transversal' in first or 'Longitudinal' in first):
            count = 3
        elif first.startswith('No Accesorio') or first.startswith('Tubo de los Pozos'):
            count = 2
        else:
            count = 1
        head, body = local.new_tag('thead'), local.new_tag('tbody')
        for ri, row in enumerate(rows):
            row.extract()
            if ri < count:
                for cell in row.find_all(['td', 'th'], recursive=False):
                    cell.name = 'th'
                    cell['scope'] = 'col'
                head.append(row)
            else:
                body.append(row)
        if count:
            table.append(head)
        table.append(body)
    for image in local.find_all('img'):
        assert image.get('src', '').startswith('https://sidofqa.segob.gob.mx/imagenes_diarios/2026/11/25/MAT/')
        image['alt'] = 'Figura del documento oficial NOM-023-ASEA-2026; consultar también el PDF original.'
    return str(local).replace('\r', '')


lid = str(uuid.uuid5(uuid.NAMESPACE_URL, URL))
ley = {'id': lid, 'titulo': text(nodes[0]), 'siglas': 'NOM-023-ASEA-2026', 'tipo': 'nom',
       'fecha_publicacion': '2026-11-25', 'fecha_ultima_reforma': None, 'vigente': None,
       'url_original': URL, 'temas_clave': ['ASEA', 'Gasolinas y diésel', 'Estaciones de servicio',
                                          'Seguridad industrial', 'Evaluación de la conformidad']}
articles, maps, checks = [], {}, []
all_lines_ends = [l['end'] for l in lines]
all_lines_starts = [l['start'] for l in lines]
paragraph_count = 0
for k, (start, label, kind) in enumerate(sections):
    end = sections[k + 1][0] if k + 1 < len(sections) else len(nodes)
    ns = [nodes[i] for i in range(start, end) if i not in omitted]
    content = clean(ns)
    finish = starts[k + 1] if k + 1 < len(starts) else len(stream)
    section_stream = stream[starts[k]:finish]
    # Comprobar TODO el texto de cada párrafo/celda contra las páginas del
    # fragmento. Normalización únicamente para cotejo, nunca del contenido.
    count = 0
    for n in ns:
        paragraphs = [n] if n.name != 'table' else [d for d in n.find_all(['div', 'p']) if not d.find(['div', 'p'])]
        for p in paragraphs:
            token = norm(text(p))
            if token:
                assert token in section_stream, (label, 'Párrafo no cotejado', text(p)[:200])
                count += 1
    paragraph_count += count
    aid = str(uuid.uuid5(uuid.NAMESPACE_URL, URL + '#' + label))
    chapter = chapter_names.get(label.split()[1].split('.')[0]) if label.startswith('Numeral ') else label
    article = {'id': aid, 'ley_id': lid, 'identificador': label, 'contenido': content, 'orden': k + 1,
               'tipo_articulo': kind, 'titulo_nombre': 'NOM-023-ASEA-2026', 'capitulo_nombre': chapter,
               'seccion_nombre': None}
    articles.append(article)
    selected = lines[bisect.bisect_right(all_lines_ends, starts[k]):bisect.bisect_left(all_lines_starts, finish)]
    pages = sorted({l['page'] for l in selected})
    assert pages
    anchors = [{'page': l['page'], 'bbox': l['bbox']} for l in selected]
    # Ilustraciones originales: incluir sus rectángulos sólo dentro del tramo
    # del numeral, evitando resaltar figuras pertenecientes al siguiente.
    if '<img ' in content:
        for pn in pages:
            pl = [l for l in selected if l['page'] == pn]
            ymin = min(l['bbox'][1] for l in pl)
            ymax = max(l['bbox'][3] for l in pl)
            for img in doc[pn - 1].get_image_info():
                rect = img['bbox']
                if rect[1] >= ymin and rect[3] <= ymax:
                    anchors.append({'page': pn, 'bbox': list(rect)})
    maps[aid] = {'sourceId': SOURCE, 'label': label, 'type': kind,
                 'contentSha256': hashlib.sha256(content.encode()).hexdigest(),
                 'pageNumbers': pages, 'anchors': anchors}
    checks.append({'id': aid, 'identificador': label, 'paginas': pages, 'parrafos_cotejados': count})

# Identidad integral después de las correcciones documentadas y recolocación
# de incisos. Cambiar etiquetas de encabezado no debe cambiar ninguna celda.
original = re.sub(r'\s+', '', ''.join(nodes[i].get_text() for i in range(len(nodes)) if i not in omitted))
result = re.sub(r'\s+', '', BeautifulSoup(''.join(a['contenido'] for a in articles), 'html.parser').get_text())
assert original == result
whole = BeautifulSoup(''.join(a['contenido'] for a in articles), 'html.parser')
assert '\ufffd' not in whole.get_text()
tables = whole.find_all('table')
assert len(tables) == 28 and len(whole.find_all('img')) == 26
table_checks = []
for ti, table in enumerate(tables):
    # Expandir rowspan/colspan para probar que ninguna fila pierde columnas.
    grid = {}
    rows = table.find_all('tr')
    for r, row in enumerate(rows):
        c = 0
        for cell in row.find_all(['td', 'th'], recursive=False):
            while (r, c) in grid:
                c += 1
            rs, cs = int(cell.get('rowspan', 1)), int(cell.get('colspan', 1))
            for y in range(r, r + rs):
                for x in range(c, c + cs):
                    assert (y, x) not in grid, (ti, r, c, 'Solapamiento de celdas')
                    grid[y, x] = True
            c += cs
    widths = [sum(y == r for y, _ in grid) for r in range(len(rows))]
    assert len(set(widths)) == 1, (ti, widths)
    table_checks.append({'tabla': ti + 1, 'filas': len(rows), 'columnas_logicas': widths[0],
                         'celdas': len(table.find_all(['td', 'th'])),
                         'filas_encabezado': len(table.thead.find_all('tr')) if table.thead else 0})

source = {'id': SOURCE, 'title': 'DOF · NOM-023-ASEA-2026 · 25 de noviembre de 2026', 'instrumentIds': [lid],
          'sha256': SHA, 'transport': 'remote-pdf', 'pdfUrl': '/api/reader/' + SOURCE,
          'originalUrl': PDF_URL, 'pageCount': len(doc),
          'pages': [{'number': p.number + 1, 'width': p.rect.width, 'height': p.rect.height} for p in doc]}
audit = {'pdf_sha256': SHA, 'pdf_bytes': PDF.stat().st_size, 'fuente_pdf': PDF_URL,
         'fuente_html': URL.replace('/notas/', '/notas/docFuente/'), 'html_sha256': HTML_SHA,
         'paginas_norma': [35, 252], 'integridad_textual_html_corregido': True,
         'criterio': 'Cada párrafo completo localizado en el tramo PDF de su fragmento; comparación alfanumérica sin diacríticos. Contenido guardado sin normalizar.',
         'parrafos_cotejados': paragraph_count, 'correcciones_html_contra_pdf': corrections,
         'tablas': table_checks, 'figuras': [i['src'] for i in whole.find_all('img')],
         'fragmentos': checks, 'marcadores': marker_audit}
metadata = {'publicacion': '2026-11-25', 'estado': 'Publicada; entrada en vigor diferida',
            'vigencia': '180 días naturales posteriores a su publicación (transitorio PRIMERO).',
            'antecedente': 'Cancela la NOM-005-ASEA-2016 a partir de su entrada en vigor, no desde la publicación (transitorio SEGUNDO).',
            'apendices': {'A': 'Normativo', 'B': 'Normativo', 'C': 'Normativo', 'D': 'Informativo'},
            'pdf_remoto': True, 'binarios_pdf_en_repositorio': False}
for name, value in [('carga.json', [{'ley': ley, 'articulos': articles}]),
                    ('map.json', {'source': source, 'articles': maps}),
                    ('cotejo.json', audit), ('metadatos.json', metadata)]:
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', 'utf8')


def lit(v):
    return 'NULL' if v is None else "'" + str(v).replace("'", "''") + "'"


sql = ['BEGIN;', "DO $$ BEGIN IF EXISTS (SELECT 1 FROM leyes WHERE id=" + lit(lid) +
       " OR siglas='NOM-023-ASEA-2026') THEN RAISE EXCEPTION 'NOM-023 ya cargada'; END IF; END $$;"]
sql.append('INSERT INTO leyes (' + ','.join(ley) + ') VALUES (' +
           ','.join('ARRAY[' + ','.join(lit(t) for t in v) + ']' if isinstance(v, list) else lit(v) for v in ley.values()) + ');')
for a in articles:
    sql.append('INSERT INTO articulos (' + ','.join(a) + ') VALUES (' + ','.join(lit(v) for v in a.values()) + ');')
sql.append('COMMIT;')
(ROOT / 'aplicar.sql').write_text('\n'.join(sql) + '\n', 'utf8')
print(json.dumps({'ley': lid, 'fragmentos': len(articles), 'parrafos_cotejados': paragraph_count,
                  'tablas': len(tables), 'figuras': 26, 'fuente': SOURCE}))
