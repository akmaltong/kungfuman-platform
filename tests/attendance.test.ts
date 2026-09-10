import { describe, expect, it } from "vitest";

import {
  generateSessions,
  isValidSlot,
  parseSchedule,
  wasPresent,
  type ScheduleSlot,
} from "@/lib/domain/attendance";

describe("attendance: базовое", () => {
  it("wasPresent", () => {
    expect(wasPresent("present")).toBe(true);
    expect(wasPresent("late")).toBe(true);
    expect(wasPresent("absent")).toBe(false);
    expect(wasPresent("registered")).toBe(false);
  });

  it("isValidSlot", () => {
    expect(isValidSlot({ dow: 1, start: "05:00", dur: 90 })).toBe(true);
    expect(isValidSlot({ dow: 7, start: "05:00", dur: 90 })).toBe(false);
    expect(isValidSlot({ dow: 1, start: "25:00", dur: 90 })).toBe(false);
    expect(isValidSlot({ dow: 1, start: "05:00", dur: 0 })).toBe(false);
  });

  it("parseSchedule отбрасывает кривые слоты", () => {
    const raw = [
      { dow: 1, start: "05:00", dur: 90 },
      { dow: 9, start: "05:00", dur: 90 },
      "мусор",
      null,
    ];
    expect(parseSchedule(raw)).toEqual([{ dow: 1, start: "05:00", dur: 90 }]);
    expect(parseSchedule("не массив")).toEqual([]);
  });
});

describe("attendance: генерация занятий", () => {
  // Понедельник 05:00 по Душанбе (UTC+5) = воскресенье 00:00 UTC.
  const schedule: ScheduleSlot[] = [{ dow: 1, start: "05:00", dur: 90 }];
  const dushanbe = 300;

  it("генерирует по одному занятию в неделю на 4 недели", () => {
    // from = понедельник 2026-09-07 (UTC)
    const from = new Date(Date.UTC(2026, 8, 7));
    const sessions = generateSessions(schedule, from, 4, dushanbe);
    expect(sessions).toHaveLength(4);
  });

  it("конвертирует локальное время школы в UTC по офсету", () => {
    const from = new Date(Date.UTC(2026, 8, 7)); // Пн
    const [first] = generateSessions(schedule, from, 1, dushanbe);
    // 05:00 локально минус 5 часов = 00:00 UTC того же дня
    expect(first.starts_at.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    // +90 минут
    expect(first.ends_at.toISOString()).toBe("2026-09-07T01:30:00.000Z");
  });

  it("несколько слотов в неделю сортируются по времени", () => {
    const multi: ScheduleSlot[] = [
      { dow: 3, start: "19:00", dur: 60 },
      { dow: 1, start: "05:00", dur: 90 },
    ];
    const from = new Date(Date.UTC(2026, 8, 7));
    const sessions = generateSessions(multi, from, 2, dushanbe);
    expect(sessions).toHaveLength(4);
    for (let i = 1; i < sessions.length; i++) {
      expect(sessions[i].starts_at.getTime()).toBeGreaterThanOrEqual(
        sessions[i - 1].starts_at.getTime(),
      );
    }
  });

  it("пустое расписание или 0 недель → пусто", () => {
    const from = new Date(Date.UTC(2026, 8, 7));
    expect(generateSessions([], from, 4, dushanbe)).toEqual([]);
    expect(generateSessions(schedule, from, 0, dushanbe)).toEqual([]);
  });
});
