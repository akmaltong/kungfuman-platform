# Академия Kungfuman — платформа

Мультитенантная платформа школы кунг-фу / цигун: офлайн-операционка (группы,
расписание, посещаемость, аттестации) и онлайн-курсы поверх единого ядра методики.

> Полное техническое задание и план: [`docs/SPEC.md`](docs/SPEC.md).
> Правила для разработки: [`CLAUDE.md`](CLAUDE.md).
> Журнал решений: [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Ключевые принципы

1. **Методика — это данные, а не контент.** Программа хранится как структура:
   дисциплина → уровень → практика → критерий аттестации.
2. **Офлайн и онлайн — два интерфейса к одному ядру.** Единый прогресс ученика.
3. **Мультитенантность с первого дня.** Худжанд — первая запись в `schools`.
4. **Мультиязычность с первого дня.** Все тексты — JSONB `{"ru","tg","en"}`.
5. **Архитектура сразу общая, релизы по очереди.**

## Стек

- **Frontend:** Next.js 15 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (тёмная тема, чёрный + золото)
- **Backend:** Supabase (Postgres 15+, RLS, Auth по телефону/OTP, Storage)
- **Хостинг:** Vercel
- **Видео:** Kinescope (РФ/СНГ), Bunny.net Stream (мир)
- **Аналитика:** Plausible / Umami

## Структура

```
app/                # Next.js App Router (public / student / staff / api)
components/ui/      # shadcn
lib/
  supabase/         # server.ts, client.ts, middleware.ts
  domain/           # чистая бизнес-логика (curriculum, attendance, billing, progress)
  i18n/             # t(jsonb, locale)
  types/database.ts # сгенерировано supabase gen types
supabase/
  migrations/       # только вперёд
  seed/
docs/               # SPEC.md, DECISIONS.md
tests/
```

## Локальный запуск (после этапа 1)

```bash
pnpm install
cp .env.example .env.local   # заполнить ключами Supabase
supabase start               # локальный Postgres + миграции
supabase gen types typescript --local > lib/types/database.ts
pnpm dev
```

## План этапов

См. `docs/SPEC.md`, Часть II. Коротко:

| Этап | Что | Оценка |
|------|-----|--------|
| 0 | Операционный контур (юрлицо, эквайринг) | параллельно, начать сразу |
| 1 | Ядро (БД, auth, оболочка) | 2 нед |
| 2 | Методика (7 уровней в БД + редактор) | 1 нед |
| 3 | Офлайн-контур (группы, посещаемость) | 2 нед |
| 4 | Деньги (абонементы, платежи) | 1.5 нед |
| 5 | Кабинет ученика + PWA | 1.5 нед |
| 6 | Онлайн-курсы | 3 нед |
| 7 | Регионы и языки | 2 нед |
| 8 | Видеоразбор формы и прочее | после 200+ учеников |
