"""Map the SENER General Organization Manual to its official DOF PDF."""
import hashlib
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path(__file__).resolve().parent
PDF = Path('tmp/dof-2026-04-27-matutina-326905.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/27-04-2026/Matutina/326905'
PDF_SHA256 = '1036c19a6f74f6bd1a5a5abc9fb1a4468f823c8e1d45c6a164317e8805067852'
INSTRUMENT_ID = '3b9afd47-4363-5938-acce-300432d8575a'
SOURCE_ID = 'dof-matutina-2026-04-27-1036c19a6f74'
FIRST_PAGE, LAST_PAGE = 191, 332
IMAGE_ONLY_IDS = {'2326d66e-14e9-53cc-a7c2-444a2d190576'}

def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', value, flags=re.I | re.S)
    value = re.sub(r'<[^>]+>', ' ', value)
    return html.unescape(value).replace('\u00ad', ' ')

def norm(value):
    value = unicodedata.normalize('NFKD', plain(value)).lower()
    return ''.join(char for char in value if char.isalnum())

rows = json.loads((ROOT / 'articulos-verificados.json').read_text(encoding='utf-8'))
assert len(rows) == 77 and len({row['id'] for row in rows}) == 77
assert all(row['ley_id'] == INSTRUMENT_ID for row in rows)
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == PDF_SHA256
document = pymupdf.open(PDF)
assert len(document) == 456

lines, stream = [], ''
for page_number in range(FIRST_PAGE, LAST_PAGE + 1):
    page = document[page_number - 1]
    text_rect = page.mediabox if page.rotation else page.rect
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            if line['bbox'][1] < 50 or line['bbox'][3] > text_rect.height - 28:
                continue
            for span in line['spans']:
                if span['bbox'][0] < 120 and re.fullmatch(r'\s*\d+(?:\.\d+)*\.?\s*', span['text']):
                    continue
                token = norm(span['text'])
                if token:
                    start = len(stream)
                    stream += token
                    bbox = pymupdf.Rect(span['bbox'])
                    if page.rotation:
                        bbox *= page.rotation_matrix
                    lines.append({'page': page_number, 'start': start, 'end': len(stream), 'bbox': list(bbox)})

starts, cursor = [], 0
for article in rows:
    normalized = norm(article['contenido'])
    if article['id'] in IMAGE_ONLY_IDS:
        starts.append({'position': None, 'id': article['id'], 'marker': 'figura oficial del organigrama', 'fragmento': article['identificador']})
        continue
    position, marker = -1, ''
    for length in (220, 180, 140, 100, 70, 45, 30, 20, 12):
        candidate = normalized[:length]
        found = stream.find(candidate, cursor)
        if found >= 0:
            position, marker = found, candidate
            break
    if position < 0:
        candidates = []
        for offset in range(0, min(len(normalized), 700), 8):
            candidate = normalized[offset:offset + 36]
            found = stream.find(candidate, cursor) if len(candidate) >= 26 else -1
            if found >= 0:
                candidates.append((found, candidate))
        if candidates:
            position, marker = min(candidates, key=lambda item: item[0])
    if position < 0:
        raise ValueError(f'No se ubicó {article["identificador"]} ({article["id"]}) después del offset {cursor}')
    starts.append({'position': position, 'id': article['id'], 'marker': marker, 'fragmento': article['identificador']})
    cursor = position + len(marker)

mapped, audit = {}, []
for index, start in enumerate(starts):
    article = next(row for row in rows if row['id'] == start['id'])
    if article['id'] in IMAGE_ONLY_IDS:
        page = document[220]  # Physical page 221, the manual's organigram page.
        blocks = [block for block in page.get_text('dict')['blocks'] if 'image' in block]
        if not blocks:
            raise ValueError('No se encontró la figura oficial del organigrama en la página 221.')
        anchors = []
        for block in blocks:
            bbox = pymupdf.Rect(block['bbox']) * page.rotation_matrix
            anchors.append({'page': 221, 'bbox': list(bbox)})
        mapped[article['id']] = {
            'sourceId': SOURCE_ID, 'label': article['identificador'], 'type': article['tipo_articulo'],
            'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
            'pageNumbers': [221], 'anchors': anchors,
        }
        audit.append({'id': article['id'], 'fragmento': article['identificador'], 'paginas': [221],
                      'anclas': len(anchors), 'metodo': 'bloque(s) gráfico(s) del organigrama en la página oficial 221'})
        continue
    later = [record['position'] for record in starts[index + 1:] if record['position'] is not None]
    end = min(later) if later else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines
               if line['start'] < end and line['end'] > start['position']]
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    method = 'prefijo textual y coordenadas de span'
    if not anchors or not page_numbers or min(page_numbers) < FIRST_PAGE or max(page_numbers) > LAST_PAGE:
        raise ValueError(f'Sin anclas/página válida para {article["identificador"]}')
    mapped[article['id']] = {
        'sourceId': SOURCE_ID, 'label': article['identificador'], 'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers, 'anchors': anchors,
    }
    audit.append({'id': article['id'], 'fragmento': article['identificador'], 'paginas': page_numbers,
                  'anclas': len(anchors), 'metodo': method, 'prefijoCotejado': start['marker']})

assert len(mapped) == 77
source = {
    'id': SOURCE_ID, 'title': 'Edición matutina del Diario Oficial de la Federación · 27 de abril de 2026',
    'lawId': INSTRUMENT_ID, 'instrumentIds': [INSTRUMENT_ID], 'sha256': PDF_SHA256,
    'transport': 'remote-pdf', 'pdfUrl': f'/api/reader/{SOURCE_ID}', 'originalUrl': PDF_URL,
    'pageCount': len(document), 'pages': [{'number': number, 'width': document[number - 1].rect.width,
                                             'height': document[number - 1].rect.height}
                                            for number in range(1, len(document) + 1)],
}
(ROOT / 'map.json').write_text(json.dumps({'sourceId': SOURCE_ID, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'source.json').write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': 'Manual de Organización General de la Secretaría de Energía',
    'instrumentoId': INSTRUMENT_ID, 'fuente': PDF_URL, 'fuenteHtml': 'https://sidof.segob.gob.mx/notas/docFuente/5785999',
    'pdfTemporal': str(PDF), 'sha256': PDF_SHA256, 'bytes': PDF.stat().st_size,
    'paginasPdf': len(document), 'paginasDelInstrumento': [FIRST_PAGE, LAST_PAGE],
    'fragmentosCargados': len(rows), 'fragmentosMapeados': len(mapped),
    'anclasGeometricas': sum(len(row['anchors']) for row in mapped.values()),
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'MOG-SENER: {len(mapped)} fragmentos; {sum(len(row["anchors"]) for row in mapped.values())} anclas; páginas {FIRST_PAGE}–{LAST_PAGE}; SHA-256 {PDF_SHA256}')
