"""Build page and geometry maps for the official MOG-CNE fragments."""
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
PACKAGE = Path('revision-acervo/incorporacion-manuales-2026-09-22')
PDF = Path('tmp/mog-cne.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/29-05-2026/Matutina/327605'
INSTRUMENT = 'MOG-CNE'
INSTRUMENT_ID = 'b872a637-08eb-55ed-a529-9822185c86f2'
EXPECTED_SHA256 = 'bc50921ecb6b6c7df79d6715d3c10eeb460ab7904667c2fcf4c4799c37258a1e'
EXPECTED_PAGES = 292
FIRST_PDF_PAGE = 86
LAST_PDF_PAGE = 135


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<img\b[^>]*alt=["\']([^"\']*)["\'][^>]*>', r' \1 ', value, flags=re.I)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', ' ', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


def first_substantive_segment(content):
    segments = re.split(r'(?:\.{3,}|…+)', plain(content))
    candidates = [(segment.strip(' \t\r\n"“”'), norm(segment)) for segment in segments]
    return next(((text, normalized) for text, normalized in candidates if len(normalized) >= 50),
                next(((text, normalized) for text, normalized in candidates if normalized), (None, '')))


data = json.loads((PACKAGE / f'{INSTRUMENT}-carga.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
pdf_bytes = PDF.read_bytes()
pdf_sha = hashlib.sha256(pdf_bytes).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'La edición oficial descargada cambió.'
document = pymupdf.open(PDF)
assert len(document) == EXPECTED_PAGES, f'Edición DOF inesperada: {len(document)} páginas.'
official = data['articulos']
assert len(official) == 41

stream_parts, line_spans, pages = [], [], []
offset = 0
for page_number in range(FIRST_PDF_PAGE, LAST_PDF_PAGE + 1):
    page = document[page_number - 1]
    pages.append({'number': page_number, 'width': page.rect.width, 'height': page.rect.height})
    # The heading is part of the rasterized organigram image in this edition.
    if page_number == 96:
        stream_parts.append('8organigrama')
        offset += len('8organigrama')
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
    if article['identificador'].startswith('8. ORGANIGRAMA'):
        marker_text, marker = '8. ORGANIGRAMA', '8organigrama'
    assert len(marker) >= 10, \
        f'Marcador demasiado corto para {article["identificador"]}.'
    position = -1
    matched_length = 0
    for length in (180, 140, 100, 75, 55, 40, 35, 25, 20, 15, 10):
        candidate = marker[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            matched_length = len(candidate)
            break
    if position < 0:
        print('DEBUG', article['identificador'], 'cursor', cursor, 'marker', marker[:120],
              'global10', stream.find(marker[:10]))
        raise ValueError(f'No se localizó en orden el inicio oficial: {article["identificador"]}')
    starts.append({'position': position, 'article': article, 'marker': marker[:matched_length],
                   'markerText': marker_text})
    # Keep one character of overlap: some section headings in this manual
    # follow each other without extracted whitespace (for example section 9
    # immediately followed by the first organizational unit).
    cursor = position + max(1, matched_length - 1)

mapped, audit = {}, []
for index, item in enumerate(starts):
    article = item['article']
    start = item['position']
    if index + 1 < len(starts):
        end = starts[index + 1]['position']
    else:
        final_text = norm(plain(article['contenido']))
        final_start = stream.find(final_text, start)
        assert final_start >= start, f'No se localizó el cierre del fragmento: {article["identificador"]}'
        end = final_start + len(final_text)
    anchors = [{'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
               for line in line_spans if line['start'] < end and line['end'] > start]
    # The official organigram is a raster graphic without searchable text.
    # Include its full chart area so selecting the section still reveals it.
    if article['identificador'].startswith('8. ORGANIGRAMA'):
        anchors = [{'page': 96, 'lineId': -1, 'bbox': [60, 96, 735, 512], 'kind': 'graphic'}]
    assert anchors, f'Fragmento sin anclas: {article["identificador"]}'
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    mapped[article['id']] = {
        'sourceId': f'dof-matutina-2026-05-29-{pdf_sha[:12]}',
        'label': article['identificador'], 'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers, 'anchors': anchors,
    }
    audit.append({'id': article['id'], 'fragmento': article['identificador'],
                  'paginasPdf': page_numbers, 'paginasImpresas': page_numbers,
                  'anclas': len(anchors), 'prefijoCotejado': item['marker']})

source = {
    'id': f'dof-matutina-2026-05-29-{pdf_sha[:12]}',
    'title': 'Edición matutina del Diario Oficial de la Federación · 29 de mayo de 2026',
    'instrumentIds': [INSTRUMENT_ID], 'sha256': pdf_sha, 'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/dof-matutina-2026-05-29-{pdf_sha[:12]}',
    'originalUrl': PDF_URL, 'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width, 'height': page.rect.height}
              for page in document],
}
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': INSTRUMENT, 'instrumentId': INSTRUMENT_ID,
    'fuenteInstrumento': data['ley']['url_original'], 'fuenteEdicion': PDF_URL,
    'archivoTemporal': str(PDF), 'sha256': pdf_sha, 'bytes': len(pdf_bytes),
    'paginasPdf': len(document), 'paginasImpresasDelInstrumento': [FIRST_PDF_PAGE, LAST_PDF_PAGE],
    'fragmentosOficiales': len(mapped), 'anclasGeometricas': sum(len(entry['anchors']) for entry in mapped.values()),
    'organigramaGrafico': {'fragmento': '8. ORGANIGRAMA', 'paginaPdf': 96,
                           'bbox': [60, 96, 735, 512], 'tipoAncla': 'graphic'},
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{INSTRUMENT}: {len(mapped)} fragmentos, {sum(len(row["anchors"]) for row in mapped.values())} anclas; páginas impresas {FIRST_PDF_PAGE}–{LAST_PDF_PAGE}; SHA-256 {pdf_sha}')
for row in audit:
    print(f'- {row["fragmento"]}: páginas {row["paginasPdf"]}, {row["anclas"]} anclas')
