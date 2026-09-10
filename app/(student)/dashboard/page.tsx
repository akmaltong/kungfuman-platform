import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/supabase/context";
import { t, type Localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import {
  isSubscriptionActive,
  remainingSessions,
  daysUntil,
  type SubscriptionLike,
} from "@/lib/domain/billing";

export const dynamic = "force-dynamic";

interface Sub extends SubscriptionLike {
  id: string;
}
interface SessionRow {
  id: string;
  group_id: string | null;
  starts_at: string;
}

export default async function StudentDashboard() {
  const { supabase, userId } = await requireUser();
  const client = supabase as unknown as SupabaseClient;
  const nowIso = new Date().toISOString();

  const [{ data: profile }, { data: subs }, { data: sessions }, { data: groups }] =
    await Promise.all([
      client.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      client
        .from("subscriptions")
        .select("id, status, starts_at, ends_at, sessions_total, sessions_used")
        .eq("profile_id", userId),
      client
        .from("sessions")
        .select("id, group_id, starts_at")
        .gte("starts_at", nowIso)
        .order("starts_at")
        .limit(5),
      client.from("groups").select("id, title"),
    ]);

  const fullName =
    (profile as { full_name?: string | null } | null)?.full_name ?? "ученик";
  const activeSub = ((subs ?? []) as Sub[]).find((s) => isSubscriptionActive(s));
  const groupTitle = new Map(
    ((groups ?? []) as { id: string; title: Localized }[]).map((g) => [
      g.id,
      t(g.title),
    ]),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Привет, {fullName}</h1>

      {/* Абонемент */}
      <section className="mt-6 rounded-lg border border-ink-muted bg-ink-soft p-5">
        <h2 className="text-sm font-semibold text-gold">Абонемент</h2>
        {activeSub ? (
          <p className="mt-2 text-neutral-200">
            {remainingSessions(activeSub) === null
              ? "Безлимит"
              : `Осталось занятий: ${remainingSessions(activeSub)}`}
            {activeSub.ends_at &&
              ` · действует ещё ${daysUntil(activeSub.ends_at)} дн.`}
          </p>
        ) : (
          <p className="mt-2 text-neutral-400">
            Активного абонемента нет. Обратись к администратору.
          </p>
        )}
      </section>

      {/* Ближайшие занятия */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-100">
          Ближайшие занятия
        </h2>
        <ul className="mt-3 space-y-2">
          {((sessions ?? []) as SessionRow[]).length === 0 && (
            <li className="text-neutral-500">Пока нет запланированных занятий.</li>
          )}
          {((sessions ?? []) as SessionRow[]).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
            >
              <span className="text-neutral-100">{formatDateTime(s.starts_at)}</span>
              <span className="text-sm text-neutral-500">
                {s.group_id ? groupTitle.get(s.group_id) : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
