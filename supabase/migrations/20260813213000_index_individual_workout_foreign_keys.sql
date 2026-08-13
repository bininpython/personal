begin;

create index if not exists individual_workout_sessions_workout_day_idx
  on public.individual_workout_sessions (workout_day_id);

create index if not exists individual_exercise_sessions_workout_exercise_idx
  on public.individual_exercise_sessions (workout_exercise_id);

commit;
