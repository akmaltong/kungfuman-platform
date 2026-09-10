"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";
import { isValidSlot, parseSchedule } from "@/lib/domain/attendance";

const PATH = "/groups";

export async function createGroup(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const titleRu = String(formData.get("title_ru") ?? "").trim();
  const disciplineId = String(formData.get("discipline_id") ?? "");
  if (!titleRu || !disciplineId) return;

  const instructorId = String(formData.get("instructor_id") ?? "");
  const venueId = String(formData.get("venue_id") ?? "");
  const capacity = Number(formData.get("capacity"));

  await supabase.from("groups").insert({
    school_id: schoolId,
    discipline_id: disciplineId,
    instructor_id: instructorId || null,
    venue_id: venueId || null,
    title: { ru: titleRu },
    level_min: Number(formData.get("level_min")) || 1,
    level_max: Number(formData.get("level_max")) || 7,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
    schedule: [],
  });
  revalidatePath(PATH);
}

export async function deleteGroup(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("groups").delete().eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}

export async function addScheduleSlot(formData: FormData) {
  const { supabase } = await requireUser();
  const groupId = String(formData.get("group_id"));
  const slot = {
    dow: Number(formData.get("dow")),
    start: String(formData.get("start") ?? ""),
    dur: Number(formData.get("dur")),
  };
  if (!isValidSlot(slot)) return;

  const { data } = await supabase
    .from("groups")
    .select("schedule")
    .eq("id", groupId)
    .single();
  const current = parseSchedule((data as { schedule?: unknown } | null)?.schedule);
  const next = [...current, slot].sort(
    (a, b) => a.dow - b.dow || a.start.localeCompare(b.start),
  );

  await supabase.from("groups").update({ schedule: next }).eq("id", groupId);
  revalidatePath(PATH);
}

export async function removeScheduleSlot(formData: FormData) {
  const { supabase } = await requireUser();
  const groupId = String(formData.get("group_id"));
  const index = Number(formData.get("index"));

  const { data } = await supabase
    .from("groups")
    .select("schedule")
    .eq("id", groupId)
    .single();
  const current = parseSchedule((data as { schedule?: unknown } | null)?.schedule);
  if (index < 0 || index >= current.length) return;

  const next = current.filter((_, i) => i !== index);
  await supabase.from("groups").update({ schedule: next }).eq("id", groupId);
  revalidatePath(PATH);
}
