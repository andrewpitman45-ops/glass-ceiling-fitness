-- Adds a searchable member directory for friend lookup by first and last name.
-- Private profile data remains in member_profiles and is not exposed here.

begin;

create table if not exists public.member_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_directory enable row level security;

revoke all on public.member_directory from anon, authenticated;

grant select, insert, update on public.member_directory to authenticated;

drop policy if exists member_directory_read on public.member_directory;
drop policy if exists member_directory_insert on public.member_directory;
drop policy if exists member_directory_update on public.member_directory;

create policy member_directory_read
on public.member_directory
for select
to authenticated
using (true);

create policy member_directory_insert
on public.member_directory
for insert
to authenticated
with check (user_id = auth.uid());

create policy member_directory_update
on public.member_directory
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists member_directory_name_search
on public.member_directory (
  lower(last_name),
  lower(first_name)
);

commit;