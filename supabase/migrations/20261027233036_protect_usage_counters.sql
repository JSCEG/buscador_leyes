-- Limit public counter writes per network. Store only a keyed daily digest, never the address.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.usage_rate_salts (
    day date primary key,
    salt uuid not null default gen_random_uuid()
);
create table if not exists private.usage_rate_limits (
    day date not null,
    bucket bigint not null,
    client_key text not null,
    requests integer not null,
    primary key (day, bucket, client_key)
);
revoke all on private.usage_rate_salts, private.usage_rate_limits from public, anon, authenticated;

create or replace function private.allow_usage_counter()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
    headers json;
    client_ip inet;
    today date := (now() at time zone 'UTC')::date;
    window_id bigint := floor(extract(epoch from now()) / 300)::bigint;
    daily_salt uuid;
    client_hash text;
    request_count integer;
begin
    begin
        headers := nullif(current_setting('request.headers', true), '')::json;
        client_ip := split_part(headers->>'x-forwarded-for', ',', 1)::inet;
    exception when invalid_text_representation then
        return true; -- preserve counts when the gateway does not supply a usable address
    end;
    if client_ip is null then return true; end if;

    insert into private.usage_rate_salts (day) values (today) on conflict (day) do nothing;
    select salt into daily_salt from private.usage_rate_salts where day = today;
    client_hash := md5(daily_salt::text || ':' || host(client_ip));
    insert into private.usage_rate_limits (day, bucket, client_key, requests)
    values (today, window_id, client_hash, 1)
    on conflict (day, bucket, client_key) do update
        set requests = private.usage_rate_limits.requests + 1
        where private.usage_rate_limits.requests < 400
    returning requests into request_count;

    -- Amortized cleanup; expired keyed digests and daily salts are short lived.
    if random() < 0.01 then
        delete from private.usage_rate_limits where bucket < window_id - 12;
        delete from private.usage_rate_salts where day < today;
    end if;
    return request_count is not null;
end;
$$;
revoke all on function private.allow_usage_counter() from public, anon, authenticated;

create or replace function public.registrar_uso(p_metrica text)
returns void language plpgsql security definer set search_path = '' as $$
begin
    if p_metrica is null or p_metrica not in ('visita', 'visitante', 'busqueda', 'lectura') then return; end if;
    if not private.allow_usage_counter() then return; end if;
    insert into public.uso_diario (dia, metrica, total)
    values ((now() at time zone 'America/Mexico_City')::date, p_metrica, 1)
    on conflict (dia, metrica) do update set total = public.uso_diario.total + 1;
end;
$$;

create or replace function public.registrar_item(p_tipo text, p_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
    if p_id is null or p_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return; end if;
    v_id := p_id::uuid;
    if p_tipo = 'ley' and exists (select 1 from public.leyes where id = v_id) then null;
    elsif p_tipo = 'articulo' and exists (select 1 from public.articulos where id = v_id) then null;
    else return;
    end if;
    if not private.allow_usage_counter() then return; end if;
    insert into public.uso_item (tipo, item_id, total, ultimo) values (p_tipo, v_id::text, 1, now())
    on conflict (tipo, item_id) do update set total = public.uso_item.total + 1, ultimo = now();
end;
$$;
