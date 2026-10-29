-- Instruments with their number of provisions, for the app start and the instrument header.
-- The REST embed `articulos(count)` turned into count(articulos_1), which builds every whole
-- row (contenido included) of the acervo on each visit: ~0.4-1.1 s and the busiest query of the
-- site. count(*) grouped by ley_id reads only the ley_id index. Read-only, SECURITY INVOKER.
begin;

create or replace function public.leyes_con_conteo(p_titulo text default null)
returns table (
  id uuid,
  titulo text,
  siglas text,
  fecha_publicacion date,
  fecha_ultima_reforma date,
  temas_clave text[],
  url_original text,
  tipo text,
  total_articulos bigint
)
language sql stable security invoker set search_path = ''
as $$
  select l.id, l.titulo, l.siglas, l.fecha_publicacion, l.fecha_ultima_reforma, l.temas_clave, l.url_original, l.tipo,
         coalesce(c.n, 0)::bigint
  from public.leyes l
  left join (select a.ley_id, count(*) as n from public.articulos a group by a.ley_id) c on c.ley_id = l.id
  where p_titulo is null or l.titulo = p_titulo;
$$;

revoke all on function public.leyes_con_conteo(text) from public;
grant execute on function public.leyes_con_conteo(text) to anon, authenticated;

commit;
