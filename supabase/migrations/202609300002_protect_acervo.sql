-- The acervo tables accepted writes from the public (anon) key that ships in the website:
-- anyone could edit or delete laws, articles and themes. Reading stays public; writing is only
-- for editorial admins (public.explorer_is_admin(): app_metadata role 'admin' or explorer_editors).
-- Maintenance scripts that use the service_role key and SQL run in the dashboard are unaffected.

do $$
declare t text;
begin
  foreach t in array array['leyes', 'articulos', 'temas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists %I on public.%I', t || '_read_all', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_read_all', t);

    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.explorer_is_admin())', t || '_admin_insert', t);

    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.explorer_is_admin()) with check (public.explorer_is_admin())', t || '_admin_update', t);

    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.explorer_is_admin())', t || '_admin_delete', t);
  end loop;
end $$;

-- Grant the admin role to an account (run once per admin, with their email):
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--  where email = 'correo@ejemplo.com';
