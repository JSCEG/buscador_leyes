"""Map every official fragment and annex form in FORMATOS-BIOCOMBUSTIBLES."""
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
PACKAGE = Path('revision-acervo/incorporacion-complementos-2026-09-19')
PDF = PACKAGE / 'fuentes/FORMATOS-BIOCOMBUSTIBLES-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/31-08-2026/Matutina/329365'
INSTRUMENT = 'FORMATOS-BIOCOMBUSTIBLES'
EXPECTED_SHA256 = '51a89cc6ed35f31778d3d2134cbd1d1c135514a184cdb99b11eb23ae66260880'
FIRST_PAGE = 4


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
assert len(document) == 438, f'Edición DOF inesperada: {len(document)} páginas.'
official = [item for item in data['articulos'] if not item['identificador'].startswith('Nota editorial')]
assert len(official) == 27, f'Cambió la estructura: {len(official)} fragmentos oficiales.'
source_id = f'dof-matutina-2026-08-31-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 31 de agosto de 2026',
    'instrumentIds': [data['ley']['id']],
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width, 'height': page.rect.height} for page in document],
}

lines, stream = [], ''
for page_number in range(FIRST_PAGE, len(document) + 1):
    page = document[page_number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans'])
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if token:
                start = len(stream)
                stream += token
                lines.append({'page': page_number, 'start': start, 'end': len(stream), 'bbox': list(line['bbox'])})

starts = []
cursor = 0
for article in official:
    normalized = norm(plain(article['contenido']))
    position = -1
    marker = ''
    for length in (260, 220, 180, 140, 100, 70, 45):
        candidate = normalized[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            marker = candidate
            break
    if position < 0:
        raise ValueError(f"No se ubicó el inicio del fragmento: {article['identificador']}")
    starts.append((position, article, marker, normalized))
    cursor = position + len(marker)
assert starts == sorted(starts, key=lambda item: item[0])

mapped, audit = {}, []
for index, (start, article, marker, normalized) in enumerate(starts):
    if index + 1 < len(starts):
        end = starts[index + 1][0]
    else:
        # The last annex must stop at its own text, before a different DOF item.
        exact_end = stream.find(normalized, start)
        if exact_end == start:
            end = start + len(normalized)
        else:
            raise ValueError('El texto completo del último formato no coincide con la extracción del PDF; revisar límite final.')
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines if line['start'] < end and line['end'] > start]
    pages = sorted({anchor['page'] for anchor in anchors})
    assert anchors and pages and pages[0] >= FIRST_PAGE
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

assert len(mapped) == 27
instrument_pages = sorted({page for entry in mapped.values() for page in entry['pageNumbers']})
image_pages = [number for number in instrument_pages if document[number - 1].get_images()]
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': INSTRUMENT,
    'fuente': PDF_URL,
    'archivo': str(PDF),
    'sha256': pdf_sha,
    'bytes': PDF.stat().st_size,
    'paginasPdf': len(document),
    'rangoPaginasMapeadas': [instrument_pages[0], instrument_pages[-1]],
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(entry['anchors']) for entry in mapped.values()),
    'paginasConImagenes': image_pages,
    'fragmentos': audit,
    'notaEditorialExcluida': [item['id'] for item in data['articulos'] if item['identificador'].startswith('Nota editorial')],
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f"{INSTRUMENT}: {len(mapped)} fragmentos, {sum(len(row['anchors']) for row in mapped.values())} anclas; páginas {instrument_pages[0]}–{instrument_pages[-1]}; páginas con imágenes {image_pages}")
for row in audit:
    print(f"- {row['fragmento']}: PDF {row['paginas']} ({row['anclas']} anclas; prefijo {len(row['prefijoCotejado'])})")
