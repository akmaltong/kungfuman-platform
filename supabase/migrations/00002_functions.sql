-- =============================================================================
-- АКАДЕМИЯ KUNGFUMAN — ТРИГГЕРЫ И СЛУЖЕБНЫЕ ФУНКЦИИ
-- =============================================================================

-- Автообновление updated_at
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create trigger trg_practice_progress_updated before update on practice_progress
  for each row execute function set_updated_at();

create trigger trg_lesson_progress_updated before update on lesson_progress
  for each row execute function set_updated_at();

-- Хелперы для RLS.
-- ВНИМАНИЕ: security definer + фиксированный search_path обязательны.
create or replace function auth_school_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select school_id from profiles where id = auth.uid()
$$;

create or replace function auth_role() returns app_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('instructor','admin','owner') from profiles where id = auth.uid()),
    false)
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('admin','owner') from profiles where id = auth.uid()),
    false)
$$;

-- Есть ли у пользователя доступ к курсу (куплен или превью)
create or replace function has_course_access(p_course_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from subscriptions s
    join products p on p.id = s.product_id
    where s.profile_id = auth.uid()
      and p.course_id = p_course_id
      and s.status = 'active'
      and (s.ends_at is null or s.ends_at >= current_date)
  ) or is_staff()
$$;

-- Списание занятия с абонемента при отметке присутствия
create or replace function consume_session_credit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'present' and (old.status is null or old.status <> 'present') then
    update subscriptions
      set sessions_used = sessions_used + 1
    where profile_id = new.profile_id
      and status = 'active'
      and sessions_total is not null
      and sessions_used < sessions_total
      and (ends_at is null or ends_at >= current_date)
      and id = (
        select id from subscriptions
        where profile_id = new.profile_id and status = 'active'
        order by ends_at nulls last limit 1
      );
  end if;
  return new;
end $$;

create trigger trg_attendance_credit
  after insert or update of status on attendance
  for each row execute function consume_session_credit();
