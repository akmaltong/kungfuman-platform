import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { setLeadStatus } from "./actions";

export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "новый" },
  { value: "contacted", label: "связались" },
  { value: "trial_booked", label: "записан на пробное" },
  { value: "trial_attended", label: "был на пробном" },
  { value: "converted", label: "стал учеником" },
  { value: "lost", label: "потерян" },
];

export default async function LeadsPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("leads")
    .select("id, full_name, phone, source, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const leads = (data ?? []) as LeadRow[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Заявки</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Записи с публичной формы и из других источников. Веди по воронке.
      </p>

      <ul className="mt-6 space-y-2">
        {leads.length === 0 && (
          <li className="text-neutral-500">Пока нет заявок.</li>
        )}
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
          >
            <div>
              <div className="text-neutral-100">
                {lead.full_name || "Без имени"}
                {lead.phone && (
                  <span className="ml-2 text-sm text-neutral-500">
                    {lead.phone}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-600">
                {lead.source ?? "—"} · {formatDateTime(lead.created_at)}
              </div>
            </div>
            <form action={setLeadStatus} className="flex items-center gap-2">
              <input type="hidden" name="id" value={lead.id} />
              <select
                name="status"
                defaultValue={lead.status}
                className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md border border-ink-muted px-3 py-1.5 text-sm text-neutral-300 hover:border-gold/50"
              >
                Сохранить
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
