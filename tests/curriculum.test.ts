import { describe, expect, it } from "vitest";

import {
  buildCurriculumTree,
  bySortOrder,
  changedSortOrders,
  isValidLevelNumber,
  moveItem,
  nextLevelNumber,
  type DisciplineRow,
  type LevelRow,
  type PracticeRow,
} from "@/lib/domain/curriculum";

describe("curriculum: сортировка и уровни", () => {
  it("bySortOrder не мутирует исходный массив", () => {
    const src = [
      { id: "b", sort_order: 2 },
      { id: "a", sort_order: 1 },
    ];
    const sorted = bySortOrder(src);
    expect(sorted.map((i) => i.id)).toEqual(["a", "b"]);
    expect(src[0].id).toBe("b"); // исходный порядок сохранён
  });

  it("nextLevelNumber уважает потолок в 7", () => {
    expect(nextLevelNumber(1)).toBe(2);
    expect(nextLevelNumber(7)).toBeNull();
  });

  it("isValidLevelNumber", () => {
    expect(isValidLevelNumber(1)).toBe(true);
    expect(isValidLevelNumber(7)).toBe(true);
    expect(isValidLevelNumber(0)).toBe(false);
    expect(isValidLevelNumber(8)).toBe(false);
    expect(isValidLevelNumber(1.5)).toBe(false);
  });
});

describe("curriculum: дерево", () => {
  const disciplines: DisciplineRow[] = [
    { id: "d1", title: { ru: "Цигун" }, sort_order: 1 },
    { id: "d0", title: { ru: "Нэйгун" }, sort_order: 0 },
  ];
  const levels: LevelRow[] = [
    { id: "l2", discipline_id: "d1", number: 2, title: { ru: "Уровень 2" } },
    { id: "l1", discipline_id: "d1", number: 1, title: { ru: "Уровень 1" } },
  ];
  const practices: PracticeRow[] = [
    { id: "p2", level_id: "l1", title: { ru: "Б" }, sort_order: 1, status: "published" },
    { id: "p1", level_id: "l1", title: { ru: "А" }, sort_order: 0, status: "draft" },
  ];

  it("сортирует дисциплины, уровни и практики", () => {
    const tree = buildCurriculumTree(disciplines, levels, practices);
    expect(tree.map((d) => d.id)).toEqual(["d0", "d1"]);
    const cigun = tree.find((d) => d.id === "d1")!;
    expect(cigun.levels.map((l) => l.number)).toEqual([1, 2]);
    expect(cigun.levels[0].practices.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("пустые уровни/практики не ломают дерево", () => {
    const tree = buildCurriculumTree(disciplines, [], []);
    expect(tree[0].levels).toEqual([]);
  });
});

describe("curriculum: переупорядочивание", () => {
  const items = [
    { id: "a", sort_order: 0 },
    { id: "b", sort_order: 1 },
    { id: "c", sort_order: 2 },
  ];

  it("двигает элемент вниз и нормализует sort_order", () => {
    const after = moveItem(items, "a", "down");
    expect(after.map((i) => i.id)).toEqual(["b", "a", "c"]);
    expect(after.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });

  it("двигает элемент вверх", () => {
    const after = moveItem(items, "c", "up");
    expect(after.map((i) => i.id)).toEqual(["a", "c", "b"]);
  });

  it("на краю списка порядок не меняется", () => {
    const after = moveItem(items, "a", "up");
    expect(after.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("changedSortOrders возвращает только изменённые", () => {
    const after = moveItem(items, "a", "down");
    const changed = changedSortOrders(items, after);
    expect(changed.sort((x, y) => x.id.localeCompare(y.id))).toEqual([
      { id: "a", sort_order: 1 },
      { id: "b", sort_order: 0 },
    ]);
  });
});
