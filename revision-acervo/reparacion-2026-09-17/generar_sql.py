"""Genera transacciones con guardas y reversión; no ejecuta SQL."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
original={x['id']:x for x in load(ROOT/'antes-verificado/articulos.json')}
FIELDS='id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden'
def fingerprints(rows):
    return [{**{k:v for k,v in a.items()if k not in ['contenido','created_at']},'contenido_md5':hashlib.md5(a['contenido'].encode()).hexdigest()}for a in rows]

def build(plan,reverse=False):
    before=plan['after']if reverse else plan['before'];after=plan['before']if reverse else plan['after']
    date_before=plan['date_after']if reverse else plan['date_before'];date_after=plan['date_before']if reverse else plan['date_after']
    removed=[a for a in before if a['id']not in {b['id']for b in after}]
    tb=plan['themes_after']if reverse else [{k:v for k,v in t.items()if k!='created_at'}for t in plan['themes_before']]
    ta=[{k:v for k,v in t.items()if k!='created_at'}for t in plan['themes_before']]if reverse else plan['themes_after']
    payload={'ley_id':plan['ley_id'],'before':fingerprints(before),'after':after,'remove':[a['id']for a in removed],'themes_before':tb,'themes_after':ta,'date_before':date_before,'date_after':date_after}
    raw=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
    assert '$payload$'not in raw
    # En reversión se coteja jerarquía por nombre/nivel/orden, pues sus IDs los asigna Postgres.
    theme_guard="(to_jsonb(t)-'created_at'-'id'-'ley_id')"if reverse else "(to_jsonb(t)-'created_at')"
    theme_insert="insert into public.temas(id,ley_id,nivel,nombre,orden) overriding system value select (t->>'id')::bigint,lid,t->>'nivel',t->>'nombre',(t->>'orden')::int from jsonb_array_elements(p->'themes_after') t;"if reverse else "insert into public.temas(ley_id,nivel,nombre,orden) select lid,t->>'nivel',t->>'nombre',(t->>'orden')::int from jsonb_array_elements(p->'themes_after') t;"
    restore_dates=''
    if reverse:
        dates=[{'id':a['id'],'created_at':original[a['id']]['created_at']}for a in after]
        restore_dates="update public.articulos a set created_at=(x->>'created_at')::timestamptz from jsonb_array_elements($dates$"+json.dumps(dates,separators=(',',':'))+"$dates$::jsonb) x where a.id=(x->>'id')::uuid;"
    return f"""-- {plan['name']} · {'REVERSIÓN'if reverse else 'CORRECCIÓN'} autorizada · transacción completa por instrumento
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
DO $repair$
DECLARE p jsonb := $payload${raw}$payload$::jsonb; lid uuid; n integer;
BEGIN
 lid := (p->>'ley_id')::uuid;
 LOCK TABLE public.articulos, public.temas, public.user_favorites, public.user_notes IN SHARE ROW EXCLUSIVE MODE;
 PERFORM 1 FROM public.leyes WHERE id=lid FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.leyes WHERE id=lid AND fecha_publicacion=(p->>'date_before')::date) THEN RAISE EXCEPTION 'Cambió la fecha o el instrumento'; END IF;
 SELECT count(*) INTO n FROM public.articulos WHERE ley_id=lid;
 IF n<>jsonb_array_length(p->'before') THEN RAISE EXCEPTION 'Cambió el conteo antes de aplicar'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p->'before') b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid WHERE a.id IS NULL OR md5(a.contenido) IS DISTINCT FROM b->>'contenido_md5' OR (to_jsonb(a)-'contenido'-'fts'-'created_at') IS DISTINCT FROM (b-'contenido_md5')) THEN RAISE EXCEPTION 'El respaldo ya no coincide con los artículos'; END IF;
 IF (SELECT count(*) FROM public.temas WHERE ley_id=lid)<>jsonb_array_length(p->'themes_before') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'themes_before') b WHERE NOT EXISTS(SELECT 1 FROM public.temas t WHERE t.ley_id=lid AND {theme_guard}=b)) THEN RAISE EXCEPTION 'Cambió el índice de temas'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_favorites f WHERE f.articulo_id IN(SELECT jsonb_array_elements_text(p->'remove'))) OR EXISTS(SELECT 1 FROM public.user_notes f WHERE f.articulo_id IN(SELECT jsonb_array_elements_text(p->'remove'))) THEN RAISE EXCEPTION 'Hay referencias nuevas a fragmentos que se unirán: revisar traslado'; END IF;
 INSERT INTO public.articulos({FIELDS})
 SELECT {FIELDS} FROM jsonb_populate_recordset(null::public.articulos,p->'after')
 ON CONFLICT(id) DO UPDATE SET identificador=excluded.identificador,contenido=excluded.contenido,tipo_articulo=excluded.tipo_articulo,titulo_nombre=excluded.titulo_nombre,capitulo_nombre=excluded.capitulo_nombre,seccion_nombre=excluded.seccion_nombre,orden=excluded.orden;
 DELETE FROM public.articulos WHERE ley_id=lid AND id IN(SELECT jsonb_array_elements_text(p->'remove')::uuid);
 DELETE FROM public.temas WHERE ley_id=lid;
 {theme_insert}
 UPDATE public.leyes SET fecha_publicacion=(p->>'date_after')::date WHERE id=lid;
 {restore_dates}
 IF (SELECT count(*) FROM public.articulos WHERE ley_id=lid)<>jsonb_array_length(p->'after') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'after') b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid WHERE a.id IS NULL OR (to_jsonb(a)-'fts'-'created_at') IS DISTINCT FROM b) THEN RAISE EXCEPTION 'La comprobación posterior de artículos falló'; END IF;
 IF EXISTS(SELECT 1 FROM public.articulos WHERE ley_id=lid AND (nullif(trim(contenido),'') IS NULL OR fts IS NULL OR fts=''::tsvector)) THEN RAISE EXCEPTION 'Texto o FTS vacío'; END IF;
 IF (SELECT count(*) FROM public.temas WHERE ley_id=lid)<>jsonb_array_length(p->'themes_after') THEN RAISE EXCEPTION 'Índice incompleto'; END IF;
END $repair$;
COMMIT;
SELECT l.siglas,l.id,(SELECT count(*) FROM public.articulos a WHERE a.ley_id=l.id) AS fragmentos,(SELECT count(*) FROM public.temas t WHERE t.ley_id=l.id) AS temas,l.fecha_publicacion FROM public.leyes l WHERE l.id='{plan['ley_id']}';
"""

assert load(ROOT/'cobertura-pendiente.json')==[]
manifest=[]
for s in load(ROOT/'resumen-plan.json'):
    p=load(ROOT/f"{s['name']}-plan.json")
    for reverse in [False,True]:
        filename=p['name']+('-revertir.sql'if reverse else '-aplicar.sql');sql=build(p,reverse)
        (ROOT/filename).write_text(sql,encoding='utf8',newline='\n')
        if not reverse:manifest.append({'name':p['name'],'file':filename,'chars':len(sql),'sha256':hashlib.sha256(sql.encode()).hexdigest()})
(ROOT/'sql-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print(json.dumps(manifest,indent=2))
