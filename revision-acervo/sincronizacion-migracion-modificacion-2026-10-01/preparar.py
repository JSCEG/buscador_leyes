"""Map official fragments of MIGRACION-MODIFICACION to the DOF edition."""
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
PACKAGE = Path('revision-acervo/incorporacion-pendientes-2026-09-19')
PDF = PACKAGE / 'fuentes/MIGRACION-MODIFICACION-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/08-09-2026/Matutina/329525'
INSTRUMENT = 'MIGRACION-MODIFICACION'
EXPECTED_SHA256 = 'f4ebc3cfc7aa62134ba0bd223bf6f2e747ba756eec187a408a5212f4e717f974'
FIRST_PAGE, LAST_PAGE = 4, 10


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / f'{INSTRUMENT}-carga.json').read_text(encoding='utf-8'))
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'La edición DOF local no coincide con la huella cotejada.'
document = pymupdf.open(PDF)
assert len(document) == 314, f'Edición DOF inesperada: {len(document)} páginas.'
official = [item for item in data['articulos'] if not item['identificador'].startswith('Nota editorial')]
assert len(official) == 18, f'Cambió la estructura del instrumento: {len(official)} fragmentos.'
source_id = f'dof-matutina-2026-09-08-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 8 de septiembre de 2026',
    'instrumentIds': [data['ley']['id']],
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width, 'height': page.rect.height} for page in document],
}

lines, stream = [], ''
for page_number in range(FIRST_PAGE, LAST_PAGE + 1):
    page = document[page_number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans'])
            # Exclude only the running folio/date and page footer.
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if token:
                start = len(stream)
                stream += token
                lines.append({'page': page_number, 'start': start, 'end': len(stream), 'bbox': list(line['bbox'])})

starts = []
cursor = 0
marker_lengths = []
for article in official:
    normalized = norm(plain(article['contenido']))
    position = -1
    marker = ''
    # Chunk text is derived from the same official DOF item. A long prefix
    # distinguishes repeated wording while allowing minor OCR/ellipsis changes.
    for length in (220, 180, 140, 100, 70, 45):
        candidate = normalized[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            marker = candidate
            break
    if position < 0:
        raise ValueError(f"No se ubicó el inicio del fragmento: {article['identificador']}")
    starts.append((position, article, marker))
    marker_lengths.append(len(marker))
    cursor = position + len(marker)
assert starts == sorted(starts, key=lambda item: item[0])

mapped, audit = {}, []
for index, (start, article, marker) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines if line['start'] < end and line['end'] > start]
    pages = sorted({anchor['page'] for anchor in anchors})
    assert anchors and pages and min(pages) >= FIRST_PAGE and max(pages) <= LAST_PAGE
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': pages,
        'anchors': anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'],
                  'paginas': pages, 'anclas': len(anchors), 'prefijoCotejado': marker})

assert len(mapped) == 18
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': INSTRUMENT,
    'fuente': PDF_URL,
    'archivo': str(PDF),
    'sha256': pdf_sha,
    'bytes': PDF.stat().st_size,
    'paginasPdf': len(document),
    'paginasImpresasMapeadas': list(range(FIRST_PAGE, LAST_PAGE + 1)),
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(entry['anchors']) for entry in mapped.values()),
    'fragmentos': audit,
    'notaEditorialExcluida': [item['id'] for item in data['articulos'] if item['identificador'].startswith('Nota editorial')],
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f"{INSTRUMENT}: {len(mapped)} fragmentos, {sum(len(row['anchors']) for row in mapped.values())} anclas; PDF {len(document)} páginas, SHA-256 {pdf_sha}")
for row in audit:
    print(f"- {row['fragmento']}: PDF {row['paginas']} ({row['anclas']} anclas; prefijo {len(row['prefijoCotejado'])})")
