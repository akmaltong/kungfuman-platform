// Онлайн-курсы — чистые функции. Курс → модуль → урок; прогресс по урокам.

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface LessonLite {
  id: string;
  is_preview: boolean;
}
export interface LessonProgressLite {
  lesson_id: string;
  status: LessonProgressStatus;
}

/** Процент прохождения курса: доля завершённых уроков от всех. */
export function courseCompletionPercent(
  lessons: LessonLite[],
  progress: LessonProgressLite[],
): number {
  if (lessons.length === 0) return 0;
  const done = new Set(
    progress.filter((p) => p.status === "completed").map((p) => p.lesson_id),
  );
  const completed = lessons.filter((l) => done.has(l.id)).length;
  return Math.round((completed / lessons.length) * 100);
}

/** Курс пройден, когда завершены все уроки. */
export function isCourseComplete(
  lessons: LessonLite[],
  progress: LessonProgressLite[],
): boolean {
  return lessons.length > 0 && courseCompletionPercent(lessons, progress) === 100;
}

/**
 * Следующий незавершённый урок в заданном порядке. null, если всё пройдено или
 * список пуст.
 */
export function nextLesson(
  orderedLessonIds: string[],
  progress: LessonProgressLite[],
): string | null {
  const done = new Set(
    progress.filter((p) => p.status === "completed").map((p) => p.lesson_id),
  );
  return orderedLessonIds.find((id) => !done.has(id)) ?? null;
}

/**
 * Статус просмотра по доле просмотренного времени. Порог завершения — 90%.
 */
export function watchStatus(
  watchedSec: number,
  durationSec: number | null,
): LessonProgressStatus {
  if (watchedSec <= 0) return "not_started";
  if (durationSec && watchedSec >= durationSec * 0.9) return "completed";
  return "in_progress";
}
