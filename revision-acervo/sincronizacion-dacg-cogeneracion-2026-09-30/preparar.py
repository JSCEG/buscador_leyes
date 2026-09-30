import hashlib
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, '.local/lse-sync/python')
import pymupdf

ROOT = Path(__file__).resolve().parent
PDF = Path('.local/dacg-cogeneracion-sync/DOF-16-04-2026.pdf')
LAW_ID = 'bb8c115e-4ccf-570d-9a06-d405aac070a2'
OFFICIAL_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685'


def clean_html(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    value = re.sub(r'<[^>]+>', ' ', value)
    return html.unescape(value)


def norm(value):
    value = clean_html(value).replace('\u00ad', '')
    # The DOF PDF uses typographic curly quotes where the indexed text uses
    # straight quotes. Canonicalize only quote glyphs for locating coordinates.
    value = value.translate(str.maketrans({'“': '"', '”': '"', '‘': "'", '’': "'"}))
    return re.sub(r'\s+', '', value)


doc = pymupdf.open(PDF)
lines = []
text = ''
# The official index places the agreement on printed page 27; its body ends
# before the next Secretaría de Energía item on printed page 35.
for page_index in range(26, 34):
    page = doc[page_index]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            raw = ''.join(span['text'] for span in line['spans'])
            # Remove the repeated running heads/folios between page-spanning
            # fragments. The agreement's first body line begins at y=57.9.
            if line['bbox'][1] < 50 or line['bbox'][1] > 755:
                continue
            value = norm(raw)
            if not value:
                continue
            lines.append({
                'page': page_index + 1,
                'lineId': len(lines),
                'bbox': list(line['bbox']),
                'start': len(text),
                'end': len(text) + len(value),
            })
            text += value

articles = json.loads((ROOT / 'articulos-verificados.json').read_text(encoding='utf-8'))
mapped = {}
missing = []
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
source_id = 'dacg-cogeneracion-' + pdf_sha[:12]

for article in articles:
    # Editorial metadata is not present in the official instrument and must
    # not receive a fabricated PDF destination.
    if article['tipo_articulo'] == 'complementario' and article['identificador'].startswith('Nota editorial'):
        missing.append({
            'id': article['id'],
            'label': article['identificador'],
            'reason': 'Nota editorial local; no forma parte de la publicación oficial.',
        })
        continue

    needle = norm(article['contenido'])
    start = text.find(needle)
    if start < 0 or text.find(needle, start + 1) >= 0:
        probe = min(100, len(needle))
        anchor = text.find(needle[:probe])
        diagnostic_start = start if start >= 0 else anchor
        prefix_len = 0
        if diagnostic_start >= 0:
            while prefix_len < len(needle) and diagnostic_start + prefix_len < len(text) and needle[prefix_len] == text[diagnostic_start + prefix_len]:
                prefix_len += 1
        missing.append({
            'id': article['id'],
            'label': article['identificador'],
            'length': len(needle),
            'first_match': text.find(needle[:min(100, len(needle))]),
            'matched_prefix_length': prefix_len,
            'source_at_first_difference': needle[prefix_len:prefix_len + 160],
            'pdf_at_first_difference': text[diagnostic_start + prefix_len:diagnostic_start + prefix_len + 160] if diagnostic_start >= 0 else '',
            'pdf_at_first_probe': text[anchor:anchor + 160] if anchor >= 0 else '',
        })
        continue

    anchors = [
        {key: line[key] for key in ('page', 'lineId', 'bbox')}
        for line in lines if line['start'] < start + len(needle) and line['end'] > start
    ]
    if not anchors:
        missing.append({'id': article['id'], 'label': article['identificador'], 'reason': 'Sin anclas geométricas.'})
        continue
    mapped[article['id']] = {
        'sourceId': source_id,
        'label': article['identificador'],
        'type': article['tipo_articulo'],
        'contentSha256': hashlib.sha256(article['contenido'].encode()).hexdigest(),
        'pageNumbers': sorted({anchor['page'] for anchor in anchors}),
        'anchors': anchors,
    }

source = {
    'id': source_id,
    'title': 'Acuerdo de la Comisión Nacional de Energía por el que se emiten las Disposiciones Administrativas de Carácter General para la generación de energía eléctrica en la modalidad de Cogeneración',
    'lawId': LAW_ID,
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': '/api/reader/' + source_id,
    'originalUrl': OFFICIAL_URL,
    'pageCount': len(doc),
    'pages': [{'number': page.number + 1, 'width': page.rect.width, 'height': page.rect.height} for page in doc],
}
(ROOT / 'map.json').write_text(json.dumps({'source': source, 'articles': mapped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'missing.json').write_text(json.dumps(missing, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'pages': len(doc), 'sourceId': source_id, 'mapped': len(mapped), 'missing': missing}, ensure_ascii=False, indent=2))
assert len(articles) == 35 and len(mapped) == 34, 'Cambió el acervo o falta mapear un fragmento oficial.'
assert len(missing) == 1 and missing[0]['id'] == 'a048614c-c1e6-5e37-91f6-027921d62b71', 'Hay diferencias no resueltas; no publicar.'
