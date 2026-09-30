-- Mesas de consulta: named sets of articles each signed-in reader keeps in their account.
create table if not exists public.user_mesas (
    id uuid primary key,
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    nombre text not null check (char_length(nombre) between 1 and 80),
    articulos text[] not null default '{}' check (cardinality(articulos) <= 24),
    orden integer not null default 0,
    updated_at timestamptz not null default now()
);

create index if not exists user_mesas_user_idx on public.user_mesas (user_id, orden);

alter table public.user_mesas enable row level security;

-- Each reader sees and changes only their own desks.
drop policy if exists "user_mesas_select_own" on public.user_mesas;
create policy "user_mesas_select_own" on public.user_mesas
    for select to authenticated using (auth.uid() = user_id);

drop policy if exists "user_mesas_insert_own" on public.user_mesas;
create policy "user_mesas_insert_own" on public.user_mesas
    for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_mesas_update_own" on public.user_mesas;
create policy "user_mesas_update_own" on public.user_mesas
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_mesas_delete_own" on public.user_mesas;
create policy "user_mesas_delete_own" on public.user_mesas
    for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_mesas to authenticated;
