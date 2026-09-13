# Запуск платформы Kungfuman

Проект Supabase: `kungfuman-platform` (ref `pucbaytvtjckybksnmte`, регион Tokyo / ap-northeast-1).

## Шаг 1. Забрать ключи из дашборда

1. Слева **Settings → API Keys**.
2. Скопируй:
   - **Publishable key** (`sb_publishable_…`) — это публичный ключ для браузера.
   - **Secret key** (`sb_secret_…`) — жми **Reveal**/«Create secret key». Это серверный ключ.
   - (Project URL и Project ID уже на странице **General**.)

> Если вместо новых ключей видишь старый раздел **JWT Keys / Project API keys** — там подойдут `anon` (публичный) и `service_role` (секретный), оба вида `eyJ…`.

## Шаг 2. `.env.local`

В корне проекта скопируй `.env.example` в `.env.local` и заполни:

```
NEXT_PUBLIC_SUPABASE_URL=https://pucbaytvtjckybksnmte.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...     # publishable key
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...              # secret key (НЕ в браузер, НЕ в git)
```

`.env.local` уже в `.gitignore` — не коммить.

## Шаг 3. Создать схему БД (один раз)

Слева **SQL Editor → New query**, вставь **весь** файл [`supabase/all.sql`](../supabase/all.sql)
(это миграции `00001–00005` + сид одним куском) и нажми **Run**.

Готово: 26 таблиц, RLS-политики, триггеры, школа Худжанд + Москва, 4 дисциплины по 7 уровней.

> Альтернатива через CLI: `supabase link --project-ref pucbaytvtjckybksnmte` → `supabase db push`, затем `supabase db execute --file supabase/seed/seed.sql`.

## Шаг 4. Настроить вход

**Authentication → Providers**:

- **Email** — включён по умолчанию, вход по коду на почту работает сразу.
- **Phone** — включи и подключи SMS-провайдера (Twilio и т.п.), иначе SMS слать некому. На старте можно тестировать через email.

## Шаг 5. Запуск

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

1. Открой `/login`, войди по email.
2. Сделай себя владельцем — в **SQL Editor**:
   ```sql
   update profiles set role = 'owner' where email = 'akmaltong@ya.ru';
   ```
3. Перелогинься — откроется админка (`/overview`, `/curriculum`, `/blog-admin`, …).

## Шаг 6. Обязательная проверка RLS

Заведи второго тестового ученика (другой email), войди им и попробуй открыть чужой
профиль/платёж/непревью-урок — должно быть пусто. Это единственный тест, который
нельзя пропускать.

## Шаг 7. Деплой на Vercel

1. **Import** репозитория `kungfuman-platform` на vercel.com.
2. **Environment Variables** — те же три ключа из шага 2.
3. Deploy, домен — в Settings → Domains.

## Что подключается позже (ключи в `.env.local` / Vercel)

- `KINESCOPE_API_TOKEN` — видео и реальная подпись ссылок (`app/api/media/sign`).
- `WEBHOOK_SECRET`, `YOOKASSA_*`, `PADDLE_API_KEY` — онлайн-оплата (`app/api/webhooks/[provider]`).

## Наполнение

- `/curriculum` — практики и критерии по уровням Цигун.
- `/course-admin` — курсы, модули, уроки, видео.
- `/blog-admin` — статьи; `/free` соберёт превью-уроки сам.
