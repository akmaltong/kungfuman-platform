"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";
import { generateSessions, parseSchedule } from "@/lib/domain/attendance";
import { tzOffsetMinutes } from "@/lib/format";

const PATH = "/sessions";

// Генерация занятий из расписания группы на N недель вперёд. Идемпотентно:
// занятия с уже существующим временем старта не дублируются.
export async function generateGroupSessions(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const groupId = String(formData.get("group_id") ?? "");
  const weeks = Math.min(Math.max(Number(formData.get("weeks")) || 4, 1), 12);
  if (!groupId) return;

  const { data: group } = await supabase
    .from("groups")
    .select("id, schedule, venue_id, instructor_id")
    .eq("id", groupId)
    .single();
  if (!group) return;

  const { data: school } = await supabase
    .from("schools")
    .select("timezone")
    .eq("id", schoolId)
    .single();
  const timezone =
    (school as { timezone?: string } | null)?.timezone ?? "Asia/Dushanbe";

  const schedule = parseSchedule((group as { schedule?: unknown }).schedule);
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const offset = tzOffsetMinutes(timezone, from);

  const generated = generateSessions(schedule, from, weeks, offset);
  if (generated.length === 0) return;

  // Существующие старты этой группы в окне — чтобы не плодить дубли.
  const windowEnd = generated[generated.length - 1].starts_at.toISOString();
  const { data: existing } = await supabase
    .from("sessions")
    .select("starts_at")
    .eq("group_id", groupId)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", windowEnd);
  const taken = new Set(
    ((existing ?? []) as { starts_at: string }[]).map((s) =>
      new Date(s.starts_at).toISOString(),
    ),
  );

  const g = group as { venue_id: string | null; instructor_id: string | null };
  const rows = generated
    .filter((s) => !taken.has(s.starts_at.toISOString()))
    .map((s) => ({
      school_id: schoolId,
      group_id: groupId,
      kind: "offline",
      venue_id: g.venue_id,
      instructor_id: g.instructor_id,
      starts_at: s.starts_at.toISOString(),
      ends_at: s.ends_at.toISOString(),
    }));

  if (rows.length > 0) await supabase.from("sessions").insert(rows);
  revalidatePath(PATH);
}

export async function cancelSession(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase
    .from("sessions")
    .update({ is_cancelled: true })
    .eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}
