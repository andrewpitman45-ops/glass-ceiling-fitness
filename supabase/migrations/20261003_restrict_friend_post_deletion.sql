begin;

drop policy if exists photo_remove on public.friend_posts;
create policy photo_remove on public.friend_posts for delete to authenticated
  using (
    auth.uid() = author
    or (
      auth.uid() = recipient
      and exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and least(f.requester, f.recipient) = least(author, friend_posts.recipient)
          and greatest(f.requester, f.recipient) = greatest(author, friend_posts.recipient)
      )
    )
  );

commit;
