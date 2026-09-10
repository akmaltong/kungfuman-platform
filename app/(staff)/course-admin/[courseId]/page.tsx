import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { bySortOrder } from "@/lib/domain/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  toggleLessonPreview,
} from "../actions";

export const dynamic = "force-dynamic";

interface Course {
  id: string;
  title: Localized;
  slug: string;
  status: string;
  discipline_id: string | null;
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
interface Named {
  id: string;
  title?: Localized;
  external_id?: string;
  media_title?: string | null;
}

export default async function CourseEditor({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data: courseData } = await supabase
    .from("courses")
    .select("id, title, slug, status, discipline_id")
    .eq("id", courseId)
    .maybeSingle();
  if (!courseData) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-neutral-400">Курс не найден.</p>
      </main>
    );
  }
  const course = courseData as Course;

  const [{ data: modules }, { data: media }] = await Promise.all([
    supabase
      .from("course_modules")
      .select("id, title, sort_order")
      .eq("course_id", courseId),
    supabase.from("media_assets").select("id, external_id, title"),
  ]);

  const moduleList = bySortOrder((modules ?? []) as ModuleRow[]);
  const moduleIds = moduleList.map((m) => m.id);
  const { data: lessons } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id, module_id, title, is_preview, duration_min, sort_order")
        .in("module_id", moduleIds)
    : { data: [] as LessonRow[] };
  const lessonList = (lessons ?? []) as LessonRow[];

  // Практики дисциплины курса — для привязки урока к методике.
  let practices: Named[] = [];
  if (course.discipline_id) {
    const { data: levels } = await supabase
      .from("levels")
      .select("id")
      .eq("discipline_id", course.discipline_id);
    const levelIds = ((levels ?? []) as { id: string }[]).map((l) => l.id);
    if (levelIds.length) {
      const { data: pr } = await supabase
        .from("practices")
        .select("id, title")
        .in("level_id", levelIds);
      practices = (pr ?? []) as Named[];
    }
  }

  const mediaList = ((media ?? []) as {
    id: string;
    external_id: string;
    title: string | null;
  }[]).map((m) => ({ id: m.id, external_id: m.external_id, media_title: m.title }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/course-admin" className="text-sm text-gold hover:underline">
        ← Курсы
      </Link>
      <h1 className="mt-2 text-3xl font-semibold text-neutral-100">
        {t(course.title)}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        /{course.slug} · {course.status}
      </p>

      {/* Добавить модуль */}
      <form action={createModule} className="mt-6 flex items-center gap-2">
        <input type="hidden" name="course_id" value={course.id} />
        <Input name="title_ru" placeholder="Название модуля" required />
        <Button type="submit">+ Модуль</Button>
      </form>

      <div className="mt-8 space-y-6">
        {moduleList.map((module) => {
          const moduleLessons = bySortOrder(
            lessonList.filter((l) => l.module_id === module.id),
          );
          return (
            <section
              key={module.id}
              className="rounded-lg border border-ink-muted bg-ink-soft p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg text-neutral-100">{t(module.title)}</h2>
                <form action={deleteModule}>
                  <input type="hidden" name="id" value={module.id} />
                  <input type="hidden" name="course_id" value={course.id} />
                  <Button type="submit" variant="danger">
                    Удалить
                  </Button>
                </form>
              </div>

              <ul className="mt-3 space-y-2">
                {moduleLessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex flex-wrap items-center gap-2 rounded border border-ink-muted p-2"
                  >
                    <span className="text-neutral-200">{t(lesson.title)}</span>
                    {lesson.is_preview && (
                      <span className="rounded-full border border-gold/30 px-2 py-0.5 text-xs text-gold">
                        превью
                      </span>
                    )}
                    {lesson.duration_min && (
                      <span className="text-xs text-neutral-600">
                        {lesson.duration_min} мин
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <form action={toggleLessonPreview}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <input type="hidden" name="course_id" value={course.id} />
                        <input
                          type="hidden"
                          name="is_preview"
                          value={(!lesson.is_preview).toString()}
                        />
                        <Button type="submit" variant="ghost">
                          {lesson.is_preview ? "Убрать превью" : "Сделать превью"}
                        </Button>
                      </form>
                      <form action={deleteLesson}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <input type="hidden" name="course_id" value={course.id} />
                        <Button type="submit" variant="danger">
                          ✕
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Добавить урок */}
              <form
                action={createLesson}
                className="mt-3 grid gap-2 sm:grid-cols-2"
              >
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="module_id" value={module.id} />
                <Input name="title_ru" placeholder="Название урока" required />
                <select
                  name="media_asset_id"
                  className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
                >
                  <option value="">— видео —</option>
                  {mediaList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.media_title || m.external_id}
                    </option>
                  ))}
                </select>
                <select
                  name="practice_id"
                  className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
                >
                  <option value="">— практика (методика) —</option>
                  {practices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {t(p.title)}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Input
                    name="duration_min"
                    type="number"
                    min={1}
                    placeholder="мин"
                    className="w-24"
                  />
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input type="checkbox" name="is_preview" className="accent-gold" />
                    превью
                  </label>
                  <Button type="submit" variant="ghost">
                    + Урок
                  </Button>
                </div>
              </form>
            </section>
          );
        })}
        {moduleList.length === 0 && (
          <p className="text-neutral-500">Добавь первый модуль.</p>
        )}
      </div>
    </main>
  );
}
