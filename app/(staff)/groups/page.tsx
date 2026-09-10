import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { dowLabel } from "@/lib/format";
import { parseSchedule } from "@/lib/domain/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addScheduleSlot,
  createGroup,
  deleteGroup,
  removeScheduleSlot,
} from "./actions";

export const dynamic = "force-dynamic";

interface GroupRow {
  id: string;
  title: Localized;
  discipline_id: string;
  instructor_id: string | null;
  venue_id: string | null;
  level_min: number;
  level_max: number;
  capacity: number | null;
  schedule: unknown;
}
interface NamedRow {
  id: string;
  title?: Localized;
  name?: Localized;
  full_name?: string | null;
}

export default async function GroupsPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const [{ data: groups }, { data: disciplines }, { data: venues }, { data: staff }] =
    await Promise.all([
      supabase
        .from("groups")
        .select(
          "id, title, discipline_id, instructor_id, venue_id, level_min, level_max, capacity, schedule",
        ),
      supabase.from("disciplines").select("id, title"),
      supabase.from("venues").select("id, name"),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["instructor", "admin", "owner"]),
    ]);

  const disciplineName = nameMap((disciplines ?? []) as NamedRow[], "title");
  const venueName = nameMap((venues ?? []) as NamedRow[], "name");
  const instructors = (staff ?? []) as NamedRow[];
  const instructorName = new Map(
    instructors.map((i) => [i.id, i.full_name ?? "—"]),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Группы</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Расписание задаётся слотами: день недели + время + длительность.
      </p>

      {/* Создать группу */}
      <form
        action={createGroup}
        className="mt-6 grid gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4 sm:grid-cols-2"
      >
        <Input name="title_ru" placeholder="Название группы" required />
        <select
          name="discipline_id"
          required
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="">— дисциплина —</option>
          {((disciplines ?? []) as NamedRow[]).map((d) => (
            <option key={d.id} value={d.id}>
              {t(d.title)}
            </option>
          ))}
        </select>
        <select
          name="instructor_id"
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="">— инструктор —</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.full_name ?? "—"}
            </option>
          ))}
        </select>
        <select
          name="venue_id"
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="">— площадка —</option>
          {((venues ?? []) as NamedRow[]).map((v) => (
            <option key={v.id} value={v.id}>
              {t(v.name)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Input name="level_min" type="number" min={1} max={7} defaultValue={1} className="w-20" />
          <span className="text-neutral-500">–</span>
          <Input name="level_max" type="number" min={1} max={7} defaultValue={7} className="w-20" />
          <Input name="capacity" type="number" min={1} placeholder="вместим." className="w-28" />
        </div>
        <Button type="submit">+ Группа</Button>
      </form>

      <div className="mt-8 space-y-6">
        {((groups ?? []) as GroupRow[]).length === 0 && (
          <p className="text-neutral-500">Пока нет групп.</p>
        )}
        {((groups ?? []) as GroupRow[]).map((g) => {
          const schedule = parseSchedule(g.schedule);
          return (
            <section
              key={g.id}
              className="rounded-lg border border-ink-muted bg-ink-soft p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-100">
                    {t(g.title)}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {disciplineName.get(g.discipline_id) ?? "—"} · уровни{" "}
                    {g.level_min}–{g.level_max}
                    {g.instructor_id &&
                      ` · ${instructorName.get(g.instructor_id) ?? "—"}`}
                    {g.venue_id && ` · ${venueName.get(g.venue_id) ?? "—"}`}
                    {g.capacity && ` · до ${g.capacity} чел.`}
                  </p>
                </div>
                <form action={deleteGroup}>
                  <input type="hidden" name="id" value={g.id} />
                  <Button type="submit" variant="danger">
                    Удалить
                  </Button>
                </form>
              </div>

              {/* Слоты расписания */}
              <ul className="mt-4 flex flex-wrap gap-2">
                {schedule.length === 0 && (
                  <li className="text-sm text-neutral-600">
                    Расписание не задано
                  </li>
                )}
                {schedule.map((slot, index) => (
                  <li
                    key={`${slot.dow}-${slot.start}-${index}`}
                    className="flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-sm text-neutral-300"
                  >
                    {dowLabel(slot.dow)} {slot.start} · {slot.dur}м
                    <form action={removeScheduleSlot}>
                      <input type="hidden" name="group_id" value={g.id} />
                      <input type="hidden" name="index" value={index} />
                      <button
                        type="submit"
                        className="text-red-400/70 hover:text-red-300"
                        aria-label="Удалить слот"
                      >
                        ✕
                      </button>
                    </form>
                  </li>
                ))}
              </ul>

              {/* Добавить слот */}
              <form
                action={addScheduleSlot}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="group_id" value={g.id} />
                <select
                  name="dow"
                  className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
                >
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <option key={d} value={d}>
                      {dowLabel(d)}
                    </option>
                  ))}
                </select>
                <Input name="start" type="time" defaultValue="05:00" className="w-32" />
                <Input name="dur" type="number" min={15} step={15} defaultValue={90} className="w-24" />
                <Button type="submit" variant="ghost">
                  + Слот
                </Button>
              </form>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function nameMap(rows: NamedRow[], key: "title" | "name"): Map<string, string> {
  return new Map(rows.map((r) => [r.id, t(r[key])]));
}
