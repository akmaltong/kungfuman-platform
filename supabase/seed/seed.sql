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
