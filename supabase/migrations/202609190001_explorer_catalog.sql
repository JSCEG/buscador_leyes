-- Catálogo editorial versionado. Esta migración no modifica leyes ni artículos.
-- Aplicar con el rol de migraciones; nunca incrustar service_role en el cliente.
begin;

create table if not exists public.explorer_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.explorer_editors enable row level security;
revoke all on public.explorer_editors from anon, authenticated;

-- Migra los administradores por correo ya definidos en auth.js sólo si su
-- correo está confirmado. Los permisos futuros se administran por UUID.
insert into public.explorer_editors(user_id)
select id from auth.users
where email_confirmed_at is not null
  and lower(email) in ('admin@sener.gob.mx', 'javiereg3@gmail.com')
on conflict do nothing;

create or replace function public.explorer_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
      and (u.raw_app_meta_data->>'role' = 'admin'
        or u.raw_app_meta_data->'is_admin' = 'true'::jsonb
        or exists (select 1 from public.explorer_editors e where e.user_id = u.id))
  );
$$;
revoke all on function public.explorer_is_admin() from public;
grant execute on function public.explorer_is_admin() to anon, authenticated;

create table if not exists public.explorer_catalog (
  id text primary key check (id = 'main'),
  revision integer not null default 1 check (revision >= 1),
  catalog jsonb,
  updated_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);
create table if not exists public.explorer_revisions (
  revision integer primary key check (revision >= 1),
  catalog jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);
insert into public.explorer_catalog(id) values ('main') on conflict do nothing;
alter table public.explorer_catalog enable row level security;
alter table public.explorer_revisions enable row level security;
revoke all on public.explorer_catalog, public.explorer_revisions from anon, authenticated;
grant select (id, revision, catalog, updated_at) on public.explorer_catalog to anon, authenticated;
grant select (revision, catalog, published_at) on public.explorer_revisions to authenticated;
drop policy if exists "Public read of explorer catalog" on public.explorer_catalog;
create policy "Public read of explorer catalog" on public.explorer_catalog for select to anon, authenticated using (true);
drop policy if exists "Editorial read of explorer history" on public.explorer_revisions;
create policy "Editorial read of explorer history" on public.explorer_revisions for select to authenticated using (public.explorer_is_admin());

create or replace function public.assert_explorer_catalog(p_catalog jsonb)
returns void language plpgsql set search_path = ''
as $$
declare item jsonb; ref jsonb; group_name text; linked_id text; allowed_keys text[]; field_name text; max_items integer;
begin
  if p_catalog is null or jsonb_typeof(p_catalog) <> 'object'
    or p_catalog->'schemaVersion' is distinct from '1'::jsonb
    or jsonb_typeof(p_catalog->'revision') is distinct from 'number'
    or coalesce(p_catalog->>'revision', '') !~ '^[1-9][0-9]*$'
    or (p_catalog->>'revision')::numeric > 9007199254740991
    or coalesce(p_catalog->>'updatedAt', '') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$'
    or octet_length(p_catalog::text) > 2097152 then
    raise exception 'EXPLORER_INVALID_CATALOG: encabezado o tamaño inválido';
  end if;
  -- El renderer acepta tabuladores, LF y CR; rechaza otros controles en texto.
  if exists (select 1 from jsonb_path_query(p_catalog, '$.** ? (@.type() == "string")') value
    where (value#>>'{}') ~ ('[' || chr(1) || '-' || chr(8) || chr(11) || chr(12) || chr(14) || '-' || chr(31) || chr(127) || ']')) then
    raise exception 'EXPLORER_INVALID_CATALOG: caracteres de control en texto';
  end if;
  if exists (select 1 from jsonb_object_keys(p_catalog) k where k not in ('schemaVersion','revision','updatedAt','entities','topics','relations','migrationNotes')) then
    raise exception 'EXPLORER_INVALID_CATALOG: campo desconocido';
  end if;
  perform (p_catalog->>'updatedAt')::timestamptz;
  if p_catalog ? 'migrationNotes' then
    if jsonb_typeof(p_catalog->'migrationNotes') <> 'array' or jsonb_array_length(p_catalog->'migrationNotes') > 100 then
      raise exception 'EXPLORER_INVALID_CATALOG: notas de migración inválidas';
    end if;
    if exists (select 1 from jsonb_array_elements(p_catalog->'migrationNotes') n where jsonb_typeof(n) <> 'string' or length(n#>>'{}') > 4000 or btrim(n#>>'{}') = '') then
      raise exception 'EXPLORER_INVALID_CATALOG: nota de migración inválida';
    end if;
  end if;
  foreach group_name in array array['entities','relations','topics'] loop
    max_items := case group_name when 'entities' then 2000 when 'topics' then 200 else 6000 end;
    if jsonb_typeof(p_catalog->group_name) is distinct from 'array'
      or jsonb_array_length(p_catalog->group_name) > max_items
      or (group_name <> 'relations' and jsonb_array_length(p_catalog->group_name) = 0) then
      raise exception 'EXPLORER_INVALID_CATALOG: colección inválida %', group_name;
    end if;
    if exists (select 1 from jsonb_array_elements(p_catalog->group_name) x
      group by x->>'id' having count(*) > 1) then
      raise exception 'EXPLORER_INVALID_CATALOG: identificadores duplicados en %', group_name;
    end if;
    for item in select value from jsonb_array_elements(p_catalog->group_name) loop
      if jsonb_typeof(item) <> 'object' or coalesce(item->>'id','') !~ '^[a-z0-9][a-z0-9_-]{0,99}$' then
        raise exception 'EXPLORER_INVALID_CATALOG: identificador inválido';
      end if;
      allowed_keys := case group_name when 'entities' then array['id','type','title','description','aliases','references'] when 'topics' then array['id','title','summary','entityIds','rootEntityId'] else array['id','source','target','type','label','description','references','reviewStatus'] end;
      if exists (select 1 from jsonb_object_keys(item) k where not (k = any(allowed_keys))) then
        raise exception 'EXPLORER_INVALID_CATALOG: campo de ficha desconocido';
      end if;
      foreach field_name in array allowed_keys loop
        if field_name not in ('aliases','references','entityIds') and (jsonb_typeof(item->field_name) is distinct from 'string'
          or btrim(item->>field_name) = '' or length(item->>field_name) > case when field_name = 'summary' then 8000 when field_name = 'description' then 12000 when field_name in ('title','label') then 240 else 100 end) then
          raise exception 'EXPLORER_INVALID_CATALOG: campo de texto inválido %', field_name;
        end if;
      end loop;
      if group_name = 'entities' then
        if item->>'type' not in ('concepto','instrumento','autoridad') or item->>'type' is null
          or coalesce(btrim(item->>'title'),'') = '' or coalesce(btrim(item->>'description'),'') = ''
          or jsonb_typeof(item->'aliases') is distinct from 'array' or jsonb_array_length(item->'aliases') > 30 then
          raise exception 'EXPLORER_INVALID_CATALOG: entidad incompleta';
        end if;
        if exists (select 1 from jsonb_array_elements(item->'aliases') a where jsonb_typeof(a) <> 'string' or btrim(a#>>'{}') = '' or length(a#>>'{}') > 240) then
          raise exception 'EXPLORER_INVALID_CATALOG: alias inválido';
        end if;
      elsif group_name = 'topics' then
        if coalesce(btrim(item->>'title'),'') = '' or coalesce(btrim(item->>'summary'),'') = ''
          or jsonb_typeof(item->'entityIds') is distinct from 'array' or jsonb_array_length(item->'entityIds') > 2000 then
          raise exception 'EXPLORER_INVALID_CATALOG: tema incompleto';
        end if;
        if not (item->'entityIds' ? (item->>'rootEntityId')) or item->>'rootEntityId' is null then
          raise exception 'EXPLORER_INVALID_CATALOG: raíz del tema inválida';
        end if;
        if exists (select 1 from jsonb_array_elements(item->'entityIds') member where jsonb_typeof(member) <> 'string')
          or exists (select 1 from jsonb_array_elements_text(item->'entityIds') member group by member having count(*) > 1) then
          raise exception 'EXPLORER_INVALID_CATALOG: miembro de tema inválido';
        end if;
        for linked_id in select jsonb_array_elements_text(item->'entityIds') loop
          if not exists (select 1 from jsonb_array_elements(p_catalog->'entities') en where en->>'id' = linked_id) then
            raise exception 'EXPLORER_INVALID_CATALOG: entidad del tema inexistente';
          end if;
        end loop;
      else
        if coalesce(item->>'type','') !~ '^[a-z0-9][a-z0-9_-]{0,99}$'
          or coalesce(btrim(item->>'label'),'') = '' or coalesce(btrim(item->>'description'),'') = ''
          or item->>'reviewStatus' not in ('editorial','verificada') or item->>'reviewStatus' is null
          or item->>'source' = item->>'target' then
          raise exception 'EXPLORER_INVALID_CATALOG: relación incompleta';
        end if;
        if not exists (select 1 from jsonb_array_elements(p_catalog->'entities') en where en->>'id' = item->>'source')
          or not exists (select 1 from jsonb_array_elements(p_catalog->'entities') en where en->>'id' = item->>'target') then
          raise exception 'EXPLORER_INVALID_CATALOG: relación con entidad inexistente';
        end if;
      end if;
      if group_name <> 'topics' then
        if jsonb_typeof(item->'references') is distinct from 'array' or jsonb_array_length(item->'references') > 100 then
          raise exception 'EXPLORER_INVALID_CATALOG: fuentes inválidas';
        end if;
        if group_name = 'relations' and item->>'reviewStatus' = 'verificada' and not exists (
          select 1 from jsonb_array_elements(item->'references') r
          where nullif(r->>'articleId','') is not null or nullif(r->>'url','') is not null
        ) then raise exception 'EXPLORER_INVALID_CATALOG: relación verificada sin evidencia'; end if;
        for ref in select value from jsonb_array_elements(item->'references') loop
          if jsonb_typeof(ref) <> 'object' or coalesce(btrim(ref->>'label'),'') = ''
            or (coalesce(ref->>'articleId','') = '' and coalesce(ref->>'url','') = '' and coalesce(ref->>'legacyArticleId','') = '') then
            raise exception 'EXPLORER_INVALID_CATALOG: fuente incompleta';
          end if;
          if exists (select 1 from jsonb_object_keys(ref) k where k not in ('articleId','legacyArticleId','label','quote','url')) then
            raise exception 'EXPLORER_INVALID_CATALOG: campo de fuente desconocido';
          end if;
          for field_name in select jsonb_object_keys(ref) loop
            if jsonb_typeof(ref->field_name) <> 'string' or btrim(ref->>field_name) = ''
              or length(ref->>field_name) > (case field_name when 'articleId' then 36 when 'legacyArticleId' then 160 when 'label' then 240 when 'quote' then 12000 else 2048 end) then
              raise exception 'EXPLORER_INVALID_CATALOG: texto de fuente inválido';
            end if;
          end loop;
          if ref ? 'legacyArticleId' and coalesce(ref->>'legacyArticleId','') !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$' then
            raise exception 'EXPLORER_INVALID_CATALOG: referencia heredada inválida';
          end if;
          if ref ? 'url' and (coalesce(ref->>'url','') !~* '^https?://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
            or coalesce(substring(ref->>'url' from '^https?://[^/:?#]+:([0-9]+)')::integer, 0) > 65535
            or ref->>'url' ~ '[\\]') then
            raise exception 'EXPLORER_INVALID_CATALOG: URL de fuente inválida';
          end if;
          if ref ? 'articleId' and not exists (select 1 from public.articulos a where a.id::text = ref->>'articleId') then
            raise exception 'EXPLORER_INVALID_CATALOG: fragmento de fuente inexistente';
          end if;
        end loop;
      end if;
    end loop;
  end loop;
end;
$$;
revoke all on function public.assert_explorer_catalog(jsonb) from public, anon, authenticated;

create or replace function public.publish_explorer_catalog(p_catalog jsonb, p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare current_revision integer; previous_catalog jsonb; result_catalog jsonb; publication_time timestamptz := date_trunc('milliseconds', now());
begin
  if not public.explorer_is_admin() then raise exception 'EXPLORER_ADMIN_REQUIRED'; end if;
  perform public.assert_explorer_catalog(p_catalog);
  select revision, catalog into current_revision, previous_catalog
    from public.explorer_catalog where id = 'main' for update;
  if current_revision is null or p_expected_revision is distinct from current_revision then
    raise exception 'EXPLORER_REVISION_CONFLICT';
  end if;
  result_catalog := jsonb_set(jsonb_set(p_catalog, '{revision}', to_jsonb(current_revision + 1)), '{updatedAt}', to_jsonb(publication_time));
  -- Preservar la base cuando el catálogo inicial se cargó mediante migración.
  if previous_catalog is not null then
    insert into public.explorer_revisions(revision, catalog)
      values (current_revision, previous_catalog) on conflict do nothing;
  end if;
  update public.explorer_catalog set catalog = result_catalog, revision = current_revision + 1,
    updated_at = publication_time, published_by = auth.uid() where id = 'main';
  insert into public.explorer_revisions(revision, catalog, published_at, published_by)
    values (current_revision + 1, result_catalog, publication_time, auth.uid());
  return result_catalog;
end;
$$;
revoke all on function public.publish_explorer_catalog(jsonb, integer) from public, anon;
grant execute on function public.publish_explorer_catalog(jsonb, integer) to authenticated;

commit;
