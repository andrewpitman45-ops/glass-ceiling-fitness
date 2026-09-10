# Activate private accounts

The app now requires Supabase authentication. It does not fall back to shared browser profiles when configuration is missing.

1. Create a Supabase project you control.
2. Run `supabase/schema.sql` once in its SQL editor. The four row-level security policies restrict reads and writes to the signed-in account's user ID. Keep RLS enabled.
3. Copy `.env.example` to `.env.local`. Set the project URL and **publishable** key from the project's Connect dialog. Never put a secret/service-role key in a Vite environment variable or browser code.
4. In Supabase Authentication, enable email/password login, require email confirmation, and set the minimum password length to 12. Configure production SMTP for confirmation and reset emails.
5. Set the Authentication Site URL to the production website. Allow that exact URL and your local preview URL (such as `http://localhost:5173/`) as redirect URLs. Include the actual path if hosted below the domain root.
6. Restart `npm run dev`. For hosting, add the same two VITE variables to its environment configuration, then rebuild and deploy.

## Verify before inviting clients

- Create two test users and confirm their email addresses. Sign in, create profiles, save different workouts and nutrition notes, refresh, and confirm persistence.
- Sign out of A and sign into B. A's profile and data must never appear.
- Using A's authenticated token against the REST API, request B's `user_id`: SELECT must return no rows; UPDATE/DELETE must affect no rows; INSERT with B's ID must fail. Repeat as an unauthenticated caller. Do not test with a service-role key, which bypasses RLS.
- Test an incorrect password, expired reset link, successful password reset, sign-out, and a failed save with the network disconnected.

This repository includes the implementation but does not provision a project, apply SQL remotely, or configure delivery of emails. Live authentication and access isolation must be tested after connection.

## Existing local data

Previously saved profiles are not proof of identity and are not automatically assigned to new accounts. The app no longer reads or writes that shared browser data. Old data may still exist under `glass-ceiling-fitness.profiles.v1` in browsers that used the earlier app. After its owner has securely retained any needed information, remove that specific local-storage entry. The new accounts do not retroactively protect old browser copies.

Account sessions persist until sign-out; sign out on shared devices. Client pathway selection is a preference, not a staff role or verified organization membership. No trainer access is granted by this implementation.

References: https://supabase.com/docs/guides/auth/passwords and https://supabase.com/docs/guides/database/postgres/row-level-security
