"""Map the FMP and LOAPF reforms captured in the March 18, 2025 DOF issue."""
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
PDF = PACKAGE / 'fuentes/DECRETO-REFORMA-ENERGETICA-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-03-2025/Vespertina/320062'
ARTICLE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5752329'
INSTRUMENT_ID = '08bb78b2-c71e-5362-98cb-b85ea046c262'
EXPECTED_SHA256 = 'ed57fbef06b46f37d53ca1caea856f4eb3b0d2d316c6e7bb7e837daa001708a3'
FIRST_PAGE, LAST_PAGE = 254, 259


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / 'DECRETO-REFORMA-ENERGETICA-carga.json').read_text(encoding='utf-8'))
revised = json.loads((PACKAGE / 'DECRETO-REFORMA-ENERGETICA-revisado.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
assert data['ley']['siglas'] == 'REFORMAS-FMP-LOAPF'
assert data['ley']['url_original'] == ARTICLE_URL
official = [article for article in data['articulos']
            if not article['identificador'].startswith('Nota editorial')]
assert len(official) == 31
assert len(revised['chunks']) == len(official)

pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'El ejemplar oficial local no coincide con la huella cotejada.'
document = pymupdf.open(PDF)
assert len(document) == 270, f'Edición DOF inesperada: {len(document)} páginas.'
source_id = f'dof-vespertina-2025-03-18-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición vespertina del Diario Oficial de la Federación · 18 de marzo de 2025',
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
            # Exclude only the newspaper masthead and printed page folio.
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if token:
                start = len(stream)
                stream += token
                lines.append({'page': page_number, 'start': start, 'end': len(stream),
                              'bbox': list(line['bbox'])})

mapped, audit = {}, []
cursor = 0
for article, chunk in zip(official, revised['chunks']):
    if chunk.get('identificador') != article['identificador']:
        raise ValueError(f"Cambió el orden de fragmentos en {article['identificador']}.")
    # Ellipses in this capture explicitly omit unamended text. Match each
    # surviving verbatim passage independently instead of treating omissions
    # as words in the PDF.
    plain_text = re.sub(r'<!--.*?-->', ' ', chunk['texto_fuente'], flags=re.S)
    plain_text = re.sub(r'<[^>]+>', ' ', plain_text)
    plain_text = html.unescape(plain_text)
    passages = [norm(value) for value in re.split(r'\.\.\.|…', plain_text)
                if len(norm(value)) >= 24]
    if not passages:
        # The only short capture is the repeal of Article 43 Ter.
        passages = [norm('Artículo 43 Ter'), norm('Se deroga')]

    matches = []
    for passage in passages:
        position = stream.find(passage, cursor)
        if position < 0:
            raise ValueError(f"No se encontró en orden en el PDF: {article['identificador']} · {passage[:70]}")
        matches.append((position, position + len(passage), passage))
        cursor = position + len(passage)
    if not matches:
        raise ValueError(f"Sin pasajes cotejados: {article['identificador']}")

    anchors = []
    for start, end, _ in matches:
        anchors.extend({'page': line['page'], 'bbox': line['bbox']}
                       for line in lines if line['start'] < end and line['end'] > start)
    unique_anchors = []
    seen = set()
    for anchor in anchors:
        key = (anchor['page'], tuple(round(value, 2) for value in anchor['bbox']))
        if key not in seen:
            seen.add(key)
            unique_anchors.append(anchor)
    page_numbers = sorted({anchor['page'] for anchor in unique_anchors})
    if not unique_anchors or page_numbers[0] < FIRST_PAGE or page_numbers[-1] > LAST_PAGE:
        raise ValueError(f"Sin anclas válidas: {article['identificador']}")
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers,
        'anchors': unique_anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'],
                  'paginas_pdf': page_numbers, 'pasajes_cotejados': len(matches),
                  'anclas': len(unique_anchors),
                  'prefijos_cotejados': [passage[:80] for _, _, passage in matches]})

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
    'cotejo_visual': [254, 255, 256, 257, 258, 259], 'detalle': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document), 'bytes': PDF.stat().st_size,
                  'sha256': pdf_sha, 'officialFragmentsMapped': len(mapped),
                  'editorialNotesExcluded': len(editorial),
                  'totalAnchors': sum(len(item['anchors']) for item in mapped.values()),
                  'firstAndLastPages': [FIRST_PAGE, LAST_PAGE],
                  'mapsByLabel': [{'label': item['fragmento'], 'pages': item['paginas_pdf'],
                                   'anchors': item['anclas']} for item in audit]},
                 ensure_ascii=False, indent=2))
