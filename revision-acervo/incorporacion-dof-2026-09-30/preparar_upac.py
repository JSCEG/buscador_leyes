from html.parser import HTMLParser
from pathlib import Path
import datetime
import hashlib
import html
import json
import re
import uuid

ROOT = Path(__file__).resolve().parent
SOURCE_HTML = ROOT / 'UPAC-oficial.html'
PDF_PATH = Path(__file__).resolve().parents[2] / 'tmp/radar-2026-09-30/dof-matutina.pdf'
NAME = 'UPAC-SGE'
TITLE = ('Acuerdo por el que se emiten las Disposiciones administrativas de carácter general para el registro '
         'de las personas usuarias de patrón de alto consumo de energía y la implementación de Sistemas de Gestión de la Energía')
SOURCE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5799963'
PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/30-09-2026/Matutina/329925'
TITLE_NAME = 'Registro UPAC y Sistemas de Gestión de la Energía'


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
                # The official HTML splits this word across spans; the official PDF reads "efecto".
                text = text.replace('tal efe cto:', 'tal efecto:')
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

blocks = TextBlocks()
blocks.feed(SOURCE_HTML.read_text(encoding='utf-8'))
source_blocks = blocks.blocks
annotations = blocks.annotations
assert len(source_blocks) == 80, f'Cambió la extracción de bloques fuente: {len(source_blocks)}'
assert len(annotations) == 3, f'Cambió la extracción de encabezados: {annotations}'

body = []
rows = []
topics = [
    {'nivel': 'capitulo', 'nombre': 'Preámbulo', 'orden': 0},
    {'nivel': 'capitulo', 'nombre': 'Cuerpo del instrumento', 'orden': 1},
    {'nivel': 'capitulo', 'nombre': 'Disposiciones administrativas', 'orden': 2},
    {'nivel': 'capitulo', 'nombre': 'Transitorios', 'orden': 3},
    {'nivel': 'capitulo', 'nombre': 'Firma', 'orden': 4},
]

# La publicación ordena: preámbulo, Artículo Único, nombre de las DACG,
# artículos 1–14, cinco transitorios y firma.
pre = [
    TITLE + '.',
    'Al margen un sello con el Escudo Nacional, que dice: Estados Unidos Mexicanos.- Energía.- Secretaría de Energía.- Comisión Nacional para el Uso Eficiente de la Energía.',
    source_blocks[0],
] + source_blocks[1:6] + [annotations[1]]
rows.append(row('Preámbulo del acuerdo', pre, 'preambulo', 'Preámbulo', 1))
rows.append(row('Resolutivo ÚNICO · Expedición de disposiciones', [source_blocks[6]], 'ordinario', 'Cuerpo del instrumento', 2))

current_label = None
current_blocks = []
current_type = None
current_chapter = None
order = 3
article_re = re.compile(r'^Artículo (\d+)\.')
transitory_re = re.compile(r'^(Primero|Segundo|Tercero|Cuarto|Quinto)\.')

def flush():
    global current_label, current_blocks, current_type, current_chapter, order
    if current_label:
        rows.append(row(current_label, current_blocks, current_type, current_chapter, order))
        order += 1
    current_label = None
    current_blocks = []

for block in source_blocks[8:79]:
    article = article_re.match(block)
    transitory = transitory_re.match(block)
    if article:
        flush()
        current_label = f'Artículo {article.group(1)}'
        current_type = 'ordinario'
        current_chapter = 'Disposiciones administrativas'
        if article.group(1) == '1':
            current_blocks.append(source_blocks[7])
        current_blocks.append(block)
    elif transitory:
        flush()
        current_label = f'Transitorio {transitory.group(1)}'
        current_type = 'transitorio'
        current_chapter = 'Transitorios'
        current_blocks = ([annotations[2], block] if transitory.group(1) == 'Primero' else [block])
    elif current_label:
        current_blocks.append(block)
    else:
        raise ValueError(f'Bloque sin encabezado estructural: {block[:100]}')
flush()
rows.append(row('Firma del acuerdo', [source_blocks[79]], 'complementario', 'Firma', order))

assert len([r for r in rows if re.fullmatch(r'Artículo \d+', r['identificador'])]) == 14
assert len([r for r in rows if r['tipo_articulo'] == 'transitorio']) == 5
assert len(rows) == 22, f'Conteo de fragmentos oficiales inesperado: {len(rows)}'
assert len({r['id'] for r in rows}) == len(rows)
assert all(r['contenido'].strip() for r in rows)

note_text = (
    '### Nota editorial · instrumento regulatorio\n\n'
    'Se conserva el Acuerdo publicado en el DOF el 30 de septiembre de 2026. '
    'Esta nota es editorial y no forma parte del texto oficial.\n\n'
    f'Fuente oficial: [{SOURCE_URL}]({SOURCE_URL}) · PDF de la edición matutina: [{PDF_URL}]({PDF_URL}).\n\n'
    'La publicación contiene el preámbulo, el resolutivo ÚNICO, catorce artículos, cinco transitorios y la firma. '
    'No contiene tablas ni anexos. El acuerdo abroga disposiciones generales publicadas el 15 de noviembre de 2018; '
    'no se presenta como texto consolidado ni se certifica su vigencia. Fuente revisada el 1 de octubre de 2026.\n'
)
rows.insert(0, {
    'id': uid('Nota editorial · instrumento regulatorio'), 'ley_id': LAW_ID, 'orden': 0,
    'identificador': 'Nota editorial · instrumento regulatorio', 'contenido': note_text,
    'tipo_articulo': 'complementario', 'titulo_nombre': 'Información editorial',
    'capitulo_nombre': None, 'seccion_nombre': None,
})

law = {
    'id': LAW_ID, 'titulo': TITLE, 'siglas': NAME, 'fecha_publicacion': '2026-09-30',
    'fecha_ultima_reforma': None, 'vigente': None,
    'temas_clave': ['Registro UPAC', 'Eficiencia energética', 'Sistemas de Gestión de la Energía'],
    'url_original': SOURCE_URL, 'tipo': 'acuerdo',
}
themes = [{'nivel': 'titulo', 'nombre': 'Información editorial', 'orden': 0}] + [
    {**topic, 'orden': topic['orden'] + 1} for topic in topics
]
payload = {'ley': law, 'articulos': rows, 'temas': themes, 'fuente': {
    'url_html': SOURCE_URL, 'url_pdf': PDF_URL,
    'sha256_pdf': hashlib.sha256(PDF_PATH.read_bytes()).hexdigest(),
    'page_count': 344, 'pdf_pages_printed': [41, 42, 43, 44, 45],
}}
(ROOT / f'{NAME}-carga.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# El cotejo registra límites estructurales y detalles que deben seguir visibles.
cotejo = {
    'instrumento': NAME, 'fecha_revision': '2026-10-01', 'estado': 'cotejado',
    'fuente_html': SOURCE_URL, 'fuente_pdf_edicion': PDF_URL,
    'sha256_pdf': payload['fuente']['sha256_pdf'], 'paginas_impresas': [41, 42, 43, 44, 45],
    'paginas_pdf_cero_indexadas': [40, 41, 42, 43, 44],
    'bloques_html_capturados': len(source_blocks),
    'fragmentos_oficiales': len(rows) - 1, 'incluye_nota_editorial_separada': True,
    'articulos': 14, 'articulo_unico': 1, 'transitorios': 5,
    'tablas': 0, 'anexos': 0,
    'verificaciones': [
        'Orden: título y margen oficiales, preámbulo y considerandos, resolutivo, DACG, transitorios y firma.',
        'Artículo 2 conserva sus cinco definiciones y subincisos a–d dentro del mismo artículo.',
        'Artículo 7 conserva inscripción, mantenimiento y baja con sus documentos y plazos.',
        'Artículo 10 conserva cinco rubros y tres estados de avance del sistema de gestión.',
        'Artículo 13 conserva seis elementos mínimos y el plazo de certificación de un año.',
        'El transitorio Segundo abroga las disposiciones de 15/11/2018; el Tercero conserva la operación provisional del registro.',
        'El HTML divide "efecto" entre spans; cotejo puntual con PDF, página impresa 44, confirmó y restableció "efecto".',
    ],
    'cambios_sin_confirmar': [],
}
(ROOT / f'{NAME}-COTEJO.json').write_text(json.dumps(cotejo, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

fields = 'id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden'
law_fields = 'id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo'
raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
assert '$payload$' not in raw and '$ingest$' not in raw
sql = f'''-- {NAME}: inserción idempotente, cotejada con DOF/SIDOF; no reemplaza instrumentos existentes.
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

# Corrige encabezados omitidos en la primera carga sin crear un duplicado.
correction = f'''-- Corrige el contenido del instrumento ya cargado; mantiene los IDs y metadatos.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='60s';
DO $fix$
DECLARE p jsonb := $payload${raw}$payload$::jsonb; lid uuid;
BEGIN
 lid := (p->'ley'->>'id')::uuid;
 LOCK TABLE public.articulos IN SHARE ROW EXCLUSIVE MODE;
 IF NOT EXISTS(SELECT 1 FROM public.leyes WHERE id=lid AND siglas='{NAME}' AND url_original='{SOURCE_URL}') THEN RAISE EXCEPTION 'Instrumento destino no coincide'; END IF;
 IF (SELECT count(*) FROM public.articulos WHERE ley_id=lid)<>jsonb_array_length(p->'articulos') THEN RAISE EXCEPTION 'Conteo destino no coincide'; END IF;
 UPDATE public.articulos a SET identificador=b.identificador, contenido=b.contenido, tipo_articulo=b.tipo_articulo,
   titulo_nombre=b.titulo_nombre, capitulo_nombre=b.capitulo_nombre, seccion_nombre=b.seccion_nombre, orden=b.orden
 FROM jsonb_populate_recordset(null::public.articulos,p->'articulos') b
 WHERE a.id=b.id AND a.ley_id=lid;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p->'articulos') b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid
   WHERE a.id IS NULL OR (to_jsonb(a)-'fts'-'created_at') IS DISTINCT FROM b) THEN RAISE EXCEPTION 'Corrección no coincide exactamente'; END IF;
 IF EXISTS(SELECT 1 FROM public.articulos WHERE ley_id=lid AND (nullif(trim(contenido),'') IS NULL OR fts IS NULL OR fts=''::tsvector)) THEN RAISE EXCEPTION 'Texto o índice FTS vacío'; END IF;
END $fix$;
COMMIT;
SELECT l.siglas,l.id,(SELECT count(*) FROM public.articulos a WHERE a.ley_id=l.id) fragmentos FROM public.leyes l WHERE l.id='{LAW_ID}';
'''
(ROOT / f'{NAME}-corregir.sql').write_text(correction, encoding='utf-8', newline='\n')
print(json.dumps({'siglas': NAME, 'fragments': len(rows), 'official': len(rows)-1, 'themes': len(themes),
                  'htmlBlocks': len(source_blocks), 'sha256Pdf': payload['fuente']['sha256_pdf']}, ensure_ascii=False, indent=2))
