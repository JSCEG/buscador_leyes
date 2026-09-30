-- Comments sent from the site's "Enviar comentario" dialog. Anyone can send one; nobody can read
-- them through the public API (review them in the Supabase dashboard or with the service role).
create table if not exists public.comentarios (
    id bigint generated always as identity primary key,
    tipo text not null check (tipo in ('error', 'documento', 'sugerencia')),
    mensaje text not null check (char_length(mensaje) between 5 and 2000),
    correo text check (correo is null or char_length(correo) <= 160),
    pagina text check (pagina is null or char_length(pagina) <= 500),
    contexto text check (contexto is null or char_length(contexto) <= 300),
    user_id uuid default auth.uid() references auth.users (id) on delete set null,
    atendido boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.comentarios enable row level security;

drop policy if exists "comentarios_insert_anyone" on public.comentarios;
create policy "comentarios_insert_anyone" on public.comentarios
    for insert to anon, authenticated
    with check (atendido = false);

grant insert on public.comentarios to anon, authenticated;
