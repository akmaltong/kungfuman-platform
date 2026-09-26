// =============================================================================
// НАПОЛНЕНИЕ КОНТЕНТОМ — школа Худжанд (KUNGFU MAN)
//
// Идемпотентный сид: реальные уровни методики + практики, офлайн-контур
// (залы, группы, расписание) и товары с ценами. Пишется service-role
// клиентом в тот же хостинг Supabase, что и приложение.
//
// Запуск:  node scripts/seed-content.mjs
// Требует переменные из .env.local: NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY.
//
// Тексты: ru заполнен полностью, en — заголовки; tg наследует ru через
// хелпер t() (фолбэк), чтобы не выдумывать таджикские переводы терминов.
// =============================================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

// --- Загрузка .env.local ------------------------------------------------------
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* переменные могут прийти из окружения */
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Нет NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const somoni = (s) => s * 100; // сомони → дирамы (minor units)

// --- Контент методики: дисциплина → 7 уровней → практики ---------------------
// Аутентичные, общеизвестные прогрессии каждого искусства (не выдуманная
// «личная методика», а канонический учебный путь этих школ).
const CURRICULUM = {
  qigong: [
    { n: 1, ru: "Постановка тела и естественного дыхания", en: "Body alignment & natural breathing",
      goal: "Выравнивание осанки, столб (чжан чжуан), спокойное брюшное дыхание.",
      practices: [
        ["zhan-zhuang", "Стояние столбом (Чжан Чжуан)", "Базовая статическая стойка: расслабленное выравнивание и укоренение."],
        ["belly-breath", "Естественное брюшное дыхание", "Мягкое дыхание животом без напряжения и форсирования."],
      ] },
    { n: 2, ru: "Суставная разминка и даоинь", en: "Joint warm-up & daoyin",
      goal: "Мягкая суставная гимнастика, растяжение и раскрытие тела.",
      practices: [
        ["daoyin-joints", "Суставной даоинь", "Последовательная проработка суставов сверху вниз."],
        ["meridian-stretch", "Растяжение линий тела", "Плавные вытяжения по линиям рук, спины и ног."],
      ] },
    { n: 3, ru: "Восемь отрезов парчи (Ба Дуань Цзинь)", en: "Eight Pieces of Brocade (Ba Duan Jin)",
      goal: "Классический оздоровительный комплекс из восьми движений.",
      practices: [
        ["baduanjin-full", "Комплекс Ба Дуань Цзинь", "Восемь движений в связке, координация с дыханием."],
      ] },
    { n: 4, ru: "Дыхание и внимание", en: "Breath & attention",
      goal: "Согласование движения, дыхания и сосредоточенного внимания.",
      practices: [
        ["breath-move-sync", "Синхронизация дыхания и движения", "Ведение движения дыханием, ровный ритм."],
        ["focus-training", "Тренировка внимания", "Удержание внимания на ощущениях тела в динамике."],
      ] },
    { n: 5, ru: "И Цзинь Цзин — смена сухожилий", en: "Yi Jin Jing — tendon changing",
      goal: "Мягкое укрепление связок и сухожилий, эластичная сила.",
      practices: [
        ["yijinjing", "Комплекс И Цзинь Цзин", "Классический комплекс на эластичность и тонус тканей."],
      ] },
    { n: 6, ru: "Тихое сидение и саморегуляция", en: "Quiet sitting & self-regulation",
      goal: "Сидячая практика, успокоение ума, восстановление.",
      practices: [
        ["quiet-sitting", "Тихое сидение", "Спокойное сидение с ровным дыханием и наблюдением."],
      ] },
    { n: 7, ru: "Методика и передача", en: "Methodology & transmission",
      goal: "Умение объяснять, вести практику и следить за безопасностью.",
      practices: [
        ["teaching-basics", "Основы преподавания цигун", "Разбор ошибок, темп группы, безопасность занятия."],
      ] },
  ],
  taijiquan: [
    { n: 1, ru: "Базовая структура и центр", en: "Structure & centre",
      goal: "Стойки, выравнивание, перенос веса, устойчивость.",
      practices: [
        ["stances", "Базовые стойки", "Постановка стоп, коленей и таза, центр тяжести."],
        ["weight-shift", "Перенос веса", "Плавный перенос веса между ногами без потери структуры."],
      ] },
    { n: 2, ru: "Шаг и «наматывание нити»", en: "Stepping & silk-reeling",
      goal: "Шаги, спиральное движение (чань сы гун), координация.",
      practices: [
        ["chansi", "Наматывание нити (Чань Сы Гун)", "Спиральные движения рук и корпуса."],
        ["taiji-step", "Шаг тайцзи", "Мягкий контролируемый шаг с сохранением равновесия."],
      ] },
    { n: 3, ru: "Короткая форма", en: "Short form",
      goal: "Первый комплекс: последовательность и запоминание движений.",
      practices: [
        ["short-form", "Короткая форма", "Связка базовых движений в единую последовательность."],
      ] },
    { n: 4, ru: "Полная форма и плавность", en: "Full form & continuity",
      goal: "Целостная форма, непрерывность и ровный ритм.",
      practices: [
        ["long-form", "Полная форма", "Развёрнутый комплекс без разрывов и остановок."],
      ] },
    { n: 5, ru: "Толкающие руки (Туйшоу)", en: "Push hands (Tui Shou)",
      goal: "Парная работа: чувствование, слушание и следование усилию.",
      practices: [
        ["tuishou-basic", "Одиночные толкающие руки", "Базовый контакт, слушание усилия партнёра."],
      ] },
    { n: 6, ru: "Внутренняя механика движения", en: "Internal mechanics",
      goal: "Расслабленная сила, передача усилия через тело.",
      practices: [
        ["fajin-intro", "Целостная передача усилия", "Согласованная работа тела как единой системы."],
      ] },
    { n: 7, ru: "Методика и наставничество", en: "Methodology & mentoring",
      goal: "Умение вести форму в группе и корректировать учеников.",
      practices: [
        ["teaching-taiji", "Основы преподавания тайцзи", "Разбор формы, темп группы, коррекция структуры."],
      ] },
  ],
  wingchun: [
    { n: 1, ru: "Сиу Ним Тау — первая форма", en: "Siu Nim Tao — first form",
      goal: "Центральная линия, структура рук, базовое расслабление.",
      practices: [
        ["siunimtao", "Форма Сиу Ним Тау", "Первая форма: центральная линия и базовые позиции рук."],
        ["centerline", "Центральная линия", "Понятие и удержание центральной линии."],
      ] },
    { n: 2, ru: "Базовые удары и защиты", en: "Basic strikes & deflections",
      goal: "Цепные удары, тан/бонг/фук сау, работа рук.",
      practices: [
        ["chain-punch", "Цепные удары", "Серия прямых ударов по центральной линии."],
        ["tan-bong-fook", "Тан / Бонг / Фук сау", "Базовые положения рук для защиты и контроля."],
      ] },
    { n: 3, ru: "Чам Киу — вторая форма", en: "Chum Kiu — second form",
      goal: "Шаги, повороты, соединение с дистанцией.",
      practices: [
        ["chumkiu", "Форма Чам Киу", "Вторая форма: перемещения и повороты корпуса."],
      ] },
    { n: 4, ru: "Липкие руки (Чи Сау)", en: "Sticking hands (Chi Sau)",
      goal: "Начальная парная чувствительность и контроль контакта.",
      practices: [
        ["chisau-basic", "Начальный Чи Сау", "Парная работа на чувствительность рук и линию."],
      ] },
    { n: 5, ru: "Бил Джи — третья форма", en: "Biu Jee — third form",
      goal: "Восстановление линии, работа локтями, аварийные ситуации.",
      practices: [
        ["biujee", "Форма Бил Джи", "Третья форма: восстановление позиции и работа локтями."],
      ] },
    { n: 6, ru: "Деревянный манекен (Мук Ян Джонг)", en: "Wooden dummy (Muk Yan Jong)",
      goal: "Отработка структуры и углов на манекене.",
      practices: [
        ["dummy-form", "Форма на манекене", "Связка движений на деревянном манекене."],
      ] },
    { n: 7, ru: "Методика и передача", en: "Methodology & transmission",
      goal: "Умение объяснять формы и безопасно вести парную работу.",
      practices: [
        ["teaching-wingchun", "Основы преподавания Вин Чун", "Разбор форм, безопасность парной работы."],
      ] },
  ],
  neigong: [
    { n: 1, ru: "Основа структуры и заземления", en: "Structure & grounding",
      goal: "Выравнивание, столб, укоренение и опора.",
      practices: [
        ["ng-alignment", "Выравнивание и столб", "Базовая структура тела и укоренение."],
      ] },
    { n: 2, ru: "Дыхание и расслабление", en: "Breathing & release",
      goal: "Управление напряжением, снятие зажимов, ровное дыхание.",
      practices: [
        ["ng-release", "Расслабление и снятие зажимов", "Последовательное освобождение напряжения по телу."],
      ] },
    { n: 3, ru: "Открытие суставов и связок", en: "Opening joints & ligaments",
      goal: "Суставная работа, эластичность и подвижность.",
      practices: [
        ["ng-joints", "Раскрытие суставов", "Мягкая работа на подвижность и эластичность связок."],
      ] },
    { n: 4, ru: "Внутренний тонус и наполнение", en: "Internal tone",
      goal: "Работа с тонусом тела и вниманием.",
      practices: [
        ["ng-tone", "Работа с тонусом", "Равномерное внимание и мягкий внутренний тонус."],
      ] },
    { n: 5, ru: "Координация дыхания и движения", en: "Breath–movement coordination",
      goal: "Целостные волны движения, согласованные с дыханием.",
      practices: [
        ["ng-wave", "Волновое движение", "Целостные движения тела, ведомые дыханием."],
      ] },
    { n: 6, ru: "Углублённая саморегуляция", en: "Advanced self-regulation",
      goal: "Тонкая работа с состоянием и восстановлением.",
      practices: [
        ["ng-selfreg", "Саморегуляция состояния", "Управление вниманием и восстановление после нагрузки."],
      ] },
    { n: 7, ru: "Методика и передача", en: "Methodology & transmission",
      goal: "Умение вести практику и следить за безопасностью.",
      practices: [
        ["teaching-neigong", "Основы преподавания нэйгун", "Темп, безопасность, коррекция структуры."],
      ] },
  ],
};

// --- Залы ---------------------------------------------------------------------
const VENUES = [
  { id: "00000000-0000-0000-0000-0000000000a1",
    name: { ru: "Набережная Сырдарьи", tg: "Соҳили Сирдарё", en: "Syr Darya embankment" },
    address: "Худжанд, набережная Сырдарьи", lat: 40.2861, lng: 69.6229, is_outdoor: true },
  { id: "00000000-0000-0000-0000-0000000000a2",
    name: { ru: "Парк имени Камоли Худжанди", tg: "Боғи Камоли Хуҷандӣ", en: "Kamoli Khujandi Park" },
    address: "Худжанд, парк имени Камоли Худжанди", lat: 40.2833, lng: 69.6333, is_outdoor: true },
];

// --- Группы (расписание — редактируется в кабинете «Группы») ------------------
const GROUPS = [
  { id: "00000000-0000-0000-0000-0000000000b1", code: "neigong",
    venue: "00000000-0000-0000-0000-0000000000a1",
    title: { ru: "Утренний Нэйгун · Сырдарья", en: "Morning Neigong · Syr Darya" },
    schedule: [ { dow: 1, start: "05:00", dur: 90 }, { dow: 3, start: "05:00", dur: 90 }, { dow: 5, start: "05:00", dur: 90 } ] },
  { id: "00000000-0000-0000-0000-0000000000b2", code: "taijiquan",
    venue: "00000000-0000-0000-0000-0000000000a2",
    title: { ru: "Вечерний Тайцзицюань · парк Худжанди", en: "Evening Taijiquan · Khujandi Park" },
    schedule: [ { dow: 2, start: "20:00", dur: 90 }, { dow: 4, start: "20:00", dur: 90 } ] },
  { id: "00000000-0000-0000-0000-0000000000b3", code: "wingchun",
    venue: "00000000-0000-0000-0000-0000000000a2",
    title: { ru: "Вечерний Вин Чун · парк Худжанди", en: "Evening Wing Chun · Khujandi Park" },
    schedule: [ { dow: 1, start: "20:00", dur: 90 }, { dow: 3, start: "20:00", dur: 90 } ] },
];

// --- Товары и цены (сомони, регион TJ) ---------------------------------------
const PRODUCTS = [
  { id: "00000000-0000-0000-0000-0000000000c1", kind: "subscription", slug: "open-group-month",
    title: { ru: "Открытая группа · абонемент", en: "Open group · monthly" },
    desc: { ru: "8 занятий в месяц в большой группе." }, sessions: 8, days: 30, price: 500 },
  { id: "00000000-0000-0000-0000-0000000000c2", kind: "single_visit", slug: "open-group-single",
    title: { ru: "Открытая группа · разовое", en: "Open group · single visit" },
    desc: { ru: "Одно занятие в открытой группе." }, sessions: 1, days: null, price: 150 },
  { id: "00000000-0000-0000-0000-0000000000c3", kind: "subscription", slug: "mini-group-month",
    title: { ru: "Мини-группа на природе · абонемент", en: "Nature mini-group · monthly" },
    desc: { ru: "8 занятий в месяц, до 4 человек, открытый воздух." }, sessions: 8, days: 30, price: 1200 },
  { id: "00000000-0000-0000-0000-0000000000c4", kind: "subscription", slug: "personal-5",
    title: { ru: "Персональные · абонемент от 5", en: "Personal · pack of 5+" },
    desc: { ru: "Индивидуальные занятия, 400 сом. за занятие в пакете." }, sessions: 5, days: 60, price: 2000 },
  { id: "00000000-0000-0000-0000-0000000000c5", kind: "single_visit", slug: "personal-single",
    title: { ru: "Персональное · разовое", en: "Personal · single" },
    desc: { ru: "Одно индивидуальное занятие один на один." }, sessions: 1, days: null, price: 500 },
  { id: "00000000-0000-0000-0000-0000000000c6", kind: "workshop", slug: "therapy-course",
    title: { ru: "Восточная терапия · курс", en: "Eastern therapy · course" },
    desc: { ru: "Диагностика состояния и 3 сеанса. Оздоровление, не заменяет врача." }, sessions: 4, days: 60, price: 900 },
  { id: "00000000-0000-0000-0000-0000000000c7", kind: "single_visit", slug: "therapy-single",
    title: { ru: "Восточная терапия · сеанс", en: "Eastern therapy · session" },
    desc: { ru: "Разовый сеанс. Оздоровительная практика, не заменяет врача." }, sessions: 1, days: null, price: 400 },
  { id: "00000000-0000-0000-0000-0000000000c8", kind: "workshop", slug: "seminar",
    title: { ru: "Семинар · 6 часов", en: "Seminar · 6 hours" },
    desc: { ru: "Дневное погружение в одно направление." }, sessions: 1, days: null, price: 1000 },
  { id: "00000000-0000-0000-0000-0000000000c9", kind: "retreat", slug: "retreat",
    title: { ru: "Выездной ретрит · 3 дня", en: "Retreat · 3 days" },
    desc: { ru: "18 часов практики, питание и проживание включены." }, sessions: 1, days: null, price: 4000 },
];

async function main() {
  const log = (...a) => console.log("·", ...a);

  // Дисциплины школы: code → id
  const { data: disc, error: dErr } = await db
    .from("disciplines").select("id, code").eq("school_id", SCHOOL_ID);
  if (dErr) throw dErr;
  const discByCode = Object.fromEntries((disc ?? []).map((d) => [d.code, d.id]));
  log("дисциплин найдено:", Object.keys(discByCode).length);

  // Инструктор — если в школе есть профиль owner/instructor
  const { data: instr } = await db
    .from("profiles").select("id, role").eq("school_id", SCHOOL_ID)
    .in("role", ["owner", "instructor"]).limit(1);
  const instructorId = instr?.[0]?.id ?? null;
  log("инструктор:", instructorId ? instructorId : "нет (оставим null)");

  // --- Уровни + практики ---
  let levelCount = 0, practiceCount = 0;
  for (const [code, levels] of Object.entries(CURRICULUM)) {
    const disciplineId = discByCode[code];
    if (!disciplineId) { log("! нет дисциплины", code); continue; }

    const levelRows = levels.map((l) => ({
      discipline_id: disciplineId,
      number: l.n,
      title: { ru: l.ru, en: l.en },
      goals: { ru: l.goal },
    }));
    const { error: lErr } = await db
      .from("levels").upsert(levelRows, { onConflict: "discipline_id,number" });
    if (lErr) throw lErr;
    levelCount += levelRows.length;

    // читаем id уровней
    const { data: savedLevels } = await db
      .from("levels").select("id, number").eq("discipline_id", disciplineId);
    const levelIdByNum = Object.fromEntries((savedLevels ?? []).map((l) => [l.number, l.id]));

    const practiceRows = [];
    for (const l of levels) {
      const levelId = levelIdByNum[l.n];
      if (!levelId) continue;
      l.practices.forEach((p, i) => {
        practiceRows.push({
          level_id: levelId,
          code: p[0],
          title: { ru: p[1], en: p[1] },
          description: { ru: p[2] },
          sort_order: i,
          status: "published",
        });
      });
    }
    if (practiceRows.length) {
      const { error: pErr } = await db
        .from("practices").upsert(practiceRows, { onConflict: "level_id,code" });
      if (pErr) throw pErr;
      practiceCount += practiceRows.length;
    }
  }
  log("уровней:", levelCount, "· практик:", practiceCount);

  // --- Залы ---
  const { error: vErr } = await db.from("venues").upsert(
    VENUES.map((v) => ({
      id: v.id, school_id: SCHOOL_ID, name: v.name, address: v.address,
      lat: v.lat, lng: v.lng, is_outdoor: v.is_outdoor, is_active: true,
    })),
    { onConflict: "id" },
  );
  if (vErr) throw vErr;
  log("залов:", VENUES.length);

  // --- Группы ---
  const groupRows = GROUPS.map((g) => ({
    id: g.id, school_id: SCHOOL_ID, discipline_id: discByCode[g.code],
    instructor_id: instructorId, venue_id: g.venue, title: g.title,
    level_min: 1, level_max: 7, schedule: g.schedule, is_active: true,
  })).filter((g) => g.discipline_id);
  const { error: gErr } = await db.from("groups").upsert(groupRows, { onConflict: "id" });
  if (gErr) throw gErr;
  log("групп:", groupRows.length);

  // --- Товары + цены ---
  const { error: prErr } = await db.from("products").upsert(
    PRODUCTS.map((p) => ({
      id: p.id, school_id: SCHOOL_ID, kind: p.kind, slug: p.slug,
      title: p.title, description: p.desc,
      sessions_included: p.sessions, duration_days: p.days, is_active: true,
    })),
    { onConflict: "school_id,slug" },
  );
  if (prErr) throw prErr;

  const { error: ppErr } = await db.from("product_prices").upsert(
    PRODUCTS.map((p) => ({
      product_id: p.id, currency: "TJS", amount_minor: somoni(p.price),
      region: "TJ", is_active: true,
    })),
    { onConflict: "product_id,currency,region" },
  );
  if (ppErr) throw ppErr;
  log("товаров:", PRODUCTS.length, "(с ценами)");

  console.log("\nГотово ✓");
}

main().catch((e) => {
  console.error("Ошибка:", e.message ?? e);
  process.exit(1);
});
