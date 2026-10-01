from __future__ import annotations
import difflib, hashlib, html, json, re, unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
PDF = ROOT / 'revision-acervo/incorporacion-autoconsumo-2026-09-18/fuentes/FORMATO-AUTOCONSUMO-edicion.pdf'
ARTICLES = WORK / 'articulos-verificados.json'
SOURCE_ID = 'formato-autoconsumo-cd93c396dc04'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/07-10-2025/Matutina/323403'
HTML_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5769388'
PAGE_RANGES = {
    'c5b54a75-ae1a-5eb7-a54a-e7191faa61eb': range(113, 115),  # encabezado y considerandos
    '2f772e41-da2e-50d6-8fc6-52a8e69157e9': range(114, 115),  # resolutivo
    '2084d5ea-bfb8-5251-973c-3419b1e0b313': range(115, 121),  # formato e instructivo
    'aad0ac72-5073-5f0d-8fd7-0e5e345af6e1': range(120, 121),  # transitorio
    'd0a5da86-7be9-5af9-a633-7c671283dc0e': range(120, 121),  # firma
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

rows = json.loads(ARTICLES.read_text(encoding='utf-8'))
pdf = pymupdf.open(PDF)
assert len(pdf) == 402
page_by_number = {number: pdf[number - 1] for number in range(1, len(pdf) + 1)}
articles, missing = {}, []
for row in rows:
    if row['id'] not in PAGE_RANGES:
        missing.append({'id': row['id'], 'label': row['identificador'], 'reason': 'Nota editorial: no es parte del acuerdo publicado y no se asigna a una página.'})
        continue
    article_tokens = tokens(row['contenido'])
    page_numbers = list(PAGE_RANGES[row['id']])
    anchors = []
    for number in page_numbers:
        anchors.extend(anchors_for_page(article_tokens, page_by_number[number]))
    articles[row['id']] = {'sourceId': SOURCE_ID, 'label': row['identificador'],
                           'contentSha256': hashlib.sha256(row['contenido'].encode('utf-8')).hexdigest(),
                           'pageNumbers': page_numbers, 'anchors': anchors}
source = {
    'id': SOURCE_ID, 'lawId': rows[0]['ley_id'],
    'title': 'Acuerdo por el que se publica el formato de solicitud de permiso de autoconsumo interconectado de 0.7 a 20 MW',
    'originalUrl': HTML_URL, 'pdfUrl': f'/api/reader/{SOURCE_ID}',
    'sha256': hashlib.sha256(PDF.read_bytes()).hexdigest(), 'pageCount': len(pdf),
    'transport': 'remote-pdf',
    'pages': [{'number': number, 'width': round(page.rect.width, 2), 'height': round(page.rect.height, 2)}
              for number, page in page_by_number.items()],
}
(WORK / 'map.json').write_text(json.dumps({'source': source, 'articles': articles}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(WORK / 'missing.json').write_text(json.dumps(missing, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sha256': source['sha256'], 'pageCount': source['pageCount'],
                  'mapped': {v['label']: {'pages': v['pageNumbers'], 'anchors': len(v['anchors'])} for v in articles.values()},
                  'unmapped': missing}, ensure_ascii=True, indent=2))
