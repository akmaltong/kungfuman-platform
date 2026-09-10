import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVenue, deleteVenue } from "./actions";

export const dynamic = "force-dynamic";

interface VenueRow {
  id: string;
  name: Localized;
  address: string | null;
  is_outdoor: boolean;
}

// Площадки школы: набережная Сырдарьи, парк Камоли Худжанди и т.п.
export default async function VenuesPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("venues")
    .select("id, name, address, is_outdoor")
    .order("id");
  const venues = (data ?? []) as VenueRow[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Площадки</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Где проходят занятия. Уличные площадки помечаются отдельно.
      </p>

      <form
        action={createVenue}
        className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4"
      >
        <Input name="name_ru" placeholder="Название (Набережная Сырдарьи)" required />
        <Input name="address" placeholder="Адрес (необязательно)" />
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" name="is_outdoor" className="accent-gold" />
          На улице
        </label>
        <Button type="submit">+ Площадка</Button>
      </form>

      <ul className="mt-8 space-y-3">
        {venues.length === 0 && (
          <li className="text-neutral-500">Пока нет площадок.</li>
        )}
        {venues.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
          >
            <div>
              <div className="text-neutral-100">
                {t(v.name)}
                {v.is_outdoor && (
                  <span className="ml-2 rounded-full border border-gold/30 px-2 py-0.5 text-xs text-neutral-400">
                    на улице
                  </span>
                )}
              </div>
              {v.address && (
                <div className="text-sm text-neutral-500">{v.address}</div>
              )}
            </div>
            <form action={deleteVenue}>
              <input type="hidden" name="id" value={v.id} />
              <Button type="submit" variant="danger">
                Удалить
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
