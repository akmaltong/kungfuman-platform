// Офлайн-контур — чистые функции. Без React и без Supabase-клиента.

export type AttendanceStatus =
  | "registered"
  | "present"
  | "absent"
  | "late"
  | "cancelled";

/** Присутствовал ли ученик (present или late — фактически был). */
export function wasPresent(status: AttendanceStatus): boolean {
  return status === "present" || status === "late";
}

export interface ScheduleSlot {
  dow: number; // день недели 0..6 (0 = воскресенье, как Date.getUTCDay)
  start: string; // "05:00" — локальное время школы
  dur: number; // длительность в минутах
}

/** Валидация одного слота расписания группы (schedule JSONB). */
export function isValidSlot(slot: ScheduleSlot): boolean {
  return (
    Number.isInteger(slot.dow) &&
    slot.dow >= 0 &&
    slot.dow <= 6 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start) &&
    slot.dur > 0
  );
}

/** Парсинг массива расписания из JSONB с отбрасыванием кривых слотов. */
export function parseSchedule(raw: unknown): ScheduleSlot[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is ScheduleSlot =>
      typeof s === "object" &&
      s !== null &&
      isValidSlot(s as ScheduleSlot),
  );
}

export interface GeneratedSession {
  starts_at: Date;
  ends_at: Date;
}

/**
 * Генерирует занятия из расписания группы на `weeks` недель вперёд, начиная с
 * даты `from` (включительно).
 *
 * Время в слотах — локальное время школы. Конвертация в абсолютный момент
 * (UTC) делается по фиксированному смещению `utcOffsetMinutes` (Душанбе = +300,
 * Москва = +180). В Таджикистане и РФ нет перехода на летнее время, поэтому
 * фиксированного смещения достаточно. Для зон с DST потребуется полноценная
 * tz-библиотека — см. DECISIONS при появлении такой школы.
 */
export function generateSessions(
  schedule: ScheduleSlot[],
  from: Date,
  weeks: number,
  utcOffsetMinutes: number,
): GeneratedSession[] {
  const valid = schedule.filter(isValidSlot);
  if (valid.length === 0 || weeks <= 0) return [];

  const days = weeks * 7;
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const d = from.getUTCDate();

  const result: GeneratedSession[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.UTC(y, m, d + i));
    const dow = date.getUTCDay();
    for (const slot of valid) {
      if (slot.dow !== dow) continue;
      const [hh, mm] = slot.start.split(":").map(Number);
      const localMs = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        hh,
        mm,
      );
      const starts = new Date(localMs - utcOffsetMinutes * 60_000);
      const ends = new Date(starts.getTime() + slot.dur * 60_000);
      result.push({ starts_at: starts, ends_at: ends });
    }
  }

  return result.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}
