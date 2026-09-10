import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCurriculumTree,
  type DisciplineNode,
  type DisciplineRow,
  type LevelRow,
  type PracticeRow,
} from "@/lib/domain/curriculum";

// Публичный каталог программы одной школы. Читается на сервере service-role
// клиентом (обходит RLS), но строго ограничен: активные дисциплины школы,
// их уровни и только опубликованные практики. Безопасно для анонимов.
//
// При отсутствии ключей/данных возвращает пустое дерево — публичная страница
// просто покажет заглушку, а не упадёт.
export async function getPublicProgram(
  schoolSlug: string,
): Promise<DisciplineNode[]> {
  let admin;
  try {
    // Приведение к схеме по умолчанию: типы БД (lib/types/database.ts) пока
    // плейсхолдер. После `pnpm db:types` каст можно убрать.
    admin = createAdminClient() as unknown as SupabaseClient;
  } catch {
    return [];
  }

  const { data: school } = await admin
    .from("schools")
    .select("id")
    .eq("slug", schoolSlug)
    .maybeSingle();

  const schoolId = (school as { id?: string } | null)?.id;
  if (!schoolId) return [];

  const { data: disciplines } = await admin
    .from("disciplines")
    .select("id, title, sort_order")
    .eq("school_id", schoolId)
    .eq("is_active", true);

  const rows = (disciplines ?? []) as DisciplineRow[];
  if (rows.length === 0) return [];

  const disciplineIds = rows.map((d) => d.id);

  const { data: levels } = await admin
    .from("levels")
    .select("id, discipline_id, number, title")
    .in("discipline_id", disciplineIds);

  const levelRows = (levels ?? []) as LevelRow[];
  const levelIds = levelRows.map((l) => l.id);

  const { data: practices } = levelIds.length
    ? await admin
        .from("practices")
        .select("id, level_id, title, sort_order, status")
        .eq("status", "published")
        .in("level_id", levelIds)
    : { data: [] };

  return buildCurriculumTree(
    rows,
    levelRows,
    (practices ?? []) as PracticeRow[],
  );
}
