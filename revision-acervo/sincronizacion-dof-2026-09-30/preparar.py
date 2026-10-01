"""Build article-to-page anchors for the two September 30 DOF instruments."""
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
PACKAGE = Path('revision-acervo/incorporacion-dof-2026-09-30')
PDF = Path('tmp/pdfs/dof-matutina-2026-09-30.pdf')
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/30-09-2026/Matutina/329925'
SIDOF = {
    'UPAC-SGE': 'https://sidof.segob.gob.mx/notas/docFuente/5799963',
    'CNE-MOD-CARGO-TRANSMISION': 'https://sidof.segob.gob.mx/notas/docFuente/5799964',
}
INSTRUMENTS = {
    'UPAC-SGE': {
        'first_page': 41, 'last_page': 45,
        'markers': {
            'Preámbulo del acuerdo': 'ACUERDO por el que se emiten las Disposiciones administrativas de carácter general para el registro',
            'Resolutivo ÚNICO · Expedición de disposiciones': 'Artículo único. La Comisión Nacional para el Uso Eficiente de la Energía emite',
            # Pair the repeated title with Art. 1 so it cannot match its earlier
            # appearance inside the Artículo Único on printed page 41.
            'Artículo 1': 'DISPOSICIONES ADMINISTRATIVAS DE CARÁCTER GENERAL PARA EL REGISTRO DE LAS PERSONAS USUARIAS DE PATRÓN DE ALTO CONSUMO DE ENERGÍA Y LA IMPLEMENTACIÓN DE SISTEMAS DE GESTIÓN DE LA ENERGÍA Artículo 1. Las presentes Disposiciones son obligatorias',
            'Artículo 2': 'Artículo 2. Para efectos de la interpretación y aplicación de las presentes Disposiciones',
            'Artículo 3': 'Artículo 3. Los Terceros Informantes deben presentar la información que permita la identificación de las UPAC',
            'Artículo 4': 'Artículo 4. Para efectos de las presentes Disposiciones, las personas físicas o morales adquieren la calidad de UPAC',
            'Artículo 5': 'Artículo 5. El Registro UPAC es administrado por la Secretaría de Energía a través de la CONUEE',
            'Artículo 6': 'Artículo 6. La inscripción en el Registro UPAC es obligatoria',
            'Artículo 7': 'Artículo 7. El Registro UPAC es gratuito, confidencial y se gestiona electrónicamente',
            'Artículo 8': 'Artículo 8. Concluida la inscripción y recibidas, la información y documentación previstas en el artículo anterior',
            'Artículo 9': 'Artículo 9. El registro de información por parte de las UPAC se realiza durante el periodo comprendido',
            'Artículo 10': 'Artículo 10. Las UPAC deben reportar anualmente al Registro UPAC por cada instalación',
            'Artículo 11': 'Artículo 11. Para solicitar la baja del Registro UPAC',
            'Artículo 12': 'Artículo 12. Los Terceros Informantes y las UPAC deben proporcionar o actualizar anualmente',
            'Artículo 13': 'Artículo 13. En términos de los artículos 11, fracción XV de la Ley',
            'Artículo 14': 'Artículo 14. Para comprobar el debido cumplimiento de las obligaciones previstas',
            'Transitorio Primero': 'TRANSITORIOS Primero. Las presentes Disposiciones entran en vigor',
            'Transitorio Segundo': 'Segundo. Se abrogan las Disposiciones administrativas de carácter general',
            'Transitorio Tercero': 'Tercero. En tanto se habilite el sistema electrónico',
            'Transitorio Cuarto': 'Cuarto. La Comisión Nacional para el Uso Eficiente de la Energía iniciará la verificación',
            'Transitorio Quinto': 'Quinto. A más tardar en el mes de enero de 2028',
            'Firma del acuerdo': 'Ciudad de México, 21 de septiembre de 2026.',
        },
    },
    'CNE-MOD-CARGO-TRANSMISION': {
        'first_page': 46, 'last_page': 48,
        'markers': {
            'Preámbulo del acuerdo': 'ACUERDO de la Comisión Nacional de Energía por el que se modifica el diverso',
            'Artículo Único · modificación de transitorios': 'Artículo Único. Se modifican los artículos Tercero y Cuarto Transitorios',
            'Transitorio Tercero · texto modificado': 'TERCERO. En el marco del procedimiento de migración voluntaria y expedita',
            'Transitorio Cuarto · texto modificado': 'CUARTO. Lo establecido en el artículo Transitorio anterior, queda sin efectos',
            'Transitorios · ÚNICO · entrada en vigor': 'ÚNICO. El presente Acuerdo entra en vigor el día de su publicación',
            'Firma del acuerdo': 'Ciudad de México, a 23 de septiembre de 2026.',
        },
    },
}


def plain(value):
    value = re.sub(r'<!--.*?-->', ' ', value, flags=re.S)
    value = re.sub(r'<br\s*/?>|</(?:div|p|li|tr|h[1-6])\s*>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', value))


def norm(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('\u00ad', '')
    return ''.join(char for char in value if char.isalnum())


document = pymupdf.open(PDF)
pdf_sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
assert len(document) == 344, f'Edición DOF inesperada: {len(document)} páginas'
assert pdf_sha == '598b6f92b41292cebf27dc3f0dce793b7d6a02477e56a3f0ca49866ce528334c'

source_id = 'dof-matutina-2026-09-30-' + pdf_sha[:12]
source = {
    'id': source_id,
    'title': 'Edición matutina del Diario Oficial de la Federación · 30 de septiembre de 2026',
    'instrumentIds': [],
    'sha256': pdf_sha,
    'transport': 'remote-pdf',
    'pdfUrl': f'/api/reader/{source_id}',
    'originalUrl': PDF_URL,
    'pageCount': len(document),
    'pages': [{'number': page.number + 1, 'width': page.rect.width,
               'height': page.rect.height} for page in document],
}
mapped = {}
audit = []

for siglas, config in INSTRUMENTS.items():
    data = json.loads((PACKAGE / f'{siglas}-carga.json').read_text(encoding='utf-8'))
    source['instrumentIds'].append(data['ley']['id'])
    assert data['ley']['url_original'] == SIDOF[siglas]
    assert set(config['markers']) == {
        item['identificador'] for item in data['articulos']
        if not item['identificador'].startswith('Nota editorial')
    }, f'Cambió la estructura de {siglas}; revisar marcadores antes de continuar.'

    lines = []
    stream = ''
    offsets = []
    for page_number in range(config['first_page'], config['last_page'] + 1):
        page = document[page_number - 1]
        page_start = len(stream)
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                text = ''.join(span['text'] for span in line['spans'])
                # Exclude the DOF masthead, printed folio and running date.
                if line['bbox'][1] < 50 or line['bbox'][3] > page.rect.height - 28:
                    continue
                token = norm(text)
                if not token:
                    continue
                start = len(stream)
                stream += token
                entry = {'page': page_number, 'start': start, 'end': len(stream),
                         'bbox': list(line['bbox'])}
                lines.append(entry)
                offsets.append(entry)
        audit.append({'siglas': siglas, 'pagina_pdf': page_number,
                      'inicio_texto': page_start, 'fin_texto': len(stream)})

    starts = []
    rows = []
    cursor = 0
    for article in data['articulos']:
        label = article['identificador']
        if label.startswith('Nota editorial'):
            continue
        marker = norm(config['markers'][label])
        position = stream.find(marker, cursor)
        if position < 0:
            raise ValueError(f'No se ubicó en el PDF oficial: {siglas} / {label} / {config["markers"][label]}')
        starts.append((position, article, marker))
        rows.append(article)
        cursor = position + len(marker)
    if starts != sorted(starts, key=lambda item: item[0]) or len({item[0] for item in starts}) != len(starts):
        raise ValueError(f'Los encabezados encontrados no siguen el orden del instrumento: {siglas}')

    for index, (start, article, marker) in enumerate(starts):
        if index + 1 < len(starts):
            end = starts[index + 1][0]
        else:
            exact = norm(plain(article['contenido']))
            end = start + len(exact) if stream.startswith(exact, start) else len(stream)
        anchors = [
            {'page': line['page'], 'bbox': line['bbox']}
            for line in lines if line['start'] < end and line['end'] > start
        ]
        page_numbers = sorted({anchor['page'] for anchor in anchors})
        if not anchors or not page_numbers:
            raise ValueError(f'El fragmento no produjo anclas: {siglas} / {article["identificador"]}')
        if page_numbers[0] < config['first_page'] or page_numbers[-1] > config['last_page']:
            raise ValueError(f'Anclas fuera del documento: {siglas} / {article["identificador"]}')
        mapped[article['id']] = {
            'sourceId': source_id,
            'label': article['identificador'],
            'type': article['tipo_articulo'],
            'contentSha256': hashlib.sha256(article['contenido'].encode('utf-8')).hexdigest(),
            'pageNumbers': page_numbers,
            'anchors': anchors,
        }
        audit.append({'siglas': siglas, 'fragmento': article['identificador'],
                      'id': article['id'], 'marker': marker,
                      'paginas': page_numbers, 'anclas': len(anchors)})

    assert len(starts) == len(config['markers'])

mapping = {'source': source, 'articles': mapped}
(ROOT / 'map.json').write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
editorial = []
for siglas in INSTRUMENTS:
    data = json.loads((PACKAGE / f'{siglas}-carga.json').read_text(encoding='utf-8'))
    for article in data['articulos']:
        if article['identificador'].startswith('Nota editorial'):
            editorial.append({'siglas': siglas, 'id': article['id'], 'label': article['identificador'],
                              'reason': 'Nota editorial local; no forma parte del DOF.'})
(ROOT / 'sin-mapa-editorial.json').write_text(json.dumps(editorial, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'cotejo.json').write_text(json.dumps({
    'fecha_cotejo': '2026-10-01', 'fuente_pdf': PDF_URL, 'fuente_sidof': SIDOF,
    'sha256_pdf': pdf_sha, 'paginas_pdf': len(document), 'paginas_impresas': {
        siglas: list(range(config['first_page'], config['last_page'] + 1))
        for siglas, config in INSTRUMENTS.items()},
    'fragmentos_oficiales_mapeados': len(mapped),
    'notas_editoriales_sin_mapa': editorial,
    'detalle': audit,
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sourceId': source_id, 'pdfPages': len(document), 'sha256': pdf_sha,
                  'mappedOfficialFragments': len(mapped), 'editorialNotesExcluded': len(editorial),
                  'totalAnchors': sum(len(entry['anchors']) for entry in mapped.values()),
                  'ranges': {siglas: list(range(value['first_page'], value['last_page'] + 1))
                             for siglas, value in INSTRUMENTS.items()}}, ensure_ascii=False, indent=2))
