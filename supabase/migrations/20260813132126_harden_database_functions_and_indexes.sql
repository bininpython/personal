begin;

-- These helpers are called only by triggers or by the server-side service role.
-- Keeping them off the public Data API prevents SECURITY DEFINER privilege escalation.
revoke execute on function public.clear_auth_rate_limit(text) from public, anon, authenticated;
revoke execute on function public.consume_auth_rate_limit(text, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.enforce_student_access_code_format() from public, anon, authenticated;
revoke execute on function public.enforce_trainer_student_limit() from public, anon, authenticated;

grant execute on function public.clear_auth_rate_limit(text) to service_role;
grant execute on function public.consume_auth_rate_limit(text, integer, integer, integer) to service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Cover every foreign key reported by the database advisor. Besides faster joins,
-- these indexes keep parent updates and deletes from scanning entire child tables.
create index if not exists appointments_student_id_idx on public.appointments (student_id);
create index if not exists appointments_trainer_id_idx on public.appointments (trainer_id);
create index if not exists exercise_sessions_exercise_id_idx on public.exercise_sessions (exercise_id);
create index if not exists exercise_sessions_workout_exercise_id_idx on public.exercise_sessions (workout_exercise_id);
create index if not exists exercise_sessions_workout_session_id_idx on public.exercise_sessions (workout_session_id);
create index if not exists physical_assessments_student_id_idx on public.physical_assessments (student_id);
create index if not exists set_records_exercise_session_id_idx on public.set_records (exercise_session_id);
create index if not exists student_achievements_achievement_id_idx on public.student_achievements (achievement_id);
create index if not exists student_achievements_student_id_idx on public.student_achievements (student_id);
create index if not exists students_trainer_privacy_attested_by_idx on public.students (trainer_privacy_attested_by);
create index if not exists workout_days_plan_id_idx on public.workout_days (plan_id);
create index if not exists workout_exercises_exercise_id_idx on public.workout_exercises (exercise_id);
create index if not exists workout_exercises_workout_day_id_idx on public.workout_exercises (workout_day_id);
create index if not exists workout_plans_student_id_idx on public.workout_plans (student_id);
create index if not exists workout_plans_trainer_id_idx on public.workout_plans (trainer_id);
create index if not exists workout_sessions_workout_day_id_idx on public.workout_sessions (workout_day_id);
create index if not exists workout_sessions_workout_plan_id_idx on public.workout_sessions (workout_plan_id);

-- Replace overlapping SELECT policies with one equivalent policy. Mutation rules
-- stay restricted to the trainer associated with the authenticated Supabase user.
drop policy if exists "Students can read their own profile" on public.students;
drop policy if exists "Trainers can manage their own students" on public.students;
drop policy if exists "Trainers can read their own students" on public.students;

create policy "Students and trainers can read authorized profiles"
on public.students for select to authenticated
using (
  id = (select auth.uid())
  or trainer_id = (
    select trainers.id from public.trainers
    where trainers.auth_user_id = (select auth.uid())
  )
);

create policy "Trainers can insert their own students"
on public.students for insert to authenticated
with check (
  trainer_id = (
    select trainers.id from public.trainers
    where trainers.auth_user_id = (select auth.uid())
  )
);

create policy "Trainers can update their own students"
on public.students for update to authenticated
using (
  trainer_id = (
    select trainers.id from public.trainers
    where trainers.auth_user_id = (select auth.uid())
  )
)
with check (
  trainer_id = (
    select trainers.id from public.trainers
    where trainers.auth_user_id = (select auth.uid())
  )
);

create policy "Trainers can delete their own students"
on public.students for delete to authenticated
using (
  trainer_id = (
    select trainers.id from public.trainers
    where trainers.auth_user_id = (select auth.uid())
  )
);

commit;
