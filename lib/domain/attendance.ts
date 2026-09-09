// Офлайн-контур — чистые функции. Полноценно наполняется на этапе 3.

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
  dow: number; // день недели 0..6 (0 = воскресенье)
  start: string; // "05:00"
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
