import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  isExpiringWithin,
  isSubscriptionActive,
  remainingSessions,
  daysUntil,
  type SubscriptionLike,
} from "@/lib/domain/billing";

export const dynamic = "force-dynamic";

interface SubRow extends SubscriptionLike {
  id: string;
  profile_id: string;
}
interface Student {
  id: string;
  full_name: string | null;
}

export default async function DashboardPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data: subs }, { data: students }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, profile_id, status, starts_at, ends_at, sessions_total, sessions_used"),
    supabase.from("profiles").select("id, full_name").eq("role", "student"),
  ]);

  const subList = (subs ?? []) as SubRow[];
  const studentList = (students ?? []) as Student[];
  const name = new Map(studentList.map((s) => [s.id, s.full_name ?? "—"]));

  const active = subList.filter((s) => isSubscriptionActive(s));
  const activeProfileIds = new Set(active.map((s) => s.profile_id));
  const expiring = active.filter((s) => isExpiringWithin(s, 7));
  const debtors = studentList.filter((s) => !activeProfileIds.has(s.id));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Дашборд</h1>

      {/* Метрики */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric value={active.length} label="активных абонементов" />
        <Metric value={expiring.length} label="заканчиваются за неделю" accent />
        <Metric value={debtors.length} label="без активного абонемента" />
      </div>

      {/* Заканчивающиеся */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-neutral-100">
          Заканчиваются на этой неделе
        </h2>
        <ul className="mt-3 space-y-2">
          {expiring.length === 0 && (
            <li className="text-neutral-500">Ничего не горит.</li>
          )}
          {expiring.map((s) => {
            const left = daysUntil(s.ends_at);
            const rem = remainingSessions(s);
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-ink-soft p-4"
              >
                <Link
                  href={`/students/${s.profile_id}`}
                  className="text-neutral-100 hover:text-gold"
                >
                  {name.get(s.profile_id) ?? "—"}
                </Link>
                <span className="text-sm text-neutral-400">
                  {left !== null && `осталось ${left} дн.`}
                  {rem !== null && ` · ${rem} занятий`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Должники */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-neutral-100">
          Без активного абонемента
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {debtors.length === 0 && (
            <li className="text-neutral-500">Все с абонементами.</li>
          )}
          {debtors.map((s) => (
            <li key={s.id}>
              <Link
                href={`/students/${s.id}`}
                className="rounded-full border border-ink-muted px-3 py-1 text-sm text-neutral-300 hover:border-gold/40"
              >
                {s.full_name ?? "—"}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Metric({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-ink-soft p-5 ${
        accent ? "border-gold/40" : "border-ink-muted"
      }`}
    >
      <div
        className={`text-4xl font-semibold tabular-nums ${
          accent ? "text-gold" : "text-neutral-100"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-neutral-400">{label}</div>
    </div>
  );
}
