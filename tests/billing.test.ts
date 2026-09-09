import { describe, expect, it } from "vitest";

import {
  formatMoney,
  isSubscriptionActive,
  remainingSessions,
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
});
