import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { formatMoney } from "@/lib/domain/billing";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  confirmPayment,
  issueSubscription,
  rejectPayment,
} from "./actions";

export const dynamic = "force-dynamic";

interface PaymentRow {
  id: string;
  profile_id: string;
  amount_minor: number;
  currency: string;
  provider: string;
  status: string;
  created_at: string;
}
interface Named {
  id: string;
  full_name?: string | null;
  title?: Localized;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "ожидает",
  succeeded: "подтверждён",
  failed: "отклонён",
  refunded: "возврат",
};

export default async function PaymentsPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data: payments }, { data: students }, { data: products }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("id, profile_id, amount_minor, currency, provider, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student")
        .order("full_name"),
      supabase.from("products").select("id, title").eq("is_active", true),
    ]);

  const studentName = new Map(
    ((students ?? []) as Named[]).map((s) => [s.id, s.full_name ?? "—"]),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Платежи</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Оформи абонемент, затем подтверди перевод — абонемент активируется, а
        занятия начнут списываться автоматически.
        <Link href="/api/payments/export" className="ml-2 text-gold hover:underline">
          Экспорт в CSV
        </Link>
      </p>

      {/* Оформить абонемент */}
      <form
        action={issueSubscription}
        className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4"
      >
        <select
          name="profile_id"
          required
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="">— ученик —</option>
          {((students ?? []) as Named[]).map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name ?? "—"}
            </option>
          ))}
        </select>
        <select
          name="product_id"
          required
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="">— продукт —</option>
          {((products ?? []) as Named[]).map((p) => (
            <option key={p.id} value={p.id}>
              {t(p.title)}
            </option>
          ))}
        </select>
        <select
          name="provider"
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="alif">Алиф</option>
          <option value="dc_wallet">DC Wallet</option>
          <option value="korti_milli">Корти Милли</option>
          <option value="cash">Наличные</option>
          <option value="manual">Вручную</option>
        </select>
        <Button type="submit">Оформить</Button>
      </form>

      <ul className="mt-8 space-y-2">
        {((payments ?? []) as PaymentRow[]).length === 0 && (
          <li className="text-neutral-500">Пока нет платежей.</li>
        )}
        {((payments ?? []) as PaymentRow[]).map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
          >
            <div>
              <div className="text-neutral-100">
                {studentName.get(p.profile_id) ?? "—"} ·{" "}
                {formatMoney(p.amount_minor, p.currency)}
              </div>
              <div className="text-sm text-neutral-500">
                {p.provider} · {formatDateTime(p.created_at)} ·{" "}
                <span
                  className={
                    p.status === "succeeded"
                      ? "text-green-400"
                      : p.status === "failed"
                        ? "text-red-400"
                        : "text-gold"
                  }
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
            </div>
            {p.status === "pending" && (
              <div className="flex items-center gap-2">
                <form action={confirmPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit">Подтвердить</Button>
                </form>
                <form action={rejectPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" variant="danger">
                    Отклонить
                  </Button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
