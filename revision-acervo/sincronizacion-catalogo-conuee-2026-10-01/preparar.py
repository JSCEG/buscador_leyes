"""Build article and image-page anchors for the official CONUEE catalog agreement."""
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
PDF = Path('tmp/catalogo-conuee-dof-2026-09-11.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/11-09-2026/Matutina/329588'
SIDOF_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5798667'
INSTRUMENT_ID = 'd9667c21-b2e6-5ecd-9b3f-f66bb053ef27'
FIRST_PAGE, LAST_PAGE = 26, 38
FORMAT_PAGES = {1: 33, 2: 34, 3: 35, 4: 36, 5: 37, 6: 38}


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / 'CATALOGO-CONUEE-carga.json').read_text(encoding='utf-8'))
revised = json.loads((PACKAGE / 'CATALOGO-CONUEE-revisado.json').read_text(encoding='utf-8'))
chunks = {item['identificador']: item for item in revised['chunks']}
assert data['ley']['id'] == INSTRUMENT_ID
assert data['ley']['url_original'] == SIDOF_URL
document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(document) == 160, f'Edición DOF inesperada: {len(document)} páginas'
assert pdf_sha == 'cc69670d9b9bf822c80a37180326f88a794b74b698133fafaa379b515769a8e9'

source_id = 'dof-matutina-2026-09-11-' + pdf_sha[:12]
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 11 de septiembre de 2026',
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
            # Exclude only the repeating DOF masthead, folio and date.
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if token:
                start = len(stream)
                stream += token
                lines.append({'page': page_number, 'start': start, 'end': len(stream),
                              'bbox': list(line['bbox'])})

image_anchors = {}
for form_number, page_number in FORMAT_PAGES.items():
    page = document[page_number - 1]
    rects = [rect for image in page.get_images(full=True)
             for rect in page.get_image_rects(image[0])]
    if not rects:
        raise ValueError(f'No se detectaron imágenes oficiales del Formato {form_number}.')
    # The form itself is printed as many image tiles. A single union rectangle
    # identifies the complete form without implying text OCR or fragment boxes.
    rect = [min(box.x0 for box in rects), min(box.y0 for box in rects),
            max(box.x1 for box in rects), max(box.y1 for box in rects)]
    image_anchors[form_number] = {
        'page': page_number, 'bbox': rect, 'imageTiles': len(rects),
    }

official_articles = [article for article in data['articulos']
                     if not article['identificador'].startswith('Nota editorial')]
assert len(official_articles) == 31
starts = []
cursor = 0
for article in official_articles:
    revised_chunk = chunks[article['identificador']]
    marker = norm(revised_chunk.get('texto_fuente') or article['identificador'])
    position = stream.find(marker, cursor)
    if position < 0:
        raise ValueError(f"No se cotejó en orden con el PDF: {article['identificador']}")
    starts.append((position, article, marker))
    cursor = position + len(marker)

positions = [position for position, _, _ in starts]
if positions != sorted(set(positions)):
    raise ValueError('Los encabezados no aparecen una sola vez y en orden en el ejemplar oficial.')

mapped = {}
audit = []
for index, (start, article, marker) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else start + len(marker)
    anchors = [{'page': line['page'], 'bbox': line['bbox']}
               for line in lines if line['start'] < end and line['end'] > start]
    format_match = re.match(r'^Formato ([1-6])\.', article['identificador'])
    if format_match:
        form_number = int(format_match.group(1))
        image = image_anchors[form_number]
        anchors.append({'page': image['page'], 'bbox': image['bbox']})
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    if not anchors or page_numbers[0] < FIRST_PAGE or page_numbers[-1] > LAST_PAGE:
        raise ValueError(f"Sin anclas válidas: {article['identificador']}")
    if format_match and page_numbers != [FORMAT_PAGES[form_number]]:
        raise ValueError(f"El Formato {form_number} alcanzó páginas incorrectas: {page_numbers}")
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers,
        'anchors': anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'],
                  'paginas_impresas': page_numbers, 'anclas': len(anchors),
                  'ancla_visual_imagen': image_anchors[int(format_match.group(1))]
                  if format_match else None})

editorial = [article for article in data['articulos']
             if article['identificador'].startswith('Nota editorial')]
assert len(editorial) == 1
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped},
                                          ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'sin-mapa-editorial.json').write_text(json.dumps([
    {'id': article['id'], 'label': article['identificador'],
     'reason': 'Nota editorial local; no forma parte del DOF.'} for article in editorial
], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'fecha_cotejo': '2026-10-01', 'fuente_pdf': PDF_URL, 'fuente_sidof': SIDOF_URL,
    'sha256_pdf': pdf_sha, 'bytes_pdf': PDF.stat().st_size,
    'paginas_pdf': len(document), 'paginas_impresas_documento': [FIRST_PAGE, LAST_PAGE],
    'fragmentos_oficiales_mapeados': len(mapped),
    'fragmentos_con_formulario_imagen': len(FORMAT_PAGES),
    'casillas_imagen_formulario': {str(k): v for k, v in image_anchors.items()},
    'nota_editorial_sin_mapa': [article['id'] for article in editorial],
    'cotejo_visual': list(range(26, 39)), 'detalle': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document), 'bytes': PDF.stat().st_size,
                  'sha256': pdf_sha, 'officialFragmentsMapped': len(mapped),
                  'editorialNotesExcluded': len(editorial),
                  'totalAnchors': sum(len(item['anchors']) for item in mapped.values()),
                  'mappedPrintedPages': [FIRST_PAGE, LAST_PAGE],
                  'imageFormPages': image_anchors}, ensure_ascii=False, indent=2))
