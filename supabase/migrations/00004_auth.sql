-- =============================================================================
-- АКАДЕМИЯ KUNGFUMAN — АВТО-СОЗДАНИЕ ПРОФИЛЯ ПРИ РЕГИСТРАЦИИ
-- =============================================================================
-- Новый пользователь auth.users → строка в profiles. На старте все попадают в
-- школу Худжанд с ролью student. Для мультишкольности здесь позже появится
-- выбор школы (по домену/приглашению) — см. DECISIONS.

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  default_school uuid;
begin
  select id into default_school from schools where slug = 'khujand' limit 1;

  insert into profiles (id, school_id, role, phone, email, full_name)
  values (
    new.id,
    default_school,
    'student',
    new.phone,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
