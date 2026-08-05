begin;

-- Estes módulos são acessados somente pelas rotas seguras do servidor.
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.appointments enable row level security;

revoke all on table public.messages from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;

grant all on table public.messages to service_role;
grant all on table public.notifications to service_role;
grant all on table public.appointments to service_role;

create index if not exists messages_sender_created_idx
    on public.messages (sender_id, sender_type, created_at desc);
create index if not exists messages_recipient_created_idx
    on public.messages (recipient_id, recipient_type, created_at desc);
create index if not exists notifications_user_created_idx
    on public.notifications (user_id, user_type, created_at desc);
create unique index if not exists notifications_deduplication_idx
    on public.notifications (user_id, user_type, ((metadata->>'key')))
    where metadata ? 'key';
create index if not exists appointments_trainer_start_idx
    on public.appointments (trainer_id, start_time);
create index if not exists appointments_student_start_idx
    on public.appointments (student_id, start_time);
create index if not exists workout_sessions_student_completed_idx
    on public.workout_sessions (student_id, completed_at desc)
    where status = 'completed';
create index if not exists assessments_student_date_idx
    on public.physical_assessments (student_id, assessment_date desc);

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'messages_sender_type_check') then
        alter table public.messages
            add constraint messages_sender_type_check
            check (sender_type in ('trainer', 'student')) not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'messages_recipient_type_check') then
        alter table public.messages
            add constraint messages_recipient_type_check
            check (recipient_type in ('trainer', 'student')) not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'appointments_status_check') then
        alter table public.appointments
            add constraint appointments_status_check
            check (status in ('scheduled', 'completed', 'cancelled')) not valid;
    end if;
end
$$;

alter table public.messages validate constraint messages_sender_type_check;
alter table public.messages validate constraint messages_recipient_type_check;
alter table public.appointments validate constraint appointments_status_check;

commit;
