"""Map the official fragments of CONV-ESTRATEGICOS-M3 to its DOF PDF."""
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
PDF = PACKAGE / 'fuentes/CONV-ESTRATEGICOS-M3-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/02-09-2026/Matutina/329425'
INSTRUMENT = 'CONV-ESTRATEGICOS-M3'
EXPECTED_SHA256 = '60b82ab476150ec4bf99072bafb345914e5a6407c1953c61cdfd57105c58da5c'
PAGE_NUMBER = 20


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
assert len(document) == 488, f'Edición DOF inesperada: {len(document)} páginas.'
official = [item for item in data['articulos'] if not item['identificador'].startswith('Nota editorial')]
assert len(official) == 4, f'Cambió la estructura: {len(official)} fragmentos oficiales.'
source_id = f'dof-matutina-2026-09-02-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 2 de septiembre de 2026',
    'instrumentIds': [data['ley']['id']],
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width, 'height': page.rect.height} for page in document],
}

page = document[PAGE_NUMBER - 1]
lines, stream = [], ''
for block in page.get_text('dict')['blocks']:
    for line in block.get('lines', []):
        text = ''.join(span['text'] for span in line['spans'])
        if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
            continue
        token = norm(text)
        if token:
            start = len(stream)
            stream += token
            lines.append({'page': PAGE_NUMBER, 'start': start, 'end': len(stream), 'bbox': list(line['bbox'])})

starts = []
cursor = 0
for article in official:
    normalized = norm(plain(article['contenido']))
    position = -1
    marker = ''
    for length in (220, 180, 140, 100, 70, 45):
        candidate = normalized[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            marker = candidate
            break
    if position < 0:
        raise ValueError(f"No se ubicó el fragmento en la página oficial: {article['identificador']}")
    starts.append((position, article, marker))
    cursor = position + len(marker)
assert starts == sorted(starts, key=lambda item: item[0])

mapped, audit = {}, []
for index, (start, article, marker) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines if line['start'] < end and line['end'] > start]
    assert anchors, f"El fragmento no produjo anclas: {article['identificador']}"
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': [PAGE_NUMBER],
        'anchors': anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'],
                  'paginas': [PAGE_NUMBER], 'anclas': len(anchors), 'prefijoCotejado': marker})

assert len(mapped) == 4
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': INSTRUMENT,
    'fuente': PDF_URL,
    'archivo': str(PDF),
    'sha256': pdf_sha,
    'bytes': PDF.stat().st_size,
    'paginasPdf': len(document),
    'paginaImpresaMapeada': PAGE_NUMBER,
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(entry['anchors']) for entry in mapped.values()),
    'fragmentos': audit,
    'notaEditorialExcluida': [item['id'] for item in data['articulos'] if item['identificador'].startswith('Nota editorial')],
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f"{INSTRUMENT}: {len(mapped)} fragmentos, {sum(len(row['anchors']) for row in mapped.values())} anclas en la página {PAGE_NUMBER}; SHA-256 {pdf_sha}")
for row in audit:
    print(f"- {row['fragmento']}: {row['anclas']} anclas; prefijo cotejado {len(row['prefijoCotejado'])}")
