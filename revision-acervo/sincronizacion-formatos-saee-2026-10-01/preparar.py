from __future__ import annotations
import difflib, hashlib, html, json, re, unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
PDF = ROOT / '.local/dacg-cogeneracion-formatos-sync/DOF-22-05-2026.pdf'
ARTICLES = WORK / 'articulos-verificados.json'
IMAGES = ROOT / 'revision-acervo/sincronizacion-formatos-cogeneracion-2026-09-30/page-images.json'
SOURCE_ID = 'formatos-saee-20260522-327465'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/22-05-2026/Matutina/327465'
HTML_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5788270'
PAGE_RANGES = {
    '4efbcb34-4db1-504c-a208-51f3505d375e': range(60, 62),  # acuerdo y considerandos
    '2f6876dc-cf50-51c3-ab0d-89563d9dc0b7': range(61, 62),  # resolutivo único
    '9e37fb22-1508-5ffd-b834-e9b3f83fbd90': range(61, 62),  # instrucciones
    '16ea4db2-81cc-5c56-a30c-006257c7480e': range(62, 70),  # CNE_ELECTRICIDAD_09
    'a2893ce6-6cb7-534b-b4ef-e543d55b318a': range(70, 74),  # CNE_ELECTRICIDAD_10
    '3fecc422-08a8-5d8f-aea1-ab08c04b37ef': range(74, 80),  # CNE_ELECTRICIDAD_11
    'b477fa61-fe8d-5077-b63c-5a3ff2dd5887': range(79, 80),  # transitorio único
    '2f13f444-a307-5dea-8f86-bb0390d2b054': range(79, 80),  # firma
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
        raise ValueError(f'Cotejo insuficiente para la página {page.number + 1}: sólo {match.size} tokens contiguos.')
    starts = sorted(set([match.b, match.b + (match.size - 12) // 2, match.b + max(0, match.size - 12)]))
    output = []
    for start in starts:
        end = min(match.b + match.size, start + min(12, match.size))
        indexes = sorted(set(token_word_indexes[start:end]))
        selected = [words[index] for index in indexes]
        box = [round(min(w[0] for w in selected), 2), round(min(w[1] for w in selected), 2),
               round(max(w[2] for w in selected), 2), round(max(w[3] for w in selected), 2)]
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
    pages.append({'number': number, 'width': round(page.rect.width, 2), 'height': round(page.rect.height, 2),
                  'imageUrl': 'https://sidof.segob.gob.mx' + row['src']})

articles = {}
for row in rows:
    article_tokens = tokens(row['contenido'])
    page_numbers = list(PAGE_RANGES[row['id']])
    anchors = []
    for number in page_numbers:
        anchors.extend(anchors_for_page(article_tokens, page_by_number[number]))
    articles[row['id']] = {'sourceId': SOURCE_ID, 'label': row['identificador'],
                           'contentSha256': sha256_text(row['contenido']), 'pageNumbers': page_numbers,
                           'anchors': anchors}
source = {
    'id': SOURCE_ID, 'lawId': rows[0]['ley_id'],
    'title': 'Acuerdo de la CNE por el que se emiten formatos para integrar sistemas de almacenamiento de energía eléctrica',
    'originalUrl': HTML_URL, 'pdfUrl': PDF_URL,
    'sha256': hashlib.sha256(PDF.read_bytes()).hexdigest(),
    'pageCount': len(pdf), 'transport': 'official-image-pages', 'pages': pages,
}
(WORK / 'map.json').write_text(json.dumps({'source': source, 'articles': articles}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'pdfSha256': source['sha256'], 'mapped': {v['label']: {'pages': v['pageNumbers'], 'anchors': len(v['anchors'])} for v in articles.values()}}, ensure_ascii=True, indent=2))
