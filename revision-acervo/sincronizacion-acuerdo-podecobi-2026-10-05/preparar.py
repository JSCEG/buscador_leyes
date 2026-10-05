"""Map PODECOBI's loaded fragments to the official May 22, 2025 DOF PDF."""
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
PDF = Path('tmp/podecobi-dof-22052025.pdf')
PDF_URL = 'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=22052025-VES.pdf&repo='
DOF_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5758079'
INSTRUMENT_ID = 'c05debf0-3748-4dac-9619-f1216a5fbd88'
EXPECTED_SHA256 = '0c10b942c45598463323464bcd2ba3fba8fb28cf d3eee2cebd31071829b6e5f4'.replace(' ', '')
EXPECTED_PAGES = 20
FIRST_PAGE, LAST_PAGE = 9, 20
EXPECTED_ARTICLES = 42


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', value, flags=re.I | re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', ' ', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', plain(value)).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


pack = json.loads((ROOT / 'articulos-verificados.json').read_text(encoding='utf-8-sig'))
rows = pack['articulos']
assert pack['ley']['id'] == INSTRUMENT_ID and len(rows) == EXPECTED_ARTICLES
assert len({row['id'] for row in rows}) == EXPECTED_ARTICLES
assert all(row['ley_id'] == INSTRUMENT_ID for row in rows)
assert [row['identificador'] for row in rows] == ['Preámbulo'] + [f'Lineamiento {i}' for i in range(1, 40)] + ['Transitorio Único', 'Firmas y promulgación']

pdf_bytes = PDF.read_bytes()
sha = hashlib.sha256(pdf_bytes).hexdigest()
assert sha == EXPECTED_SHA256, f'Cambió el PDF oficial: {sha}'
document = pymupdf.open(PDF)
assert len(document) == EXPECTED_PAGES

lines, stream = [], ''
for page_number in range(FIRST_PAGE, LAST_PAGE + 1):
    page = document[page_number - 1]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            for span in line['spans']:
                token = norm(span['text'])
                if not token:
                    continue
                y0, y1 = span['bbox'][1], span['bbox'][3]
                if y0 < 46 or y1 > page.rect.height - 34:
                    continue
                start = len(stream)
                stream += token
                lines.append({'page': page_number, 'start': start, 'end': len(stream),
                              'bbox': list(span['bbox'])})

starts, cursor = [], 0
for row in rows:
    text = norm(row['contenido'])
    if len(text) < 50:
        raise ValueError(f'Fragmento demasiado corto para cotejar: {row["identificador"]}')
    position, marker = -1, ''
    for length in (220, 180, 140, 100, 70, 45, 30, 20, 12):
        candidate = text[:length]
        found = stream.find(candidate, cursor)
        if found >= 0:
            position, marker = found, candidate
            break
    if position < 0:
        raise ValueError(f'No se localizó en orden {row["identificador"]}; cursor {cursor}.')
    if stream.find(text, position) != position:
        raise ValueError(f'El texto completo de {row["identificador"]} no coincide con el PDF oficial.')
    starts.append({'position': position, 'end': position + len(text), 'article': row, 'marker': marker})
    cursor = position + len(text)

source_id = f'dof-vespertina-2025-05-22-{sha[:12]}'
mapped, audit = {}, []
for index, start in enumerate(starts):
    row = start['article']
    end = start['end']
    anchors = [{'page': line['page'], 'bbox': line['bbox']} for line in lines
               if line['start'] < end and line['end'] > start['position']]
    page_numbers = sorted({anchor['page'] for anchor in anchors})
    if not anchors or not page_numbers or min(page_numbers) < FIRST_PAGE or max(page_numbers) > LAST_PAGE:
        raise ValueError(f'Sin anclas válidas para {row["identificador"]}.')
    mapped[row['id']] = {
        'sourceId': source_id,
        'label': row['identificador'],
        'type': row['tipo_articulo'],
        'contentSha256': hashlib.sha256(row['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': page_numbers,
        'anchors': anchors,
    }
    audit.append({'id': row['id'], 'fragmento': row['identificador'], 'paginasPdf': page_numbers,
                  'paginasImpresas': page_numbers, 'anclas': len(anchors),
                  'textoCompletoCotejado': True, 'caracteresFuenteNormalizados': start['end'] - start['position'],
                  'prefijoCotejado': start['marker']})

source = {
    'id': source_id,
    'title': 'Diario Oficial de la Federación · edición vespertina del 22 de mayo de 2025',
    'instrumentIds': [INSTRUMENT_ID],
    'sha256': sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': i + 1, 'width': page.rect.width, 'height': page.rect.height}
              for i, page in enumerate(document)],
}
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': pack['ley']['title'], 'instrumentId': INSTRUMENT_ID,
    'fuenteInstrumento': DOF_URL, 'fuenteEdicionDOF': PDF_URL,
    'archivoTemporal': str(PDF), 'sha256': sha, 'bytes': len(pdf_bytes),
    'paginasPdf': len(document), 'paginasImpresasDelInstrumento': [FIRST_PAGE, LAST_PAGE],
    'fragmentosOficiales': len(mapped), 'anclasGeometricas': sum(len(value['anchors']) for value in mapped.values()),
    'notaAlcance': 'Se cotejó completo el texto normalizado de cada uno de los 39 lineamientos, el preámbulo, el transitorio único y las firmas contra las páginas impresas 9–20 del PDF oficial de la edición vespertina del DOF del 22 de mayo de 2025. El mapa corresponde a esa edición original; el PDF temporal no se agrega al repositorio.',
    'fragmentos': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(mapped)} fragmentos; {sum(len(value["anchors"]) for value in mapped.values())} anclas; páginas {FIRST_PAGE}–{LAST_PAGE}; SHA-256 {sha}')
for item in audit:
    print(f'- páginas {item["paginasPdf"]}: {item["fragmento"]}; {item["anclas"]} anclas')
