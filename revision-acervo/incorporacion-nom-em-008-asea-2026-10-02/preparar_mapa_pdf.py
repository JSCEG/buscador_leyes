"""Build a page-and-coordinate map against the official DOF issue PDF."""
import hashlib
import html
import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / '.local/lse-sync/python'))
import pymupdf

ROOT = Path(__file__).resolve().parent
PACKAGE = ROOT / 'NOM-EM-008-ASEA-2026-carga.json'
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'AppData/Local/Temp/DOF-2026-10-02-Matutina-NOM-EM-008.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/02-10-2026/Matutina/329985'
SIDOF_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5800169'
INSTRUMENT_ID = '864ee23b-19ea-5c44-9b01-bd77e0320b11'
FIRST_PAGE, LAST_PAGE = 26, 61


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain(value):
    parser = TextExtractor()
    parser.feed(value)
    return ' '.join(' '.join(parser.parts).split())


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads(PACKAGE.read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
assert data['ley']['url_original'] == SIDOF_URL
document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(document) == 224, f'Edición DOF inesperada: {len(document)} páginas'
assert pdf_sha == 'e6d17b1ecd3713cd74ab2b7f3921aafa884373526fb3a63604471e7a6abf3bef'

source_id = 'dof-matutina-2026-10-02-' + pdf_sha[:12]
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 2 de octubre de 2026',
    'instrumentIds': [INSTRUMENT_ID],
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width,
               'height': page.rect.height} for page in document],
}

lines = []
stream = ''
for page_number in range(FIRST_PAGE, LAST_PAGE + 1):
    page = document[page_number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans'])
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if not token:
                continue
            start = len(stream)
            stream += token
            lines.append({'page': page_number, 'start': start, 'end': len(stream),
                          'bbox': list(line['bbox'])})

official = [item for item in data['articulos'] if item['tipo_articulo'] != 'nota']
editorial = [item for item in data['articulos'] if item['tipo_articulo'] == 'nota']
starts = []
unmatched = []
last_position = -1
for item in official:
    text = norm(plain(item['contenido']))
    # Prefer the whole text. When PDF extraction changes line/table spacing,
    # fall back to a leading passage, choosing the next occurrence in legal
    # document order (headings can intentionally repeat in later sections).
    position = stream.find(text, last_position + 1) if text else -1
    matched_length = len(text)
    if position < 0:
        position = -1
        for size in (120, 80, 48, 24):
            marker = text[:size]
            if len(marker) != size:
                continue
            candidate = stream.find(marker, last_position + 1)
            if candidate >= 0:
                position, matched_length = candidate, size
                break
    if position < 0:
        unmatched.append(item['identificador'] + ' :: ' + text[:220])
        continue
    last_position = position
    starts.append((position, item, matched_length, text))

positions = [position for position, *_ in starts]
if unmatched or len(starts) != len(official):
    raise ValueError('No se cotejaron todos los fragmentos oficiales: ' + ', '.join(unmatched))
if positions != sorted(set(positions)):
    raise ValueError('Los fragmentos oficiales no aparecen una sola vez y en orden en el PDF.')

mapped = {}
audit = []
for index, (start, item, matched_length, normalized_text) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else start + len(normalized_text)
    # The next verified fragment start bounds the current provision. For the
    # last one, the exact source-text length bounds the final range.
    content_end = end
    anchors = [{'page': line['page'], 'bbox': line['bbox']}
               for line in lines if line['start'] < content_end and line['end'] > start]
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    if not anchors or page_numbers[0] < FIRST_PAGE or page_numbers[-1] > LAST_PAGE:
        raise ValueError(f"Sin anclas válidas: {item['identificador']}")
    mapped[item['id']] = {
        'sourceId': source_id,
        'label': item['identificador'],
        'type': item['tipo_articulo'],
        'contentSha256': hashlib.sha256(item['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers,
        'anchors': anchors,
    }
    audit.append({'fragmento': item['identificador'], 'id': item['id'],
                  'paginas_pdf': page_numbers, 'anclas': len(anchors),
                  'coincidencia_normalizada': matched_length == len(normalized_text)})

(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped},
                                          ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'sin-mapa-editorial.json').write_text(json.dumps([
    {'id': item['id'], 'label': item['identificador'],
     'reason': 'Nota editorial local; no forma parte del DOF.'} for item in editorial
], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo-mapa.json').write_text(json.dumps({
    'fecha_cotejo': '2026-10-04', 'fuente_pdf': PDF_URL, 'fuente_sidof': SIDOF_URL,
    'sha256_pdf': pdf_sha, 'bytes_pdf': PDF.stat().st_size,
    'paginas_pdf': len(document), 'paginas_impresas_documento': [FIRST_PAGE, LAST_PAGE],
    'fragmentos_oficiales_mapeados': len(mapped),
    'nota_editorial_sin_mapa': [item['id'] for item in editorial],
    'cotejo_visual_recomendado': [26, 30, 40, 54, 59, 61], 'detalle': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document),
                  'bytes': PDF.stat().st_size, 'sha256': pdf_sha,
                  'officialFragmentsMapped': len(mapped), 'editorialExcluded': len(editorial),
                  'totalAnchors': sum(len(item['anchors']) for item in mapped.values()),
                  'allExactMatches': all(item['coincidencia_normalizada'] for item in audit),
                  'firstAndLastPages': [FIRST_PAGE, LAST_PAGE]}, ensure_ascii=False, indent=2))
