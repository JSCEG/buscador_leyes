-- The old "Admin full access" policies on leyes, articulos and temas also accepted
-- user_metadata.role = 'admin', which every user can edit on their own account: any signed-in
-- person could grant themselves write access to the acervo. The *_admin_insert/update/delete
-- policies (202609300002_protect_acervo.sql, public.explorer_is_admin()) already cover the admins,
-- and the read policies stay as they are.
begin;
drop policy if exists "Admin full access" on public.leyes;
drop policy if exists "Admin full access" on public.articulos;
drop policy if exists "Admin full access" on public.temas;
commit;
