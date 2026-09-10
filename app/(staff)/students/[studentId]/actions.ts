"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";
import type { ProgressStatus } from "@/lib/domain/progress";

function path(studentId: string) {
  return `/students/${studentId}`;
}

// Зачислить ученика на дисциплину (создаёт enrollment). Прогресс по практикам
// вешается на enrollment.
export async function enrollStudent(formData: FormData) {
  const { supabase } = await requireUser();
  const profileId = String(formData.get("profile_id"));
  const disciplineId = String(formData.get("discipline_id"));
  if (!profileId || !disciplineId) return;

  await supabase
    .from("enrollments")
    .upsert(
      { profile_id: profileId, discipline_id: disciplineId, status: "active" },
      { onConflict: "profile_id,discipline_id" },
    );
  revalidatePath(path(profileId));
}

// Отметить статус освоения практики учеником.
export async function setProgress(formData: FormData) {
  const { supabase } = await requireUser();
  const profileId = String(formData.get("profile_id"));
  const enrollmentId = String(formData.get("enrollment_id"));
  const practiceId = String(formData.get("practice_id"));
  const status = String(formData.get("status")) as ProgressStatus;
  if (!["not_started", "in_progress", "completed"].includes(status)) return;

  await supabase.from("practice_progress").upsert(
    {
      enrollment_id: enrollmentId,
      practice_id: practiceId,
      status,
      last_practiced_at:
        status === "not_started" ? null : new Date().toISOString(),
    },
    { onConflict: "enrollment_id,practice_id" },
  );
  revalidatePath(path(profileId));
}

// Обновить текущий уровень зачисления.
export async function setCurrentLevel(formData: FormData) {
  const { supabase } = await requireUser();
  const profileId = String(formData.get("profile_id"));
  const enrollmentId = String(formData.get("enrollment_id"));
  const levelId = String(formData.get("level_id")) || null;
  await supabase
    .from("enrollments")
    .update({ current_level_id: levelId })
    .eq("id", enrollmentId);
  revalidatePath(path(profileId));
}
