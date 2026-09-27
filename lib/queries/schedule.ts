import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseSchedule, type ScheduleSlot } from "@/lib/domain/attendance";
import type { Localized } from "@/lib/i18n";

// Публичное расписание офлайн-групп школы. Как и каталог программы, читается
// service-role клиентом, но строго ограничено безопасными полями активных
// групп (без учеников и персональных данных). Безопасно для анонимов.

export interface PublicGroup {
  id: string;
  title: Localized;
  discipline: Localized;
  venue: Localized;
  isOutdoor: boolean;
  slots: ScheduleSlot[];
}

export async function getPublicSchedule(
  schoolSlug: string,
): Promise<PublicGroup[]> {
  let admin;
  try {
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

  const [{ data: groups }, { data: disciplines }, { data: venues }] =
    await Promise.all([
      admin
        .from("groups")
        .select("id, title, discipline_id, venue_id, schedule, is_active")
        .eq("school_id", schoolId)
        .eq("is_active", true),
      admin.from("disciplines").select("id, title").eq("school_id", schoolId),
      admin.from("venues").select("id, name").eq("school_id", schoolId),
    ]);

  const discById = new Map(
    ((disciplines ?? []) as { id: string; title: Localized }[]).map((d) => [
      d.id,
      d.title,
    ]),
  );
  const venueById = new Map(
    ((venues ?? []) as { id: string; name: Localized }[]).map((v) => [
      v.id,
      v.name,
    ]),
  );

  type GroupRow = {
    id: string;
    title: Localized;
    discipline_id: string;
    venue_id: string | null;
    schedule: unknown;
  };

  const result: PublicGroup[] = ((groups ?? []) as GroupRow[]).map((g) => ({
    id: g.id,
    title: g.title,
    discipline: discById.get(g.discipline_id) ?? {},
    venue: (g.venue_id && venueById.get(g.venue_id)) || {},
    isOutdoor: true,
    slots: parseSchedule(g.schedule),
  }));

  // Сортировка: по самому раннему времени начала, затем по названию.
  const earliest = (g: PublicGroup) =>
    g.slots.length
      ? Math.min(...g.slots.map((s) => Number(s.start.replace(":", ""))))
      : 9999;
  return result.sort((a, b) => earliest(a) - earliest(b));
}
