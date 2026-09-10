-- Run once in the SQL editor of your own Supabase project.
begin;
create schema if not exists focus_private;
revoke all on schema focus_private from public;
grant usage on schema focus_private to authenticated;

create table public.focus_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  owner_id uuid not null references auth.users(id),
  version integer not null default 1,
  posts jsonb not null default '[]' check (jsonb_typeof(posts) = 'array'),
  templates jsonb not null default '[]' check (jsonb_typeof(templates) = 'array'),
  updated_at timestamptz not null default now()
);
create table public.focus_members (
  workspace_id uuid not null references public.focus_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  email text not null,
  primary key (workspace_id, user_id)
);
create index focus_members_user on public.focus_members(user_id);
alter table public.focus_workspaces enable row level security;
alter table public.focus_members enable row level security;

create function focus_private.member_role(target uuid) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.focus_members where workspace_id = target and user_id = auth.uid();
$$;
revoke all on function focus_private.member_role(uuid) from public;
grant execute on function focus_private.member_role(uuid) to authenticated;
create policy workspace_read on public.focus_workspaces for select to authenticated
  using (focus_private.member_role(id) is not null);
create policy member_read on public.focus_members for select to authenticated
  using (user_id = auth.uid() or focus_private.member_role(workspace_id) = 'owner');
-- No direct mutations: RPCs enforce ownership, roles and compare-and-swap versions.
revoke all on public.focus_workspaces, public.focus_members from anon, authenticated;
grant select on public.focus_workspaces, public.focus_members to authenticated;

create function public.focus_create_workspace(workspace_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid; user_email text;
begin
  select email into user_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if user_email is null then raise exception 'Confirma tu correo antes de crear un espacio.'; end if;
  insert into public.focus_workspaces(name, owner_id) values (trim(workspace_name), auth.uid()) returning id into new_id;
  insert into public.focus_members values (new_id, auth.uid(), 'owner', user_email);
  return new_id;
end; $$;

create function public.focus_save_workspace(workspace_id uuid, expected_version integer, new_posts jsonb, new_templates jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.focus_workspaces;
begin
  -- Hold the membership lock until commit so revocation cannot race a write.
  perform 1 from public.focus_members m where m.workspace_id = focus_save_workspace.workspace_id
    and m.user_id = auth.uid() and m.role in ('owner', 'editor') for share;
  if not found then raise exception 'No tienes permiso para editar.'; end if;
  if new_posts is null or new_templates is null or jsonb_typeof(new_posts) <> 'array'
    or jsonb_typeof(new_templates) <> 'array' or octet_length(new_posts::text) + octet_length(new_templates::text) > 5000000
    then raise exception 'Contenido no válido o demasiado grande.'; end if;
  update public.focus_workspaces w set posts = new_posts, templates = new_templates,
    version = w.version + 1, updated_at = now()
    where w.id = workspace_id and w.version = expected_version returning w.* into result;
  if not found then raise exception 'CONFLICT'; end if;
  return to_jsonb(result);
end; $$;

create function public.focus_add_member(workspace_id uuid, member_email text, member_role text) returns void
language plpgsql security definer set search_path = '' as $$
declare target_user uuid; normalized_email text;
begin
  if focus_private.member_role(workspace_id) is distinct from 'owner' then raise exception 'Solo el propietario puede gestionar miembros.'; end if;
  if member_role is null or member_role not in ('editor', 'viewer') then raise exception 'Rol no válido.'; end if;
  select id, email into target_user, normalized_email from auth.users
    where lower(email) = lower(trim(member_email)) and email_confirmed_at is not null;
  if target_user is null then raise exception 'La persona debe crear su cuenta y confirmar su correo primero.'; end if;
  if target_user = auth.uid() then raise exception 'No puedes cambiar tu propio rol.'; end if;
  insert into public.focus_members values (workspace_id, target_user, member_role, normalized_email)
    on conflict on constraint focus_members_pkey do update set role = excluded.role;
end; $$;

create function public.focus_remove_member(workspace_id uuid, member_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if focus_private.member_role(workspace_id) is distinct from 'owner' then raise exception 'Solo el propietario puede gestionar miembros.'; end if;
  delete from public.focus_members m where m.workspace_id = focus_remove_member.workspace_id and m.user_id = member_id and m.role <> 'owner';
end; $$;

revoke all on function public.focus_create_workspace(text) from public, anon;
revoke all on function public.focus_save_workspace(uuid, integer, jsonb, jsonb) from public, anon;
revoke all on function public.focus_add_member(uuid, text, text) from public, anon;
revoke all on function public.focus_remove_member(uuid, uuid) from public, anon;
grant execute on function public.focus_create_workspace(text) to authenticated;
grant execute on function public.focus_save_workspace(uuid, integer, jsonb, jsonb) to authenticated;
grant execute on function public.focus_add_member(uuid, text, text) to authenticated;
grant execute on function public.focus_remove_member(uuid, uuid) to authenticated;
commit;
