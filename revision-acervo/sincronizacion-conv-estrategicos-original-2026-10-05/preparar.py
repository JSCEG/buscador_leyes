"""Build page and geometry maps for the official CONV-ESTRATEGICOS original fragments."""
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
PACKAGE = Path('revision-acervo/incorporacion-convocatorias-2026-09-17')
PDF = Path('tmp/conv-estrategicos-original.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/15-05-2026/Vespertina/327345'
INSTRUMENT = 'CONV-ESTRATEGICOS'
INSTRUMENT_ID = '24110e92-4d4c-5434-b02a-6a1794ee65ff'
EXPECTED_SHA256 = 'c06daf5c3f72e1b170cbe01cf1e213f2eab4804a6c1a1db05c7950f2be736ff7'
EXPECTED_PAGES = 38
FIRST_PDF_PAGE = 20
LAST_PDF_PAGE = 38


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', ' ', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


def first_substantive_segment(content):
    # Cited excerpts use ellipses for unchanged text. Start the map at the first
    # actual quoted passage, not at the omitted material represented by "...".
    segments = re.split(r'(?:\.{3,}|…+)', plain(content))
    candidates = [(segment.strip(' \t\r\n\"“”'), norm(segment)) for segment in segments]
    return next(((text, normalized) for text, normalized in candidates if len(normalized) >= 50),
                next(((text, normalized) for text, normalized in candidates if normalized), (None, '')))


data = json.loads((PACKAGE / f'{INSTRUMENT}-carga.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
pdf_bytes = PDF.read_bytes()
pdf_sha = hashlib.sha256(pdf_bytes).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'La edición oficial descargada cambió.'
document = pymupdf.open(PDF)
assert len(document) == EXPECTED_PAGES, f'Edición DOF inesperada: {len(document)} páginas.'

official = [item for item in data['articulos'] if item['identificador'] not in ('Nota editorial · versiones relacionadas', 'Índice de la publicación')]
excluded = [item for item in data['articulos'] if item not in official]
assert len(official) == 56 and len(excluded) == 2

# Flatten the official pages into a searchable character stream while retaining
# the PDF line geometry needed to build precise highlights.
stream_parts, line_spans = [], []
offset = 0
pages = []
for page_number in range(FIRST_PDF_PAGE, LAST_PDF_PAGE + 1):
    page = document[page_number - 1]
    pages.append({'number': page_number, 'width': page.rect.width, 'height': page.rect.height})
    line_id = 0
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans'])
            token = norm(text)
            if not token:
                continue
            start = offset
            stream_parts.append(token)
            offset += len(token)
            line_spans.append({'page': page_number, 'lineId': line_id,
                               'start': start, 'end': offset, 'bbox': list(line['bbox'])})
            line_id += 1
stream = ''.join(stream_parts)

starts, cursor = [], 0
for article in official:
    marker_text, marker = first_substantive_segment(article['contenido'])
    assert len(marker) >= 35, f'Marcador demasiado corto para {article["identificador"]}.'
    position = -1
    matched_length = 0
    for length in (180, 140, 100, 75, 55, 40, 35):
        candidate = marker[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            matched_length = length
            break
    if position < 0:
        page_hits = [page['number'] for page in pages if marker[:35] in norm(document[page['number'] - 1].get_text())]
        print(f'DEBUG cursor={cursor} marker={marker[:180]} page_hits={page_hits}')
        raise ValueError(f'No se localizó en orden el inicio oficial: {article["identificador"]}')
    starts.append({'position': position, 'article': article, 'marker': marker[:matched_length],
                   'markerText': marker_text})
    # The next fragment may begin before a long matching prefix ends (for
    # example, adjacent numbered clauses); advance only past the unambiguous
    # prefix needed to prevent matching this same occurrence again.
    cursor = position + min(matched_length, 35)

mapped, audit = {}, []
for index, item in enumerate(starts):
    article = item['article']
    start = item['position']
    end = starts[index + 1]['position'] if index + 1 < len(starts) else len(stream)
    anchors = [{'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
               for line in line_spans if line['start'] < end and line['end'] > start]
    assert anchors, f'Fragmento sin anclas: {article["identificador"]}'
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    mapped[article['id']] = {
        'sourceId': f'dof-vespertina-2026-05-15-{pdf_sha[:12]}',
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers,
        'anchors': anchors,
    }
    audit.append({'id': article['id'], 'fragmento': article['identificador'],
                  'paginasPdf': page_numbers, 'paginasImpresas': page_numbers,
                  'anclas': len(anchors), 'prefijoCotejado': item['marker']})

assert len(mapped) == len(official) == 56
source = {
    'id': f'dof-vespertina-2026-05-15-{pdf_sha[:12]}',
    'title': 'Edición vespertina del Diario Oficial de la Federación · 15 de mayo de 2026',
    'instrumentIds': [INSTRUMENT_ID],
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/dof-vespertina-2026-05-15-{pdf_sha[:12]}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width, 'height': page.rect.height}
              for page in document],
}
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': INSTRUMENT,
    'instrumentId': INSTRUMENT_ID,
    'fuenteInstrumento': data['ley']['url_original'],
    'fuenteEdicion': PDF_URL,
    'archivoTemporal': str(PDF),
    'sha256': pdf_sha,
    'bytes': len(pdf_bytes),
    'paginasPdf': len(document),
    'paginasImpresasDelAcuerdo': [FIRST_PDF_PAGE, LAST_PDF_PAGE],
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(entry['anchors']) for entry in mapped.values()),
    'tablasVisibles': 3,
    'fragmentos': audit,
    'fragmentosFueraDeMapa': [{'id': item['id'], 'label': item['identificador']}
                                  for item in excluded],
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{INSTRUMENT}: {len(mapped)} fragmentos, {sum(len(row["anchors"]) for row in mapped.values())} anclas; páginas impresas {FIRST_PDF_PAGE}–{LAST_PDF_PAGE}; SHA-256 {pdf_sha}')
for row in audit:
    print(f'- {row["fragmento"]}: páginas {row["paginasPdf"]}, {row["anclas"]} anclas')
