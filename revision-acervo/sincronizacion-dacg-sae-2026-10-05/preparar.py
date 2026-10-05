"""Map loaded SAE DACG fragments to their shared official DOF issue PDF."""
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path(__file__).resolve().parent
PDF = Path('tmp/dof-2026-04-16-matutina-326685.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685'
PDF_SHA256 = 'aa23e284c9c97542a96c8db5278f4694f38d0ad1f07b2081b6f0db268a93cba4'
INSTRUMENT_ID = 'd5562ad3-7682-4add-8cc9-7ee5994fdc1c'
SOURCE_ID = 'dacg-cogeneracion-aa23e284c9c9'
FIRST_PAGE, LAST_PAGE = 35, 57


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


rows = json.loads((ROOT / 'articulos-verificados.json').read_text(encoding='utf-8'))
assert len(rows) == 154, f'Cambió el total de fragmentos: {len(rows)}'
assert len({row['id'] for row in rows}) == len(rows)
assert all(row['ley_id'] == INSTRUMENT_ID for row in rows)
assert not any(row['tipo_articulo'] == 'editorial' for row in rows)
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == PDF_SHA256
document = pymupdf.open(PDF)
assert len(document) == 304

# Reuse the reviewed source already used by the neighboring Cogeneration DACG.
manifest = json.loads(Path('public/reader-sources/manifest.v1.json').read_text(encoding='utf-8'))
source = manifest['sources'][SOURCE_ID]
assert source['originalUrl'] == PDF_URL
assert source['sha256'] == PDF_SHA256 and source['pageCount'] == len(document)

lines, stream = [], ''
for page_number in range(FIRST_PAGE, LAST_PAGE + 1):
    page = document[page_number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                continue
            # Keep each span's box separate: the DOF often puts a numeral in
            # its own span, so line-wide boxes can highlight the next label.
            for span in line['spans']:
                if span['bbox'][0] < 120 and re.fullmatch(r'\s*\d+(?:\.\d+)*\.?\s*', span['text']):
                    continue
                token = norm(span['text'])
                if token:
                    start = len(stream)
                    stream += token
                    lines.append({'page': page_number, 'start': start, 'end': len(stream), 'bbox': list(span['bbox'])})

starts, cursor = [], 0
for article in rows:
    normalized = norm(article['contenido'])
    position, marker = -1, ''
    for length in (220, 180, 140, 100, 70, 45):
        candidate = normalized[:length]
        position = stream.find(candidate, cursor)
        if position >= 0:
            marker = candidate
            break
    if position < 0:
        raise ValueError(f'No se ubicó el inicio de {article["identificador"]} ({article["id"]})')
    starts.append((position, article, marker))
    cursor = position + len(marker)
assert starts == sorted(starts, key=lambda item: item[0])

mapped, audit = {}, []
for index, (start, article, marker) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines if line['start'] < end and line['end'] > start]
    pages = sorted({anchor['page'] for anchor in anchors})
    assert anchors and FIRST_PAGE <= min(pages) <= max(pages) <= LAST_PAGE
    mapped[article['id']] = {
        'sourceId': SOURCE_ID,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': pages,
        'anchors': anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'],
                  'paginas': pages, 'anclas': len(anchors), 'prefijoCotejado': marker})

assert len(mapped) == 154
assert audit[0]['paginas'][0] == FIRST_PAGE
assert audit[-1]['fragmento'] == 'Firmas y promulgación'
assert audit[-1]['paginas'][-1] == LAST_PAGE
(ROOT / 'map.json').write_text(json.dumps({'sourceId': SOURCE_ID, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': 'ACUERDO-CNE-16/04/2026-DACG-SAE',
    'instrumentoId': INSTRUMENT_ID,
    'fuente': PDF_URL,
    'pdfTemporal': str(PDF),
    'sha256': PDF_SHA256,
    'bytes': PDF.stat().st_size,
    'paginasPdf': len(document),
    'paginasImpresasMapeadas': list(range(FIRST_PAGE, LAST_PAGE + 1)),
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(row['anchors']) for row in mapped.values()),
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'DACG-SAE: {len(mapped)} fragmentos, {sum(len(row["anchors"]) for row in mapped.values())} anclas; PDF {len(document)} páginas; SHA-256 {PDF_SHA256}')
for row in audit:
    print(f'- {row["fragmento"]}: páginas {row["paginas"]} ({row["anclas"]} anclas; prefijo {len(row["prefijoCotejado"])})')
