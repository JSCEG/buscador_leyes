from __future__ import annotations
import difflib, hashlib, html, json, re, unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
PDF = ROOT / 'revision-acervo/incorporacion-autoconsumo-2026-09-18/fuentes/AUTOCONSUMO-0.7-20-edicion.pdf'
INGEST = ROOT / 'revision-acervo/incorporacion-autoconsumo-2026-09-18/AUTOCONSUMO-0.7-20-carga.json'
ARTICLES = WORK / 'articulos-verificados.json'
SOURCE_ID = 'autoconsumo-0-7-20-47b9e25c4def'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/06-08-2025/Matutina/322403'
HTML_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5764827'
PAGE_RANGES = {
    '3d86067e-ddc0-5647-beaf-b0f17b5aa6d9': range(26, 28),  # preámbulo y fundamentos
    '8d20bb53-e5ab-57ce-bb2b-d09f456df342': range(27, 29),  # requisitos, continúa en p. 28
    '6dbe255f-6e61-5d15-a911-a2410779ea16': range(28, 29),  # procedimiento
    'e555349c-da5a-52af-8db4-1ab87f5f5386': range(28, 29),
    '3341dc50-1cc9-5da7-94f6-b555d196ab3b': range(28, 29),
    '44911701-5a21-52b4-9c90-c49a23694b60': range(28, 29),
    '7a12f2bb-ef8e-59e7-9951-8945008438a6': range(28, 29),
    '93f443e8-6d1e-50f6-bc53-3c77f6c92de5': range(28, 29),
}

def tokens(value: str) -> list[str]:
    value = html.unescape(re.sub(r'<[^>]*>', ' ', value)).replace('\u00ad', '').lower()
    value = unicodedata.normalize('NFKD', value)
    value = ''.join(char for char in value if not unicodedata.combining(char))
    return re.findall(r'[a-z0-9]+', value)

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

if not ARTICLES.exists():
    payload = json.loads(INGEST.read_text(encoding='utf-8'))
    rows = [{'id': row['id'], 'ley_id': row['ley_id'], 'identificador': row['identificador'], 'contenido': row['contenido']}
            for row in payload['articulos']]
    ARTICLES.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
else:
    rows = json.loads(ARTICLES.read_text(encoding='utf-8'))

pdf = pymupdf.open(PDF)
assert len(pdf) == 524
articles, missing = {}, []
for row in rows:
    if row['id'] not in PAGE_RANGES:
        missing.append({'id': row['id'], 'label': row['identificador'], 'reason': 'Nota editorial: no forma parte del acuerdo publicado y no se asigna a una página.'})
        continue
    article_tokens = tokens(row['contenido'])
    page_numbers = list(PAGE_RANGES[row['id']])
    anchors = []
    for number in page_numbers:
        anchors.extend(anchors_for_page(article_tokens, pdf[number - 1]))
    articles[row['id']] = {'sourceId': SOURCE_ID, 'label': row['identificador'],
                           'contentSha256': hashlib.sha256(row['contenido'].encode('utf-8')).hexdigest(),
                           'pageNumbers': page_numbers, 'anchors': anchors}
source = {
    'id': SOURCE_ID, 'lawId': rows[0]['ley_id'],
    'title': 'Acuerdo de requisitos para permiso de generación para autoconsumo interconectado de 0.7 a 20 MW',
    'originalUrl': HTML_URL, 'pdfUrl': f'/api/reader/{SOURCE_ID}',
    'sha256': hashlib.sha256(PDF.read_bytes()).hexdigest(), 'pageCount': len(pdf),
    'transport': 'remote-pdf',
    'pages': [{'number': number, 'width': round(page.rect.width, 2), 'height': round(page.rect.height, 2)}
              for number, page in enumerate(pdf, start=1)],
}
(WORK / 'map.json').write_text(json.dumps({'source': source, 'articles': articles}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(WORK / 'missing.json').write_text(json.dumps(missing, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sha256': source['sha256'], 'pageCount': source['pageCount'],
                  'mapped': {v['label']: {'pages': v['pageNumbers'], 'anchors': len(v['anchors'])} for v in articles.values()},
                  'unmapped': missing}, ensure_ascii=True, indent=2))
