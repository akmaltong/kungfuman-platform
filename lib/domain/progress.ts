// Прогресс ученика — чистые функции.

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export interface PracticeProgressLike {
  practice_id: string;
  status: ProgressStatus;
}

/**
 * Процент освоения уровня: доля практик со статусом completed.
 * totalPractices — сколько практик всего на уровне.
 */
export function levelCompletionPercent(
  progress: PracticeProgressLike[],
  totalPractices: number,
): number {
  if (totalPractices <= 0) return 0;
  const done = progress.filter((p) => p.status === "completed").length;
  return Math.round((Math.min(done, totalPractices) / totalPractices) * 100);
}
