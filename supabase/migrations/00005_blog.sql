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
