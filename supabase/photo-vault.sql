-- Private Vault (end-to-end encrypted progress photos). Run once in the Supabase SQL Editor.
-- The server only ever stores wrapped keys and opaque ciphertext; it never sees the passcode,
-- the recovery code, or the data key.
begin;

create table if not exists public.photo_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version int not null default 1,
  kdf_salt text not null,
  kdf_iterations int not null check (kdf_iterations >= 100000),
  wrapped_key text not null,
  recovery_salt text not null,
  recovery_wrapped_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.photo_vaults enable row level security;
revoke all on public.photo_vaults from anon, authenticated;
grant select, insert, update, delete on public.photo_vaults to authenticated;
drop policy if exists photo_vaults_own_select on public.photo_vaults;
create policy photo_vaults_own_select on public.photo_vaults for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists photo_vaults_own_insert on public.photo_vaults;
create policy photo_vaults_own_insert on public.photo_vaults for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists photo_vaults_own_update on public.photo_vaults;
create policy photo_vaults_own_update on public.photo_vaults for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists photo_vaults_own_delete on public.photo_vaults;
create policy photo_vaults_own_delete on public.photo_vaults for delete to authenticated using ((select auth.uid()) = user_id);

-- Photos: flag encrypted rows. Encrypted notes are 'enc1:' + base64, so they need more room than 500 characters.
alter table public.transformation_photos add column if not exists encrypted boolean not null default false;
alter table public.transformation_photos drop constraint if exists transformation_photos_note_check;
alter table public.transformation_photos add constraint transformation_photos_note_check
  check (char_length(note) <= case when encrypted then 3000 else 500 end);

commit;
