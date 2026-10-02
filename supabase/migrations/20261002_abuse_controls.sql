-- Rate limits for member-generated requests, posts, and photo uploads.
begin;

create index if not exists friendships_requester_created_at
  on public.friendships (requester, created_at desc);
create index if not exists friend_posts_author_created_at
  on public.friend_posts (author, created_at desc);

create or replace function public.enforce_member_action_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  action_key text;
  recent_count bigint;
begin
  if actor is null then
    return new;
  end if;

  if tg_table_schema = 'public' and tg_table_name = 'friendships' then
    if new.requester <> actor then
      raise exception 'Friend requests must be sent by the signed-in user';
    end if;

    action_key := 'friend-request:' || actor::text;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(action_key, 0));

    select count(*) into recent_count
    from public.friendships f
    where f.requester = actor
      and f.created_at >= pg_catalog.now() - interval '1 hour';

    if recent_count >= 10 then
      raise exception 'Friend request limit reached. Try again later';
    end if;
  elsif tg_table_schema = 'public' and tg_table_name = 'friend_posts' then
    if new.author <> actor then
      raise exception 'Photo posts must be created by the signed-in user';
    end if;

    action_key := 'friend-post:' || actor::text;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(action_key, 0));

    select count(*) into recent_count
    from public.friend_posts p
    where p.author = actor
      and p.created_at >= pg_catalog.now() - interval '24 hours';

    if recent_count >= 10 then
      raise exception 'Photo post limit reached. Try again later';
    end if;
  elsif tg_table_schema = 'storage' and tg_table_name = 'objects' then
    if new.bucket_id <> 'friend-photos'
      or (storage.foldername(new.name))[1] is distinct from actor::text then
      raise exception 'Photo uploads must use the signed-in user folder';
    end if;

    action_key := 'friend-photo-upload:' || actor::text;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(action_key, 0));

    select count(*) into recent_count
    from storage.objects o
    where o.bucket_id = 'friend-photos'
      and (storage.foldername(o.name))[1] = actor::text
      and o.created_at >= pg_catalog.now() - interval '1 hour';

    if recent_count >= 20 then
      raise exception 'Photo upload limit reached. Try again later';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_member_action_rate_limit() from public, anon, authenticated;

drop trigger if exists limit_friendship_requests on public.friendships;
create trigger limit_friendship_requests
before insert on public.friendships
for each row execute function public.enforce_member_action_rate_limit();

drop trigger if exists limit_friend_photo_posts on public.friend_posts;
create trigger limit_friend_photo_posts
before insert on public.friend_posts
for each row execute function public.enforce_member_action_rate_limit();

drop trigger if exists limit_friend_photo_uploads on storage.objects;
create trigger limit_friend_photo_uploads
before insert on storage.objects
for each row
when (new.bucket_id = 'friend-photos')
execute function public.enforce_member_action_rate_limit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'friend-photos',
  'friend-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

commit;
