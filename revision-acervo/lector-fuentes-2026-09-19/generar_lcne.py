"""Publica el mapa cotejado del PDF remoto; no copia PDF/imágenes ni escribe en Supabase.

Requiere pypdf. El cotejo remoto de UUID y texto está preservado como evidencia
en LCNE-verificacion-bd.json. Falla ante cambios de PDF, texto o identidad.
"""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[1]
INGEST = PROJECT / 'revision-acervo/incorporacion-7-2026-09-17'
REVIEW = PROJECT / 'revision-acervo/LCNE'
OUT = PROJECT / 'public/reader-sources'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha(data):
    return hashlib.sha256(data).hexdigest()


loaded = read(INGEST / 'LCNE-carga.json')
reviewed = read(INGEST / 'LCNE-revisado.json')
trace = read(INGEST / 'fuentes/LCNE.lineas.json')
checked = read(ROOT / 'LCNE-verificacion-bd.json')
pdf_path = REVIEW / 'LCNE_oficial.pdf'
pdf_bytes = pdf_path.read_bytes()
pdf_hash = sha(pdf_bytes)
assert pdf_hash == loaded['fuente']['sha256'] == reviewed['control']['pdf_sha256']
assert len(pdf_bytes) == loaded['fuente']['bytes']
assert checked['lawId'] == loaded['ley']['id']

remote = {row['id']: row for row in checked['rows']}
assert len(remote) == len(loaded['articulos']) == len(reviewed['chunks']) == 48
by_label = {chunk['identificador']: chunk for chunk in reviewed['chunks']}
assert len(by_label) == 48
lines = {line['id']: line for line in trace['lineas']}
assert len(lines) == reviewed['control']['lineas_cuerpo_pdf'] == 671

source_id = f'lcne-{pdf_hash[:12]}'
OUT.mkdir(parents=True, exist_ok=True)
reader = PdfReader(pdf_path)
assert len(reader.pages) == trace['paginas'] == 20
pages = []
for number, pdf_page in enumerate(reader.pages, 1):
    assert int(pdf_page.get('/Rotate', 0)) == 0, 'Rotación requiere nueva preparación.'
    assert list(pdf_page.mediabox) == list(pdf_page.cropbox), 'Recorte requiere nueva preparación.'
    assert float(pdf_page.mediabox.left) == float(pdf_page.mediabox.bottom) == 0
    width, height = float(pdf_page.mediabox.width), float(pdf_page.mediabox.height)
    pages.append(dict(number=number, width=width, height=height))

articles = {}
assigned = set()
for row in loaded['articulos']:
    actual = remote[row['id']]
    assert all(actual[key] == row[key] for key in ['ley_id', 'identificador', 'orden'])
    assert actual['content_md5'] == hashlib.md5(row['contenido'].encode()).hexdigest()
    chunk = by_label[row['identificador']]
    assert chunk['contenido'] == row['contenido']
    anchors = []
    page_numbers = []
    for line_id in chunk['lineas_origen']:
        assert line_id not in assigned, 'Una línea no debe atribuirse a dos fragmentos.'
        assigned.add(line_id)
        line = lines[line_id]
        page = pages[line['pagina'] - 1]
        x0, y0, x1, y1 = line['bbox']
        assert 0 <= x0 < x1 <= page['width'] and 0 <= y0 < y1 <= page['height']
        anchors.append(dict(page=line['pagina'], lineId=line_id, bbox=line['bbox']))
        if line['pagina'] not in page_numbers:
            page_numbers.append(line['pagina'])
    assert page_numbers == chunk['paginas'] and anchors
    articles[row['id']] = dict(sourceId=source_id, label=row['identificador'], type=row['tipo_articulo'],
                                contentSha256=sha(row['contenido'].encode()), pageNumbers=page_numbers, anchors=anchors)

# Los títulos/capítulos pueden estar asignados a estructura en la revisión, no al texto del artículo.
source = dict(id=source_id, title=loaded['ley']['titulo'], lawId=loaded['ley']['id'], sha256=pdf_hash,
              transport='remote-pdf', pdfUrl=f'/api/reader/{source_id}', originalUrl=loaded['fuente']['url'],
              pageCount=len(pages), pages=pages)
verified_at = datetime.strptime(checked['checkedAt'], '%Y-%m-%d %H:%M:%S UTC').replace(tzinfo=timezone.utc).isoformat()
manifest = dict(schemaVersion=1, revision=2, verifiedAt=verified_at,
                sources={source_id: source}, articles=articles)
(OUT / 'manifest.v1.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
report = dict(sourceId=source_id, sourceSha256=pdf_hash, databaseCheckedAt=checked['checkedAt'],
              mappedFragments=len(articles), ordinaryArticles=28, lawTransitories=13, decreeTransitories=2,
              preambles=1, complementaryDocuments=4, sourcePages=len(pages),
              bodyLines=len(lines), highlightedLines=len(assigned), structureLinesWithoutArticle=len(lines) - len(assigned),
              inputSha256={str(path.relative_to(PROJECT)): sha(path.read_bytes()) for path in
                           [INGEST / 'LCNE-carga.json', INGEST / 'LCNE-revisado.json', INGEST / 'fuentes/LCNE.lineas.json']},
              assetBytes=0, transport='remote-pdf',
              manifestBytes=(OUT / 'manifest.v1.json').stat().st_size, databaseWrites=False)
(ROOT / 'COBERTURA.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=True, indent=2))
