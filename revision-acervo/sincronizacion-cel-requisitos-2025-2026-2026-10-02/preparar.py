"""Map the 2025–2026 clean-energy certificate requirements to the official DOF PDF."""
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
PACKAGE = Path('revision-acervo/incorporacion-electricidad-2026-09-19')
PDF = Path('tmp/dof-2026-08-17-matutina-329125.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/17-08-2026/Matutina/329125'
ARTICLE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5796405'
INSTRUMENT_ID = 'ae305a67-31a5-5ec6-8b2e-e12b8f71985a'
EXPECTED_SHA256 = '46b5daef3c0bafff1716c204d6e060580ad24b8ad1361fbb21e275deec9f8472'
FIRST_PAGE, LAST_PAGE = 44, 45


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / 'CEL-REQUISITOS-2025-2026-carga.json').read_text(encoding='utf-8'))
revised = json.loads((PACKAGE / 'CEL-REQUISITOS-2025-2026-revisado.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
assert data['ley']['url_original'] == ARTICLE_URL
assert data['fuente']['codDiario'] == 329125 and data['fuente']['pagina'] == 44
official = [article for article in data['articulos']
            if not article['identificador'].startswith('Nota editorial')]
assert len(official) == 5
assert len(revised['chunks']) == len(official)

pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'El ejemplar oficial no coincide con la huella cotejada.'
document = pymupdf.open(PDF)
assert len(document) == 520, f'Edición DOF inesperada: {len(document)} páginas.'
source_id = f'dof-matutina-2026-08-17-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 17 de agosto de 2026',
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

mapped, detail = {}, []
cursor = 0
for article, chunk in zip(official, revised['chunks']):
    if article['identificador'] != chunk.get('identificador'):
        raise ValueError(f"Cambió el orden de fragmentos en {article['identificador']}.")
    raw = re.sub(r'<!--.*?-->', ' ', chunk.get('texto_fuente', chunk['contenido']), flags=re.S)
    raw = html.unescape(re.sub(r'<[^>]+>', ' ', raw))
    passage = norm(raw)
    position = stream.find(passage, cursor)
    if position < 0:
        raise ValueError(f"No se encontró en orden en el PDF: {article['identificador']}")
    end = position + len(passage)
    anchors = [{'page': line['page'], 'bbox': line['bbox']}
               for line in lines if line['start'] < end and line['end'] > position]
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
    detail.append({'fragmento': article['identificador'], 'id': article['id'],
                   'paginas_pdf': page_numbers, 'anclas': len(anchors),
                   'texto_cotejado_sha256': hashlib.sha256(passage.encode('ascii')).hexdigest()})
    cursor = end

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
    'paginas_pdf': len(document), 'paginas_impresas_instrumento': [FIRST_PAGE, LAST_PAGE],
    'fragmentos_oficiales_mapeados': len(mapped),
    'nota_editorial_sin_mapa': [article['id'] for article in editorial],
    'cotejo_visual': [44, 45], 'comprobacion_sustantiva':
        'La tabla oficial fija el requisito de CEL en 13.9 % para los periodos 2025 y 2026.',
    'detalle': detail,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document), 'bytes': PDF.stat().st_size,
                  'sha256': pdf_sha, 'officialFragmentsMapped': len(mapped),
                  'editorialNotesExcluded': len(editorial),
                  'totalAnchors': sum(len(item['anchors']) for item in mapped.values()),
                  'mapsByLabel': [{'label': item['fragmento'], 'pages': item['paginas_pdf'],
                                   'anchors': item['anclas']} for item in detail]},
                 ensure_ascii=False, indent=2))
