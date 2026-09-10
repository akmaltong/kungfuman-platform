import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/domain/attendance";
import { Button } from "@/components/ui/button";
import { markAttendance, planPractice, unplanPractice } from "./actions";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  full_name: string | null;
}
interface PracticeRow {
  id: string;
  title: Localized;
}

// Экран отметки посещаемости. Спроектирован под телефон и одну руку: крупные
// кнопки, минимум скролла. Отмечаешь людей на набережной в 5 утра.
export default async function AttendancePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data: session } = await supabase
    .from("sessions")
    .select("id, group_id, starts_at, is_cancelled")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-neutral-400">Занятие не найдено.</p>
      </main>
    );
  }
  const s = session as {
    group_id: string | null;
    starts_at: string;
    is_cancelled: boolean;
  };

  const [{ data: schoolRow }, { data: students }, { data: attendance }] =
    await Promise.all([
      supabase.from("schools").select("timezone").limit(1).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student")
        .order("full_name"),
      supabase
        .from("attendance")
        .select("profile_id, status")
        .eq("session_id", sessionId),
    ]);

  const tz = (schoolRow as { timezone?: string } | null)?.timezone ?? "Asia/Dushanbe";
  const statusByProfile = new Map<string, AttendanceStatus>(
    ((attendance ?? []) as { profile_id: string; status: AttendanceStatus }[]).map(
      (a) => [a.profile_id, a.status],
    ),
  );

  // Запланированные практики занятия + кандидаты (практики дисциплины группы).
  const { data: planned } = await supabase
    .from("session_practices")
    .select("practice_id")
    .eq("session_id", sessionId);
  const plannedIds = ((planned ?? []) as { practice_id: string }[]).map(
    (p) => p.practice_id,
  );

  const candidates = await loadCandidatePractices(supabase, s.group_id);
  const plannedPractices = candidates.filter((p) => plannedIds.includes(p.id));
  const unplanned = candidates.filter((p) => !plannedIds.includes(p.id));

  const studentList = (students ?? []) as StudentRow[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-gold">Посещаемость</h1>
      <p className="mt-1 text-sm text-neutral-400">
        {formatDateTime(s.starts_at, tz)}
        {s.is_cancelled && (
          <span className="ml-2 text-red-400">занятие отменено</span>
        )}
      </p>

      {/* Практики занятия */}
      <section className="mt-4 rounded-lg border border-ink-muted bg-ink-soft p-3">
        <div className="text-sm font-medium text-neutral-300">
          Практики занятия
        </div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {plannedPractices.length === 0 && (
            <li className="text-sm text-neutral-600">не запланированы</li>
          )}
          {plannedPractices.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-sm text-neutral-300"
            >
              {t(p.title)}
              <form action={unplanPractice}>
                <input type="hidden" name="session_id" value={sessionId} />
                <input type="hidden" name="practice_id" value={p.id} />
                <button
                  type="submit"
                  className="text-red-400/70 hover:text-red-300"
                  aria-label="Убрать практику"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
        {unplanned.length > 0 && (
          <form action={planPractice} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="session_id" value={sessionId} />
            <select
              name="practice_id"
              className="flex-1 rounded-md border border-ink-muted bg-ink px-3 py-2 text-sm text-neutral-100"
            >
              {unplanned.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.title)}
                </option>
              ))}
            </select>
            <Button type="submit" variant="ghost">
              + В план
            </Button>
          </form>
        )}
      </section>

      {/* Список учеников с крупными кнопками */}
      <ul className="mt-5 space-y-2">
        {studentList.length === 0 && (
          <li className="text-neutral-500">В школе пока нет учеников.</li>
        )}
        {studentList.map((student) => {
          const current = statusByProfile.get(student.id);
          return (
            <li
              key={student.id}
              className="rounded-lg border border-ink-muted bg-ink-soft p-3"
            >
              <div className="text-neutral-100">
                {student.full_name ?? "Без имени"}
              </div>
              <div className="mt-2 flex gap-2">
                <StatusButton
                  sessionId={sessionId}
                  profileId={student.id}
                  status="present"
                  label="Был"
                  active={current === "present"}
                />
                <StatusButton
                  sessionId={sessionId}
                  profileId={student.id}
                  status="late"
                  label="Опоздал"
                  active={current === "late"}
                />
                <StatusButton
                  sessionId={sessionId}
                  profileId={student.id}
                  status="absent"
                  label="Не был"
                  active={current === "absent"}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function StatusButton({
  sessionId,
  profileId,
  status,
  label,
  active,
}: {
  sessionId: string;
  profileId: string;
  status: AttendanceStatus;
  label: string;
  active: boolean;
}) {
  return (
    <form action={markAttendance} className="flex-1">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="profile_id" value={profileId} />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        variant={active ? "primary" : "ghost"}
        className="w-full py-3 text-base"
      >
        {label}
      </Button>
    </form>
  );
}

// Практики дисциплины группы (кандидаты для планирования на занятие).
async function loadCandidatePractices(
  supabase: SupabaseClient,
  groupId: string | null,
): Promise<PracticeRow[]> {
  if (!groupId) return [];

  const { data: group } = await supabase
    .from("groups")
    .select("discipline_id")
    .eq("id", groupId)
    .maybeSingle();
  const disciplineId = (group as { discipline_id?: string } | null)?.discipline_id;
  if (!disciplineId) return [];

  const { data: levels } = await supabase
    .from("levels")
    .select("id")
    .eq("discipline_id", disciplineId);
  const levelIds = ((levels ?? []) as { id: string }[]).map((l) => l.id);
  if (levelIds.length === 0) return [];

  const { data: practices } = await supabase
    .from("practices")
    .select("id, title")
    .in("level_id", levelIds)
    .order("sort_order");
  return (practices ?? []) as PracticeRow[];
}
