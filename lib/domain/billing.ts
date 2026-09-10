// Деньги — чистые функции. Суммы всегда в минорных единицах (bigint в БД,
// number здесь) + отдельный код валюты. Никаких float для хранения.

export interface SubscriptionLike {
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  sessions_total: number | null;
  sessions_used: number;
}

/** Активен ли абонемент на дату (по умолчанию сегодня). */
export function isSubscriptionActive(
  sub: SubscriptionLike,
  on: Date = new Date(),
): boolean {
  if (sub.status !== "active") return false;
  const day = on.toISOString().slice(0, 10);
  if (sub.starts_at && sub.starts_at > day) return false;
  if (sub.ends_at && sub.ends_at < day) return false;
  if (sub.sessions_total !== null && sub.sessions_used >= sub.sessions_total) {
    return false;
  }
  return true;
}

/** Остаток занятий: null = безлимит. Никогда не отрицательный. */
export function remainingSessions(sub: SubscriptionLike): number | null {
  if (sub.sessions_total === null) return null;
  return Math.max(0, sub.sessions_total - sub.sessions_used);
}

/** Форматирование суммы из минорных единиц в строку с валютой. */
export function formatMoney(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(major);
  return `${formatted} ${currency}`;
}

/**
 * Сколько дней до даты (в днях, по датам без времени). Отрицательное — дата в
 * прошлом. null, если даты нет.
 */
export function daysUntil(
  dateIso: string | null,
  from: Date = new Date(),
): number | null {
  if (!dateIso) return null;
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const target = new Date(dateIso + "T00:00:00Z");
  return Math.round((day(target) - day(from)) / 86_400_000);
}

/**
 * Заканчивается ли активный абонемент в ближайшие `days` дней (включая сегодня).
 * Безлимитный по датам (ends_at = null) — не «заканчивается».
 */
export function isExpiringWithin(
  sub: SubscriptionLike,
  days: number,
  from: Date = new Date(),
): boolean {
  if (!isSubscriptionActive(sub, from)) return false;
  const left = daysUntil(sub.ends_at, from);
  return left !== null && left >= 0 && left <= days;
}

/**
 * Сборка CSV из строк. Значения экранируются по RFC 4180 (кавычки, запятые,
 * переводы строк). Первая строка — заголовки.
 */
export function toCsv(
  rows: Record<string, string | number | null>[],
  headers: { key: string; label: string }[],
): string {
  const esc = (v: string | number | null): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = headers.map((h) => esc(h.label)).join(",");
  const body = rows.map((r) => headers.map((h) => esc(r[h.key])).join(","));
  return [head, ...body].join("\r\n");
}
