import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import {
  levelCompletionPercent,
  type ProgressStatus,
} from "@/lib/domain/progress";
import { bySortOrder } from "@/lib/domain/curriculum";
import { Button } from "@/components/ui/button";
import { enrollStudent, setCurrentLevel, setProgress } from "./actions";

export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}
interface Health {
  conditions: string | null;
  restrictions: string | null;
  emergency_phone: string | null;
}
interface Discipline {
  id: string;
  title: Localized;
}
interface Enrollment {
  id: string;
  discipline_id: string;
  current_level_id: string | null;
  status: string;
}
interface Level {
  id: string;
  discipline_id: string;
  number: number;
  title: Localized;
}
interface Practice {
  id: string;
  level_id: string;
  title: Localized;
  sort_order: number;
}
interface Progress {
  practice_id: string;
  enrollment_id: string;
  status: ProgressStatus;
}

export default async function StudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email, is_active, created_at")
    .eq("id", studentId)
    .maybeSingle();

  if (!profileData) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-neutral-400">Ученик не найден.</p>
      </main>
    );
  }
  const profile = profileData as Profile;

  const [
    { data: healthData },
    { data: disciplines },
    { data: enrollments },
    { data: attendance },
  ] = await Promise.all([
    supabase
      .from("student_health")
      .select("conditions, restrictions, emergency_phone")
      .eq("profile_id", studentId)
      .maybeSingle(),
    supabase.from("disciplines").select("id, title"),
    supabase
      .from("enrollments")
      .select("id, discipline_id, current_level_id, status")
      .eq("profile_id", studentId),
    supabase
      .from("attendance")
      .select("session_id, status")
      .eq("profile_id", studentId),
  ]);

  const health = healthData as Health | null;
  const disciplineList = (disciplines ?? []) as Discipline[];
  const disciplineName = new Map(disciplineList.map((d) => [d.id, t(d.title)]));
  const enrollmentList = (enrollments ?? []) as Enrollment[];

  // Уровни и практики нужных дисциплин + прогресс по зачислениям.
  const disciplineIds = enrollmentList.map((e) => e.discipline_id);
  const enrollmentIds = enrollmentList.map((e) => e.id);

  const [{ data: levels }, { data: progress }] = await Promise.all([
    disciplineIds.length
      ? supabase
          .from("levels")
          .select("id, discipline_id, number, title")
          .in("discipline_id", disciplineIds)
      : Promise.resolve({ data: [] as Level[] }),
    enrollmentIds.length
      ? supabase
          .from("practice_progress")
          .select("practice_id, enrollment_id, status")
          .in("enrollment_id", enrollmentIds)
      : Promise.resolve({ data: [] as Progress[] }),
  ]);

  const levelList = (levels ?? []) as Level[];
  const levelIds = levelList.map((l) => l.id);
  const { data: practices } = levelIds.length
    ? await supabase
        .from("practices")
        .select("id, level_id, title, sort_order")
        .in("level_id", levelIds)
    : { data: [] as Practice[] };
  const practiceList = (practices ?? []) as Practice[];
  const progressList = (progress ?? []) as Progress[];

  // История посещений: занятия по session_id, отсортированы по дате (свежие сверху).
  const attendanceRows = (attendance ?? []) as {
    session_id: string;
    status: string;
  }[];
  const sessionIds = attendanceRows.map((a) => a.session_id);
  const { data: histSessions } = sessionIds.length
    ? await supabase
        .from("sessions")
        .select("id, starts_at")
        .in("id", sessionIds)
    : { data: [] as { id: string; starts_at: string }[] };
  const startsById = new Map(
    ((histSessions ?? []) as { id: string; starts_at: string }[]).map((s) => [
      s.id,
      s.starts_at,
    ]),
  );
  const history = attendanceRows
    .map((a) => ({ status: a.status, starts_at: startsById.get(a.session_id) }))
    .filter((h) => h.starts_at)
    .sort((x, y) => (x.starts_at! < y.starts_at! ? 1 : -1))
    .slice(0, 20);

  const enrolledDisciplineIds = new Set(disciplineIds);
  const notEnrolled = disciplineList.filter(
    (d) => !enrolledDisciplineIds.has(d.id),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/students" className="text-sm text-gold hover:underline">
        ← Ученики
      </Link>
      <h1 className="mt-2 text-3xl font-semibold text-neutral-100">
        {profile.full_name ?? "Без имени"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {profile.phone ?? "телефон не указан"}
        {profile.email ? ` · ${profile.email}` : ""} · с{" "}
        {formatDateTime(profile.created_at)}
        {!profile.is_active && " · неактивен"}
      </p>

      {/* Медданные */}
      <section className="mt-6 rounded-lg border border-ink-muted bg-ink-soft p-4">
        <h2 className="text-sm font-semibold text-gold">Медицинские данные</h2>
        {health &&
        (health.conditions || health.restrictions || health.emergency_phone) ? (
          <dl className="mt-2 space-y-1 text-sm text-neutral-300">
            {health.conditions && (
              <div>
                <span className="text-neutral-500">Состояния: </span>
                {health.conditions}
              </div>
            )}
            {health.restrictions && (
              <div>
                <span className="text-neutral-500">Противопоказания: </span>
                {health.restrictions}
              </div>
            )}
            {health.emergency_phone && (
              <div>
                <span className="text-neutral-500">Экстренный контакт: </span>
                {health.emergency_phone}
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">Не заполнены.</p>
        )}
      </section>

      {/* Зачисления и прогресс */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gold">Прогресс</h2>
          {notEnrolled.length > 0 && (
            <form action={enrollStudent} className="flex items-center gap-2">
              <input type="hidden" name="profile_id" value={studentId} />
              <select
                name="discipline_id"
                className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
              >
                {notEnrolled.map((d) => (
                  <option key={d.id} value={d.id}>
                    {t(d.title)}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="ghost">
                Зачислить
              </Button>
            </form>
          )}
        </div>

        {enrollmentList.length === 0 && (
          <p className="mt-3 text-neutral-500">Не зачислен ни на одну дисциплину.</p>
        )}

        <div className="mt-4 space-y-6">
          {enrollmentList.map((enrollment) => {
            const disciplineLevels = bySortOrderByNumber(
              levelList.filter((l) => l.discipline_id === enrollment.discipline_id),
            );
            const progressForEnrollment = progressList.filter(
              (p) => p.enrollment_id === enrollment.id,
            );
            const statusMap = new Map(
              progressForEnrollment.map((p) => [p.practice_id, p.status]),
            );
            const allPractices = practiceList.filter((p) =>
              disciplineLevels.some((l) => l.id === p.level_id),
            );
            const percent = levelCompletionPercent(
              progressForEnrollment,
              allPractices.length,
            );

            return (
              <div
                key={enrollment.id}
                className="rounded-lg border border-ink-muted bg-ink-soft p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg text-neutral-100">
                    {disciplineName.get(enrollment.discipline_id) ?? "—"}
                  </h3>
                  <span className="text-sm text-neutral-400">
                    освоено {percent}%
                  </span>
                </div>

                {/* Текущий уровень */}
                <form
                  action={setCurrentLevel}
                  className="mt-3 flex items-center gap-2"
                >
                  <input type="hidden" name="profile_id" value={studentId} />
                  <input type="hidden" name="enrollment_id" value={enrollment.id} />
                  <span className="text-sm text-neutral-500">
                    Текущий уровень:
                  </span>
                  <select
                    name="level_id"
                    defaultValue={enrollment.current_level_id ?? ""}
                    className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
                  >
                    <option value="">—</option>
                    {disciplineLevels.map((l) => (
                      <option key={l.id} value={l.id}>
                        Уровень {l.number}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="ghost">
                    Сохранить
                  </Button>
                </form>

                {/* Практики по уровням */}
                <div className="mt-4 space-y-4">
                  {disciplineLevels.map((level) => {
                    const levelPractices = bySortOrder(
                      practiceList.filter((p) => p.level_id === level.id),
                    );
                    if (levelPractices.length === 0) return null;
                    return (
                      <div key={level.id}>
                        <div className="text-sm font-semibold text-gold">
                          Уровень {level.number} · {t(level.title)}
                        </div>
                        <ul className="mt-2 space-y-2">
                          {levelPractices.map((practice) => {
                            const status =
                              statusMap.get(practice.id) ?? "not_started";
                            return (
                              <li
                                key={practice.id}
                                className="flex flex-wrap items-center gap-2 rounded border border-ink-muted p-2"
                              >
                                <span className="text-neutral-200">
                                  {t(practice.title)}
                                </span>
                                <div className="ml-auto flex gap-1">
                                  <ProgressButton
                                    profileId={studentId}
                                    enrollmentId={enrollment.id}
                                    practiceId={practice.id}
                                    status="not_started"
                                    label="—"
                                    active={status === "not_started"}
                                  />
                                  <ProgressButton
                                    profileId={studentId}
                                    enrollmentId={enrollment.id}
                                    practiceId={practice.id}
                                    status="in_progress"
                                    label="В процессе"
                                    active={status === "in_progress"}
                                  />
                                  <ProgressButton
                                    profileId={studentId}
                                    enrollmentId={enrollment.id}
                                    practiceId={practice.id}
                                    status="completed"
                                    label="Освоено"
                                    active={status === "completed"}
                                  />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* История посещений */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gold">История посещений</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {history.length === 0 && (
            <li className="text-neutral-500">Пока нет отметок.</li>
          )}
          {history.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between border-b border-ink-muted/60 py-1"
            >
              <span className="text-neutral-300">
                {a.starts_at ? formatDateTime(a.starts_at) : "—"}
              </span>
              <span className="text-neutral-500">{statusLabel(a.status)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    present: "был",
    late: "опоздал",
    absent: "не был",
    registered: "записан",
    cancelled: "отменено",
  };
  return map[status] ?? status;
}

// Уровни сортируются по номеру (1..7), а не по sort_order.
function bySortOrderByNumber<T extends { number: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.number - b.number);
}

function ProgressButton({
  profileId,
  enrollmentId,
  practiceId,
  status,
  label,
  active,
}: {
  profileId: string;
  enrollmentId: string;
  practiceId: string;
  status: ProgressStatus;
  label: string;
  active: boolean;
}) {
  return (
    <form action={setProgress}>
      <input type="hidden" name="profile_id" value={profileId} />
      <input type="hidden" name="enrollment_id" value={enrollmentId} />
      <input type="hidden" name="practice_id" value={practiceId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={active ? "primary" : "ghost"}>
        {label}
      </Button>
    </form>
  );
}
