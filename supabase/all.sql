-- =============================================================================
-- АКАДЕМИЯ KUNGFUMAN — ВСЁ В ОДНОМ ФАЙЛЕ (миграции 00001–00005 + сид)
-- Вставь целиком в Supabase SQL Editor и нажми Run. Идемпотентно по сиду.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- source: supabase/migrations/00001_core.sql
-- ─────────────────────────────────────────────────────────────────────────
-- =============================================================================
-- АКАДЕМИЯ KUNGFUMAN — ЯДРО
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ПЕРЕЧИСЛЕНИЯ
-- -----------------------------------------------------------------------------
create type app_role          as enum ('student','instructor','admin','owner');
create type session_kind      as enum ('offline','online_live','self_paced');
create type attendance_status as enum ('registered','present','absent','late','cancelled');
create type enrollment_status as enum ('active','paused','completed','dropped');
create type sub_status        as enum ('pending','active','paused','expired','cancelled');
create type payment_status    as enum ('pending','succeeded','failed','refunded');
create type payment_provider  as enum ('cash','alif','dc_wallet','korti_milli','yookassa','paddle','manual');
create type media_provider    as enum ('kinescope','vk_video','bunny','youtube','supabase');
create type product_kind      as enum ('subscription','course','workshop','retreat','single_visit');
create type content_status    as enum ('draft','review','published','archived');
create type progress_status   as enum ('not_started','in_progress','completed');
create type lead_status       as enum ('new','contacted','trial_booked','trial_attended','converted','lost');

-- -----------------------------------------------------------------------------
-- ШКОЛЫ (ТЕНАНТЫ)
-- -----------------------------------------------------------------------------
create table schools (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,              -- 'khujand', 'moscow'
  name           jsonb not null,                    -- {"ru":"Худжанд","tg":"Хуҷанд"}
  country_code   char(2) not null,                  -- 'TJ','RU','AE'
  currency       char(3) not null,                  -- 'TJS','RUB','USD'
  default_locale text not null default 'ru',
  locales        text[] not null default '{ru}',
  timezone       text not null default 'Asia/Dushanbe',
  is_active      boolean not null default true,
  settings       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ПРОФИЛИ
-- -----------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  school_id    uuid not null references schools(id) on delete restrict,
  role         app_role not null default 'student',
  full_name    text,
  phone        text,
  email        text,
  locale       text not null default 'ru',
  birth_date   date,
  avatar_url   text,
  telegram_id  text,
  notes        text,                               -- заметки администратора
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on profiles (school_id, role);
create index on profiles (phone);

-- Медицинские данные вынесены отдельно: доступ строже, чем к профилю
create table student_health (
  profile_id      uuid primary key references profiles(id) on delete cascade,
  conditions      text,          -- травмы, хронические состояния
  restrictions    text,          -- противопоказания к практикам
  emergency_phone text,
  updated_by      uuid references profiles(id),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- МЕТОДИКА: ДИСЦИПЛИНА → УРОВЕНЬ → ПРАКТИКА → КРИТЕРИЙ
-- -----------------------------------------------------------------------------
create table disciplines (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid references schools(id) on delete cascade, -- null = общая для всех школ
  code        text not null,                -- 'qigong','taijiquan','wingchun','neigong'
  title       jsonb not null,
  description jsonb not null default '{}',
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  unique (school_id, code)
);

create table levels (
  id            uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references disciplines(id) on delete cascade,
  number        int not null check (number between 1 and 7),
  title         jsonb not null,
  description   jsonb not null default '{}',
  goals         jsonb not null default '{}',   -- что осваивается на уровне
  min_months    int,                           -- ориентировочный срок
  unique (discipline_id, number)
);

create table practices (
  id           uuid primary key default gen_random_uuid(),
  level_id     uuid not null references levels(id) on delete cascade,
  code         text not null,
  title        jsonb not null,
  description  jsonb not null default '{}',
  theory       jsonb not null default '{}',       -- теоретическая часть
  duration_min int,
  tags         text[] not null default '{}',
  sort_order   int not null default 0,
  status       content_status not null default 'draft',
  created_at   timestamptz not null default now(),
  unique (level_id, code)
);
create index on practices (level_id, sort_order);

create table practice_criteria (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  title       jsonb not null,                    -- "Корень в стопах устойчив на 3 мин"
  weight      int not null default 1,
  sort_order  int not null default 0
);

-- -----------------------------------------------------------------------------
-- ОБУЧЕНИЕ УЧЕНИКА
-- -----------------------------------------------------------------------------
create table enrollments (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  discipline_id    uuid not null references disciplines(id) on delete restrict,
  current_level_id uuid references levels(id),
  status           enrollment_status not null default 'active',
  started_at       date not null default current_date,
  created_at       timestamptz not null default now(),
  unique (profile_id, discipline_id)
);

create table attestations (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  level_id        uuid not null references levels(id) on delete restrict,
  instructor_id   uuid not null references profiles(id) on delete restrict,
  passed_at       date not null default current_date,
  score           int check (score between 0 and 100),
  criteria_scores jsonb not null default '{}',   -- {criterion_id: score}
  notes           text,
  certificate_url text,
  created_at      timestamptz not null default now(),
  unique (enrollment_id, level_id)
);

create table practice_progress (
  id                uuid primary key default gen_random_uuid(),
  enrollment_id     uuid not null references enrollments(id) on delete cascade,
  practice_id       uuid not null references practices(id) on delete cascade,
  status            progress_status not null default 'not_started',
  reps_count        int not null default 0,          -- сколько раз отработано
  last_practiced_at timestamptz,
  instructor_note   text,
  updated_at        timestamptz not null default now(),
  unique (enrollment_id, practice_id)
);

-- -----------------------------------------------------------------------------
-- ОФЛАЙН-КОНТУР
-- -----------------------------------------------------------------------------
create table venues (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools(id) on delete cascade,
  name       jsonb not null,               -- {"ru":"Набережная Сырдарьи"}
  address    text,
  lat        double precision,
  lng        double precision,
  is_outdoor boolean not null default false,
  is_active  boolean not null default true
);

create table groups (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  discipline_id uuid not null references disciplines(id) on delete restrict,
  instructor_id uuid references profiles(id) on delete set null,
  venue_id      uuid references venues(id) on delete set null,
  title         jsonb not null,
  level_min     int not null default 1,
  level_max     int not null default 7,
  schedule      jsonb not null default '[]',  -- [{"dow":1,"start":"05:00","dur":90}]
  capacity      int,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table sessions (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  group_id      uuid references groups(id) on delete set null,
  kind          session_kind not null default 'offline',
  venue_id      uuid references venues(id) on delete set null,
  instructor_id uuid references profiles(id) on delete set null,
  title         jsonb not null default '{}',
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  capacity      int,
  stream_url    text,                        -- для online_live
  is_cancelled  boolean not null default false,
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on sessions (school_id, starts_at desc);
create index on sessions (group_id, starts_at desc);

-- Практики, запланированные на конкретное занятие
create table session_practices (
  session_id  uuid not null references sessions(id) on delete cascade,
  practice_id uuid not null references practices(id) on delete cascade,
  sort_order  int not null default 0,
  primary key (session_id, practice_id)
);

create table attendance (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  profile_id    uuid not null references profiles(id) on delete cascade,
  status        attendance_status not null default 'registered',
  checked_in_at timestamptz,
  marked_by     uuid references profiles(id),
  note          text,
  unique (session_id, profile_id)
);
create index on attendance (profile_id, session_id);

-- -----------------------------------------------------------------------------
-- ОНЛАЙН-КОНТУР
-- -----------------------------------------------------------------------------
create table media_assets (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid references schools(id) on delete cascade,
  provider     media_provider not null,
  external_id  text not null,               -- id видео у провайдера
  title        text,
  duration_sec int,
  poster_url   text,
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (provider, external_id)
);

create table courses (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  discipline_id uuid references disciplines(id) on delete set null,
  level_id      uuid references levels(id) on delete set null,
  slug          text not null,
  title         jsonb not null,
  description   jsonb not null default '{}',
  cover_url     text,
  status        content_status not null default 'draft',
  locales       text[] not null default '{ru}',
  created_at    timestamptz not null default now(),
  unique (school_id, slug)
);

create table course_modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  title      jsonb not null,
  sort_order int not null default 0
);

create table lessons (
  id             uuid primary key default gen_random_uuid(),
  module_id      uuid not null references course_modules(id) on delete cascade,
  practice_id    uuid references practices(id) on delete set null,  -- связь с методикой
  media_asset_id uuid references media_assets(id) on delete set null,
  title          jsonb not null,
  body           jsonb not null default '{}',
  duration_min   int,
  is_preview     boolean not null default false,   -- доступен без оплаты
  sort_order     int not null default 0
);
create index on lessons (module_id, sort_order);

create table lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  status       progress_status not null default 'not_started',
  watched_sec  int not null default 0,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (profile_id, lesson_id)
);

-- -----------------------------------------------------------------------------
-- ДЕНЬГИ
-- -----------------------------------------------------------------------------
create table products (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  kind              product_kind not null,
  course_id         uuid references courses(id) on delete set null,
  discipline_id     uuid references disciplines(id) on delete set null,
  slug              text not null,
  title             jsonb not null,
  description       jsonb not null default '{}',
  sessions_included int,                    -- для абонементов; null = безлимит
  duration_days     int,                    -- срок действия
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (school_id, slug)
);

-- Цены отдельно: один продукт — разные валюты и регионы
create table product_prices (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  currency     char(3) not null,
  amount_minor bigint not null check (amount_minor >= 0),  -- в копейках/дирамах
  region       text,                               -- 'TJ','RU','WORLD'
  is_active    boolean not null default true,
  unique (product_id, currency, region)
);

create table subscriptions (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  product_id     uuid not null references products(id) on delete restrict,
  status         sub_status not null default 'pending',
  starts_at      date,
  ends_at        date,
  sessions_total int,
  sessions_used  int not null default 0,
  created_at     timestamptz not null default now()
);
create index on subscriptions (profile_id, status);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete restrict,
  profile_id      uuid not null references profiles(id) on delete restrict,
  subscription_id uuid references subscriptions(id) on delete set null,
  provider        payment_provider not null,
  external_id     text,
  amount_minor    bigint not null,
  currency        char(3) not null,
  status          payment_status not null default 'pending',
  paid_at         timestamptz,
  confirmed_by    uuid references profiles(id),   -- для ручного подтверждения
  receipt_url     text,
  meta            jsonb not null default '{}',
  created_at      timestamptz not null default now()
);
create index on payments (school_id, created_at desc);
create index on payments (profile_id, status);

-- -----------------------------------------------------------------------------
-- ВОРОНКА
-- -----------------------------------------------------------------------------
create table leads (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools(id) on delete cascade,
  full_name  text,
  phone      text,
  source     text,                       -- 'instagram','whatsapp','referral'
  utm        jsonb not null default '{}',
  status     lead_status not null default 'new',
  note       text,
  profile_id uuid references profiles(id) on delete set null,  -- после конверсии
  created_at timestamptz not null default now()
);
create index on leads (school_id, status, created_at desc);

-- -----------------------------------------------------------------------------
-- АУДИТ
-- -----------------------------------------------------------------------------
create table audit_log (
  id         bigserial primary key,
  school_id  uuid,
  actor_id   uuid,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  diff       jsonb,
  created_at timestamptz not null default now()
);
create index on audit_log (school_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- source: supabase/migrations/00002_functions.sql
-- ─────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────
-- source: supabase/migrations/00003_rls.sql
-- ─────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────
-- source: supabase/migrations/00004_auth.sql
-- ─────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────
-- source: supabase/migrations/00005_blog.sql
-- ─────────────────────────────────────────────────────────────────────────
-- =============================================================================
-- АКАДЕМИЯ KUNGFUMAN — БЛОГ
-- =============================================================================
-- Статьи школы: контент-маркетинг и SEO. Тексты — JSONB (ru/tg/en).
-- Публично видны только опубликованные; правит персонал своей школы.

create table posts (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  author_id    uuid references profiles(id) on delete set null,
  slug         text not null,
  title        jsonb not null,
  excerpt      jsonb not null default '{}',      -- анонс для списка
  body         jsonb not null default '{}',      -- тело статьи (markdown-текст)
  cover_url    text,
  status       content_status not null default 'draft',
  locales      text[] not null default '{ru}',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (school_id, slug)
);
create index on posts (school_id, status, published_at desc);

create trigger trg_posts_updated before update on posts
  for each row execute function set_updated_at();

alter table posts enable row level security;

-- Читают все опубликованные статьи; черновики — только персонал школы.
create policy posts_read on posts for select
  using (status = 'published' or is_staff());

create policy posts_write on posts for all
  using (school_id = auth_school_id() and is_staff())
  with check (school_id = auth_school_id() and is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- source: supabase/seed/seed.sql
-- ─────────────────────────────────────────────────────────────────────────
-- =============================================================================
-- АКАДЕМИЯ KUNGFUMAN — СИД ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ
-- Школа Худжанд + 4 дисциплины + 7 уровней в каждой.
--
-- Профиль owner НЕ создаётся здесь: он ссылается на auth.users и заводится
-- после первой регистрации по телефону (этап 1, задача 5/7). После входа
-- выполнить вручную, подставив свой auth uid:
--   update profiles set role = 'owner' where id = '<твой-auth-uid>';
-- =============================================================================

-- Школа Худжанд
insert into schools (id, slug, name, country_code, currency, default_locale, locales, timezone)
values (
  '00000000-0000-0000-0000-000000000001',
  'khujand',
  '{"ru":"Худжанд","tg":"Хуҷанд","en":"Khujand"}',
  'TJ', 'TJS', 'ru', '{ru,tg}', 'Asia/Dushanbe'
)
on conflict (slug) do nothing;

-- Дисциплины (общие для школы Худжанд)
insert into disciplines (school_id, code, title, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'qigong',
   '{"ru":"Цигун","tg":"Сигун","en":"Qigong"}', 1),
  ('00000000-0000-0000-0000-000000000001', 'taijiquan',
   '{"ru":"Тайцзицюань","tg":"Тайсзисюан","en":"Taijiquan"}', 2),
  ('00000000-0000-0000-0000-000000000001', 'wingchun',
   '{"ru":"Вин Чун","tg":"Вин Чун","en":"Wing Chun"}', 3),
  ('00000000-0000-0000-0000-000000000001', 'neigong',
   '{"ru":"Нэйгун","tg":"Нейгун","en":"Neigong"}', 4)
on conflict (school_id, code) do nothing;

-- Вторая школа (Москва) — для проверки изоляции данных между тенантами (этап 7).
-- Своя валюта, локали и часовой пояс. Наполнение — по мере надобности.
insert into schools (id, slug, name, country_code, currency, default_locale, locales, timezone)
values (
  '00000000-0000-0000-0000-000000000002',
  'moscow',
  '{"ru":"Москва","en":"Moscow"}',
  'RU', 'RUB', 'ru', '{ru,en}', 'Europe/Moscow'
)
on conflict (slug) do nothing;

-- 7 уровней в каждой дисциплине
insert into levels (discipline_id, number, title)
select d.id,
       n,
       jsonb_build_object(
         'ru', 'Уровень ' || n,
         'tg', 'Сатҳи ' || n,
         'en', 'Level ' || n
       )
from disciplines d
cross join generate_series(1, 7) as n
where d.school_id = '00000000-0000-0000-0000-000000000001'
on conflict (discipline_id, number) do nothing;

