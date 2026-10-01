-- Run in the Supabase SQL Editor to remove saved application data for all users
-- while preserving their authentication accounts.
begin;

do $$
begin
  if to_regclass('public.friend_posts') is not null then
    execute 'delete from public.friend_posts';
  end if;

  if to_regclass('public.friendships') is not null then
    execute 'delete from public.friendships';
  end if;
end
$$;

delete from public.member_profiles;

commit;
