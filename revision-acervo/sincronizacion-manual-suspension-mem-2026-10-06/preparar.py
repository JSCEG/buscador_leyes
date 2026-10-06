import hashlib, html, json, re, sys, unicodedata
from pathlib import Path

sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path('revision-acervo/sincronizacion-manual-suspension-mem-2026-10-06')
DATA = ROOT / 'articulos-verificados.json'
PDF = Path('tmp/pdfs/manual-suspension-mem-dof-2024-01-12.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/12-01-2024/Vespertina/310942'
FIRST, LAST = 2, 16


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', ' ', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


pack = json.loads(DATA.read_text(encoding='utf-8-sig'))
law_id = '8f0c071e-ef10-5b40-a9f9-b401dbb823ea'
assert pack['ley']['id'] == law_id
articles = [article for article in pack['articulos']
            if article['identificador'] != 'Nota editorial · alcance de la publicación']
assert len(pack['articulos']) == 27 and len(articles) == 26

pdf_bytes = PDF.read_bytes()
sha = hashlib.sha256(pdf_bytes).hexdigest()
doc = pymupdf.open(PDF)
assert len(doc) == 16

lines, tokens, offset = [], [], 0
for number in range(FIRST, LAST + 1):
    page = doc[number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            # Drop the DOF running header so split sections do not highlight it.
            if line['bbox'][1] < 55:
                continue
            token = norm(''.join(span['text'] for span in line['spans']))
            if token:
                lines.append({'page': number, 'lineId': len(lines), 'start': offset,
                              'end': offset + len(token), 'bbox': list(line['bbox'])})
                tokens.append(token)
                offset += len(token)
stream = ''.join(tokens)

starts, cursor = [], 0
for article in articles:
    text = norm(plain(article['contenido']))
    assert len(text) >= 10, article['identificador']
    found = stream.find(text, cursor)
    if found < 0:
        raise ValueError(f'El texto completo no coincide con el PDF en {article["identificador"]}; '
                         f'prefijo={text[:160]}')
    starts.append({'position': found, 'end': found + len(text), 'article': article,
                   'marker': text[:min(220, len(text))]})
    cursor = found + len(text)

source_id = 'dof-vespertina-2024-01-12-310942'
mapped, audit = {}, []
for index, item in enumerate(starts):
    article, start, end = item['article'], item['position'], item['end']
    anchors = [{'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
               for line in lines if line['start'] < end and line['end'] > start]
    if not anchors:
        raise ValueError(f'Sin anclas: {article["identificador"]}')
    pages = sorted({anchor['page'] for anchor in anchors})
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode()).hexdigest(),
        'pageNumbers': pages,
        'anchors': anchors,
    }
    audit.append({'id': article['id'], 'fragmento': article['identificador'],
                  'paginasPdf': pages, 'anclas': len(anchors),
                  'textoCompletoCotejado': True,
                  'hashTexto': hashlib.sha256(article['contenido'].encode()).hexdigest(),
                  'prefijoCotejado': item['marker']})

source = {
    'id': source_id,
    'title': 'Edición vespertina del Diario Oficial de la Federación · 12 de enero de 2024',
    'lawId': law_id,
    'sha256': sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(doc),
    'pages': [{'number': number + 1, 'width': float(doc[number].rect.width),
               'height': float(doc[number].rect.height)} for number in range(len(doc))],
}

(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped},
                                           ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': pack['ley']['titulo'],
    'instrumentId': law_id,
    'fuenteInstrumento': pack['ley']['url_original'],
    'fuenteEdicion': PDF_URL,
    'archivoTemporal': str(PDF),
    'sha256': sha,
    'bytes': len(pdf_bytes),
    'paginasPdf': len(doc),
    'paginasPdfCotejadas': [FIRST, LAST],
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(value['anchors']) for value in mapped.values()),
    'notaAlcance': ('Se mapearon los 26 fragmentos oficiales (preámbulo, artículo único, '
                    'transitorio, firma, portada/índice y 21 apartados del Manual) a la edición '
                    'vespertina oficial del DOF del 12 de enero de 2024, páginas PDF 2–16. '
                    'Se excluyó la nota editorial del buscador.'),
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(f'OK {len(mapped)} mapas; {sum(len(value["anchors"]) for value in mapped.values())} anclas; '
      f'páginas {FIRST}–{LAST}; SHA {sha}')
for item in audit:
    print(item['fragmento'], 'páginas', item['paginasPdf'], 'anclas', item['anclas'])
