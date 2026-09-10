import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/supabase/context";
import { t, type Localized } from "@/lib/i18n";
import { levelCompletionPercent } from "@/lib/domain/progress";
import { bySortOrder } from "@/lib/domain/curriculum";

export const dynamic = "force-dynamic";

interface Enrollment {
  id: string;
  discipline_id: string;
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
  status: "not_started" | "in_progress" | "completed";
}

const DOT: Record<string, string> = {
  completed: "text-green-400",
  in_progress: "text-gold",
  not_started: "text-neutral-600",
};

export default async function StudentProgress() {
  const { supabase, userId } = await requireUser();
  const client = supabase as unknown as SupabaseClient;

  const [{ data: enrollments }, { data: disciplines }] = await Promise.all([
    client.from("enrollments").select("id, discipline_id").eq("profile_id", userId),
    client.from("disciplines").select("id, title"),
  ]);

  const enrollmentList = (enrollments ?? []) as Enrollment[];
  const disciplineName = new Map(
    ((disciplines ?? []) as { id: string; title: Localized }[]).map((d) => [
      d.id,
      t(d.title),
    ]),
  );

  if (enrollmentList.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-gold">Прогресс</h1>
        <p className="mt-4 text-neutral-400">
          Ты пока не зачислен на дисциплины. Приходи на занятие — инструктор
          зачислит.
        </p>
      </main>
    );
  }

  const disciplineIds = enrollmentList.map((e) => e.discipline_id);
  const enrollmentIds = enrollmentList.map((e) => e.id);

  const [{ data: levels }, { data: progress }] = await Promise.all([
    client
      .from("levels")
      .select("id, discipline_id, number, title")
      .in("discipline_id", disciplineIds),
    client
      .from("practice_progress")
      .select("practice_id, enrollment_id, status")
      .in("enrollment_id", enrollmentIds),
  ]);
  const levelList = (levels ?? []) as Level[];
  const { data: practices } = levelList.length
    ? await client
        .from("practices")
        .select("id, level_id, title, sort_order")
        .in(
          "level_id",
          levelList.map((l) => l.id),
        )
    : { data: [] as Practice[] };
  const practiceList = (practices ?? []) as Practice[];
  const progressList = (progress ?? []) as Progress[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Прогресс</h1>
      <div className="mt-6 space-y-8">
        {enrollmentList.map((enrollment) => {
          const disciplineLevels = levelList
            .filter((l) => l.discipline_id === enrollment.discipline_id)
            .sort((a, b) => a.number - b.number);
          const prog = progressList.filter(
            (p) => p.enrollment_id === enrollment.id,
          );
          const statusMap = new Map(prog.map((p) => [p.practice_id, p.status]));
          const allPractices = practiceList.filter((p) =>
            disciplineLevels.some((l) => l.id === p.level_id),
          );
          const percent = levelCompletionPercent(prog, allPractices.length);

          return (
            <section key={enrollment.id}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-100">
                  {disciplineName.get(enrollment.discipline_id) ?? "—"}
                </h2>
                <span className="text-sm text-neutral-400">освоено {percent}%</span>
              </div>
              <div className="mt-3 space-y-4">
                {disciplineLevels.map((level) => {
                  const lp = bySortOrder(
                    practiceList.filter((p) => p.level_id === level.id),
                  );
                  if (lp.length === 0) return null;
                  return (
                    <div
                      key={level.id}
                      className="rounded-lg border border-ink-muted bg-ink-soft p-4"
                    >
                      <div className="text-sm font-semibold text-gold">
                        Уровень {level.number} · {t(level.title)}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {lp.map((practice) => {
                          const status =
                            statusMap.get(practice.id) ?? "not_started";
                          return (
                            <li
                              key={practice.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className={DOT[status]}>●</span>
                              <span className="text-neutral-200">
                                {t(practice.title)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
