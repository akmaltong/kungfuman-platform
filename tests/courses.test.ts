import { describe, expect, it } from "vitest";

import {
  courseCompletionPercent,
  isCourseComplete,
  nextLesson,
  watchStatus,
  type LessonLite,
  type LessonProgressLite,
} from "@/lib/domain/courses";

const lessons: LessonLite[] = [
  { id: "a", is_preview: true },
  { id: "b", is_preview: false },
  { id: "c", is_preview: false },
  { id: "d", is_preview: false },
];

describe("courses", () => {
  it("считает процент прохождения", () => {
    const progress: LessonProgressLite[] = [
      { lesson_id: "a", status: "completed" },
      { lesson_id: "b", status: "completed" },
      { lesson_id: "c", status: "in_progress" },
    ];
    expect(courseCompletionPercent(lessons, progress)).toBe(50);
    expect(courseCompletionPercent([], progress)).toBe(0);
  });

  it("isCourseComplete только при 100%", () => {
    const all: LessonProgressLite[] = lessons.map((l) => ({
      lesson_id: l.id,
      status: "completed",
    }));
    expect(isCourseComplete(lessons, all)).toBe(true);
    expect(isCourseComplete(lessons, all.slice(0, 2))).toBe(false);
    expect(isCourseComplete([], [])).toBe(false);
  });

  it("nextLesson находит первый незавершённый по порядку", () => {
    const progress: LessonProgressLite[] = [
      { lesson_id: "a", status: "completed" },
      { lesson_id: "b", status: "completed" },
    ];
    expect(nextLesson(["a", "b", "c", "d"], progress)).toBe("c");
    const done = lessons.map((l) => ({
      lesson_id: l.id,
      status: "completed" as const,
    }));
    expect(nextLesson(["a", "b", "c", "d"], done)).toBeNull();
  });

  it("watchStatus по доле просмотра (порог 90%)", () => {
    expect(watchStatus(0, 100)).toBe("not_started");
    expect(watchStatus(50, 100)).toBe("in_progress");
    expect(watchStatus(91, 100)).toBe("completed");
    expect(watchStatus(10, null)).toBe("in_progress");
  });
});
