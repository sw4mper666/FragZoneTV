-- FragZoneTV: team and tournament application workflow
create table if not exists public.fztv_tournament_applications (
 id uuid primary key default gen_random_uuid(),
 tournament_id uuid not null references public.tournaments(id) on delete cascade,
 team_id uuid not null references public.fztv_teams(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 moderation_note text not null default '',
 created_at timestamptz not null default now(),
 unique(tournament_id,team_id)
);
create index if not exists fztv_tournament_applications_status_idx on public.fztv_tournament_applications(status,created_at);
alter table public.fztv_teams enable row level security;
alter table public.fztv_staff_roles enable row level security;
alter table public.fztv_tournament_applications enable row level security;
-- Staff membership is assigned by a trusted backend/database admin, never by the browser.
create or replace function public.fztv_is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.fztv_staff_roles where user_id=(select auth.uid()) and role in ('admin','owner','superadmin')); $$;
revoke all on function public.fztv_is_admin() from public;
grant execute on function public.fztv_is_admin() to authenticated;
drop policy if exists fztv_teams_read on public.fztv_teams;
create policy fztv_teams_read on public.fztv_teams for select to authenticated
using (status='approved' or owner_id=(select auth.uid()) or (select public.fztv_is_admin()));
drop policy if exists fztv_teams_create on public.fztv_teams;
create policy fztv_teams_create on public.fztv_teams for insert to authenticated
with check (owner_id=(select auth.uid()) and status='pending' and moderation_note='');
drop policy if exists fztv_teams_admin_update on public.fztv_teams;
create policy fztv_teams_admin_update on public.fztv_teams for update to authenticated
using ((select public.fztv_is_admin())) with check ((select public.fztv_is_admin()));
drop policy if exists fztv_applications_read on public.fztv_tournament_applications;
create policy fztv_applications_read on public.fztv_tournament_applications for select to authenticated
using (owner_id=(select auth.uid()) or (select public.fztv_is_admin()));
drop policy if exists fztv_applications_create on public.fztv_tournament_applications;
create policy fztv_applications_create on public.fztv_tournament_applications for insert to authenticated
with check (owner_id=(select auth.uid()) and status='pending' and moderation_note='' and exists(select 1 from public.fztv_teams t where t.id=team_id and t.owner_id=(select auth.uid()) and t.status='approved') and exists(select 1 from public.tournaments tr where tr.id=tournament_id and tr.status='registration'));
drop policy if exists fztv_applications_admin_update on public.fztv_tournament_applications;
create policy fztv_applications_admin_update on public.fztv_tournament_applications for update to authenticated
using ((select public.fztv_is_admin())) with check ((select public.fztv_is_admin()));
grant select,insert,update on public.fztv_teams to authenticated;
grant select,insert,update on public.fztv_tournament_applications to authenticated;
