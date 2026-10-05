"""Build text-verified article-to-page anchors for the official CENACE copy."""
import hashlib, html, json, re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'articulos-verificados.json'
PDF = Path('tmp/cenace-dacg.pdf')
PDF_URL = 'https://www.cenace.gob.mx/Docs/16_MARCOREGULATORIO/SENyMEM/%28DOF%202026-04-03%20SENER%29%20DACG%20Criterios%20para%20aplicaci%C3%B3n%20Mecanismos_Competitivos_Confiabilidad%20SEN.pdf'
DOF_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5784027'
INSTRUMENT_ID = '59bbb2ee-8d9e-5de1-a3c9-ca087286c5c9'
EXPECTED_SHA256 = 'd48705b079e9742cd38b920870a45d2100ebffa043b30bcff78432b54f40191e'
EXPECTED_PAGES = 26
EXPECTED_ARTICLES = 40


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', ' ', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads(DATA.read_text(encoding='utf8'))
assert data['ley']['id'] == INSTRUMENT_ID and len(data['articulos']) == EXPECTED_ARTICLES
pdf_bytes = PDF.read_bytes()
sha = hashlib.sha256(pdf_bytes).hexdigest()
assert sha == EXPECTED_SHA256, f'Cambio de versión en el PDF CENACE: {sha}'
doc = pymupdf.open(PDF)
assert len(doc) == EXPECTED_PAGES
pages = [{'number': i + 1, 'width': page.rect.width, 'height': page.rect.height}
         for i, page in enumerate(doc)]
lines, pieces = [], []
offset = 0
for page_number, page in enumerate(doc, 1):
    line_id = 0
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            token = norm(''.join(span['text'] for span in line['spans']))
            if token:
                lines.append({'page': page_number, 'lineId': line_id,
                              'start': offset, 'end': offset + len(token),
                              'bbox': list(line['bbox'])})
                pieces.append(token)
                offset += len(token)
            line_id += 1
stream = ''.join(pieces)
starts, cursor = [], 0
for article in data['articulos']:
    text = norm(plain(article['contenido']))
    assert len(text) >= 50, article['identificador']
    found, used = -1, 0
    for size in (200, 160, 120, 100, 80, 60, 40, 25, 15, 10):
        if len(text) >= size:
            found = stream.find(text[:size], cursor)
            if found >= 0:
                used = min(size, len(text))
                break
    if found < 0:
        raise ValueError(f'No se localizó en orden el inicio de {article["identificador"]}.')
    starts.append({'position': found, 'article': article, 'marker': text[:used]})
    cursor = found + max(1, used - 1)

source_id = f'cenace-dacg-mecanismos-2026-04-03-{sha[:12]}'
mapped, audit = {}, []
for index, item in enumerate(starts):
    article = item['article']
    start = item['position']
    end = starts[index + 1]['position'] if index + 1 < len(starts) else offset
    covered = [line for line in lines if line['start'] < end and line['end'] > start]
    assert covered, article['identificador']
    page_numbers = sorted({line['page'] for line in covered})
    anchors = [{'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
               for line in covered]
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf8')).hexdigest(),
        'pageNumbers': page_numbers,
        'anchors': anchors,
    }
    audit.append({
        'id': article['id'], 'fragmento': article['identificador'],
        'paginasPdf': page_numbers,
        'paginasImpresas': [number + 53 for number in page_numbers],
        'anclas': len(anchors), 'prefijoCotejado': item['marker'],
    })
source = {
    'id': source_id,
    'title': 'Diario Oficial de la Federación · edición matutina del 3 de abril de 2026 · copia oficial CENACE',
    'instrumentIds': [INSTRUMENT_ID],
    'sha256': sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(doc),
    'pages': pages,
}
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': data['ley']['title'], 'instrumentId': INSTRUMENT_ID,
    'fuenteInstrumento': DOF_URL, 'fuenteEdicionDOF': 'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=03042026-MAT.pdf&repo=',
    'copiaOficialCENACE': PDF_URL, 'archivoTemporal': str(PDF), 'sha256': sha,
    'bytes': len(pdf_bytes), 'paginasPdf': len(doc), 'paginaImpresadeInicio': 54,
    'paginasImpresasDelInstrumento': [54, 79], 'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(value['anchors']) for value in mapped.values()),
    'notaAlcance': 'Cotejados los 40 fragmentos oficiales, en orden, contra la copia PDF publicada por CENACE de las DACG del DOF del 3 de abril de 2026. Cada página asociada corresponde al PDF de 26 páginas alojado por CENACE (páginas impresas 54–79). Se excluyó una nota editorial de Supabase. El archivo PDF se usó temporalmente y no se agrega a Git.',
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(f'{len(mapped)} fragmentos; {sum(len(value["anchors"]) for value in mapped.values())} anclas; páginas PDF {min(n for e in mapped.values() for n in e["pageNumbers"])}–{max(n for e in mapped.values() for n in e["pageNumbers"])}; SHA-256 {sha}')
for entry in audit:
    print(f'- p. {entry["paginasPdf"]} ({entry["paginasImpresas"]} DOF): {entry["fragmento"]}; {entry["anclas"]} anclas')
