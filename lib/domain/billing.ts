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
