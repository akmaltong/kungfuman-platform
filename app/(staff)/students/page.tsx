import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
}

export default async function StudentsPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, is_active")
    .eq("role", "student")
    .order("full_name");
  const students = (data ?? []) as StudentRow[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Ученики</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {students.length} чел. Нажми на карточку, чтобы увидеть прогресс и
        историю.
      </p>

      <ul className="mt-6 space-y-2">
        {students.length === 0 && (
          <li className="text-neutral-500">Пока нет учеников.</li>
        )}
        {students.map((s) => (
          <li key={s.id}>
            <Link
              href={`/students/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4 hover:border-gold/40"
            >
              <span className="text-neutral-100">
                {s.full_name ?? "Без имени"}
                {!s.is_active && (
                  <span className="ml-2 text-xs text-neutral-500">
                    неактивен
                  </span>
                )}
              </span>
              <span className="text-sm text-neutral-500">{s.phone ?? ""}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
