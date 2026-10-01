"""Map the four official fragments of CONV-GEN-2-M4 to its DOF PDF."""
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
PACKAGE = Path('revision-acervo/incorporacion-convocatorias-2026-09-17')
PDF = PACKAGE / 'fuentes/CONV-GEN-2-M4-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/10-09-2026/Matutina/329565'
INSTRUMENT = 'CONV-GEN-2-M4'
EXPECTED_SHA256 = 'c0d21b4ac958faa59adff00f420b8c5f613c70884d25a9760c39954e4ef5ea7b'
FIRST_PAGE, LAST_PAGE = 13, 14
MARKERS = {
    'Preámbulo del acuerdo modificatorio': 'ACUERDO por el que se emite la cuarta modificación a la Segunda Convocatoria para la atención prioritaria de solicitudes de permisos de generación de energía eléctrica e interconexión al Sistema Eléctrico Nacional, alineados a la planeación vinculante.',
    'Resolutivo ÚNICO': 'ÚNICO. Se modifican las fechas de las etapas 8 a 17 del calendario y la denominación de las etapas 14 y 16 del numeral 7;',
    'Transitorio ÚNICO · acuerdo': 'TRANSITORIOS ÚNICO. El presente Acuerdo entra en vigor el mismo día de su publicación en el Diario Oficial de la Federación.',
    'Firma del acuerdo': 'Ciudad de México, a 7 de septiembre de 2026.- La Secretaria de Energía, Luz Elena González Escobar.- Rúbrica.',
}


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


data = json.loads((PACKAGE / f'{INSTRUMENT}-carga.json').read_text(encoding='utf-8'))
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert pdf_sha == EXPECTED_SHA256, 'La edición DOF local no coincide con la huella cotejada.'
document = pymupdf.open(PDF)
assert len(document) == 274, f'Edición DOF inesperada: {len(document)} páginas.'
official = [item for item in data['articulos'] if not item['identificador'].startswith('Nota editorial')]
assert {item['identificador'] for item in official} == set(MARKERS), 'Cambió la estructura; revisar el mapa.'
source_id = f'dof-matutina-2026-09-10-{pdf_sha[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 10 de septiembre de 2026',
    'instrumentIds': [data['ley']['id']],
    'sha256': pdf_sha,
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

starts = []
cursor = 0
for article in official:
    marker = norm(MARKERS[article['identificador']])
    position = stream.find(marker, cursor)
    if position < 0:
        raise ValueError(f"No se ubicó el encabezado: {article['identificador']}")
    starts.append((position, article, marker))
    cursor = position + len(marker)
assert starts == sorted(starts, key=lambda item: item[0])

mapped, audit = {}, []
for index, (start, article, marker) in enumerate(starts):
    end = starts[index + 1][0] if index + 1 < len(starts) else len(stream)
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines if line['start'] < end and line['end'] > start]
    pages = sorted({anchor['page'] for anchor in anchors})
    assert anchors and pages and min(pages) >= FIRST_PAGE and max(pages) <= LAST_PAGE
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': pages,
        'anchors': anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'], 'paginas': pages, 'anclas': len(anchors), 'marcador': marker})

assert len(mapped) == 4
result = {'source': source, 'articles': mapped}
(ROOT / 'map.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': INSTRUMENT,
    'fuente': PDF_URL,
    'archivo': str(PDF),
    'sha256': pdf_sha,
    'bytes': PDF.stat().st_size,
    'paginasPdf': len(document),
    'paginasImpresasMapeadas': list(range(FIRST_PAGE, LAST_PAGE + 1)),
    'fragmentosOficiales': len(mapped),
    'anclasGeometricas': sum(len(entry['anchors']) for entry in mapped.values()),
    'fragmentos': audit,
    'notaEditorialExcluida': [item['id'] for item in data['articulos'] if item['identificador'].startswith('Nota editorial')],
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f"{INSTRUMENT}: {len(mapped)} fragmentos, {sum(len(row['anchors']) for row in mapped.values())} anclas; PDF {len(document)} págs, SHA-256 {pdf_sha}")
for row in audit:
    print(f"- {row['fragmento']}: PDF {row['paginas']} ({row['anclas']} anclas)")
