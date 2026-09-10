"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";
import { wasPresent, type AttendanceStatus } from "@/lib/domain/attendance";

function path(sessionId: string) {
  return `/attendance/${sessionId}`;
}

export async function markAttendance(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const sessionId = String(formData.get("session_id"));
  const profileId = String(formData.get("profile_id"));
  const status = String(formData.get("status")) as AttendanceStatus;
  if (
    !["registered", "present", "absent", "late", "cancelled"].includes(status)
  ) {
    return;
  }

  await supabase.from("attendance").upsert(
    {
      session_id: sessionId,
      profile_id: profileId,
      status,
      marked_by: userId,
      checked_in_at: wasPresent(status) ? new Date().toISOString() : null,
    },
    { onConflict: "session_id,profile_id" },
  );
  revalidatePath(path(sessionId));
}

export async function planPractice(formData: FormData) {
  const { supabase } = await requireUser();
  const sessionId = String(formData.get("session_id"));
  const practiceId = String(formData.get("practice_id"));
  if (!practiceId) return;

  // Дубли не критичны — первичный ключ (session_id, practice_id) их отсечёт.
  await supabase
    .from("session_practices")
    .upsert(
      { session_id: sessionId, practice_id: practiceId },
      { onConflict: "session_id,practice_id" },
    );
  revalidatePath(path(sessionId));
}

export async function unplanPractice(formData: FormData) {
  const { supabase } = await requireUser();
  const sessionId = String(formData.get("session_id"));
  const practiceId = String(formData.get("practice_id"));
  await supabase
    .from("session_practices")
    .delete()
    .eq("session_id", sessionId)
    .eq("practice_id", practiceId);
  revalidatePath(path(sessionId));
}
