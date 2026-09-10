import { requireUser } from "@/lib/supabase/context";
import { formatMoney, toCsv } from "@/lib/domain/billing";

export const dynamic = "force-dynamic";

interface PaymentRow {
  profile_id: string;
  amount_minor: number;
  currency: string;
  provider: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

// Экспорт платежей школы в CSV для бухгалтерии. Доступ — только персонал (RLS
// на payments уже ограничивает выборку своей школой).
export async function GET() {
  const { supabase } = await requireUser();

  const [{ data: payments }, { data: students }] = await Promise.all([
    supabase
      .from("payments")
      .select("profile_id, amount_minor, currency, provider, status, paid_at, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const name = new Map(
    ((students ?? []) as { id: string; full_name: string | null }[]).map((s) => [
      s.id,
      s.full_name ?? "",
    ]),
  );

  const rows = ((payments ?? []) as PaymentRow[]).map((p) => ({
    created_at: p.created_at,
    paid_at: p.paid_at ?? "",
    student: name.get(p.profile_id) ?? "",
    amount: formatMoney(p.amount_minor, p.currency),
    provider: p.provider,
    status: p.status,
  }));

  const csv = toCsv(rows, [
    { key: "created_at", label: "Создан" },
    { key: "paid_at", label: "Оплачен" },
    { key: "student", label: "Ученик" },
    { key: "amount", label: "Сумма" },
    { key: "provider", label: "Способ" },
    { key: "status", label: "Статус" },
  ]);

  // BOM для корректной кириллицы в Excel.
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payments-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
