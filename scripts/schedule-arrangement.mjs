// Другие направления в расписании со статусом «договорная» (пустое schedule).
// Идемпотентно. Запуск: node scripts/schedule-arrangement.mjs
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

async function main() {
  const { data: disc } = await db
    .from("disciplines").select("id, code").eq("school_id", SCHOOL_ID);
  const byCode = Object.fromEntries((disc ?? []).map((d) => [d.code, d.id]));

  // Существующие вечерние группы: снова активны, но время — договорное (пусто).
  const arrangement = [
    { id: "00000000-0000-0000-0000-0000000000b2", code: "taijiquan",
      title: { ru: "Тайцзицюань", en: "Taijiquan" } },
    { id: "00000000-0000-0000-0000-0000000000b3", code: "wingchun",
      title: { ru: "Вин Чун", en: "Wing Chun" } },
    { id: "00000000-0000-0000-0000-0000000000b4", code: "qigong",
      title: { ru: "Цигун", en: "Qigong" } },
  ];

  const rows = arrangement
    .filter((g) => byCode[g.code])
    .map((g) => ({
      id: g.id, school_id: SCHOOL_ID, discipline_id: byCode[g.code],
      title: g.title, level_min: 1, level_max: 7,
      schedule: [], is_active: true,
    }));

  const { error } = await db.from("groups").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log("· договорных групп:", rows.length, "(Тайцзи, Вин Чун, Цигун)");
  console.log("Готово ✓");
}
main().catch((e) => { console.error("Ошибка:", e.message ?? e); process.exit(1); });
