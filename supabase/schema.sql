-- Run once in the Supabase SQL editor before enabling the app.
create table public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from anon;
grant select, insert, update, delete on public.member_profiles to authenticated;
create policy "Read own profile" on public.member_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own profile" on public.member_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own profile" on public.member_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own profile" on public.member_profiles
  for delete to authenticated using ((select auth.uid()) = user_id);
