"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";
import { getPage } from "@/lib/content/schema";

// Сохранение контента витринной страницы в schools.settings.content[pageKey].
// Писать schools может только owner (RLS) — у мастера роль owner.
export async function saveContent(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const pageKey = String(formData.get("__page") ?? "");
  const page = getPage(pageKey);
  if (!page) return;

  // Собираем значения только известных полей (строки как есть).
  const values: Record<string, string> = {};
  for (const f of page.fields) {
    values[f.key] = String(formData.get(f.key) ?? "");
  }

  // Читаем текущие настройки и мержим, чтобы не затереть остальное.
  const { data } = await supabase
    .from("schools")
    .select("settings")
    .eq("id", schoolId)
    .maybeSingle();

  const settings =
    ((data as { settings?: Record<string, unknown> } | null)?.settings ??
      {}) as Record<string, unknown>;
  const content = (
    settings.content && typeof settings.content === "object"
      ? settings.content
      : {}
  ) as Record<string, unknown>;

  const nextSettings = {
    ...settings,
    content: { ...content, [pageKey]: values },
  };

  await supabase
    .from("schools")
    .update({ settings: nextSettings })
    .eq("id", schoolId);

  revalidatePath(page.path);
  revalidatePath("/site");
}
