"""Inserciones nuevas, una transacción por instrumento. No ejecuta SQL remoto."""
from pathlib import Path
import json,hashlib,uuid,sys
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
NAMES=['LCNE','LSH','RICNE','LEPECFE','LEPEPM','LBio','LGeo']
TITLES=['Ley de la Comisión Nacional de Energía','Ley del Sector Hidrocarburos','Reglamento Interior de la Comisión Nacional de Energía','Ley de la Empresa Pública del Estado, Comisión Federal de Electricidad','Ley de la Empresa Pública del Estado, Petróleos Mexicanos','Ley de Biocombustibles','Ley de Geotermia']
TOPICS=[['Comisión Nacional de Energía','Regulación energética','Comité Técnico'],['Hidrocarburos','Exploración y extracción','Permisos'],['Comisión Nacional de Energía','Organización','Atribuciones'],['Electricidad','CFE','Empresa pública del Estado'],['Hidrocarburos','Petróleos Mexicanos','Empresa pública del Estado'],['Biocombustibles','Biomasa','Transición energética'],['Geotermia','Permisos y concesiones','Energías renovables']]
FIELDS='id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden'
LFIELDS='id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo'
def uid(name,label):return str(uuid.uuid5(uuid.NAMESPACE_URL,'buscador-sener/instrumento/'+name+'/'+label))
def build(name):
    j=load(ROOT/f'{name}-revisado.json');source=next(x for x in load(ROOT/'fuentes.json')if x['name']==name);i=NAMES.index(name);lid=uid(name,'ley')
    law=dict(id=lid,titulo=TITLES[i],siglas=name,fecha_publicacion='2025-05-08'if name=='RICNE'else'2025-03-18',fecha_ultima_reforma=None,vigente=True,temas_clave=TOPICS[i],url_original=source['url'],tipo='reglamento'if name=='RICNE'else'ley')
    rows=[dict(id=uid(name,a['identificador']),ley_id=lid,orden=n,**{k:a.get(k)for k in ['identificador','contenido','tipo_articulo','titulo_nombre','capitulo_nombre','seccion_nombre']})for n,a in enumerate(j['chunks'])]
    assert len({a['id']for a in rows})==len(rows)
    p=dict(ley=law,articulos=rows,temas=j['temas'],fuente=source)
    save(ROOT/f'{name}-carga.json',p)
    raw=json.dumps(p,ensure_ascii=False,separators=(',',':'));assert '$payload$'not in raw
    sql=f'''-- {name}: inserción autorizada, sin reemplazo de instrumentos existentes.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='60s';
DO $ingest$
DECLARE p jsonb := $payload${raw}$payload$::jsonb; lid uuid;
BEGIN
 lid := (p->'ley'->>'id')::uuid;
 LOCK TABLE public.leyes,public.articulos,public.temas IN SHARE ROW EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM public.leyes WHERE id=lid OR lower(siglas)=lower(p->'ley'->>'siglas') OR lower(titulo)=lower(p->'ley'->>'titulo') OR url_original=p->'ley'->>'url_original') THEN RAISE EXCEPTION 'El instrumento ya existe: se requiere revisión, no reemplazar'; END IF;
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
    (ROOT/f'{name}-aplicar.sql').write_text(sql,encoding='utf8',newline='\n')
    return dict(name=name,file=f'{name}-aplicar.sql',chars=len(sql),sha256=hashlib.sha256(sql.encode()).hexdigest(),ley_id=lid,fragmentos=len(rows),temas=len(j['temas']))
if __name__=='__main__':
    manifests=[build(n)for n in NAMES if (ROOT/f'{n}-revisado.json').exists()]
    save(ROOT/'sql-manifest.json',manifests);print(json.dumps(manifests,indent=2))
