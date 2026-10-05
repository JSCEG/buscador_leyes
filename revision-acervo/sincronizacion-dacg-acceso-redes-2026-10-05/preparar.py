"""Map official A/025/2023 fragments to the reviewed DOF issue PDF."""
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
PDF = Path('tmp/dof-2024-01-23-matutina-311101.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/23-01-2024/Matutina/311101'
PDF_SHA256 = '69abcd4beaa791bbde64666099c23ba394e7db0f9a23ab0ef09717a34e014743'
INSTRUMENT_ID = '02442bce-c5ff-5b39-aeff-59a9d8a37a80'
EDITORIAL_ID = '72237956-cba1-574a-a747-0b2a5b63f205'
SOURCE_ID = 'dof-matutina-2024-01-23-69abcd4beaa7'
FIRST_PAGE, LAST_PAGE = 189, 304
IMAGE_PAGES = {
    '6868bcb8-e80f-5736-993e-cad2a9d219f2': 298,
    '1ae34e5d-56a2-5c7c-9913-31eb0435cae0': 299,
    'e7218085-b8f1-5784-bc25-1628cf6a6ea8': 300,
    '9ecf87dc-1503-5a5d-8138-572e196ea480': 301,
}

def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', value, flags=re.I | re.S)
    value = re.sub(r'<[^>]+>', ' ', value)
    return html.unescape(value).replace('\u00ad', ' ')

def norm(value):
    value = unicodedata.normalize('NFKD', plain(value)).lower()
    return ''.join(char for char in value if char.isalnum())

rows = json.loads((ROOT / 'articulos-verificados.json').read_text(encoding='utf-8'))
assert len(rows) == 123 and len({row['id'] for row in rows}) == 123
assert all(row['ley_id'] == INSTRUMENT_ID for row in rows)
assert sum(row['id'] == EDITORIAL_ID for row in rows) == 1
official = [row for row in rows if row['id'] != EDITORIAL_ID]
assert len(official) == 122
assert set(IMAGE_PAGES).issubset({row['id'] for row in official})
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == PDF_SHA256
document = pymupdf.open(PDF)
assert len(document) == 466

manifest = json.loads(Path('public/reader-sources/manifest.v1.json').read_text(encoding='utf-8'))
sources = manifest['sources']
pages = [{'number': number, 'width': document[number - 1].rect.width, 'height': document[number - 1].rect.height}
         for number in range(FIRST_PAGE, LAST_PAGE + 1)]

lines, stream = [], ''
for page_number in range(FIRST_PAGE, LAST_PAGE + 1):
    page = document[page_number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            for span in line['spans']:
                if span['bbox'][0] < 120 and re.fullmatch(r'\s*\d+(?:\.\d+)*\.?\s*', span['text']):
                    continue
                token = norm(span['text'])
                if token:
                    start = len(stream)
                    stream += token
                    lines.append({'page': page_number, 'start': start, 'end': len(stream), 'bbox': list(span['bbox'])})

mapped, audit, cursor = {}, [], 0
for article in official:
    if article['id'] in IMAGE_PAGES:
        continue
    if article['identificador'] == 'Nota al pie de los anexos':
        # Supabase preserved this footnote with replacement characters in
        # accented letters, so its full normalized prefix cannot be matched.
        # The source wording is visibly printed on physical PDF page 251.
        page_number = 251
        page = document[page_number - 1]
        note_spans = [span for block in page.get_text('dict')['blocks'] for line in block.get('lines', [])
                      for span in line['spans'] if 'requerimientos del sistema' in span['text'].lower()
                      or 'mayor detalle' in span['text'].lower()]
        if not note_spans:
            raise ValueError('No se ubicó la nota al pie en la página 251 cotejada visualmente.')
        anchors = [{'page': page_number, 'bbox': list(span['bbox'])} for span in note_spans]
        mapped[article['id']] = {
            'sourceId': SOURCE_ID, 'label': article['identificador'], 'type': article['tipo_articulo'],
            'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
            'pageNumbers': [page_number], 'anchors': anchors,
        }
        audit.append({'id': article['id'], 'fragmento': article['identificador'], 'paginas': [page_number],
                      'anclas': len(anchors), 'metodo': 'nota al pie ubicada en página impresa 251; texto fuente preservado con caracteres de reemplazo'})
        continue
    normalized = norm(article['contenido'])
    position, marker = -1, ''
    # First prefer the longest opening phrase after the previous fragment.
    for length in (220, 180, 140, 100, 70, 45, 30, 20, 12):
        candidate = normalized[:length]
        found = stream.find(candidate, cursor)
        if found >= 0:
            position, marker = found, candidate
            break
    if position < 0:
        # Numeric article labels are sometimes separate PDF spans and omitted
        # above. Search text windows after the preceding fragment.
        candidates = []
        for offset in range(0, min(len(normalized), 800), 10):
            candidate = normalized[offset:offset + 32]
            found = stream.find(candidate, cursor) if len(candidate) >= 24 else -1
            if found >= 0:
                candidates.append((found, candidate))
        if candidates:
            position, marker = min(candidates, key=lambda pair: pair[0])
    if position < 0:
        # Some appendix notes are extracted near the end of the loaded data
        # despite appearing earlier in the official PDF. Only here search the
        # entire stream, selecting the longest exact phrase/window available.
        for length in (220, 180, 140, 100, 70, 45, 30, 20, 12):
            candidate = normalized[:length]
            found = stream.find(candidate)
            if found >= 0:
                position, marker = found, candidate
                break
        if position < 0:
            candidates = []
            for offset in range(0, min(len(normalized), 800), 10):
                candidate = normalized[offset:offset + 32]
                found = stream.find(candidate) if len(candidate) >= 24 else -1
                if found >= 0:
                    candidates.append((found, candidate))
            if candidates:
                position, marker = min(candidates, key=lambda pair: pair[0])
    if position < 0:
        raise ValueError(f'No se encontró {article["identificador"]} ({article["id"]}) después de offset {cursor}')
    audit.append({'id': article['id'], 'position': position, 'marker': marker})
    cursor = position + len(marker)

positioned = sorted((record for record in audit if 'position' in record), key=lambda item: item['position'])
for index, record in enumerate(positioned):
    article = next(row for row in official if row['id'] == record['id'])
    end = positioned[index + 1]['position'] if index + 1 < len(positioned) else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines if line['start'] < end and line['end'] > record['position']]
    pages_for_article = sorted({anchor['page'] for anchor in anchors})
    if not anchors:
        raise ValueError(f'Sin anclas para {article["identificador"]}')
    mapped[article['id']] = {
        'sourceId': SOURCE_ID, 'label': article['identificador'], 'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': pages_for_article, 'anchors': anchors,
    }
    record.update({'fragmento': article['identificador'], 'paginas': pages_for_article, 'anclas': len(anchors)})

for article in official:
    page_number = IMAGE_PAGES.get(article['id'])
    if page_number is None:
        continue
    page = document[page_number - 1]
    blocks = [block for block in page.get_text('dict')['blocks'] if 'image' in block]
    if not blocks:
        raise ValueError(f'No hay bloques de imagen en página {page_number} para {article["identificador"]}')
    # The source HTML stores these four image-only annexes as single images.
    # PyMuPDF exposes the DOF PDF's sliced image resources as adjacent blocks;
    # the union reproduces the source image's verified aspect ratio.
    x0 = min(block['bbox'][0] for block in blocks)
    y0 = min(block['bbox'][1] for block in blocks)
    x1 = max(block['bbox'][2] for block in blocks)
    y1 = max(block['bbox'][3] for block in blocks)
    source_image = {'6868bcb8-e80f-5736-993e-cad2a9d219f2': (589, 714),
                    '1ae34e5d-56a2-5c7c-9913-31eb0435cae0': (591, 780),
                    'e7218085-b8f1-5784-bc25-1628cf6a6ea8': (589, 787),
                    '9ecf87dc-1503-5a5d-8138-572e196ea480': (589, 758)}[article['id']]
    pdf_ratio, html_ratio = (x1 - x0) / (y1 - y0), source_image[0] / source_image[1]
    if abs(pdf_ratio - html_ratio) > 0.01:
        raise ValueError(f'Geometría de imagen no cotejada para {article["identificador"]}: {pdf_ratio} vs {html_ratio}')
    mapped[article['id']] = {
        'sourceId': SOURCE_ID, 'label': article['identificador'], 'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': [page_number], 'anchors': [{'page': page_number, 'bbox': [x0, y0, x1, y1]}],
    }
    audit.append({'id': article['id'], 'fragmento': article['identificador'], 'paginas': [page_number],
                  'anclas': 1, 'metodo': 'bloque de imagen; relación de aspecto cotejada con el recurso oficial', 'position': -1})

assert len(mapped) == 122 and not (set(mapped) & {EDITORIAL_ID})
source = {
    'id': SOURCE_ID, 'title': 'Edición matutina del Diario Oficial de la Federación · 23 de enero de 2024',
    'lawId': INSTRUMENT_ID, 'instrumentIds': [INSTRUMENT_ID], 'sha256': PDF_SHA256,
    'transport': 'remote-pdf', 'pdfUrl': f'/api/reader/{SOURCE_ID}', 'originalUrl': PDF_URL,
    'pageCount': len(document), 'pages': [{'number': p, 'width': document[p - 1].rect.width,
                                             'height': document[p - 1].rect.height} for p in range(1, len(document) + 1)],
}
(ROOT / 'map.json').write_text(json.dumps({'sourceId': SOURCE_ID, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'source.json').write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': 'Acuerdo A/025/2023 · modificaciones a DACG de acceso abierto a redes eléctricas',
    'instrumentoId': INSTRUMENT_ID, 'fuente': PDF_URL, 'fuenteHtml': 'https://sidof.segob.gob.mx/notas/docFuente/5714880',
    'pdfTemporal': str(PDF), 'sha256': PDF_SHA256, 'bytes': PDF.stat().st_size, 'paginasPdf': len(document),
    'paginasDelInstrumento': [FIRST_PAGE, LAST_PAGE], 'fragmentosEnSupabase': len(rows),
    'fragmentosEditorialesExcluidos': 1, 'fragmentosOficialesMapeados': len(mapped),
    'anclasGeometricas': sum(len(row['anchors']) for row in mapped.values()),
    'anexosImagen': [{'id': key, 'pagina': value, 'geometriaCotejada': True} for key, value in IMAGE_PAGES.items()],
    'fragmentos': sorted(audit, key=lambda item: next(i for i, row in enumerate(official) if row['id'] == item['id'])),
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'DACG acceso a redes: {len(mapped)} fragmentos; {sum(len(row["anchors"]) for row in mapped.values())} anclas; páginas {FIRST_PAGE}–{LAST_PAGE}; SHA-256 {PDF_SHA256}')
