// Точечное обновление под прайс-сайт и текущее расписание.
// Идемпотентно. Запуск: node scripts/update-offline.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

const env = {};
for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const somoni = (s) => s * 100;
const log = (...a) => console.log("·", ...a);

// --- Новые продукты с прайс-сайта (разовое мини-группы, диагностика) ---
const NEW_PRODUCTS = [
  {
    id: "00000000-0000-0000-0000-0000000000ca",
    kind: "single_visit",
    slug: "mini-group-single",
    title: { ru: "Мини-группа на природе · разовое", en: "Nature mini-group · single" },
    desc: { ru: "Одно занятие в мини-группе (до 4 человек, 90 минут, открытый воздух)." },
    sessions: 1,
    days: null,
    price: 200,
  },
  {
    id: "00000000-0000-0000-0000-0000000000cb",
    kind: "single_visit",
    slug: "therapy-diagnostic",
    title: { ru: "Восточная терапия · диагностика", en: "Eastern therapy · diagnostics" },
    desc: { ru: "Диагностика состояния перед курсом. При оплате курса из 3 сеансов — в подарок." },
    sessions: 1,
    days: null,
    price: 300,
  },
];

async function main() {
  // Продукты + цены
  const { error: pErr } = await db.from("products").upsert(
    NEW_PRODUCTS.map((p) => ({
      id: p.id, school_id: SCHOOL_ID, kind: p.kind, slug: p.slug,
      title: p.title, description: p.desc,
      sessions_included: p.sessions, duration_days: p.days, is_active: true,
    })),
    { onConflict: "school_id,slug" },
  );
  if (pErr) throw pErr;

  const { error: ppErr } = await db.from("product_prices").upsert(
    NEW_PRODUCTS.map((p) => ({
      product_id: p.id, currency: "TJS", amount_minor: somoni(p.price),
      region: "TJ", is_active: true,
    })),
    { onConflict: "product_id,currency,region" },
  );
  if (ppErr) throw ppErr;
  log("новых продуктов:", NEW_PRODUCTS.length);

  // --- Расписание: пока только утро 05:00 по Пн (1) и Чт (4) ---
  const morningId = "00000000-0000-0000-0000-0000000000b1";
  const { error: gErr } = await db
    .from("groups")
    .update({
      is_active: true,
      schedule: [
        { dow: 1, start: "05:00", dur: 90 },
        { dow: 4, start: "05:00", dur: 90 },
      ],
    })
    .eq("id", morningId);
  if (gErr) throw gErr;
  log("утренняя группа: Пн, Чт · 05:00");

  // Вечерние группы (Тайцзи, Вин Чун) — пока скрыть с сайта.
  const eveningIds = [
    "00000000-0000-0000-0000-0000000000b2",
    "00000000-0000-0000-0000-0000000000b3",
  ];
  const { error: eErr } = await db
    .from("groups")
    .update({ is_active: false })
    .in("id", eveningIds);
  if (eErr) throw eErr;
  log("вечерние группы скрыты (is_active=false)");

  console.log("\nГотово ✓");
}

main().catch((e) => {
  console.error("Ошибка:", e.message ?? e);
  process.exit(1);
});
