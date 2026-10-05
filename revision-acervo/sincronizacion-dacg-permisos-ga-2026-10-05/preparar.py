"""Map the loaded CNE generation/storage permits DACG to its official DOF PDF."""
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
PDF = Path('tmp/dof-2025-10-23-matutina-323704.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/23-10-2025/Matutina/323704'
PDF_SHA256 = '0314af26eb12f95ba3de3f838b7bf8821f5a1900f5ad76fd11e42d2e7bc66a7d'
INSTRUMENT_ID = '37c89350-82df-5021-8dbe-94e8e31e1d3e'
INDEX_ID = '35bac1e8-52b3-50aa-bf28-4209291bfe09'
SOURCE_ID = 'dof-matutina-2025-10-23-0314af26eb12'
FIRST_PAGE, LAST_PAGE = 13, 69

def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', value, flags=re.I | re.S)
    value = re.sub(r'<[^>]+>', ' ', value)
    return html.unescape(value).replace('\u00ad', ' ')

def norm(value):
    value = unicodedata.normalize('NFKD', plain(value)).lower()
    return ''.join(char for char in value if char.isalnum())

rows = json.loads((ROOT / 'articulos-verificados.json').read_text(encoding='utf-8'))
assert len(rows) == 86 and len({row['id'] for row in rows}) == 86
assert all(row['ley_id'] == INSTRUMENT_ID for row in rows)
assert sum(row['id'] == INDEX_ID for row in rows) == 1
official = [row for row in rows if row['id'] != INDEX_ID]
assert len(official) == 85
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == PDF_SHA256
document = pymupdf.open(PDF)
assert len(document) == 364

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

starts, cursor = [], 0
for article in official:
    normalized = norm(article['contenido'])
    position, marker = -1, ''
    # Prefer the longest exact leading phrase after the preceding fragment.
    for length in (220, 180, 140, 100, 70, 45, 30, 20, 12):
        candidate = normalized[:length]
        found = stream.find(candidate, cursor)
        if found >= 0:
            position, marker = found, candidate
            break
    # Chunk text may have corrupted accented characters, and multi-column
    # tables can reorder text; locate a longer exact phrase within the chunk.
    if position < 0:
        matches = []
        for offset in range(0, min(len(normalized), 700), 8):
            candidate = normalized[offset:offset + 36]
            found = stream.find(candidate, cursor) if len(candidate) >= 26 else -1
            if found >= 0:
                matches.append((found, candidate))
        if matches:
            position, marker = min(matches, key=lambda item: item[0])
    if position < 0:
        raise ValueError(f'No se encontró {article["identificador"]} ({article["id"]}) luego del offset {cursor}')
    starts.append({'position': position, 'id': article['id'], 'marker': marker, 'fragmento': article['identificador']})
    cursor = position + len(marker)

mapped, audit = {}, []
for index, start in enumerate(starts):
    article = next(row for row in official if row['id'] == start['id'])
    end = starts[index + 1]['position'] if index + 1 < len(starts) else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines
               if line['start'] < end and line['end'] > start['position']]
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    if not anchors or not page_numbers or min(page_numbers) < FIRST_PAGE or max(page_numbers) > LAST_PAGE:
        raise ValueError(f'Sin anclas/página válida para {article["identificador"]}')
    mapped[article['id']] = {
        'sourceId': SOURCE_ID, 'label': article['identificador'], 'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers, 'anchors': anchors,
    }
    audit.append({'id': article['id'], 'fragmento': article['identificador'], 'paginas': page_numbers,
                  'anclas': len(anchors), 'prefijoCotejado': start['marker']})

assert len(mapped) == 85 and INDEX_ID not in mapped
source = {
    'id': SOURCE_ID, 'title': 'Edición matutina del Diario Oficial de la Federación · 23 de octubre de 2025',
    'lawId': INSTRUMENT_ID, 'instrumentIds': [INSTRUMENT_ID], 'sha256': PDF_SHA256,
    'transport': 'remote-pdf', 'pdfUrl': f'/api/reader/{SOURCE_ID}', 'originalUrl': PDF_URL,
    'pageCount': len(document), 'pages': [{'number': number, 'width': document[number - 1].rect.width,
                                             'height': document[number - 1].rect.height}
                                            for number in range(1, len(document) + 1)],
}
(ROOT / 'map.json').write_text(json.dumps({'sourceId': SOURCE_ID, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'source.json').write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': 'DACG para permisos de generación y almacenamiento de energía eléctrica',
    'instrumentoId': INSTRUMENT_ID, 'fuente': PDF_URL, 'fuenteHtml': 'https://sidof.segob.gob.mx/notas/docFuente/5770667',
    'pdfTemporal': str(PDF), 'sha256': PDF_SHA256, 'bytes': PDF.stat().st_size,
    'paginasPdf': len(document), 'paginasDelInstrumento': [FIRST_PAGE, LAST_PAGE],
    'fragmentosCargados': len(rows), 'fragmentosMapeados': len(mapped),
    'fragmentosNoMapeables': [{'id': INDEX_ID, 'fragmento': 'Índice de las disposiciones',
                              'razon': 'Índice de navegación sintético; la edición oficial no lo reproduce como bloque. Los títulos referenciados sí se mapean en sus fragmentos.'}],
    'anclasGeometricas': sum(len(row['anchors']) for row in mapped.values()),
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'DACG-PERMISOS-GA: {len(mapped)} fragmentos oficiales; {sum(len(row["anchors"]) for row in mapped.values())} anclas; páginas {FIRST_PAGE}–{LAST_PAGE}; SHA-256 {PDF_SHA256}')
