import hashlib, html, json, re, sys, unicodedata
from pathlib import Path

sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path('revision-acervo/sincronizacion-beneficio-redes-2026-10-06')
DATA = ROOT / 'articulos-verificados.json'
PDF = Path('tmp/pdfs/beneficio-redes-dof-2024-01-18.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-01-2024/Matutina/311042'
FIRST, LAST = 517, 547
EDITORIAL = 'Nota editorial · alcance de la publicación'


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<img\b[^>]*>', ' ', value, flags=re.I)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', ' ', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


pack = json.loads(DATA.read_text(encoding='utf-8-sig'))
law_id = 'a25595c8-cdb8-57de-8200-7551ca27ac9c'
assert pack['ley']['id'] == law_id
articles = [article for article in pack['articulos'] if article['identificador'] != EDITORIAL]
assert len(pack['articulos']) == 26 and len(articles) == 25

pdf_bytes = PDF.read_bytes()
sha = hashlib.sha256(pdf_bytes).hexdigest()
doc = pymupdf.open(PDF)
assert len(doc) == 646 and sha == 'f19d7306421896e2fb023a6d97b156233714ffb65876177c9849330f13bd1abe'

lines, image_anchors, page_streams = [], {}, {}
offset = 0
for number in range(FIRST, LAST + 1):
    page = doc[number - 1]
    page_streams[number] = ''
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            # Exclude the DOF running header/page number from article highlights.
            if line['bbox'][1] < 55:
                continue
            token = norm(''.join(span['text'] for span in line['spans']))
            if token:
                item = {'page': number, 'lineId': len(lines), 'start': offset,
                        'end': offset + len(token), 'bbox': list(line['bbox']), 'token': token}
                lines.append(item)
                page_streams[number] += token
                offset += len(token)
        if block.get('type') == 1:
            image_anchors.setdefault(number, []).append(list(block['bbox']))

stream = ''.join(page_streams.values())
mapped, audit = {}, []
cursor = 0
source_id = 'dof-matutina-2024-01-18-f19d73064218'

for article in articles:
    text = norm(plain(article['contenido']))
    assert len(text) >= 10, article['identificador']
    start = stream.find(text, cursor)
    method, anchors, pages = 'texto-completo-secuencial', [], []

    if start >= 0:
        end = start + len(text)
        anchors = [{'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
                   for line in lines if line['start'] < end and line['end'] > start]
        pages = sorted({anchor['page'] for anchor in anchors})
        cursor = end
    elif article['identificador'].startswith('Anexo I'):
        # The request form is laid out as form tables. Preserve each printed
        # line on its 14 official pages, including fields and table headings.
        pages = list(range(532, 546))
        anchors = [{'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
                   for line in lines if line['page'] in pages]
        assert 'anexoi' in page_streams[532] and 'anexoii' in page_streams[546]
        method = 'formulario-tabular-paginas-completas'
    elif article['identificador'].startswith('Anexo II'):
        # The flowchart is a raster image in the official PDF; anchor its real
        # image rectangle as well as the searchable text on pages 546–547.
        pages = [546, 547]
        anchors = [{'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
                   for line in lines if line['page'] in pages]
        for bbox in image_anchors.get(546, []):
            anchors.append({'page': 546, 'lineId': 100000 + len(anchors), 'bbox': bbox})
        assert image_anchors.get(546), 'No se encontró el diagrama del Anexo II.'
        method = 'anexo-con-diagrama-oficial'
    elif article['identificador'].startswith('Notas al pie'):
        # Footnotes are printed at the bottoms of four non-contiguous pages.
        note_parts = [norm(plain(part)) for part in re.findall(
            r'<div[^>]*>(.*?)</div>', article['contenido'], flags=re.S) if norm(plain(part))]
        part_hits = []
        for part in note_parts:
            found = [(number, page_streams[number].find(part)) for number in page_streams
                     if page_streams[number].find(part) >= 0]
            if not found:
                raise ValueError(f'Nota al pie no cotejada completa: {part[:90]}')
            number, position = found[0]
            part_hits.append((number, position, position + len(part)))
        pages = sorted({number for number, _, _ in part_hits})
        for number, start_part, end_part in part_hits:
            page_offset = sum(len(page_streams[pn]) for pn in range(FIRST, number))
            start_global, end_global = page_offset + start_part, page_offset + end_part
            anchors.extend({'page': line['page'], 'lineId': line['lineId'], 'bbox': line['bbox']}
                           for line in lines if line['start'] < end_global and line['end'] > start_global)
        method = 'notas-al-pie-cotejadas-por-pagina'
    else:
        raise ValueError(f'No se pudo cotejar el texto completo: {article["identificador"]}')

    if not anchors or not pages:
        raise ValueError(f'Sin páginas/anclas: {article["identificador"]}')
    if article['identificador'].startswith('Anexo II'):
        for bbox in image_anchors.get(546, []):
            if not any(anchor['page'] == 546 and anchor['bbox'] == bbox for anchor in anchors):
                anchors.append({'page': 546, 'lineId': 100000 + len(anchors), 'bbox': bbox})
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
                  'metodoCotejo': method, 'paginasPdf': pages, 'anclas': len(anchors),
                  'hashTexto': hashlib.sha256(article['contenido'].encode()).hexdigest(),
                  'textoCompletoCotejado': method in ('texto-completo-secuencial',
                                                       'notas-al-pie-cotejadas-por-pagina')})

source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 18 de enero de 2024',
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
    'paginasPdfInstrumento': [FIRST, LAST],
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(value['anchors']) for value in mapped.values()),
    'notaAlcance': ('Se mapearon los 25 fragmentos oficiales del Acuerdo A/051/2023 a la edición '
                    'matutina oficial del DOF del 18 de enero de 2024, páginas PDF 517–547. '
                    'El Anexo I se conserva como formulario tabular página a página; el Anexo II '
                    'incluye el diagrama raster oficial; las notas al pie se enlazan en sus páginas '
                    'impresas discontinuas. Se excluyó la nota editorial del buscador.'),
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(f'OK {len(mapped)} mapas; {sum(len(value["anchors"]) for value in mapped.values())} anclas; '
      f'páginas del instrumento {FIRST}–{LAST}; PDF {len(doc)} páginas; SHA {sha}')
for item in audit:
    print(item['fragmento'], item['metodoCotejo'], 'páginas', item['paginasPdf'], 'anclas', item['anclas'])
