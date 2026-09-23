-- Búsqueda con relevancia. Solo lectura: no modifica leyes ni artículos.
-- Ambas funciones son SECURITY INVOKER, así que respetan exactamente los permisos
-- y políticas RLS que ya tiene el rol que llama (anon / authenticated).
begin;

-- Artículos que coinciden, ordenados por relevancia, con un fragmento donde aparece
-- el término. El fragmento marca coincidencias con [[[ y ]]]: el cliente escapa el
-- texto y solo después convierte esas marcas en <mark>, nunca inserta HTML de la base.
create or replace function public.buscar_articulos(
  q text,
  p_ley_ids uuid[] default null,
  p_articulo text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  ley_id uuid,
  identificador text,
  tipo_articulo text,
  titulo_nombre text,
  capitulo_nombre text,
  rank real,
  fragmento text,
  total bigint
)
language sql stable security invoker set search_path = ''
as $$
  with consulta as (
    select websearch_to_tsquery('spanish', q) as tsq,
           phraseto_tsquery('spanish', q) as frase,
           '%' || replace(replace(trim(q), '%', ''), '_', '') || '%' as patron
  ),
  coincidencias as (
    select a.id, a.ley_id, a.identificador, a.tipo_articulo, a.titulo_nombre, a.capitulo_nombre, a.orden, a.contenido,
           ( ts_rank_cd(a.fts, c.tsq, 32)
             -- La frase completa pesa más que las palabras sueltas.
             + case when numnode(c.frase) > 0 and a.fts @@ c.frase then 0.6 else 0 end
             -- Coincidir en el rótulo o encabezado indica que el artículo trata del tema.
             + case when concat_ws(' ', a.identificador, a.titulo_nombre, a.capitulo_nombre) ilike c.patron then 0.4 else 0 end
           )::real as rank,
           count(*) over () as total
    from public.articulos a, consulta c
    where numnode(c.tsq) > 0
      and a.fts @@ c.tsq
      and (p_ley_ids is null or a.ley_id = any (p_ley_ids))
      and (p_articulo is null or p_articulo = '' or a.identificador ilike '%' || p_articulo || '%')
  ),
  pagina as (
    select * from coincidencias
    order by rank desc, ley_id, orden
    limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)
  )
  select p.id::uuid, p.ley_id::uuid, p.identificador::text, p.tipo_articulo::text, p.titulo_nombre::text, p.capitulo_nombre::text, p.rank,
         ts_headline('spanish', p.contenido::text, c.tsq,
           'StartSel=[[[, StopSel=]]], MaxWords=38, MinWords=16, ShortWord=3, MaxFragments=2, FragmentDelimiter=" … "')::text,
         p.total::bigint
  from pagina p, consulta c
  order by p.rank desc, p.ley_id, p.orden;
$$;

-- Coincidencias por instrumento, para los filtros laterales del buscador.
create or replace function public.buscar_conteo_por_ley(
  q text,
  p_ley_ids uuid[] default null,
  p_articulo text default null
)
returns table (ley_id uuid, coincidencias bigint)
language sql stable security invoker set search_path = ''
as $$
  select a.ley_id::uuid, count(*)::bigint
  from public.articulos a
  where numnode(websearch_to_tsquery('spanish', q)) > 0
    and a.fts @@ websearch_to_tsquery('spanish', q)
    and (p_ley_ids is null or a.ley_id = any (p_ley_ids))
    and (p_articulo is null or p_articulo = '' or a.identificador ilike '%' || p_articulo || '%')
  group by a.ley_id
  order by count(*) desc;
$$;

revoke all on function public.buscar_articulos(text, uuid[], text, integer, integer) from public;
revoke all on function public.buscar_conteo_por_ley(text, uuid[], text) from public;
grant execute on function public.buscar_articulos(text, uuid[], text, integer, integer) to anon, authenticated;
grant execute on function public.buscar_conteo_por_ley(text, uuid[], text) to anon, authenticated;

commit;
