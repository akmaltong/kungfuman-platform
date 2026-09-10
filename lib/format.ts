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

/**
 * Смещение таймзоны от UTC в минутах (локальное − UTC) на конкретный момент.
 * Для 'Asia/Dushanbe' вернёт +300. Учитывает DST, если он есть в зоне.
 */
export function tzOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(at)) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour === 24 ? 0 : map.hour,
    map.minute,
    map.second,
  );
  return Math.round((asUTC - at.getTime()) / 60_000);
}

/** Только время (ЧЧ:ММ) из ISO-строки в таймзоне школы. */
export function formatTime(iso: string, timeZone = "Asia/Dushanbe"): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
