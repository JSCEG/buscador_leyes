"""Map the verified MIGRACION-ACLARACION fragments to the DOF issue PDF."""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path(__file__).resolve().parent
PACKAGE = Path('revision-acervo/incorporacion-pendientes-2026-09-19')
PDF = PACKAGE / 'fuentes/MIGRACION-ACLARACION-edicion.pdf'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/26-06-2026/Matutina/328125'
SHA256 = '2d99cb2a77fdc34e7f8f39187ab4d00b105f9b33466b07c66fb7df7e69e53470'
INSTRUMENT_ID = '5fd6bd12-5c8b-553c-bdb5-7b0b9bfcc524'
PAGE_NUMBER = 107

package = json.loads((PACKAGE / 'MIGRACION-ACLARACION-carga.json').read_text(encoding='utf-8'))
assert package['ley']['id'] == INSTRUMENT_ID
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == SHA256
assert package['ley']['url_original'] == 'https://sidof.segob.gob.mx/notas/docFuente/5791847'
document = pymupdf.open(PDF)
assert len(document) == 274, f'Edición inesperada: {len(document)} páginas.'
page = document[PAGE_NUMBER - 1]

# Boundaries are based on the visually cotejada print page 107. The first
# fragment ends at the second title; the clarification includes both tables;
# the signature stops before the unrelated DOF fee notice.
regions = {
    'Presentación de la nota aclaratoria': (70, 342),
    'Aclaración al artículo 18 · Dice y debe decir': (342, 570),
    'Firma de la nota aclaratoria': (570, 605),
}
articles = [row for row in package['articulos'] if row['id'] != '3e5d22a1-8b7f-5637-8532-d25e7069cf82']
assert len(articles) == 3
source_id = f'dof-matutina-2026-06-26-{SHA256[:12]}'
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 26 de junio de 2026',
    'instrumentIds': [INSTRUMENT_ID],
    'sha256': SHA256,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': p.number + 1, 'width': p.rect.width, 'height': p.rect.height} for p in document],
}

mapped, audit = {}, []
for article in articles:
    bounds = regions[article['identificador']]
    anchors = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans']).strip()
            y0, y1 = line['bbox'][1], line['bbox'][3]
            if text and y0 >= bounds[0] and y1 <= bounds[1]:
                anchors.append({'page': PAGE_NUMBER, 'bbox': list(line['bbox'])})
    assert anchors, f'Sin anclas en PDF para {article["identificador"]}'
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
        'pageNumbers': [PAGE_NUMBER],
        'anchors': anchors,
    }
    audit.append({'fragmento': article['identificador'], 'id': article['id'],
                  'pagina': PAGE_NUMBER, 'anclas': len(anchors), 'regionY': list(bounds)})

assert len(mapped) == 3
assert all(not any(a['bbox'][1] >= 608 for a in row['anchors']) for row in mapped.values())
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'instrumento': 'MIGRACION-ACLARACION',
    'fuente': PDF_URL,
    'pdfLocal': str(PDF),
    'sha256': SHA256,
    'bytes': PDF.stat().st_size,
    'paginasPdf': len(document),
    'paginaImpreso': PAGE_NUMBER,
    'fragmentosMapeados': audit,
    'notaEditorialExcluida': '3e5d22a1-8b7f-5637-8532-d25e7069cf82',
    'avisoDOFExcluido': True,
    'criterio': 'Coordenadas cotejadas con la página impresa 107; la firma concluye antes del AVISO de cuotas del propio DOF.',
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(mapped)} fragmentos; {sum(len(x["anchors"]) for x in mapped.values())} anclas; PDF {len(document)} páginas; página impresa {PAGE_NUMBER}; SHA-256 {SHA256}')
for row in audit:
    print(f'- {row["fragmento"]}: página {row["pagina"]}, {row["anclas"]} anclas')
