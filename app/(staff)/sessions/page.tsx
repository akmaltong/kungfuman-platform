import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelSession, generateGroupSessions } from "./actions";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  group_id: string | null;
  starts_at: string;
  ends_at: string;
  is_cancelled: boolean;
}
interface GroupRow {
  id: string;
  title: Localized;
}

export default async function SessionsPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const nowIso = new Date().toISOString();

  const [{ data: school }, { data: sessions }, { data: groups }] =
    await Promise.all([
      supabase.from("schools").select("timezone").limit(1).maybeSingle(),
      supabase
        .from("sessions")
        .select("id, group_id, starts_at, ends_at, is_cancelled")
        .gte("starts_at", nowIso)
        .order("starts_at")
        .limit(100),
      supabase.from("groups").select("id, title"),
    ]);

  const tz = (school as { timezone?: string } | null)?.timezone ?? "Asia/Dushanbe";
  const groupTitle = new Map(
    ((groups ?? []) as GroupRow[]).map((g) => [g.id, t(g.title)]),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Занятия</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Сгенерируй занятия из расписания группы, затем отмечай посещаемость.
      </p>

      {/* Генерация */}
      <form
        action={generateGroupSessions}
        className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4"
      >
        <select
          name="group_id"
          required
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="">— группа —</option>
          {((groups ?? []) as GroupRow[]).map((g) => (
            <option key={g.id} value={g.id}>
              {t(g.title)}
            </option>
          ))}
        </select>
        <Input name="weeks" type="number" min={1} max={12} defaultValue={4} className="w-24" />
        <span className="text-sm text-neutral-500">недель</span>
        <Button type="submit">Сгенерировать</Button>
      </form>

      <ul className="mt-8 space-y-2">
        {((sessions ?? []) as SessionRow[]).length === 0 && (
          <li className="text-neutral-500">Нет предстоящих занятий.</li>
        )}
        {((sessions ?? []) as SessionRow[]).map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
          >
            <div>
              <div className="text-neutral-100">
                {formatDateTime(s.starts_at, tz)}
                {s.is_cancelled && (
                  <span className="ml-2 text-sm text-red-400">отменено</span>
                )}
              </div>
              <div className="text-sm text-neutral-500">
                {s.group_id ? (groupTitle.get(s.group_id) ?? "—") : "без группы"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/attendance/${s.id}`}>
                <Button variant="ghost">Посещаемость</Button>
              </Link>
              {!s.is_cancelled && (
                <form action={cancelSession}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button type="submit" variant="danger">
                    Отменить
                  </Button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
