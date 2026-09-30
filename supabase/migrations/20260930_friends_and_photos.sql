-- Run once in the Supabase SQL editor. No private profile data is exposed.
begin;
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> recipient)
);
create unique index friendship_pair on public.friendships (least(requester, recipient), greatest(requester, recipient));
alter table public.friendships enable row level security;
revoke all on public.friendships from anon, authenticated;
grant select, insert, delete on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;
create policy friendship_read on public.friendships for select to authenticated
  using (auth.uid() in (requester, recipient));
create policy friendship_request on public.friendships for insert to authenticated
  with check (auth.uid() = requester and status = 'pending');
create policy friendship_accept on public.friendships for update to authenticated
  using (auth.uid() = recipient and status = 'pending')
  with check (auth.uid() = recipient and status = 'accepted');
create policy friendship_remove on public.friendships for delete to authenticated
  using (auth.uid() in (requester, recipient));

create table public.friend_posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  object_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 500),
  created_at timestamptz not null default now(),
  check (author <> recipient),
  check (object_path in (author::text || '/' || id::text || '.jpg', author::text || '/' || id::text || '.png', author::text || '/' || id::text || '.webp'))
);
create index friend_posts_recipient_date on public.friend_posts (recipient, created_at desc);
create index friend_posts_author_date on public.friend_posts (author, created_at desc);
alter table public.friend_posts enable row level security;
revoke all on public.friend_posts from anon, authenticated;
grant select, insert, delete on public.friend_posts to authenticated;
create policy photo_read on public.friend_posts for select to authenticated
  using (auth.uid() = author or (auth.uid() = recipient and exists (
    select 1 from public.friendships f where f.status = 'accepted'
    and least(f.requester, f.recipient) = least(author, friend_posts.recipient)
    and greatest(f.requester, f.recipient) = greatest(author, friend_posts.recipient)
  )));
create policy photo_post on public.friend_posts for insert to authenticated
  with check (auth.uid() = author and exists (
    select 1 from public.friendships f where f.status = 'accepted'
    and least(f.requester, f.recipient) = least(author, friend_posts.recipient)
    and greatest(f.requester, f.recipient) = greatest(author, friend_posts.recipient)
  ));
create policy photo_remove on public.friend_posts for delete to authenticated
  using (auth.uid() in (author, recipient));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('friend-photos', 'friend-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
create policy friend_photo_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'friend-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy friend_photo_download on storage.objects for select to authenticated
  using (bucket_id = 'friend-photos' and (
    (storage.foldername(name))[1] = auth.uid()::text or exists (
      select 1 from public.friend_posts p where p.object_path = name and p.recipient = auth.uid()
    )
  ));
create policy friend_photo_delete on storage.objects for delete to authenticated
  using (bucket_id = 'friend-photos' and (storage.foldername(name))[1] = auth.uid()::text);
commit;
