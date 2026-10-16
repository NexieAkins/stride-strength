-- Run once in this app's Supabase SQL Editor before publishing the Delete account button.
-- Lets a signed-in user delete only their own account and data. No service key is stored in the app.
-- The app removes the user's private photo files from storage first, then calls this function.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  delete from public.transformation_photos where user_id = uid;
  delete from public.workouts where user_id = uid;
  delete from public.meals where user_id = uid;
  delete from public.weigh_ins where user_id = uid;
  delete from public.water_logs where user_id = uid;
  delete from public.goals where user_id = uid;
  delete from public.profiles where user_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
