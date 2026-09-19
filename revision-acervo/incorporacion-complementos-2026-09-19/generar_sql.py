"""SQL de incorporación: una transacción verificable por instrumento, sin reemplazos."""
from pathlib import Path
import json,uuid,hashlib,datetime,html
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
SOURCES=load(ROOT/'fuentes.json')
METADATA={s['name']:s for s in load(ROOT/'config.json')}
CONFIG={s['name']:(s['titulo'].rstrip('.'),METADATA[s['name']]['tipo'],[s['familia'], s['pieza']])for s in SOURCES}
FIELDS='id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden'
LFIELDS='id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo'
def uid(name,label):return str(uuid.uuid5(uuid.NAMESPACE_URL,'buscador-sener/instrumento/'+name+'/'+label))
def note(source):
 text='### Nota editorial · '+source['familia']+'\n\n'
 text+='Se conserva la publicación del DOF de '+source['fecha'].replace('-','/')+'. Esta nota es información editorial del buscador y no forma parte del texto oficial.\n\n'
 text+='Publicación consultada:\n\n'
 for s in SOURCES:
  if s['name']!=source['name'] and not (s['name'].startswith('PROSENER') and source['name'].startswith('PROSENER')):continue
  label={'DACG-COGENERACION':'Texto original · DACG de cogeneración','MIGRACION-PERMISOS':'Texto original · Lineamientos de migración','MIGRACION-MODIFICACION':'Modificación 1 · Acuerdo del 8 de septiembre de 2026'}.get(s['name'],s['pieza'])
  text+=f'- <a href="/#ley-{uid(s["name"],"ley")}" target="_blank" rel="noopener noreferrer">{html.escape(label)}</a> · {s["fecha"]} · [fuente oficial]({s["url"]})\n'
 text+='\nSe conserva la estructura de la publicación: artículos, numerales, bases, transitorios o formularios, según corresponda. Las tablas se mantienen completas dentro de su apartado. Las firmas pertenecen a esta publicación. No se certifica la vigencia ni se presenta un texto consolidado. Fuente revisada el 19 de septiembre de 2026.\n'
 if source['name'].startswith('REFORMA-'):text+='\nEste instrumento es un decreto de reforma. Las disposiciones que reproduce se identifican como modificaciones; no equivalen al texto completo de la Constitución, ley o reglamento reformados.\n'
 if source['name']=='ASEA-CONV-BODEGAS-LP':text+='\nEsta publicación modifica una convocatoria anterior; se conserva el texto modificatorio, con sus omisiones y derogaciones tal como fue publicado. No se presenta como la convocatoria original completa.\n'
 if source['name']=='FORMATOS-BIOCOMBUSTIBLES':text+='\nLos siete anexos reúnen 22 formularios completos. Cada formulario se conserva como una unidad de consulta con sus tablas, instrucciones y manifestaciones; no es un formulario de envío o captura de datos personales.\n'
 if source['name']=='CATALOGO-CONUEE':text+='\nLos seis formatos del Apéndice B se conservan en ocho imágenes oficiales por enlace. El texto dentro de esas imágenes no está indexado mediante OCR y requiere conexión con la fuente.\n'
 if source['name']=='PLADESE':text+='\nObservación de la publicación: la tabla A2.1 se titula «Características básicas de centrales generadoras», pero muestra una serie por gerencias de control y años. Esta correspondencia aparece tanto en el HTML como en la página 108 del PDF oficial. Se conserva tal como fue publicada, sin corregirla ni inferir datos.\n'
 if source['name']=='MIGRACION-ACLARACION':text+='\nLa versión HTML oficial y el PDF difieren en la redacción del segundo encabezado repetido. Se conserva el HTML; el cuerpo de la aclaración, las tablas y la firma se cotejaron con la página 107 del PDF oficial.\n'
 return dict(identificador='Nota editorial · documentos relacionados',contenido=text,tipo_articulo='complementario',titulo_nombre='Información editorial',capitulo_nombre=None,seccion_nombre=None)

def build(name):
 j=load(ROOT/f'{name}-revisado.json');source=next(s for s in load(ROOT/'fuentes.json')if s['name']==name)
 assert j['control']['cobertura_total'] and j['control']['sin_solapamientos']
 assert next(c for c in load(ROOT/'ALCANCE-PDF.json')if c['instrumento']==name)['final_localizado']
 assert next(c for c in load(ROOT/'COTEJO-FUENTES.json')if c['instrumento']==name)['texto_completo_cotejado']
 title,kind,topics=CONFIG[name];lid=uid(name,'ley')
 law=dict(id=lid,titulo=title,siglas=name,fecha_publicacion=datetime.datetime.strptime(source['fecha'],'%d-%m-%Y').date().isoformat(),fecha_ultima_reforma=None,vigente=None,temas_clave=topics,url_original=source['url'],tipo=kind)
 chunks=[note(source)]+j['chunks']
 rows=[dict(id=uid(name,a['identificador']),ley_id=lid,orden=n,**{k:a.get(k)for k in ['identificador','contenido','tipo_articulo','titulo_nombre','capitulo_nombre','seccion_nombre']})for n,a in enumerate(chunks)]
 assert len({a['id']for a in rows})==len(rows) and all(a['contenido'].strip()for a in rows)
 themes=[dict(nivel='titulo',nombre='Información editorial',orden=0)]+[{**t,'orden':t['orden']+1}for t in j['temas']]
 p=dict(ley=law,articulos=rows,temas=themes,fuente=source);save(ROOT/f'{name}-carga.json',p)
 raw=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$'not in raw and '$ingest$'not in raw
 sql=f'''-- {name}: inserción autorizada, sin reemplazo de instrumentos existentes.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='60s';
DO $ingest$
DECLARE p jsonb := $payload${raw}$payload$::jsonb; lid uuid;
BEGIN
 lid := (p->'ley'->>'id')::uuid;
 LOCK TABLE public.leyes,public.articulos,public.temas IN SHARE ROW EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM public.leyes WHERE id=lid OR lower(siglas)=lower(p->'ley'->>'siglas') OR lower(titulo)=lower(p->'ley'->>'titulo') OR url_original=p->'ley'->>'url_original') THEN RAISE EXCEPTION 'El instrumento ya existe: revisar, no reemplazar'; END IF;
 INSERT INTO public.leyes({LFIELDS}) SELECT {LFIELDS} FROM jsonb_populate_record(null::public.leyes,p->'ley');
 INSERT INTO public.articulos({FIELDS}) SELECT {FIELDS} FROM jsonb_populate_recordset(null::public.articulos,p->'articulos');
 INSERT INTO public.temas(ley_id,nivel,nombre,orden) SELECT lid,t->>'nivel',t->>'nombre',(t->>'orden')::int FROM jsonb_array_elements(p->'temas')t;
 IF (SELECT count(*)FROM public.articulos WHERE ley_id=lid)<>jsonb_array_length(p->'articulos') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'articulos')b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid WHERE a.id IS NULL OR (to_jsonb(a)-'fts'-'created_at') IS DISTINCT FROM b) THEN RAISE EXCEPTION 'Fallo de cotejo exacto de artículos'; END IF;
 IF (SELECT count(*)FROM public.temas WHERE ley_id=lid)<>jsonb_array_length(p->'temas') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'temas')b WHERE NOT EXISTS(SELECT 1 FROM public.temas t WHERE ley_id=lid AND (to_jsonb(t)-'id'-'ley_id'-'created_at')=b)) THEN RAISE EXCEPTION 'Fallo de cotejo de estructura'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.leyes l WHERE id=lid AND to_jsonb(l)-'created_at'=p->'ley') THEN RAISE EXCEPTION 'Metadatos diferentes'; END IF;
 IF EXISTS(SELECT 1 FROM public.articulos WHERE ley_id=lid AND (nullif(trim(contenido),'')IS NULL OR fts IS NULL OR fts=''::tsvector)) THEN RAISE EXCEPTION 'Texto o índice FTS vacío'; END IF;
END $ingest$;
COMMIT;
SELECT l.siglas,l.id,(SELECT count(*)FROM public.articulos a WHERE a.ley_id=l.id)fragmentos,(SELECT count(*)FROM public.temas t WHERE t.ley_id=l.id)temas FROM public.leyes l WHERE l.id='{lid}';
'''
 (ROOT/f'{name}-aplicar.sql').write_text(sql,encoding='utf-8',newline='\n')
 return dict(name=name,ley_id=lid,fragmentos=len(rows),temas=len(themes),chars=len(sql),sha256=hashlib.sha256(sql.encode()).hexdigest())
if __name__=='__main__':
 manifest=[build(n)for n in CONFIG if (ROOT/f'{n}-revisado.json').exists()];save(ROOT/'sql-manifest.json',manifest);print(json.dumps(manifest,ensure_ascii=False,indent=2))
