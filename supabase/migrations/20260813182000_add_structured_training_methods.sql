begin;

alter table public.workout_exercises
  add column if not exists method_notes text;

alter table public.individual_workout_exercises
  add column if not exists method_notes text;

comment on column public.workout_exercises.method_notes is
  'Orientacao personalizada do profissional para o metodo selecionado.';

comment on column public.individual_workout_exercises.method_notes is
  'Orientacao personalizada para o metodo selecionado.';

commit;
