-- "Lo más buscado": what people search, counted per day and per normalized term. No user, session or
-- address is stored, only the term and its daily count; the client sends only searches that found
-- results. Terms that look like personal data (e-mail addresses, long digit runs) are refused here
-- too, and the public list shows only terms searched at least three times in the window.

create table if not exists public.uso_busqueda (
    dia date not null,
    termino text not null check (char_length(termino) between 2 and 80),
    total bigint not null default 0,
    primary key (dia, termino)
);
create index if not exists uso_busqueda_termino_idx on public.uso_busqueda (termino);

alter table public.uso_busqueda enable row level security;
revoke all on public.uso_busqueda from anon, authenticated;

create or replace function public.registrar_busqueda(p_termino text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_termino text;
begin
    v_termino := regexp_replace(lower(btrim(coalesce(p_termino, ''))), '\s+', ' ', 'g');
    if char_length(v_termino) < 2 or char_length(v_termino) > 80 then return; end if;
    if v_termino ~ '@' or v_termino ~ '\d{6,}' then return; end if;
    if not private.allow_usage_counter() then return; end if;
    insert into public.uso_busqueda (dia, termino, total)
    values ((now() at time zone 'America/Mexico_City')::date, v_termino, 1)
    on conflict (dia, termino) do update set total = public.uso_busqueda.total + 1;
end;
$$;

-- Most searched terms in the last p_dias days (1-365), at least three searches each.
create or replace function public.top_busquedas(p_limite int default 10, p_dias int default 30)
returns json language sql stable security definer set search_path = '' as $$
    select coalesce(json_agg(x order by x.total desc, x.termino), '[]'::json) from (
        select termino, sum(total)::bigint as total
        from public.uso_busqueda
        where dia >= (now() at time zone 'America/Mexico_City')::date - least(greatest(p_dias, 1), 365)
        group by termino
        having sum(total) >= 3
        order by sum(total) desc, termino
        limit least(greatest(p_limite, 1), 30)
    ) x;
$$;

revoke all on function public.registrar_busqueda(text) from public;
revoke all on function public.top_busquedas(int, int) from public;
grant execute on function public.registrar_busqueda(text) to anon, authenticated;
grant execute on function public.top_busquedas(int, int) to anon, authenticated;
