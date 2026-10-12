-- Registered users panel (#usuarios), visible only to the site owner.
-- Editors (explorer_editors) and admins of the acervo do NOT get it: the owner list is separate.
-- No table of auth data is exposed; the browser only calls the two functions below.
begin;

create table if not exists public.site_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.site_owners enable row level security;
revoke all on public.site_owners from anon, authenticated;

-- The owner account, only if its email is confirmed. More owners are added by UUID from the dashboard.
insert into public.site_owners(user_id)
select id from auth.users
where email_confirmed_at is not null and lower(email) = 'javiereg3@gmail.com'
on conflict do nothing;

create or replace function public.site_is_owner()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.site_owners o
    join auth.users u on u.id = o.user_id
    where o.user_id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.site_is_owner() from public;
grant execute on function public.site_is_owner() to authenticated;

-- ultimo_acceso: last sign-in with password or link. ultima_actividad: last time a session was
-- used or refreshed (people who stay signed in do not sign in again).
create or replace function public.site_list_users()
returns table (
  email text,
  nombre text,
  registrado timestamptz,
  confirmado timestamptz,
  ultimo_acceso timestamptz,
  ultima_actividad timestamptz,
  sesiones_abiertas integer
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.site_is_owner() then
    raise exception 'SITE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  return query
    select u.email::text,
           coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'nombre', u.raw_user_meta_data->>'name', '')::text,
           u.created_at,
           u.email_confirmed_at,
           u.last_sign_in_at,
           greatest(u.last_sign_in_at, max(coalesce(s.refreshed_at, s.updated_at, s.created_at))::timestamptz),
           count(s.id)::integer
    from auth.users u
    left join auth.sessions s on s.user_id = u.id
    group by u.id
    order by 6 desc nulls last, u.created_at desc;
end;
$$;
revoke all on function public.site_list_users() from public;
grant execute on function public.site_list_users() to authenticated;
-- Supabase grants execute to anon on new functions by default; take it back explicitly.
revoke execute on function public.site_list_users() from anon;
revoke execute on function public.site_is_owner() from anon;

commit;
