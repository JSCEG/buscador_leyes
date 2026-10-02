"""Map the official CFE contracting provisions to pages in the DOF issue."""
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
PACKAGE = Path('revision-acervo/incorporacion-cierre-prioridades-2026-09-19')
PDF = PACKAGE / 'fuentes/CFE-CONTRATACION-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/19-08-2026/Matutina/329166'
ARTICLE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5796647'
INSTRUMENT_ID = '100f7f8a-26e6-5619-b2d6-56e9d95f8d72'
EXPECTED_SHA256 = 'a7c206cad00cf89d19750bca7faa09470526fff07c0874d31ff3941dca605c55'
FIRST_PAGE, LAST_PAGE = 89, 149


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / 'CFE-CONTRATACION-carga.json').read_text(encoding='utf-8'))
revised = json.loads((PACKAGE / 'CFE-CONTRATACION-revisado.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
assert data['ley']['url_original'] == ARTICLE_URL
official = [article for article in data['articulos']
            if not article['identificador'].startswith('Nota editorial')]
assert len(official) == 115
assert len(revised['chunks']) == len(official)

pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'El ejemplar oficial local no coincide con la huella cotejada.'
document = pymupdf.open(PDF)
assert len(document) == 542, f'Edición DOF inesperada: {len(document)} páginas.'
source_id = f'dof-matutina-2026-08-19-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 19 de agosto de 2026',
    'instrumentIds': [INSTRUMENT_ID],
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width,
               'height': page.rect.height} for page in document],
}

lines, stream = [], ''
for page_number in range(FIRST_PAGE, LAST_PAGE + 1):
    page = document[page_number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans'])
            # Ignore only the issue masthead and printed folio.
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if token:
                start = len(stream)
                stream += token
                lines.append({'page': page_number, 'start': start, 'end': len(stream),
                              'bbox': list(line['bbox'])})

starts = []
cursor = 0
for article, chunk in zip(official, revised['chunks']):
    if chunk.get('identificador') != article['identificador']:
        raise ValueError(f"Cambió el orden de fragmentos en {article['identificador']}.")
    normalized = norm(chunk['texto_fuente'])
    position, marker = -1, ''
    for length in (300, 240, 180, 120, 80, 50, 30):
        candidate = normalized[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            marker = candidate
            break
    if position < 0:
        raise ValueError(f"No se encontró en el PDF: {article['identificador']}")
    starts.append((position, article, marker))
    cursor = position + len(marker)

positions = [position for position, _, _ in starts]
if positions != sorted(set(positions)):
    raise ValueError('Los inicios no aparecen en orden estricto en la edición DOF.')

mapped, audit = {}, []
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
                  'paginas_pdf': page_numbers, 'anclas': len(anchors),
                  'prefijo_cotejado': marker})

editorial = [article for article in data['articulos']
             if article['identificador'].startswith('Nota editorial')]
if len(editorial) != 1:
    raise ValueError('Se esperaba una nota editorial local fuera de la publicación oficial.')

(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped},
                                          ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'sin-mapa-editorial.json').write_text(json.dumps([
    {'id': article['id'], 'label': article['identificador'],
     'reason': 'Nota editorial local; no forma parte del DOF.'} for article in editorial
], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'fecha_cotejo': '2026-10-02', 'fuente_pdf': PDF_URL, 'fuente_texto': ARTICLE_URL,
    'sha256_pdf': pdf_sha, 'bytes_pdf': PDF.stat().st_size,
    'paginas_pdf': len(document), 'paginas_impresas_documento': [FIRST_PAGE, LAST_PAGE],
    'fragmentos_oficiales_mapeados': len(mapped),
    'nota_editorial_sin_mapa': [article['id'] for article in editorial],
    'cotejo_visual': [89, 90, 92, 93, 106, 149], 'detalle': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document), 'bytes': PDF.stat().st_size,
                  'sha256': pdf_sha, 'officialFragmentsMapped': len(mapped),
                  'editorialNotesExcluded': len(editorial),
                  'totalAnchors': sum(len(item['anchors']) for item in mapped.values()),
                  'firstAndLastPages': [FIRST_PAGE, LAST_PAGE],
                  'firstMaps': audit[:4], 'lastMaps': audit[-6:]},
                 ensure_ascii=False, indent=2))
