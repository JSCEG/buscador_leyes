from __future__ import annotations
import difflib, hashlib, html, json, re, unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
PDF = ROOT / '.local/dacg-cogeneracion-formatos-sync/DOF-22-05-2026.pdf'
ARTICLES = WORK / 'articulos-verificados.json'
IMAGES = WORK / 'page-images.json'
SOURCE_ID = 'formatos-cogeneracion-20260522-327465'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/22-05-2026/Matutina/327465'
HTML_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5788271'
PAGE_RANGES = {
    '933fcab6-8914-5957-aece-a829daa35174': range(80, 82),  # Acuerdo y considerandos
    '538170bc-92f9-508c-b967-259e9ea3c595': range(81, 82),  # Resolutivo
    '87773b0b-d059-5d1e-9b83-ebc17b6d771c': range(81, 82),  # Instrucciones
    '3dabc920-2941-5c92-a1be-bca0fc406ab4': range(82, 89),  # Formato CNE_ELECTRICIDAD_07
    '9546c4e6-baa7-5ece-ad2f-f26100526fd5': range(89, 94),  # Formato CNE_ELECTRICIDAD_08
    'd4dca24d-0dd8-566f-ad2b-dee4a8ffd767': range(93, 94),  # Transitorio
    '13687c82-bf85-53ca-829e-c0e8c66fc949': range(93, 94),  # Firma
}

def tokens(value: str) -> list[str]:
    value = html.unescape(re.sub(r'<[^>]*>', ' ', value)).replace('\u00ad', '').lower()
    value = unicodedata.normalize('NFKD', value)
    value = ''.join(char for char in value if not unicodedata.combining(char))
    return re.findall(r'[a-z0-9]+', value)

def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()

def anchors_for_page(article_tokens, page):
    words = sorted(page.get_text('words'), key=lambda word: (word[5], word[6], word[7]))
    page_tokens, token_word_indexes = [], []
    for index, word in enumerate(words):
        for token in tokens(word[4]):
            page_tokens.append(token)
            token_word_indexes.append(index)
    match = max(difflib.SequenceMatcher(None, article_tokens, page_tokens, autojunk=False).get_matching_blocks(), key=lambda block: block.size)
    if match.size < 8:
        raise ValueError(f'Cotejo insuficiente para la página {page.number}: sólo {match.size} tokens contiguos.')
    # Several concise highlights spread through the exact matched passage.
    starts = sorted(set([match.b, match.b + (match.size - 12) // 2, match.b + max(0, match.size - 12)]))
    output = []
    for start in starts:
        end = min(match.b + match.size, start + min(12, match.size))
        indexes = sorted(set(token_word_indexes[start:end]))
        selected = [words[index] for index in indexes]
        x0, y0 = min(w[0] for w in selected), min(w[1] for w in selected)
        x1, y1 = max(w[2] for w in selected), max(w[3] for w in selected)
        box = [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)]
        if box[0] < box[2] and box[1] < box[3]:
            output.append({'page': page.number + 1, 'bbox': box})
    return output

rows = json.loads(ARTICLES.read_text(encoding='utf-8'))
image_rows = json.loads(IMAGES.read_text(encoding='utf-8'))
pdf = pymupdf.open(PDF)
assert len(image_rows) == len(pdf) == 496
page_by_number = {number: pdf[number - 1] for number in range(1, len(pdf) + 1)}
pages = []
for row in image_rows:
    number = row['pagina']
    assert number in page_by_number and row['src'].startswith('/imagenes_diarios/Matutina/20260522-')
    page = page_by_number[number]
    pages.append({
        'number': number,
        'width': round(page.rect.width, 2),
        'height': round(page.rect.height, 2),
        'imageUrl': 'https://sidof.segob.gob.mx' + row['src'],
    })

articles = {}
missing = []
for row in rows:
    if row['id'] not in PAGE_RANGES:
        missing.append({'id': row['id'], 'label': row['identificador'], 'reason': 'Nota editorial: no es parte de la publicación oficial y no se asigna a una página.'})
        continue
    article_tokens = tokens(row['contenido'])
    page_numbers = list(PAGE_RANGES[row['id']])
    anchors = []
    for number in page_numbers:
        anchors.extend(anchors_for_page(article_tokens, page_by_number[number]))
    articles[row['id']] = {
        'sourceId': SOURCE_ID,
        'label': row['identificador'],
        'contentSha256': sha256_text(row['contenido']),
        'pageNumbers': page_numbers,
        'anchors': anchors,
    }

source = {
    'id': SOURCE_ID,
    'lawId': rows[0]['ley_id'],
    'title': 'Acuerdo de la CNE por el que se emiten los formatos para generación eléctrica en modalidad de cogeneración',
    'originalUrl': HTML_URL,
    'pdfUrl': PDF_URL,
    'sha256': hashlib.sha256(PDF.read_bytes()).hexdigest(),
    'pageCount': len(pdf),
    'transport': 'official-image-pages',
    'pages': pages,
}
result = {'source': source, 'articles': articles}
(WORK / 'map.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(WORK / 'missing.json').write_text(json.dumps(missing, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'pdfSha256': source['sha256'], 'mapped': {v['label']: {'pages': v['pageNumbers'], 'anchors': len(v['anchors'])} for v in articles.values()}, 'unmapped': missing}, ensure_ascii=False, indent=2))
