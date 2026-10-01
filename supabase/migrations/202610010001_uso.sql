-- Usage counters for the Estadísticas page: daily totals only (no IPs, emails or search terms).
-- The table is not reachable through the API; the site writes and reads it only through the two
-- functions below.

create table if not exists public.uso_diario (
    dia date not null,
    metrica text not null check (metrica in ('visita', 'visitante', 'busqueda', 'lectura')),
    total bigint not null default 0,
    primary key (dia, metrica)
);

alter table public.uso_diario enable row level security;
revoke all on public.uso_diario from anon, authenticated;

-- Adds one to today's counter (Mexico City day). Unknown metrics are ignored.
create or replace function public.registrar_uso(p_metrica text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_metrica not in ('visita', 'visitante', 'busqueda', 'lectura') then
        return;
    end if;
    insert into public.uso_diario (dia, metrica, total)
    values ((now() at time zone 'America/Mexico_City')::date, p_metrica, 1)
    on conflict (dia, metrica) do update set total = public.uso_diario.total + 1;
end;
$$;

-- Totals, today, the last 30 days of visits, when counting started, and confirmed accounts.
create or replace function public.resumen_uso()
returns json
language sql
stable
security definer
set search_path = public
as $$
    with hoy as (select (now() at time zone 'America/Mexico_City')::date as d)
    select json_build_object(
        'totales', coalesce((select json_object_agg(metrica, t) from (select metrica, sum(total) as t from public.uso_diario group by metrica) x), '{}'::json),
        'hoy', coalesce((select json_object_agg(metrica, total) from public.uso_diario, hoy where dia = hoy.d), '{}'::json),
        'serie', coalesce((select json_agg(json_build_object('dia', dia, 'visitas', total) order by dia)
                           from public.uso_diario, hoy where metrica = 'visita' and dia > hoy.d - 30), '[]'::json),
        'desde', (select min(dia) from public.uso_diario),
        'usuarios', (select count(*) from auth.users where email_confirmed_at is not null)
    );
$$;

revoke all on function public.registrar_uso(text) from public;
revoke all on function public.resumen_uso() from public;
grant execute on function public.registrar_uso(text) to anon, authenticated;
grant execute on function public.resumen_uso() to anon, authenticated;
