"""Map the official MIGRACION-PERMISOS fragments to its official DOF PDF."""
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
PDF = PACKAGE / 'fuentes/MIGRACION-PERMISOS-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-06-2026/Matutina/327985'
SHA256 = '4fb0664039a940ee5f281059d741aa8bafff6b713ff969e60af49ed248331c49'
INSTRUMENT_ID = '91a6f28d-52a9-5f72-96e0-ac50a1991c96'
FIRST_PAGE, LAST_PAGE = 5, 26


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / 'MIGRACION-PERMISOS-carga.json').read_text(encoding='utf-8'))
assert data['ley']['id'] == INSTRUMENT_ID
assert data['ley']['url_original'] == 'https://sidof.segob.gob.mx/notas/docFuente/5790937'
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == SHA256
document = pymupdf.open(PDF)
assert len(document) == 324, f'Edición inesperada: {len(document)} páginas.'
official = [row for row in data['articulos'] if not row['identificador'].startswith('Nota editorial')]
assert len(official) == 77, f'Cambió la estructura: {len(official)} fragmentos oficiales.'

source_id = f'dof-matutina-2026-06-18-{SHA256[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 18 de junio de 2026',
    'instrumentIds': [INSTRUMENT_ID],
    'sha256': SHA256,
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
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            token = norm(text)
            if token:
                start = len(stream)
                stream += token
                lines.append({'page': page_number, 'start': start, 'end': len(stream), 'bbox': list(line['bbox'])})

starts, cursor = [], 0
for article in official:
    normalized = norm(plain(article['contenido']))
    position, marker = -1, ''
    for length in (220, 180, 140, 100, 70, 45):
        candidate = normalized[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            marker = candidate
            break
    if position < 0:
        raise ValueError(f'No se ubicó el inicio de {article["identificador"]}')
    starts.append((position, article, marker))
    cursor = position + len(marker)
assert starts == sorted(starts, key=lambda item: item[0])

mapped, audit = {}, []
for index, (start, article, marker) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines if line['start'] < end and line['end'] > start]
    pages = sorted({anchor['page'] for anchor in anchors})
    assert anchors and pages and FIRST_PAGE <= min(pages) <= max(pages) <= LAST_PAGE
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

assert len(mapped) == 77
assert audit[-1]['fragmento'] == 'Firma del acuerdo'
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': 'MIGRACION-PERMISOS',
    'fuente': PDF_URL,
    'pdfLocal': str(PDF),
    'sha256': SHA256,
    'bytes': PDF.stat().st_size,
    'paginasPdf': len(document),
    'paginasImpresasMapeadas': list(range(FIRST_PAGE, LAST_PAGE + 1)),
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(row['anchors']) for row in mapped.values()),
    'fragmentos': audit,
    'notaEditorialExcluida': [row['id'] for row in data['articulos'] if row['identificador'].startswith('Nota editorial')],
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'MIGRACION-PERMISOS: {len(mapped)} fragmentos, {sum(len(row["anchors"]) for row in mapped.values())} anclas; PDF {len(document)} páginas; SHA-256 {SHA256}')
for row in audit:
    print(f'- {row["fragmento"]}: páginas {row["paginas"]} ({row["anclas"]} anclas; prefijo {len(row["prefijoCotejado"])})')
