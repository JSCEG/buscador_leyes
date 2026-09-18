"""SQL de incorporación: una transacción verificable por instrumento, sin reemplazos."""
from pathlib import Path
import json,uuid,hashlib,datetime
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
CONFIG={
 'RLBio':('Reglamento de la Ley de Biocombustibles','reglamento',['Biocombustibles','Permisos y autorizaciones','Biomasa']),
 'RLGeo':('Reglamento de la Ley de Geotermia','reglamento',['Geotermia','Permisos y concesiones','Usos diversos']),
 'RLEPECFE':('Reglamento de la Ley de la Empresa Pública del Estado, Comisión Federal de Electricidad','reglamento',['CFE','Consejo de Administración','Régimen especial']),
 'RLEPEPM':('Reglamento de la Ley de la Empresa Pública del Estado, Petróleos Mexicanos','reglamento',['Petróleos Mexicanos','Consejo de Administración','Régimen especial']),
 'DACG-PERMISOS-GA':('Disposiciones administrativas de carácter general para solicitar el otorgamiento y la modificación de permisos de generación y almacenamiento de energía eléctrica, así como su vigencia','dacg',['Permisos de generación','Almacenamiento de energía eléctrica','Modificación de permisos','Formatos']),
 'FORMATOS-SAEE':('Acuerdo de la Comisión Nacional de Energía por el que se emiten los formatos referidos en las DACG para la integración de Sistemas de Almacenamiento de Energía Eléctrica al Sistema Eléctrico Nacional','acuerdo',['Almacenamiento de energía eléctrica','Respaldo propio','Formatos','CNE']),
}
FIELDS='id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden'
LFIELDS='id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo'
def uid(name,label):return str(uuid.uuid5(uuid.NAMESPACE_URL,'buscador-sener/instrumento/'+name+'/'+label))
def build(name):
 j=load(ROOT/f'{name}-revisado.json');source=next(s for s in load(ROOT/'fuentes.json')if s['name']==name)
 assert j['control']['cobertura_total'] and j['control']['sin_solapamientos']
 title,kind,topics=CONFIG[name];lid=uid(name,'ley')
 law=dict(id=lid,titulo=title,siglas=name,fecha_publicacion=datetime.datetime.strptime(source['fecha'],'%d-%m-%Y').date().isoformat(),fecha_ultima_reforma=None,vigente=True,temas_clave=topics,url_original=source.get('pdf',{}).get('url',source['url']),tipo=kind)
 rows=[dict(id=uid(name,a['identificador']),ley_id=lid,orden=n,**{k:a.get(k)for k in ['identificador','contenido','tipo_articulo','titulo_nombre','capitulo_nombre','seccion_nombre']})for n,a in enumerate(j['chunks'])]
 assert len({a['id']for a in rows})==len(rows) and all(a['contenido'].strip()for a in rows)
 p=dict(ley=law,articulos=rows,temas=j['temas'],fuente=source);save(ROOT/f'{name}-carga.json',p)
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
 return dict(name=name,ley_id=lid,fragmentos=len(rows),temas=len(j['temas']),chars=len(sql),sha256=hashlib.sha256(sql.encode()).hexdigest())
if __name__=='__main__':
 manifest=[build(n)for n in CONFIG if (ROOT/f'{n}-revisado.json').exists()];save(ROOT/'sql-manifest.json',manifest);print(json.dumps(manifest,ensure_ascii=False,indent=2))
