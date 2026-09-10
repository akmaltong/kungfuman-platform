// Методика — чистые функции. Дисциплина → уровень → практика → критерий.
// Без React и без Supabase-клиента (правило 5 из CLAUDE.md).

import type { Localized } from "@/lib/i18n";

export interface Sortable {
  sort_order: number;
}

/** Стабильная сортировка по sort_order (по возрастанию). */
export function bySortOrder<T extends Sortable>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

/** Следующий уровень после текущего (1..7). null, если достигнут максимум. */
export function nextLevelNumber(current: number, max = 7): number | null {
  if (current >= max) return null;
  return current + 1;
}

/** Номер уровня валиден (1..7). */
export function isValidLevelNumber(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 7;
}

// --- Сборка дерева методики ---------------------------------------------------

export interface DisciplineRow {
  id: string;
  title: Localized;
  sort_order: number;
}

export interface LevelRow {
  id: string;
  discipline_id: string;
  number: number;
  title: Localized;
}

export interface PracticeRow {
  id: string;
  level_id: string;
  title: Localized;
  sort_order: number;
  status: string;
}

export interface PracticeNode extends PracticeRow {}
export interface LevelNode extends LevelRow {
  practices: PracticeNode[];
}
export interface DisciplineNode extends DisciplineRow {
  levels: LevelNode[];
}

/**
 * Собирает дерево дисциплина → уровень → практика.
 * Дисциплины сортируются по sort_order, уровни по number, практики по sort_order.
 */
export function buildCurriculumTree(
  disciplines: DisciplineRow[],
  levels: LevelRow[],
  practices: PracticeRow[],
): DisciplineNode[] {
  const practicesByLevel = new Map<string, PracticeRow[]>();
  for (const p of practices) {
    const arr = practicesByLevel.get(p.level_id);
    if (arr) arr.push(p);
    else practicesByLevel.set(p.level_id, [p]);
  }

  const levelsByDiscipline = new Map<string, LevelRow[]>();
  for (const l of levels) {
    const arr = levelsByDiscipline.get(l.discipline_id);
    if (arr) arr.push(l);
    else levelsByDiscipline.set(l.discipline_id, [l]);
  }

  return bySortOrder(disciplines).map((d) => ({
    ...d,
    levels: (levelsByDiscipline.get(d.id) ?? [])
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((l) => ({
        ...l,
        practices: bySortOrder(practicesByLevel.get(l.id) ?? []),
      })),
  }));
}

// --- Переупорядочивание -------------------------------------------------------

export type MoveDirection = "up" | "down";

/**
 * Двигает элемент вверх/вниз в списке, отсортированном по sort_order, и
 * возвращает НОВЫЙ список с нормализованными sort_order (0..n-1).
 * Если сдвиг невозможен (край списка или элемент не найден) — список
 * возвращается с нормализованными sort_order без перестановки.
 */
export function moveItem<T extends Sortable & { id: string }>(
  items: T[],
  id: string,
  direction: MoveDirection,
): T[] {
  const sorted = bySortOrder(items);
  const index = sorted.findIndex((i) => i.id === id);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index !== -1 && target >= 0 && target < sorted.length) {
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
  }

  return sorted.map((item, i) => ({ ...item, sort_order: i }));
}

/**
 * Возвращает только те элементы, у которых sort_order изменился, — для
 * минимального апдейта в БД.
 */
export function changedSortOrders<T extends Sortable & { id: string }>(
  before: T[],
  after: T[],
): { id: string; sort_order: number }[] {
  const prev = new Map(before.map((i) => [i.id, i.sort_order]));
  return after
    .filter((i) => prev.get(i.id) !== i.sort_order)
    .map((i) => ({ id: i.id, sort_order: i.sort_order }));
}
