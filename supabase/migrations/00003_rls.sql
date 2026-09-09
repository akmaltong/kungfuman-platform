-- =============================================================================
-- АКАДЕМИЯ KUNGFUMAN — RLS-ПОЛИТИКИ
-- Принцип: ученик видит только своё, персонал видит всю свою школу,
-- чужие школы не видит никто.
-- =============================================================================

alter table schools           enable row level security;
alter table profiles          enable row level security;
alter table student_health    enable row level security;
alter table disciplines       enable row level security;
alter table levels            enable row level security;
alter table practices         enable row level security;
alter table practice_criteria enable row level security;
alter table enrollments       enable row level security;
alter table attestations      enable row level security;
alter table practice_progress enable row level security;
alter table venues            enable row level security;
alter table groups            enable row level security;
alter table sessions          enable row level security;
alter table session_practices enable row level security;
alter table attendance        enable row level security;
alter table media_assets      enable row level security;
alter table courses           enable row level security;
alter table course_modules    enable row level security;
alter table lessons           enable row level security;
alter table lesson_progress   enable row level security;
alter table products          enable row level security;
alter table product_prices    enable row level security;
alter table subscriptions     enable row level security;
alter table payments          enable row level security;
alter table leads             enable row level security;
alter table audit_log         enable row level security;

-- Школы: своя школа читается всеми её участниками
create policy schools_read on schools for select
  using (id = auth_school_id());
create policy schools_write on schools for all
  using (id = auth_school_id() and auth_role() = 'owner')
  with check (id = auth_school_id() and auth_role() = 'owner');

-- Профили
create policy profiles_self on profiles for select
  using (id = auth.uid());
create policy profiles_staff_read on profiles for select
  using (school_id = auth_school_id() and is_staff());
create policy profiles_self_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy profiles_admin_all on profiles for all
  using (school_id = auth_school_id() and is_admin())
  with check (school_id = auth_school_id() and is_admin());

-- Медданные: только сам ученик и персонал школы
create policy health_self on student_health for select
  using (profile_id = auth.uid());
create policy health_staff on student_health for all
  using (exists (select 1 from profiles p
                 where p.id = student_health.profile_id
                   and p.school_id = auth_school_id()) and is_staff())
  with check (exists (select 1 from profiles p
                      where p.id = student_health.profile_id
                        and p.school_id = auth_school_id()) and is_staff());

-- Методика: читают все участники школы, правит только админ
create policy disciplines_read on disciplines for select
  using (school_id is null or school_id = auth_school_id());
create policy disciplines_write on disciplines for all
  using (school_id = auth_school_id() and is_admin())
  with check (school_id = auth_school_id() and is_admin());

create policy levels_read on levels for select
  using (exists (select 1 from disciplines d where d.id = levels.discipline_id
                 and (d.school_id is null or d.school_id = auth_school_id())));
create policy levels_write on levels for all
  using (is_admin()) with check (is_admin());

create policy practices_read on practices for select
  using (status = 'published' or is_staff());
create policy practices_write on practices for all
  using (is_admin()) with check (is_admin());

create policy criteria_read on practice_criteria for select using (true);
create policy criteria_write on practice_criteria for all
  using (is_admin()) with check (is_admin());

-- Обучение
create policy enrollments_self on enrollments for select
  using (profile_id = auth.uid());
create policy enrollments_staff on enrollments for all
  using (exists (select 1 from profiles p where p.id = enrollments.profile_id
                 and p.school_id = auth_school_id()) and is_staff())
  with check (exists (select 1 from profiles p where p.id = enrollments.profile_id
                      and p.school_id = auth_school_id()) and is_staff());

create policy attestations_self on attestations for select
  using (exists (select 1 from enrollments e where e.id = attestations.enrollment_id
                 and e.profile_id = auth.uid()));
create policy attestations_staff on attestations for all
  using (is_staff()) with check (is_staff());

create policy progress_self on practice_progress for select
  using (exists (select 1 from enrollments e where e.id = practice_progress.enrollment_id
                 and e.profile_id = auth.uid()));
create policy progress_staff on practice_progress for all
  using (is_staff()) with check (is_staff());

-- Расписание: читают все в школе
create policy venues_read on venues for select using (school_id = auth_school_id());
create policy venues_write on venues for all
  using (school_id = auth_school_id() and is_admin())
  with check (school_id = auth_school_id() and is_admin());

create policy groups_read on groups for select using (school_id = auth_school_id());
create policy groups_write on groups for all
  using (school_id = auth_school_id() and is_admin())
  with check (school_id = auth_school_id() and is_admin());

create policy sessions_read on sessions for select using (school_id = auth_school_id());
create policy sessions_write on sessions for all
  using (school_id = auth_school_id() and is_staff())
  with check (school_id = auth_school_id() and is_staff());

create policy session_practices_read on session_practices for select using (true);
create policy session_practices_write on session_practices for all
  using (is_staff()) with check (is_staff());

-- Посещаемость: ученик видит свою, персонал правит всю
create policy attendance_self on attendance for select
  using (profile_id = auth.uid());
create policy attendance_staff on attendance for all
  using (is_staff()) with check (is_staff());

-- Онлайн-контент
create policy courses_read on courses for select
  using (status = 'published' or is_staff());
create policy courses_write on courses for all
  using (school_id = auth_school_id() and is_admin())
  with check (school_id = auth_school_id() and is_admin());

create policy modules_read on course_modules for select
  using (exists (select 1 from courses c where c.id = course_modules.course_id
                 and (c.status = 'published' or is_staff())));
create policy modules_write on course_modules for all
  using (is_admin()) with check (is_admin());

create policy lessons_read on lessons for select
  using (
    is_preview
    or is_staff()
    or has_course_access((select c.id from course_modules m
                          join courses c on c.id = m.course_id
                          where m.id = lessons.module_id))
  );
create policy lessons_write on lessons for all
  using (is_admin()) with check (is_admin());

create policy media_read on media_assets for select
  using (is_public or is_staff());
create policy media_write on media_assets for all
  using (is_admin()) with check (is_admin());

create policy lesson_progress_self on lesson_progress for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy lesson_progress_staff on lesson_progress for select
  using (is_staff());

-- Деньги
create policy products_read on products for select
  using (is_active and school_id = auth_school_id());
create policy products_write on products for all
  using (school_id = auth_school_id() and is_admin())
  with check (school_id = auth_school_id() and is_admin());

create policy prices_read on product_prices for select using (is_active);
create policy prices_write on product_prices for all
  using (is_admin()) with check (is_admin());

create policy subs_self on subscriptions for select
  using (profile_id = auth.uid());
create policy subs_staff on subscriptions for all
  using (is_staff()) with check (is_staff());

create policy payments_self on payments for select
  using (profile_id = auth.uid());
create policy payments_admin on payments for all
  using (school_id = auth_school_id() and is_admin())
  with check (school_id = auth_school_id() and is_admin());

-- Лиды и аудит: только персонал
create policy leads_staff on leads for all
  using (school_id = auth_school_id() and is_staff())
  with check (school_id = auth_school_id() and is_staff());

create policy audit_read on audit_log for select
  using (school_id = auth_school_id() and is_admin());
