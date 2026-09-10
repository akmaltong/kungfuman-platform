import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/supabase/context";
import { t, type Localized } from "@/lib/i18n";
import { bySortOrder } from "@/lib/domain/curriculum";
import { courseCompletionPercent, nextLesson } from "@/lib/domain/courses";
import { Player } from "@/components/player";

export const dynamic = "force-dynamic";

interface Course {
  id: string;
  slug: string;
  title: Localized;
}
interface ModuleRow {
  id: string;
  title: Localized;
  sort_order: number;
}
interface LessonRow {
  id: string;
  module_id: string;
  title: Localized;
  is_preview: boolean;
  duration_min: number | null;
  sort_order: number;
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const { supabase, userId } = await requireUser();
  const client = supabase as unknown as SupabaseClient;

  const { data: courseData } = await client
    .from("courses")
    .select("id, slug, title")
    .eq("slug", courseSlug)
    .maybeSingle();
  if (!courseData) {
    return <NotAvailable slug={courseSlug} />;
  }
  const course = courseData as Course;

  const { data: modules } = await client
    .from("course_modules")
    .select("id, title, sort_order")
    .eq("course_id", course.id);
  const moduleList = bySortOrder((modules ?? []) as ModuleRow[]);
  const moduleIds = moduleList.map((m) => m.id);

  const { data: lessons } = moduleIds.length
    ? await client
        .from("lessons")
        .select("id, module_id, title, is_preview, duration_min, sort_order")
        .in("module_id", moduleIds)
    : { data: [] as LessonRow[] };
  const lessonList = (lessons ?? []) as LessonRow[];

  const current = lessonList.find((l) => l.id === lessonId);
  if (!current) {
    return <NotAvailable slug={courseSlug} />;
  }

  const { data: progress } = await client
    .from("lesson_progress")
    .select("lesson_id, status")
    .eq("profile_id", userId);
  const progressList = (progress ?? []) as {
    lesson_id: string;
    status: "not_started" | "in_progress" | "completed";
  }[];
  const doneSet = new Set(
    progressList.filter((p) => p.status === "completed").map((p) => p.lesson_id),
  );

  // Плоский порядок уроков по модулям для «следующего».
  const orderedIds = moduleList.flatMap((m) =>
    bySortOrder(lessonList.filter((l) => l.module_id === m.id)).map((l) => l.id),
  );
  const percent = courseCompletionPercent(
    lessonList.map((l) => ({ id: l.id, is_preview: l.is_preview })),
    progressList,
  );
  const upNextId = nextLesson(orderedIds, progressList);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href={`/courses/${course.slug}`} className="text-sm text-gold hover:underline">
        ← {t(course.title)}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">
            {t(current.title)}
          </h1>
          <div className="mt-4">
            <Player
              lessonId={current.id}
              durationSec={current.duration_min ? current.duration_min * 60 : null}
            />
          </div>
          {upNextId && upNextId !== current.id && (
            <div className="mt-4">
              <Link
                href={`/learn/${course.slug}/${upNextId}`}
                className="text-gold hover:underline"
              >
                Следующий урок →
              </Link>
            </div>
          )}
        </div>

        {/* Оглавление */}
        <aside>
          <div className="mb-3 text-sm text-neutral-400">Пройдено {percent}%</div>
          <div className="space-y-4">
            {moduleList.map((m) => (
              <div key={m.id}>
                <div className="text-sm font-semibold text-gold">
                  {t(m.title)}
                </div>
                <ul className="mt-1 space-y-1">
                  {bySortOrder(
                    lessonList.filter((l) => l.module_id === m.id),
                  ).map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${course.slug}/${l.id}`}
                        className={`flex items-center gap-2 text-sm ${
                          l.id === current.id
                            ? "text-neutral-100"
                            : "text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <span
                          className={
                            doneSet.has(l.id) ? "text-green-400" : "text-neutral-600"
                          }
                        >
                          ●
                        </span>
                        {t(l.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {percent === 100 && (
            <Link
              href={`/certificate/${course.id}`}
              className="mt-6 inline-block rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink"
            >
              Получить сертификат
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}

function NotAvailable({ slug }: { slug: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-neutral-300">
        Этот урок недоступен. Возможно, курс не куплен.
      </p>
      <Link
        href={`/courses/${slug}`}
        className="mt-4 inline-block text-gold hover:underline"
      >
        Открыть страницу курса →
      </Link>
    </main>
  );
}
