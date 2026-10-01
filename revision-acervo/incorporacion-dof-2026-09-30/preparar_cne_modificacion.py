from html.parser import HTMLParser
from pathlib import Path
import hashlib
import html
import json
import re
import uuid

ROOT = Path(__file__).resolve().parent
SOURCE_HTML = ROOT / 'CNE-modificacion-oficial.html'
PDF_PATH = Path(__file__).resolve().parents[2] / 'tmp/radar-2026-09-30/dof-matutina.pdf'
NAME = 'CNE-MOD-CARGO-TRANSMISION'
TITLE = ('Acuerdo de la Comisión Nacional de Energía por el que se modifica el diverso por el que se emite la metodología '
         'para la determinación del cargo correspondiente al servicio de transmisión de energía eléctrica que preste la '
         'Suministradora a las Personas Permisionarias con centrales de generación de energía eléctrica, que cuenten con '
         'contrato de interconexión y convenio para el servicio de transmisión de energía eléctrica celebrados al amparo '
         'de la Ley del Servicio Público de Energía Eléctrica, publicado el 18 de junio de 2026')
SOURCE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5799964'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/30-09-2026/Matutina/329925'
BASE_ID = '6be7cf44-0134-5950-b9d0-a898d4ec5ced'
BASE_TITLE = ('Acuerdo de la Comisión Nacional de Energía por el que se emite la metodología para la determinación del '
              'cargo correspondiente al servicio de transmisión de energía eléctrica que preste la Suministradora a las '
              'Personas Permisionarias con centrales de generación de energía eléctrica, que cuenten con contrato de '
              'interconexión y convenio para el servicio de transmisión de energía eléctrica celebrados al amparo de la '
              'Ley del Servicio Público de Energía Eléctrica')
TITLE_NAME = 'Modificación a la metodología de cargos de transmisión para permisionarios legados'
FORMAL_HEADING = ('ACUERDO DE LA COMISIÓN NACIONAL DE ENERGÍA POR EL QUE SE MODIFICA EL DIVERSO POR EL QUE SE EMITE '
                  'LA METODOLOGÍA PARA LA DETERMINACIÓN DEL CARGO CORRESPONDIENTE AL SERVICIO DE TRANSMISIÓN DE '
                  'ENERGÍA ELÉCTRICA QUE PRESTE LA SUMINISTRADORA A LAS PERSONAS PERMISIONARIAS CON CENTRALES DE '
                  'GENERACIÓN DE ENERGÍA ELÉCTRICA, QUE CUENTEN CON CONTRATO DE INTERCONEXIÓN Y CONVENIO PARA EL '
                  'SERVICIO DE TRANSMISIÓN DE ENERGÍA ELÉCTRICA CELEBRADOS AL AMPARO DE LA LEY DEL SERVICIO PÚBLICO '
                  'DE ENERGÍA ELÉCTRICA, PUBLICADO EL 18 DE JUNIO DE 2026 EN EL DIARIO OFICIAL DE LA FEDERACIÓN')


class TextBlocks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.annotations = []
        self.current = None
        self.current_kind = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if tag.lower() == 'div' and any(name in classes for name in ('Texto', 'ROMANOS', 'ANOTACION')):
            self.current = []
            self.current_kind = next(name for name in ('ANOTACION', 'Texto', 'ROMANOS') if name in classes)

    def handle_endtag(self, tag):
        if tag.lower() == 'div' and self.current is not None:
            text = re.sub(r'\s+', ' ', ''.join(self.current)).strip()
            if text:
                if self.current_kind == 'ANOTACION':
                    self.annotations.append(text)
                else:
                    self.blocks.append(text)
            self.current = None
            self.current_kind = None

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)


def uid(label):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'buscador-sener/instrumento/{NAME}/{label}'))


def as_html(blocks):
    return '\n'.join(f'<div>{html.escape(block, quote=False)}</div>' for block in blocks)


def row(label, blocks, kind, chapter, order):
    return {
        'id': uid(label), 'ley_id': LAW_ID, 'orden': order, 'identificador': label,
        'contenido': as_html(blocks), 'tipo_articulo': kind,
        'titulo_nombre': TITLE_NAME, 'capitulo_nombre': chapter, 'seccion_nombre': None,
    }


LAW_ID = uid('ley')
source = TextBlocks()
source.feed(SOURCE_HTML.read_text(encoding='utf-8'))
blocks = source.blocks
annotations = source.annotations
assert len(blocks) == 30, f'Cambió la extracción de bloques fuente: {len(blocks)}'
assert len(annotations) == 3, f'Cambió la extracción de encabezados: {annotations}'

rows = []
pre = [
    TITLE + '.',
    'Al margen un sello con el Escudo Nacional, que dice: Estados Unidos Mexicanos.- Comisión Nacional de Energía.',
    blocks[0],
] + blocks[1:15] + [annotations[1] or FORMAL_HEADING]
rows.append(row('Preámbulo del acuerdo', pre, 'preambulo', 'Preámbulo', 1))
rows.append(row('Artículo Único · modificación de transitorios', [blocks[15]], 'ordinario', 'Cuerpo del instrumento', 2))
rows.append(row('Transitorio Tercero · texto modificado', blocks[16:22], 'transitorio', 'Modificaciones al Acuerdo de la Metodología de Transmisión', 3))
rows.append(row('Transitorio Cuarto · texto modificado', blocks[22:28], 'transitorio', 'Modificaciones al Acuerdo de la Metodología de Transmisión', 4))
rows.append(row('Transitorios · ÚNICO · entrada en vigor', [annotations[2], blocks[28]], 'transitorio', 'Entrada en vigor', 5))
rows.append(row('Firma del acuerdo', [blocks[29]], 'complementario', 'Firma', 6))

assert len(rows) == 6 and all(r['contenido'].strip() for r in rows)
assert '19 de octubre de 2026' in rows[2]['contenido']
assert '6 de octubre de 2028' in rows[2]['contenido']
assert 'Renuncien voluntariamente' in rows[3]['contenido']
assert 'Que cuenten' in rows[2]['contenido'] and 'Que inicien' in rows[2]['contenido']
assert all(f'{letter}.' in rows[3]['contenido'] for letter in ('I', 'II', 'III', 'IV'))

note_text = (
    '### Nota editorial · modificación relacionada\n\n'
    'Este acuerdo del 30 de septiembre de 2026 modifica únicamente los transitorios Tercero y Cuarto del instrumento '
    'original publicado el 18 de junio de 2026. Se incorpora por separado; no sustituye ni consolida el acuerdo original.\n\n'
    f'Instrumento original: <a href="/#ley-{BASE_ID}" target="_blank" rel="noopener noreferrer">{html.escape(BASE_TITLE)}</a> · '
    f'[fuente oficial]({"https://sidof.segob.gob.mx/notas/docFuente/5790939"}).\n\n'
    f'Modificación publicada en el DOF: [{SOURCE_URL}]({SOURCE_URL}) · edición matutina PDF: [{PDF_URL}]({PDF_URL}).\n\n'
    'La publicación conserva por separado el Artículo Único modificatorio, los textos reformados de los transitorios '
    'Tercero y Cuarto, el transitorio de entrada en vigor y la firma. No se certifica vigencia ni se presenta un texto '
    'consolidado. Fuente revisada el 1 de octubre de 2026.\n'
)
rows.insert(0, {
    'id': uid('Nota editorial · modificación relacionada'), 'ley_id': LAW_ID, 'orden': 0,
    'identificador': 'Nota editorial · modificación relacionada', 'contenido': note_text,
    'tipo_articulo': 'complementario', 'titulo_nombre': 'Información editorial',
    'capitulo_nombre': None, 'seccion_nombre': None,
})

law = {
    'id': LAW_ID, 'titulo': TITLE, 'siglas': NAME, 'fecha_publicacion': '2026-09-30',
    'fecha_ultima_reforma': None, 'vigente': None,
    'temas_clave': ['Metodología de transmisión', 'Permisionarios legados', 'Migración voluntaria al marco de la LSE'],
    'url_original': SOURCE_URL, 'tipo': 'acuerdo',
}
themes = [
    {'nivel': 'titulo', 'nombre': 'Información editorial', 'orden': 0},
    {'nivel': 'capitulo', 'nombre': 'Preámbulo', 'orden': 1},
    {'nivel': 'capitulo', 'nombre': 'Cuerpo del instrumento', 'orden': 2},
    {'nivel': 'capitulo', 'nombre': 'Modificaciones al Acuerdo de la Metodología de Transmisión', 'orden': 3},
    {'nivel': 'capitulo', 'nombre': 'Entrada en vigor', 'orden': 4},
    {'nivel': 'capitulo', 'nombre': 'Firma', 'orden': 5},
]
payload = {'ley': law, 'articulos': rows, 'temas': themes, 'fuente': {
    'url_html': SOURCE_URL, 'url_pdf': PDF_URL,
    'sha256_pdf': hashlib.sha256(PDF_PATH.read_bytes()).hexdigest(),
    'page_count': 344, 'pdf_pages_printed': [46, 47, 48],
}}
(ROOT / f'{NAME}-carga.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

cotejo = {
    'instrumento': NAME, 'fecha_revision': '2026-10-01', 'estado': 'cotejado',
    'fuente_html': SOURCE_URL, 'fuente_pdf_edicion': PDF_URL,
    'sha256_pdf': payload['fuente']['sha256_pdf'], 'paginas_impresas': [46, 47, 48],
    'paginas_pdf_cero_indexadas': [45, 46, 47], 'bloques_html_capturados': len(blocks),
    'encabezados_html_capturados': annotations,
    'fragmentos_oficiales': len(rows) - 1, 'incluye_nota_editorial_separada': True,
    'base_modificada': {'id': BASE_ID, 'titulo': BASE_TITLE, 'url': 'https://sidof.segob.gob.mx/notas/docFuente/5790939'},
    'alcance': ['Modifica sólo los transitorios Tercero y Cuarto del acuerdo original.',
                'Conserva el resolutivo Artículo Único y cada texto transitorio reformado por separado.',
                'El transitorio único de entrada en vigor y la firma quedan identificados como componentes de esta modificación.',
                'No se combina con el texto original ni se presenta como versión consolidada.'],
    'verificaciones': [
        'Transitorio Tercero conserva el periodo del 19/10/2026 al 06/10/2028 y las dos condiciones para acceder a la excepción.',
        'La excepción surte efectos desde el día siguiente a cumplir ambas condiciones, sin retroactividad y nunca antes del 19/10/2026.',
        'Transitorio Cuarto conserva los cuatro supuestos de terminación y la regla del siguiente periodo de facturación.',
        'Entrada en vigor: el día de publicación en el DOF, 30/09/2026.',
    ],
    'cambios_sin_confirmar': [],
}
(ROOT / f'{NAME}-COTEJO.json').write_text(json.dumps(cotejo, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

fields = 'id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden'
law_fields = 'id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo'
raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
assert '$payload$' not in raw and '$ingest$' not in raw
sql = f'''-- {NAME}: inserción idempotente, cotejada con DOF/SIDOF; conserva el acuerdo original.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='60s';
DO $ingest$
DECLARE p jsonb := $payload${raw}$payload$::jsonb; lid uuid;
BEGIN
 lid := (p->'ley'->>'id')::uuid;
 LOCK TABLE public.leyes,public.articulos,public.temas IN SHARE ROW EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM public.leyes WHERE id=lid OR lower(siglas)=lower(p->'ley'->>'siglas') OR lower(titulo)=lower(p->'ley'->>'titulo') OR url_original=p->'ley'->>'url_original') THEN RAISE EXCEPTION 'El instrumento ya existe: revisar, no reemplazar'; END IF;
 INSERT INTO public.leyes({law_fields}) SELECT {law_fields} FROM jsonb_populate_record(null::public.leyes,p->'ley');
 INSERT INTO public.articulos({fields}) SELECT {fields} FROM jsonb_populate_recordset(null::public.articulos,p->'articulos');
 INSERT INTO public.temas(ley_id,nivel,nombre,orden) SELECT lid,t->>'nivel',t->>'nombre',(t->>'orden')::int FROM jsonb_array_elements(p->'temas')t;
 IF (SELECT count(*) FROM public.articulos WHERE ley_id=lid)<>jsonb_array_length(p->'articulos') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'articulos')b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid WHERE a.id IS NULL OR (to_jsonb(a)-'fts'-'created_at') IS DISTINCT FROM b) THEN RAISE EXCEPTION 'Fallo de cotejo exacto de artículos'; END IF;
 IF (SELECT count(*) FROM public.temas WHERE ley_id=lid)<>jsonb_array_length(p->'temas') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'temas')b WHERE NOT EXISTS(SELECT 1 FROM public.temas t WHERE ley_id=lid AND (to_jsonb(t)-'id'-'ley_id'-'created_at')=b)) THEN RAISE EXCEPTION 'Fallo de cotejo de estructura'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.leyes l WHERE id=lid AND to_jsonb(l)-'created_at'=p->'ley') THEN RAISE EXCEPTION 'Metadatos diferentes'; END IF;
 IF EXISTS(SELECT 1 FROM public.articulos WHERE ley_id=lid AND (nullif(trim(contenido),'') IS NULL OR fts IS NULL OR fts=''::tsvector)) THEN RAISE EXCEPTION 'Texto o índice FTS vacío'; END IF;
END $ingest$;
COMMIT;
SELECT l.siglas,l.id,(SELECT count(*) FROM public.articulos a WHERE a.ley_id=l.id) fragmentos,(SELECT count(*) FROM public.temas t WHERE t.ley_id=l.id) temas FROM public.leyes l WHERE l.id='{LAW_ID}';
'''
(ROOT / f'{NAME}-aplicar.sql').write_text(sql, encoding='utf-8', newline='\n')
print(json.dumps({'siglas': NAME, 'fragments': len(rows), 'official': len(rows)-1, 'themes': len(themes),
                  'htmlBlocks': len(blocks), 'sha256Pdf': payload['fuente']['sha256_pdf']}, ensure_ascii=False, indent=2))
