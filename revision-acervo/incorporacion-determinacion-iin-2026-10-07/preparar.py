"""Extract each provision with exact PDF line provenance; no PDF is published locally."""
import hashlib, html, json, re, sys, uuid
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / '.local/lse-sync/python'))
import pymupdf
URL = 'https://www.snieg.mx/Documentos/Normatividad/Vigente/Reglas_Determinacion_Informacion_Interes_Nacional.pdf'
TITLE = 'Acuerdo de la Junta de Gobierno por el que se aprueban las Reglas para la determinación de Información de Interés Nacional'
PDF = Path.home() / 'AppData/Local/Temp/DeterminacionIIN.pdf'
sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
sid = 'snieg-determinacion-iin-2018-' + sha[:12]
lawid = str(uuid.uuid5(uuid.NAMESPACE_URL, URL))
doc = pymupdf.open(PDF)
lines = []
for p, page in enumerate(doc, 1):
    if p == 1: continue  # Edition cover, not an operative provision.
    for block in page.get_text('dict', sort=True)['blocks']:
        for line in block.get('lines', []):
            text = ''.join(s['text'] for s in line['spans']).strip()
            if not text or text.startswith(('Publicadas en el Diario', 'última reforma')) or re.fullmatch(r'\d+', text): continue
            lines.append({'text': text, 'page': p, 'bbox': [round(float(x), 3) for x in line['bbox']]})
articles = []; mapping = {}; chapter = None; section = None; active = []
label = 'Preámbulo'; kind = 'preambulo'; key = 'preambulo'
def flush():
    if not active: return
    paragraphs = []; current = []
    for line in active:
        text = line['text']
        if current and (re.match(r'^(?:Artículo \d+\.|[IVXLCDM]+\.|[a-z]\)|Que |Primero\.|Segundo\.|Tercero\.|Cuarto\.|Quinto\.|Sexto\.)', text) or text == 'CONSIDERANDO'):
            paragraphs.append(' '.join(current)); current = []
        current.append(text)
    if current: paragraphs.append(' '.join(current))
    content = ''.join('<p>' + html.escape(x) + '</p>' for x in paragraphs)
    aid = str(uuid.uuid5(uuid.NAMESPACE_URL, URL + '#' + key))
    a = dict(id=aid, identificador=label, contenido=content, tipo_articulo=kind, orden=len(articles)+1,
             titulo_nombre='Reglas para la determinación de IIN', capitulo_nombre=chapter, seccion_nombre=section)
    articles.append(a)
    mapping[aid] = dict(sourceId=sid, label=label, type=kind, contentSha256=hashlib.sha256(content.encode()).hexdigest(),
                        pageNumbers=sorted({x['page'] for x in active}), anchors=[dict(page=x['page'], bbox=x['bbox']) for x in active])
i = 0; signatures = []
while i < len(lines):
    text = lines[i]['text']
    if re.match(r'^(?:Capítulo|Sección) [IVX]+,?$', text):
        flush(); active = []
        j = i + 1
        heading = []
        while j < len(lines) and not re.match(r'^(?:Artículo \d+|Capítulo |Sección |Transitorios)', lines[j]['text']):
            heading.append(lines[j]['text']); j += 1
        name = text.rstrip(',') + ' · ' + ' '.join(heading)
        if text.startswith('Capítulo'): chapter = name; section = None
        else: section = name
        i = j; continue
    if text == 'Transitorios':
        flush(); active = []; chapter = 'Transitorios'; section = None; i += 1; continue
    if text.startswith('Las presentes Reglas fueron aprobadas'):
        signatures = lines[i:]; break
    match = re.match(r'^Artículo (\d+)\.', text)
    trans = re.match(r'^(PRIMERO|SEGUNDO|TERCERO|CUARTO)\.-', text)
    if match or trans:
        flush(); active = []
        if match: label = 'Artículo ' + match[1]; key = 'articulo-' + match[1]; kind = 'ordinario'
        else: label = 'Transitorio ' + trans[1].title(); key = 'transitorio-' + trans[1].lower(); kind = 'transitorio'
    active.append(lines[i]); i += 1
flush()
assert [a['identificador'] for a in articles if a['tipo_articulo']=='ordinario'] == ['Artículo '+str(n) for n in range(1,38)], [(a['identificador'], a['contenido'][:140]) for a in articles]
assert len(articles)==42 and len(signatures)>0
assert sum(len(m['anchors']) for m in mapping.values()) + len(signatures) < len(lines)  # Heading lines excluded.
source = dict(id=sid,title='Reglas para la determinación de IIN · SNIEG · 9 de abril de 2018',instrumentIds=[lawid],sha256=sha,
              transport='remote-pdf',pdfUrl='/api/reader/'+sid,originalUrl=URL,pageCount=len(doc),
              pages=[dict(number=n,width=page.rect.width,height=page.rect.height) for n,page in enumerate(doc,1)])
law = dict(id=lawid,titulo=TITLE,siglas='RDETERMINACION-IIN',fecha_publicacion='2018-04-09',fecha_ultima_reforma=None,
           vigente=True,temas_clave=['SNIEG','INEGI','Información de Interés Nacional','Propuestas de información','Criterios','Revocación'],url_original=URL,tipo='acuerdo')
audit = dict(sha256=sha,bytes=PDF.stat().st_size,paginas=len(doc),fragmentos=len(articles),
             articulos=37,transitorios=4,anclas=sum(len(m['anchors']) for m in mapping.values()),
             fuenteVigencia='https://www.snieg.mx/scn-vigente/',
             nota='Cada párrafo procede de líneas completas del PDF, con sus coordenadas exactas. Se excluyen portada, pies repetidos y certificación de firmas final; la certificación se conserva aquí para cotejo, no como documento relacionado.',
             certificacion=[x['text'] for x in signatures],
             resumen='Establece los criterios y procedimientos para proponer y determinar Información de Interés Nacional. Regula la participación de las Unidades del Estado, los Comités Técnicos Especializados y Ejecutivos, el Consejo Consultivo Nacional y la Junta de Gobierno del INEGI, así como revisión, revocación, nuevos temas, difusión y conservación. Abroga las reglas publicadas el 3 de septiembre de 2015.')
package = dict(ley=law,articulos=articles,source=source,auditoria=audit)
for name,obj in [('carga.json',package),('source.json',source),('map.json',dict(source=source,articles=mapping)),('cotejo.json',audit)]:
    (ROOT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def q(value): return 'null' if value is None else "'"+str(value).replace("'","''")+"'"
cols = list(law)
vals = ["ARRAY["+','.join(q(t) for t in law[c])+']::text[]' if c=='temas_clave' else 'true' if c=='vigente' else q(law[c]) for c in cols]
sql=['begin;', 'insert into public.leyes ('+','.join(cols)+') values ('+','.join(vals)+') on conflict (id) do nothing;']
for a in articles:
    row=dict(a,ley_id=lawid); cols=list(row)
    vals=[str(row[c]) if c=='orden' else q(row[c]) for c in cols]
    sql.append('insert into public.articulos ('+','.join(cols)+') values ('+','.join(vals)+') on conflict (id) do nothing;')
sql.append('commit;')
(ROOT/'aplicar.sql').write_text('\n'.join(sql)+'\n',encoding='utf-8')
print(json.dumps(dict(lawId=lawid,sourceId=sid,**audit),ensure_ascii=False))
