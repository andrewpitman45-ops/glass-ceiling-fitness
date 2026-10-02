# Activate private accounts

The app now requires Supabase authentication. It does not fall back to shared browser profiles when configuration is missing.

1. Create a Supabase project you control.
2. Run `supabase/schema.sql` once in its SQL editor. The four row-level security policies restrict reads and writes to the signed-in account's user ID. Keep RLS enabled.
3. Copy `.env.example` to `.env.local`. Set the project URL and **publishable** key from the project's Connect dialog. Never put a secret/service-role key in a Vite environment variable or browser code.
4. In Supabase Authentication, enable email/password login, **disable public sign-ups / new user sign-ups**, require email confirmation, and set the minimum password length to 12. This application only exposes sign-in and password recovery; do not re-enable public sign-ups in the Supabase project. To approve a new user, an administrator must invite that person from Supabase Authentication → Users (or a trusted server using the Supabase Admin API). Never put a service-role key in this browser app. Invited users accept the Terms of Use and Privacy Policy before creating their in-app profile. Configure production SMTP for invitations and reset emails.
5. Set the Authentication Site URL to the production website. Allow that exact URL and your local preview URL (such as `http://localhost:5173/`) as redirect URLs. Include the actual path if hosted below the domain root.
6. Restart `npm run dev`. For hosting, add the same two VITE variables to its environment configuration, then rebuild and deploy.

## Verify before inviting clients

- Invite two test users from the Supabase dashboard and confirm the invitation flow. Sign in, accept the legal terms, create profiles, save different workouts and nutrition notes, refresh, and confirm persistence.
- Confirm the public sign-up control is absent and the Supabase Auth setting rejects unauthenticated public sign-up requests. Existing invited users must still be able to sign in and reset passwords.
- Sign out of A and sign into B. A's profile and data must never appear.
- Using A's authenticated token against the REST API, request B's `user_id`: SELECT must return no rows; UPDATE/DELETE must affect no rows; INSERT with B's ID must fail. Repeat as an unauthenticated caller. Do not test with a service-role key, which bypasses RLS.
- Test an incorrect password, expired reset link, successful password reset, sign-out, and a failed save with the network disconnected.

This repository includes the implementation but does not provision a project, apply SQL remotely, or configure delivery of emails. Live authentication and access isolation must be tested after connection.

## Existing local data

Previously saved profiles are not proof of identity and are not automatically assigned to new accounts. The app no longer reads or writes that shared browser data. Old data may still exist under `glass-ceiling-fitness.profiles.v1` in browsers that used the earlier app. After its owner has securely retained any needed information, remove that specific local-storage entry. The new accounts do not retroactively protect old browser copies.

Account sessions persist until sign-out; sign out on shared devices. Client pathway selection is a preference, not a staff role or verified organization membership. No trainer access is granted by this implementation.

References: https://supabase.com/docs/guides/auth/passwords and https://supabase.com/docs/guides/database/postgres/row-level-security

## Friends and private photo posts

After the base account schema, run `supabase/migrations/20260930_friends_and_photos.sql` once in the Supabase SQL editor. It creates friend requests, photo metadata, a private 5 MB image bucket, and row-level security. Deploy the updated frontend after applying the migration.

Then run `supabase/migrations/20261002_abuse_controls.sql` once. It keeps the photo bucket private, restricts uploads to JPEG/PNG/WebP at 5 MiB each, and enforces database-side limits of 10 friend requests per hour, 10 photo posts per 24 hours, and 20 photo uploads per hour per signed-in account. The frontend also validates image signatures, caps captions and member searches, prevents overlapping actions, and spaces repeated searches. These checks do not replace RLS; leave the friends migration's policies enabled.

Open **Friends & photos** in the profile menu. Exchange friend codes (account IDs), send and accept a request, choose a friend, and upload a JPEG, PNG, or WebP. Only the sender and selected accepted friend can retrieve a post. No email address, workout, nutrition, or profile record is exposed. Either participant can remove a post; only the uploader can delete its stored file. Removing a received post hides it for both participants but leaves the private file in the uploader's storage. Unfriending removes recipient access to past posts; re-friending restores access. Downloaded copies cannot be recalled.

Verify with three test accounts after applying SQL: pending requests cannot send photos; only the recipient can accept; requester/recipient IDs cannot be changed; accepted A/B can share while C and anonymous users cannot read posts or files; unfriend blocks B from retrieving A's photos. Check oversize/unsupported uploads, failed uploads, refresh persistence, and post removal. Storage orphan cleanup may be needed if an upload is interrupted or file removal fails. The frontend shows the latest 50 accessible posts and refreshes on actions or with the Refresh button.
