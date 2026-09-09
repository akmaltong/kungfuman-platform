// Методика — чистые функции. Дисциплина → уровень → практика → критерий.

export interface Sortable {
  sort_order: number;
}

/** Стабильная сортировка по sort_order (по возрастанию). */
export function bySortOrder<T extends Sortable>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export interface LevelLike {
  number: number;
}

/** Следующий уровень после текущего (1..7). null, если достигнут максимум. */
export function nextLevelNumber(
  current: number,
  max = 7,
): number | null {
  if (current >= max) return null;
  return current + 1;
}
