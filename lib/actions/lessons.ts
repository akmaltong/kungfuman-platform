"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/supabase/context";
import { watchStatus } from "@/lib/domain/courses";

// Сохранение прогресса просмотра урока (хартбит раз в ~15 секунд).
// Инкрементирует watched_sec и пересчитывает статус по доле просмотра.
export async function saveLessonProgress(
  lessonId: string,
  addSeconds: number,
  durationSec: number | null,
) {
  const { supabase, userId } = await requireUser();
  const client = supabase as unknown as SupabaseClient;

  const { data: existing } = await client
    .from("lesson_progress")
    .select("watched_sec")
    .eq("profile_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const watched =
    ((existing as { watched_sec?: number } | null)?.watched_sec ?? 0) +
    Math.max(0, Math.round(addSeconds));
  const status = watchStatus(watched, durationSec);

  await client.from("lesson_progress").upsert(
    {
      profile_id: userId,
      lesson_id: lessonId,
      watched_sec: watched,
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    },
    { onConflict: "profile_id,lesson_id" },
  );
}

// Явная отметка урока пройденным (кнопка).
export async function completeLesson(lessonId: string) {
  const { supabase, userId } = await requireUser();
  const client = supabase as unknown as SupabaseClient;
  await client.from("lesson_progress").upsert(
    {
      profile_id: userId,
      lesson_id: lessonId,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,lesson_id" },
  );
}
