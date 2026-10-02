"""Map CONV-SISTRANGAS fragments to the official DOF issue pages."""
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
PDF = PACKAGE / 'fuentes/CONV-SISTRANGAS-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/14-08-2026/Matutina/329086'
ARTICLE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5796317'
INSTRUMENT_ID = 'a067e4c6-638c-5174-b9fd-386837bf0a28'
EXPECTED_SHA256 = '5ec39d45cbcdef191fbeae7caf31049fcf7d72fe37999f3f33dfa10ae73317d8'
FIRST_PAGE, LAST_PAGE = 406, 407


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / 'CONV-SISTRANGAS-carga.json').read_text(encoding='utf-8'))
official = [article for article in data['articulos']
            if not article['identificador'].startswith('Nota editorial')]
assert data['ley']['id'] == INSTRUMENT_ID and data['ley']['url_original'] == ARTICLE_URL
assert len(data['articulos']) == 7 and len(official) == 6

pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'La edición DOF local no coincide con la huella cotejada.'
document = pymupdf.open(PDF)
assert len(document) == 440, f'Edición DOF inesperada: {len(document)} páginas.'
source_id = f'dof-matutina-2026-08-14-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 14 de agosto de 2026',
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
for article in official:
    normalized = norm(plain(article['contenido']))
    position, marker = -1, ''
    for length in (260, 220, 180, 140, 100, 70, 45, 30):
        candidate = normalized[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            marker = candidate
            break
    if position < 0:
        raise ValueError(f"No se cotejó en la edición oficial: {article['identificador']}")
    starts.append((position, article, marker))
    cursor = position + len(marker)

if [start for start, _, _ in starts] != sorted(set(start for start, _, _ in starts)):
    raise ValueError('Los inicios no aparecen en orden estricto en el PDF.')

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
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped},
                                          ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'sin-mapa-editorial.json').write_text(json.dumps([
    {'id': article['id'], 'label': article['identificador'],
     'reason': 'Nota editorial local; no forma parte de la convocatoria publicada en el DOF.'}
    for article in editorial
], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'fecha_cotejo': '2026-10-02', 'fuente_pdf': PDF_URL, 'fuente_texto': ARTICLE_URL,
    'sha256_pdf': pdf_sha, 'bytes_pdf': PDF.stat().st_size,
    'paginas_pdf': len(document), 'paginas_impresas_documento': [FIRST_PAGE, LAST_PAGE],
    'fragmentos_oficiales_mapeados': len(mapped),
    'nota_editorial_sin_mapa': [article['id'] for article in editorial],
    'cotejo_visual': [406, 407], 'detalle': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document), 'bytes': PDF.stat().st_size,
                  'sha256': pdf_sha, 'officialFragmentsMapped': len(mapped),
                  'editorialNotesExcluded': len(editorial),
                  'totalAnchors': sum(len(item['anchors']) for item in mapped.values()),
                  'instrumentPages': [FIRST_PAGE, LAST_PAGE], 'fragments': audit},
                 ensure_ascii=False, indent=2))
