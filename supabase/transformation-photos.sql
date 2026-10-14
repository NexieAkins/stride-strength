-- Run once in this app's Supabase SQL Editor before enabling photo uploads.
-- Photos remain private; authenticated users can access only their own folder.
begin;

create table if not exists public.transformation_photos (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  captured_on date not null,
  angle text not null check (angle in ('Front','Side','Back','Other')),
  note text not null default '' check (char_length(note) <= 500),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  check (storage_path = user_id::text || '/' || id::text || '.jpg')
);
create index if not exists transformation_photos_user_date_idx
  on public.transformation_photos(user_id,captured_on);
alter table public.transformation_photos enable row level security;
revoke all on public.transformation_photos from anon, authenticated;
grant select,insert,delete on public.transformation_photos to authenticated;
drop policy if exists transformation_photos_own_select on public.transformation_photos;
create policy transformation_photos_own_select on public.transformation_photos
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists transformation_photos_own_insert on public.transformation_photos;
create policy transformation_photos_own_insert on public.transformation_photos
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists transformation_photos_own_delete on public.transformation_photos;
create policy transformation_photos_own_delete on public.transformation_photos
  for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('stride-transformation-private-v5','stride-transformation-private-v5',false,5242880,array['image/jpeg'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg'];

drop policy if exists stride_photos_own_select on storage.objects;
create policy stride_photos_own_select on storage.objects for select to authenticated
using (bucket_id='stride-transformation-private-v5' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists stride_photos_own_insert on storage.objects;
create policy stride_photos_own_insert on storage.objects for insert to authenticated
with check (bucket_id='stride-transformation-private-v5' and (storage.foldername(name))[1]=(select auth.uid())::text and storage.extension(name)='jpg');
drop policy if exists stride_photos_own_delete on storage.objects;
create policy stride_photos_own_delete on storage.objects for delete to authenticated
using (bucket_id='stride-transformation-private-v5' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
