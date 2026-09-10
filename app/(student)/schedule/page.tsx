import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/supabase/context";
import { t, type Localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  group_id: string | null;
  starts_at: string;
  is_cancelled: boolean;
}

const ATT_LABEL: Record<string, string> = {
  present: "был",
  late: "опоздал",
  absent: "не был",
  registered: "записан",
};

export default async function StudentSchedule() {
  const { supabase, userId } = await requireUser();
  const client = supabase as unknown as SupabaseClient;
  const nowIso = new Date().toISOString();

  const [{ data: sessions }, { data: groups }, { data: attendance }] =
    await Promise.all([
      client
        .from("sessions")
        .select("id, group_id, starts_at, is_cancelled")
        .gte("starts_at", nowIso)
        .order("starts_at")
        .limit(50),
      client.from("groups").select("id, title"),
      client.from("attendance").select("session_id, status").eq("profile_id", userId),
    ]);

  const groupTitle = new Map(
    ((groups ?? []) as { id: string; title: Localized }[]).map((g) => [
      g.id,
      t(g.title),
    ]),
  );
  const myStatus = new Map(
    ((attendance ?? []) as { session_id: string; status: string }[]).map((a) => [
      a.session_id,
      a.status,
    ]),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Расписание</h1>
      <ul className="mt-6 space-y-2">
        {((sessions ?? []) as SessionRow[]).length === 0 && (
          <li className="text-neutral-500">Занятий пока нет.</li>
        )}
        {((sessions ?? []) as SessionRow[]).map((s) => {
          const status = myStatus.get(s.id);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
            >
              <div>
                <div className="text-neutral-100">
                  {formatDateTime(s.starts_at)}
                  {s.is_cancelled && (
                    <span className="ml-2 text-sm text-red-400">отменено</span>
                  )}
                </div>
                <div className="text-sm text-neutral-500">
                  {s.group_id ? groupTitle.get(s.group_id) : ""}
                </div>
              </div>
              {status && (
                <span className="rounded-full border border-gold/30 px-3 py-1 text-xs text-neutral-400">
                  {ATT_LABEL[status] ?? status}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
