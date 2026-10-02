-- "Lo más consultado": how many times each law and each article was opened. Only ids that exist in
-- the acervo are counted; like uso_diario, the table is reachable only through the functions below.
-- Ids are validated as UUIDs and looked up by primary key, so the checks use the indexes.

create table if not exists public.uso_item (
    tipo text not null check (tipo in ('ley', 'articulo')),
    item_id text not null check (char_length(item_id) <= 80),
    total bigint not null default 0,
    ultimo timestamptz not null default now(),
    primary key (tipo, item_id)
);

alter table public.uso_item enable row level security;
revoke all on public.uso_item from anon, authenticated;

create or replace function public.registrar_item(p_tipo text, p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    if p_id is null or p_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        return;
    end if;
    v_id := p_id::uuid;
    if p_tipo = 'ley' and exists (select 1 from public.leyes where id = v_id) then
        null;
    elsif p_tipo = 'articulo' and exists (select 1 from public.articulos where id = v_id) then
        null;
    else
        return;
    end if;
    insert into public.uso_item (tipo, item_id, total, ultimo)
    values (p_tipo, v_id::text, 1, now())
    on conflict (tipo, item_id) do update set total = public.uso_item.total + 1, ultimo = now();
end;
$$;

-- Top laws and top articles, with the names the page needs.
create or replace function public.top_consultados(p_limite int default 8)
returns json
language sql
stable
security definer
set search_path = public
as $$
    select json_build_object(
        'leyes', coalesce((
            select json_agg(x order by x.total desc) from (
                select l.id::text as id, l.titulo, l.siglas, u.total
                from public.uso_item u join public.leyes l on l.id = u.item_id::uuid
                where u.tipo = 'ley'
                order by u.total desc, u.ultimo desc
                limit least(greatest(p_limite, 1), 20)
            ) x), '[]'::json),
        'articulos', coalesce((
            select json_agg(x order by x.total desc) from (
                select a.id::text as id, a.identificador, l.titulo as ley, l.siglas, u.total
                from public.uso_item u
                join public.articulos a on a.id = u.item_id::uuid
                left join public.leyes l on l.id = a.ley_id
                where u.tipo = 'articulo'
                order by u.total desc, u.ultimo desc
                limit least(greatest(p_limite, 1), 20)
            ) x), '[]'::json)
    );
$$;

revoke all on function public.registrar_item(text, text) from public;
revoke all on function public.top_consultados(int) from public;
grant execute on function public.registrar_item(text, text) to anon, authenticated;
grant execute on function public.top_consultados(int) to anon, authenticated;
