from __future__ import annotations
import difflib, hashlib, html, json, re, unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
PDF = ROOT / 'revision-acervo/incorporacion-autoconsumo-2026-09-18/fuentes/VENTANILLA-AUTOCONSUMO-edicion.pdf'
INGEST = ROOT / 'revision-acervo/incorporacion-autoconsumo-2026-09-18/VENTANILLA-AUTOCONSUMO-carga.json'
ARTICLES = WORK / 'articulos-verificados.json'
SOURCE_ID = 'ventanilla-autoconsumo-92d7d0137e0a'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2026/Matutina/327165'
HTML_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5786923'
PAGE_RANGES = {
    'ab84c286-e2e9-5c1b-a0d0-971490a5e54d': range(26, 28),  # preámbulo
    '46c08200-fbef-5624-a8a4-64752e3d8528': range(28, 29),  # artículo único
    '333b1cf3-9e4f-54d9-a1c2-3a603c8e3a11': range(28, 29),  # 1.1
    'b3c0e095-6881-504d-9cb8-797b08cf0433': range(28, 29),  # 2.1
    'cb52c91a-5856-52c9-8b31-106b2849e2a0': range(28, 29),  # 2.2
    'd7cbc490-d3ea-5c08-93ec-c60af11d9f62': range(28, 29),  # 2.3
    '4bf6cdea-df60-57b4-8f50-125a19648b51': range(29, 30),  # 2.4
    '91626dae-569a-5563-a826-f449b7d124a5': range(29, 31),  # 3.1
    '9ddc8a1b-eddb-5d06-ac2e-b39df2f67eba': range(30, 31),
    '7d43365e-ae64-53fa-aa0a-f00fcc6b3e7e': range(30, 31),
    '8c38cd05-0563-5882-8422-fdfafcbcab1d': range(30, 31),
    'b00ba534-3419-55ec-86cf-243138576ca6': range(30, 31),
    '08e39549-a371-5594-8427-132598312832': range(30, 31),
    'd5a428d8-4c18-5817-a232-bcf557736183': range(30, 31),
    '8545b50e-2369-5f21-b0da-25ea2c5fa071': range(30, 31),
    'd07406aa-c5aa-52f9-a3c9-60cc5d12ee85': range(30, 32),
    '384e8152-b539-56e6-9b44-b0c371aca32f': range(31, 33),
    'c8b0fcef-d2a3-5da4-9f9b-bc5ac803fb3e': range(32, 34),
    '9456c19f-0ca0-5012-9f1a-2c0636af4074': range(33, 34),
    '8d6e7519-026c-55ee-987e-4da11742b001': range(34, 35),
    'c5cac065-9d1e-5cad-82ce-7ef9d4fafa66': range(34, 35),
    '63f7c52e-345e-5823-b810-cea418c8b5d1': range(34, 35),
    'ed0317ff-6db8-5e91-8e0a-57d35cc90803': range(34, 35),
    '5732d486-8688-537b-97de-9da6a5055a1e': range(34, 36),
    'ee7522ef-e766-55a3-8615-6636e1e6aa08': range(35, 36),
    '537fdd67-2cce-5568-917d-2392d4c1a89c': range(35, 37),
    'ed285a72-7159-5015-825b-263e18db28da': range(36, 38),
    '56113347-de00-53d4-921f-22acf08a52af': range(37, 39),
    '1f06189c-4400-5a4c-83d1-0e18c57fa468': range(38, 39),
    '5fbbd29c-6440-56f6-aec9-b3457f878c86': range(38, 39),
    'a5a753c2-32ea-5f53-a47e-fd9183756e5b': range(38, 39),
    '24213dff-1e96-5704-b016-a316c228e65e': range(38, 39),
    '92f5bc31-3b25-543e-8f61-75e5056f237c': range(38, 39),
    '423c8479-cdf7-5422-a660-84808252f4f1': range(38, 39),
    'cbcb3d09-74af-5491-8257-cfb5320741c3': range(38, 39),
    '66eab009-c2de-5111-a4fa-d081b6ccffb1': range(38, 40),
    '46c1cbaa-9d73-5b85-8456-f53a5e8a050e': range(38, 40),
    'de69ee83-d6e1-52c1-b039-6915d551d21c': range(39, 40),
    '3392b037-9b7d-5a11-b890-ce11af1d5e62': range(39, 40),
    'd1f9c832-ee77-5fc3-8b91-0640ebc0895f': range(39, 40),
    'cfe7ca1c-f573-5c88-87cd-1a3cf19ba2f9': range(39, 40),
    'd7cb284b-67f0-50ba-bb44-5315a755abcf': range(39, 40),
    '219ccb73-86f3-5cdc-b8ee-10996ac8caa4': range(39, 40),
    '71225ab4-558d-55d2-8cbd-d7af9c227c5c': range(39, 40),
    'e850d059-05a7-5e13-a4b3-8bdf570ed7ae': range(40, 63),  # Anexo A: tablas distribuidas
    '8b95d908-9e68-51f0-b680-f4bc755d97b6': range(63, 64),  # Anexo B
    '6fedeea2-807f-5623-b25b-e701b03c336c': range(64, 65),  # Anexo C
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
assert len(pdf) == 326
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
    'title': 'Lineamientos para la implementación de la Ventanilla Única de Autoconsumo',
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
