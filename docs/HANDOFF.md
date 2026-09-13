# Kungfuman — статус проекта и где мы остановились

_Обновлено: 2026-09-13_

Документ для передачи контекста (в т.ч. локальной сессии Claude Code, открытой в
`C:\kungfuman-platform`). Коротко: **весь код готов и в `main`; осталось поднять
Supabase и запустить.**

---

## 1. Что это

Мультитенантная платформа школы кунг-фу / цигун **Kungfuman** (Худжанд): офлайн-
операционка (группы, расписание, посещаемость, аттестации) + онлайн-курсы, блог и
бесплатные уроки поверх единого ядра методики. Стек: **Next.js 15 (App Router,
TypeScript) + Tailwind + Supabase (Postgres, RLS, Auth)**, деплой на Vercel.

Полное ТЗ — `docs/SPEC.md`. Правила разработки — `CLAUDE.md`. Отклонения — `docs/DECISIONS.md`.
Инструкция запуска — `docs/SETUP.md`.

## 2. Репозиторий

- GitHub: `akmaltong/kungfuman-platform`, ветка по умолчанию **`main`** — там всё.
- Рабочая ветка сессий: `claude/document-review-uu4e5d`.
- Слитые PR: **#1** (этапы 2–7), **#2** (блог + бесплатные уроки), **#3** (инструкция + `all.sql`).

## 3. Что уже сделано (всё в `main`)

| Блок | Готово |
|------|--------|
| Этап 0–1 | Фундамент, каркас Next.js, миграции ядра |
| Этап 2 | Методика: домен, публичная программа, редактор `(staff)/curriculum` |
| Этап 3 | Офлайн: площадки, группы+расписание, генерация занятий, экран посещаемости, карточка ученика |
| Этап 4 | Деньги: продукты/цены, абонементы, подтверждение платежей, дашборд, CSV |
| Этап 5 | Вход по OTP (email/телефон), кабинет ученика, заявки, PWA |
| Этап 6 | Онлайн-курсы: редактор, плеер+прогресс, витрина, сертификат |
| Этап 7 | Языки ru/tg/en, вторая школа (Москва), вебхуки оплаты |
| Доп. | Блог (`/blog`, `/blog-admin`) и бесплатные уроки (`/free`) |

**Карта маршрутов** (≈30):
- Публичные: `/`, `/program`, `/courses`, `/courses/[slug]`, `/free`, `/blog`, `/blog/[slug]`, `/trial`, `/login`
- Ученик: `/dashboard`, `/schedule`, `/progress`, `/learn/[courseSlug]/[lessonId]`, `/certificate/[courseId]`
- Персонал: `/overview`, `/students`, `/students/[id]`, `/groups`, `/sessions`, `/attendance/[sessionId]`, `/curriculum`, `/course-admin`, `/course-admin/[id]`, `/blog-admin`, `/blog-admin/[id]`, `/venues`, `/products`, `/payments`, `/leads`
- API: `/api/media/sign`, `/api/webhooks/[provider]`, `/api/payments/export`

**Качество:** `pnpm typecheck` чисто · `pnpm test` 26/26 · `pnpm build` зелёный.
Миграции `00001–00005` + сид прогнаны на локальном Postgres; **тест изоляции RLS
пройден** (ученик не видит чужие профили/платежи/медданные и чужую школу).

## 4. Где именно остановились ⏸️

Код закончен. Осталась **настройка облачного Supabase и первый запуск**.

Проект Supabase уже создан:
- Project URL: `https://pucbaytvtjckybksnmte.supabase.co`
- Project ID (ref): `pucbaytvtjckybksnmte`
- Регион: `ap-northeast-1` (Tokyo)
- Publishable key (публичный, для браузера): `sb_publishable_9u4l267esnAghrrS_9haIQ_VFQ4lTJT`

> Секретный ключ (`sb_secret_…`) и пароль БД в этот документ НЕ вносим — держим в
> `.env.local`, который в `.gitignore`.

### Оставшиеся шаги (по порядку)

1. **Взять секретный ключ**: дашборд → **Settings → API Keys** → раздел *Secret keys* → Reveal (`sb_secret_…`).
2. **Создать схему**: **SQL Editor → New query** → вставить весь `supabase/all.sql` → **Run**.
3. **`.env.local`** в корне проекта:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://pucbaytvtjckybksnmte.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9u4l267esnAghrrS_9haIQ_VFQ4lTJT
   SUPABASE_SERVICE_ROLE_KEY=<sb_secret_...>
   ```
4. **Запуск**: `pnpm install && pnpm dev` → `http://localhost:3000`.
5. **Стать владельцем**: войти по email на `/login`, затем в SQL Editor
   `update profiles set role='owner' where email='akmaltong@ya.ru';` и перелогиниться.
6. **Проверить RLS вручную** вторым тестовым учеником (обязательный тест из спеки).
7. **Деплой на Vercel**: импорт репозитория + те же 3 переменные окружения.

Подробности каждого шага — в `docs/SETUP.md`.

## 5. Отложено (нужны внешние аккаунты/ключи)

- **SMS-провайдер** (Twilio и т.п.) для телефон-OTP — иначе работает только email-вход.
- **Kinescope**: реальная подпись видео-ссылок в `app/api/media/sign/route.ts`
  (функция `playbackUrl`) при подключении аккаунта.
- **Онлайн-оплата** (ЮKassa/Paddle): подпись вебхуков в `app/api/webhooks/[provider]/route.ts`
  (`WEBHOOK_SECRET` → реальная подпись провайдера).
- **Наполнение контентом** через редакторы `/curriculum`, `/course-admin`, `/blog-admin`.
- **Этап 8** (видеоразбор формы, сообщество, сертификация инструкторов, RN, ретриты)
  — по спеке начинать после 200+ учеников.

## 6. Как продолжить работу над кодом

- **Локально (агент в `C:\kungfuman-platform`)**: открыть в приложении Claude Code
  **локальную** сессию с рабочей папкой `C:\kungfuman-platform` (не облачную) — тогда
  агент видит файлы на ПК и может править их напрямую.
- **В облаке (эта сессия)**: правки идут в репозиторий через ветку и PR; файлы на
  твоём ПК недоступны.

Полезные команды: `pnpm dev`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
