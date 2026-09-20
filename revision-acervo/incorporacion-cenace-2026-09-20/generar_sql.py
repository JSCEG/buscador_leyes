from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=load(R/'PROGRAMA-CENACE-carga.json');assert load(R/'COTEJO-FUENTE.json')['celdas_y_spans_identicos']
before=load(R/'antes/articulos.json');note=next(a for a in before if a['ley_id']=='f17cb3b7-0f09-5a97-8c90-47812c921dbd'and a['identificador'].startswith('Nota editorial'))
old='Esta ficha contiene únicamente el aviso de publicación. El programa completo es un documento distinto de 52 páginas, localizado en [el PDF oficial](https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf). Su texto, tablas e indicadores todavía no están incorporados al buscador; el inventario conserva la referencia con cobertura parcial.'
assert old in note['contenido']
new='Esta ficha contiene únicamente el aviso de publicación. El programa completo es un documento distinto de 52 páginas y ya está incorporado, con sus tablas, indicadores y páginas sincronizadas: <a href="/#ley-'+p['ley']['id']+'">Texto original del Programa Institucional CENACE 2026-2030</a>. El aviso y el programa se conservan en fichas vinculadas. Actualización de cobertura: 20 de septiembre de 2026.'
update=dict(id=note['id'],antes=note['contenido'],despues=note['contenido'].replace(old,new));save(R/'actualizacion-nota-aviso.json',update)
payload={**p,'nota_aviso':update};raw=json.dumps(payload,ensure_ascii=False,separators=(',',':'));assert '$payload$'not in raw
lf='id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo';af='id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden'
sql=f'''BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='60s';
DO $ingest$
DECLARE p jsonb := $payload${raw}$payload$::jsonb; lid uuid;
BEGIN
 lid := (p->'ley'->>'id')::uuid;
 LOCK TABLE public.leyes,public.articulos,public.temas IN SHARE ROW EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM public.leyes WHERE id=lid OR lower(siglas)=lower(p->'ley'->>'siglas') OR url_original=p->'ley'->>'url_original') THEN RAISE EXCEPTION 'El programa ya existe: no reemplazar'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.articulos WHERE id=(p->'nota_aviso'->>'id')::uuid AND contenido=p->'nota_aviso'->>'antes') THEN RAISE EXCEPTION 'La nota del aviso cambió; revisar antes de actualizar'; END IF;
 INSERT INTO public.leyes({lf}) SELECT {lf} FROM jsonb_populate_record(null::public.leyes,p->'ley');
 INSERT INTO public.articulos({af}) SELECT {af} FROM jsonb_populate_recordset(null::public.articulos,p->'articulos');
 INSERT INTO public.temas(ley_id,nivel,nombre,orden) SELECT lid,t->>'nivel',t->>'nombre',(t->>'orden')::int FROM jsonb_array_elements(p->'temas')t;
 UPDATE public.articulos SET contenido=p->'nota_aviso'->>'despues' WHERE id=(p->'nota_aviso'->>'id')::uuid;
 IF (SELECT count(*)FROM public.articulos WHERE ley_id=lid)<>jsonb_array_length(p->'articulos') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'articulos')b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid WHERE a.id IS NULL OR (to_jsonb(a)-'fts'-'created_at') IS DISTINCT FROM b) THEN RAISE EXCEPTION 'Fallo de cotejo exacto de artículos'; END IF;
 IF (SELECT count(*)FROM public.temas WHERE ley_id=lid)<>jsonb_array_length(p->'temas') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'temas')b WHERE NOT EXISTS(SELECT 1 FROM public.temas t WHERE ley_id=lid AND (to_jsonb(t)-'id'-'ley_id'-'created_at')=b)) THEN RAISE EXCEPTION 'Fallo de cotejo de estructura'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.leyes l WHERE id=lid AND to_jsonb(l)-'created_at'=p->'ley') THEN RAISE EXCEPTION 'Metadatos diferentes'; END IF;
 IF EXISTS(SELECT 1 FROM public.articulos WHERE (ley_id=lid OR id=(p->'nota_aviso'->>'id')::uuid) AND (nullif(trim(contenido),'')IS NULL OR fts IS NULL OR fts=''::tsvector)) THEN RAISE EXCEPTION 'Texto o índice FTS vacío'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.articulos WHERE id=(p->'nota_aviso'->>'id')::uuid AND contenido=p->'nota_aviso'->>'despues') THEN RAISE EXCEPTION 'Nota del aviso sin actualizar'; END IF;
END $ingest$;
COMMIT;
SELECT l.id,l.siglas,(SELECT count(*)FROM public.articulos a WHERE a.ley_id=l.id)fragmentos FROM public.leyes l WHERE l.id='{p['ley']['id']}';
'''
(R/'PROGRAMA-CENACE-aplicar.sql').write_text(sql,encoding='utf8',newline='\n')
save(R/'sql-manifest.json',[dict(name='PROGRAMA-CENACE',ley_id=p['ley']['id'],fragmentos=len(p['articulos']),temas=len(p['temas']),chars=len(sql),sha256=hashlib.sha256(sql.encode()).hexdigest())])
print('SQL revisado:',len(sql),'caracteres; 33 fragmentos y una nota editorial actualizada.')
