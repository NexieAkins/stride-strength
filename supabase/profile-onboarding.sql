-- Applied to the existing owner-protected public.profiles table.
alter table public.profiles
 add column if not exists height_cm numeric check(height_cm between 50 and 260),
 add column if not exists starting_weight_lb numeric check(starting_weight_lb between 30 and 700),
 add column if not exists fitness_goal text check(fitness_goal in ('consistency','strength','endurance','weight_loss','maintenance')),
 add column if not exists experience_level text check(experience_level in ('beginner','intermediate','advanced')),
 add column if not exists onboarding_completed_at timestamptz,
 add column if not exists age_years integer check(age_years between 18 and 100),
 add column if not exists calorie_equation text check(calorie_equation in ('female','male')),
 add column if not exists activity_level text check(activity_level in ('sedentary','light','moderate','high')),
 add column if not exists nutrition_mode text check(nutrition_mode in ('auto','manual')),
 add column if not exists nutrition_context text check(nutrition_context in ('standard','pregnant','breastfeeding','manual'));
grant select,insert,update on public.profiles to authenticated;
-- Existing SELECT/INSERT/UPDATE policies enforce auth.uid() = user_id,
-- including WITH CHECK on UPDATE. No policy or anonymous grant is broadened.
