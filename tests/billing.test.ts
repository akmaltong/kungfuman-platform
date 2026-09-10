import { describe, expect, it } from "vitest";

import {
  daysUntil,
  formatMoney,
  isExpiringWithin,
  isSubscriptionActive,
  remainingSessions,
  toCsv,
  type SubscriptionLike,
} from "@/lib/domain/billing";

const base: SubscriptionLike = {
  status: "active",
  starts_at: null,
  ends_at: null,
  sessions_total: 8,
  sessions_used: 3,
};

describe("billing", () => {
  it("считает остаток занятий", () => {
    expect(remainingSessions(base)).toBe(5);
    expect(remainingSessions({ ...base, sessions_used: 10 })).toBe(0);
    expect(remainingSessions({ ...base, sessions_total: null })).toBeNull();
  });

  it("определяет активность абонемента", () => {
    expect(isSubscriptionActive(base)).toBe(true);
    expect(isSubscriptionActive({ ...base, status: "expired" })).toBe(false);
    expect(
      isSubscriptionActive({ ...base, sessions_used: 8 }),
    ).toBe(false);
    expect(
      isSubscriptionActive({ ...base, ends_at: "2000-01-01" }),
    ).toBe(false);
  });

  it("форматирует деньги из минорных единиц", () => {
    // 12000 дирам = 120 сомони
    expect(formatMoney(12000, "TJS")).toBe("120 TJS");
    expect(formatMoney(12050, "TJS")).toBe("120,5 TJS");
  });

  it("daysUntil считает разницу в днях", () => {
    const from = new Date("2026-09-10T08:00:00Z");
    expect(daysUntil("2026-09-15", from)).toBe(5);
    expect(daysUntil("2026-09-10", from)).toBe(0);
    expect(daysUntil("2026-09-08", from)).toBe(-2);
    expect(daysUntil(null, from)).toBeNull();
  });

  it("isExpiringWithin ловит заканчивающиеся на неделе", () => {
    const from = new Date("2026-09-10T08:00:00Z");
    const dated: SubscriptionLike = { ...base, ends_at: "2026-09-14" };
    expect(isExpiringWithin(dated, 7, from)).toBe(true);
    expect(isExpiringWithin({ ...dated, ends_at: "2026-09-30" }, 7, from)).toBe(false);
    // безлимитный по датам — не заканчивается
    expect(isExpiringWithin(base, 7, from)).toBe(false);
  });

  it("toCsv экранирует запятые и кавычки", () => {
    const csv = toCsv(
      [{ name: 'Иванов, "младший"', amount: 120 }],
      [
        { key: "name", label: "Имя" },
        { key: "amount", label: "Сумма" },
      ],
    );
    expect(csv).toBe('Имя,Сумма\r\n"Иванов, ""младший""",120');
  });
});
