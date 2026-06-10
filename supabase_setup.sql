-- ═══════════════════════════════════════════════════════════════════════════
-- Auth + datos por usuario para Buscador de Leyes Energía
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Favoritos ──────────────────────────────────────────────────────────────
create table if not exists public.user_favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  articulo_id  text not null,
  created_at   timestamptz default now() not null,
  unique (user_id, articulo_id)
);

alter table public.user_favorites enable row level security;

grant select, insert, delete on public.user_favorites to authenticated;

drop policy if exists "Usuarios gestionan sus propios favoritos" on public.user_favorites;

create policy "Usuarios gestionan sus propios favoritos"
  on public.user_favorites
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Notas ──────────────────────────────────────────────────────────────────
create table if not exists public.user_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  articulo_id  text not null,
  nota         text not null default '',
  updated_at   timestamptz default now() not null,
  unique (user_id, articulo_id)
);

alter table public.user_notes enable row level security;

grant select, insert, update, delete on public.user_notes to authenticated;

drop policy if exists "Usuarios gestionan sus propias notas" on public.user_notes;

create policy "Usuarios gestionan sus propias notas"
  on public.user_notes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_user_note_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_notes_updated_at on public.user_notes;

create trigger trg_user_notes_updated_at
before update on public.user_notes
for each row
execute function public.set_user_note_updated_at();

-- ── Índices para velocidad ─────────────────────────────────────────────────
create index if not exists idx_user_favorites_user on public.user_favorites(user_id);
create index if not exists idx_user_favorites_articulo on public.user_favorites(articulo_id);
create index if not exists idx_user_notes_user on public.user_notes(user_id);
create index if not exists idx_user_notes_articulo on public.user_notes(articulo_id);

-- ── Verificación rápida opcional ───────────────────────────────────────────
-- select * from public.user_favorites limit 10;
-- select * from public.user_notes limit 10;

-- ═══════════════════════════════════════════════════════════════════════════
-- Configuración adicional en Supabase Auth (Dashboard, no SQL)
--
-- 1. Authentication → Providers → Email
--    Activa Email provider.
--
-- 2. Authentication → URL Configuration
--    Agrega tu dominio local y productivo a:
--    - Site URL
--    - Redirect URLs
--
-- 3. Authentication → Providers → Email
--    Decide si el registro requiere confirmación por correo.
--
-- 4. Variables de entorno del frontend:
--    VITE_SUPABASE_URL=
--    VITE_SUPABASE_ANON_KEY=
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Relaciones entre instrumentos (modificaciones / reformas / abrogaciones)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.ley_relaciones (
  id              uuid primary key default gen_random_uuid(),
  ley_afectada_id uuid not null references public.leyes(id) on delete cascade,
  ley_nueva_id    uuid not null references public.leyes(id) on delete cascade,
  tipo            text not null default 'modifica'
                  check (tipo in ('modifica','reforma','adiciona','abroga','sustituye')),
  fecha           date,
  created_at      timestamptz default now() not null,
  unique (ley_afectada_id, ley_nueva_id),
  check (ley_afectada_id <> ley_nueva_id)
);

-- Mismo patrón de acceso que leyes/articulos: lectura pública, escritura
-- desde el Gestor con el rol anon (sin RLS).
grant select, insert, update, delete on public.ley_relaciones to anon, authenticated;

create index if not exists idx_ley_relaciones_afectada on public.ley_relaciones(ley_afectada_id);
create index if not exists idx_ley_relaciones_nueva on public.ley_relaciones(ley_nueva_id);
