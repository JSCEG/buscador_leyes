"""Build page and text anchors for CFE-IMPEDIMENTOS from the official DOF PDF."""
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
PDF = Path('tmp/cfe-impedimentos-dof-2026-09-18.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-09-2026/Matutina/329705'
SIDOF_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5799057'
INSTRUMENT_ID = 'a7fdc69c-897a-59fb-85f5-7779c46fd03d'
FIRST_PAGE, LAST_PAGE = 213, 225


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / 'CFE-IMPEDIMENTOS-carga.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
assert data['ley']['url_original'] == SIDOF_URL
document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(document) == 288, f'Edición DOF inesperada: {len(document)} páginas'
assert pdf_sha == '37f3ebe292747ee4d2bdf0a720b9c67b940f1953347523eb9843e10f39aa446e'

source_id = 'dof-matutina-2026-09-18-' + pdf_sha[:12]
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 18 de septiembre de 2026',
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
            # Ignore only the running masthead and printed folio, not document text.
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if not token:
                continue
            start = len(stream)
            stream += token
            lines.append({'page': page_number, 'start': start, 'end': len(stream),
                          'bbox': list(line['bbox'])})

official_articles = [article for article in data['articulos']
                     if not article['identificador'].startswith('Nota editorial')]
assert len(official_articles) == 31
starts = []
for article in official_articles:
    # The verified ingestion's source transcription anchors each differently
    # structured fragment; do not infer an article/section numbering scheme.
    revised = json.loads((PACKAGE / 'CFE-IMPEDIMENTOS-revisado.json').read_text(encoding='utf-8'))
    chunk = next(item for item in revised['chunks']
                 if item['identificador'] == article['identificador'])
    marker = norm(chunk['texto_fuente'])
    position = stream.find(marker)
    if position < 0:
        raise ValueError(f"No se cotejó completo en el PDF oficial: {article['identificador']}")
    starts.append((position, article, marker))

positions = [start for start, _, _ in starts]
if positions != sorted(set(positions)):
    raise ValueError('Los fragmentos no aparecen una sola vez y en orden en el ejemplar oficial.')

mapped = {}
audit = []
for index, (start, article, marker) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else start + len(marker)
    anchors = [{'page': line['page'], 'bbox': line['bbox']}
               for line in lines if line['start'] < end and line['end'] > start]
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    if not anchors or page_numbers[0] < FIRST_PAGE or page_numbers[-1] > LAST_PAGE:
        raise ValueError(f"Sin anclas válidas: {article['identificador']}")
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers,
        'anchors': anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'],
                  'paginas_impresas': page_numbers, 'anclas': len(anchors)})

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
    'nota_editorial_sin_mapa': [article['id'] for article in editorial],
    'cotejo_visual': [213, 217, 221, 225], 'detalle': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document), 'bytes': PDF.stat().st_size,
                  'sha256': pdf_sha, 'officialFragmentsMapped': len(mapped),
                  'editorialNotesExcluded': len(editorial),
                  'totalAnchors': sum(len(item['anchors']) for item in mapped.values()),
                  'firstAndLastPages': [FIRST_PAGE, LAST_PAGE]}, ensure_ascii=False, indent=2))
