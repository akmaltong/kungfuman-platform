// Добавляет продукт «Мастер-класс» (150 сом.). Идемпотентно.
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
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ID = "00000000-0000-0000-0000-0000000000cc";
async function main() {
  await db.from("products").upsert(
    [{ id: ID, school_id: SCHOOL_ID, kind: "workshop", slug: "masterclass",
       title: { ru: "Мастер-класс", en: "Master class" },
       description: { ru: "90 минут · с участника. Погружение в одно направление." },
       sessions_included: 1, duration_days: null, is_active: true }],
    { onConflict: "school_id,slug" },
  );
  await db.from("product_prices").upsert(
    [{ product_id: ID, currency: "TJS", amount_minor: 15000, region: "TJ", is_active: true }],
    { onConflict: "product_id,currency,region" },
  );
  console.log("· добавлен мастер-класс (150 сом.)\nГотово ✓");
}
main().catch((e) => { console.error("Ошибка:", e.message ?? e); process.exit(1); });
