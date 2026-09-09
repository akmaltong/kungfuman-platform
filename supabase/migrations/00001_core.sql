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
