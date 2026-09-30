-- Private account data. Safe to apply to an existing member_profiles table.
create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);
alter table public.member_profiles enable row level security;
grant select, insert, update, delete on public.member_profiles to authenticated;
drop policy if exists member_profile_read on public.member_profiles;
drop policy if exists member_profile_create on public.member_profiles;
drop policy if exists member_profile_update on public.member_profiles;
drop policy if exists member_profile_delete on public.member_profiles;
create policy member_profile_read on public.member_profiles for select to authenticated using (user_id = auth.uid());
create policy member_profile_create on public.member_profiles for insert to authenticated with check (user_id = auth.uid());
create policy member_profile_update on public.member_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy member_profile_delete on public.member_profiles for delete to authenticated using (user_id = auth.uid());
