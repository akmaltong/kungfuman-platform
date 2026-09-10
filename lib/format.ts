// Презентационные хелперы. Отображение времени всегда конвертируется в таймзону
// школы (правило 7 из CLAUDE.md).

export const DOW_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;

/** Название дня недели (0..6, 0 = воскресенье). */
export function dowLabel(dow: number): string {
  return DOW_RU[dow] ?? String(dow);
}

/** Дата и время из ISO-строки (timestamptz) в таймзоне школы. */
export function formatDateTime(
  iso: string,
  timeZone = "Asia/Dushanbe",
): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Только время (ЧЧ:ММ) из ISO-строки в таймзоне школы. */
export function formatTime(iso: string, timeZone = "Asia/Dushanbe"): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
