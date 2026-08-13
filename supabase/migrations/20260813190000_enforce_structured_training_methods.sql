begin;

-- O campo antigo aceitava qualquer observacao. Preservamos esse conteudo como
-- orientacao personalizada e padronizamos o metodo sem perder dados existentes.
update public.workout_exercises
set method_notes = nullif(
      concat_ws(' · ', nullif(trim(method), ''), nullif(trim(method_notes), '')),
      ''
    ),
    method = 'standard'
where method is null
   or trim(method) = ''
   or method not in (
      'standard', 'dropset', 'rest_pause', 'to_failure', 'myo_reps', 'cluster_set',
      'biset', 'triset', 'superset', 'giant_set', 'circuit', 'pre_exhaustion',
      'post_exhaustion', 'pyramid_ascending', 'pyramid_descending', 'wave_loading',
      'isometric', 'time_under_tension', 'paused_reps', 'eccentric', 'partial_reps',
      'amrap', 'emom'
   );

update public.individual_workout_exercises
set method_notes = nullif(
      concat_ws(' · ', nullif(trim(method), ''), nullif(trim(method_notes), '')),
      ''
    ),
    method = 'standard'
where method is null
   or trim(method) = ''
   or method not in (
      'standard', 'dropset', 'rest_pause', 'to_failure', 'myo_reps', 'cluster_set',
      'biset', 'triset', 'superset', 'giant_set', 'circuit', 'pre_exhaustion',
      'post_exhaustion', 'pyramid_ascending', 'pyramid_descending', 'wave_loading',
      'isometric', 'time_under_tension', 'paused_reps', 'eccentric', 'partial_reps',
      'amrap', 'emom'
   );

alter table public.workout_exercises
  alter column method set default 'standard';

alter table public.individual_workout_exercises
  alter column method set default 'standard';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'workout_exercises_method_check'
      and conrelid = 'public.workout_exercises'::regclass
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_method_check check (method in (
        'standard', 'dropset', 'rest_pause', 'to_failure', 'myo_reps', 'cluster_set',
        'biset', 'triset', 'superset', 'giant_set', 'circuit', 'pre_exhaustion',
        'post_exhaustion', 'pyramid_ascending', 'pyramid_descending', 'wave_loading',
        'isometric', 'time_under_tension', 'paused_reps', 'eccentric', 'partial_reps',
        'amrap', 'emom'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'workout_exercises_method_notes_length_check'
      and conrelid = 'public.workout_exercises'::regclass
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_method_notes_length_check
      check (method_notes is null or char_length(method_notes) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'individual_workout_exercises_method_check'
      and conrelid = 'public.individual_workout_exercises'::regclass
  ) then
    alter table public.individual_workout_exercises
      add constraint individual_workout_exercises_method_check check (method in (
        'standard', 'dropset', 'rest_pause', 'to_failure', 'myo_reps', 'cluster_set',
        'biset', 'triset', 'superset', 'giant_set', 'circuit', 'pre_exhaustion',
        'post_exhaustion', 'pyramid_ascending', 'pyramid_descending', 'wave_loading',
        'isometric', 'time_under_tension', 'paused_reps', 'eccentric', 'partial_reps',
        'amrap', 'emom'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'individual_workout_exercises_method_notes_length_check'
      and conrelid = 'public.individual_workout_exercises'::regclass
  ) then
    alter table public.individual_workout_exercises
      add constraint individual_workout_exercises_method_notes_length_check
      check (method_notes is null or char_length(method_notes) <= 500);
  end if;
end $$;

commit;
