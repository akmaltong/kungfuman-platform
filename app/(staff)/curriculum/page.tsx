import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  buildCurriculumTree,
  type DisciplineRow,
  type LevelRow,
  type PracticeRow,
} from "@/lib/domain/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCriterion,
  createDiscipline,
  createLevel,
  createPractice,
  deleteCriterion,
  deleteDiscipline,
  deleteLevel,
  deletePractice,
  movePractice,
  setPracticeStatus,
} from "./actions";

export const dynamic = "force-dynamic";

interface CriterionRow {
  id: string;
  practice_id: string;
  title: { ru?: string };
  weight: number;
  sort_order: number;
}

// Редактор методики: дисциплины → уровни → практики → критерии.
// Читается под RLS (персонал видит всю свою школу). Наполнение — этап 2.
export default async function CurriculumPage() {
  // Каст к дефолтной схеме: типы БД пока плейсхолдер (см. DECISIONS).
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const [{ data: disciplines }, { data: levels }, { data: practices }] =
    await Promise.all([
      supabase.from("disciplines").select("id, title, sort_order"),
      supabase.from("levels").select("id, discipline_id, number, title"),
      supabase
        .from("practices")
        .select("id, level_id, title, sort_order, status"),
    ]);

  const tree = buildCurriculumTree(
    (disciplines ?? []) as DisciplineRow[],
    (levels ?? []) as LevelRow[],
    (practices ?? []) as PracticeRow[],
  );

  const practiceIds = ((practices ?? []) as PracticeRow[]).map((p) => p.id);
  const { data: criteriaData } = practiceIds.length
    ? await supabase
        .from("practice_criteria")
        .select("id, practice_id, title, weight, sort_order")
        .in("practice_id", practiceIds)
    : { data: [] };

  const criteriaByPractice = new Map<string, CriterionRow[]>();
  for (const c of (criteriaData ?? []) as CriterionRow[]) {
    const arr = criteriaByPractice.get(c.practice_id);
    if (arr) arr.push(c);
    else criteriaByPractice.set(c.practice_id, [c]);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Методика</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Дисциплина → уровень → практика → критерий. Тексты пока только на
        русском.
      </p>

      {/* Добавить дисциплину */}
      <form
        action={createDiscipline}
        className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4"
      >
        <Input name="code" placeholder="код (qigong)" required />
        <Input name="title_ru" placeholder="Название (Цигун)" required />
        <Button type="submit">+ Дисциплина</Button>
      </form>

      <div className="mt-8 space-y-10">
        {tree.map((discipline) => (
          <section
            key={discipline.id}
            className="rounded-lg border border-ink-muted"
          >
            <header className="flex items-center justify-between gap-3 border-b border-ink-muted px-4 py-3">
              <h2 className="text-xl font-semibold text-neutral-100">
                {t(discipline.title)}
              </h2>
              <form action={deleteDiscipline}>
                <input type="hidden" name="id" value={discipline.id} />
                <Button type="submit" variant="danger">
                  Удалить
                </Button>
              </form>
            </header>

            <div className="space-y-6 p-4">
              {/* Добавить уровень */}
              <form
                action={createLevel}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  type="hidden"
                  name="discipline_id"
                  value={discipline.id}
                />
                <Input
                  name="number"
                  type="number"
                  min={1}
                  max={7}
                  placeholder="№ (1–7)"
                  className="w-24"
                  required
                />
                <Input
                  name="title_ru"
                  placeholder="Название уровня"
                  required
                />
                <Button type="submit" variant="ghost">
                  + Уровень
                </Button>
              </form>

              {discipline.levels.map((level) => (
                <div
                  key={level.id}
                  className="rounded-md border border-ink-muted bg-ink-soft p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-neutral-100">
                      <span className="mr-2 text-sm font-semibold text-gold">
                        Уровень {level.number}
                      </span>
                      {t(level.title)}
                    </h3>
                    <form action={deleteLevel}>
                      <input type="hidden" name="id" value={level.id} />
                      <Button type="submit" variant="danger">
                        Удалить
                      </Button>
                    </form>
                  </div>

                  {/* Практики уровня */}
                  <ul className="mt-4 space-y-3">
                    {level.practices.map((practice, i) => (
                      <li
                        key={practice.id}
                        className="rounded border border-ink-muted p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-neutral-200">
                            {t(practice.title)}
                          </span>
                          <span className="rounded-full border border-gold/30 px-2 py-0.5 text-xs text-neutral-400">
                            {practice.status}
                          </span>

                          <div className="ml-auto flex items-center gap-1">
                            <ReorderButton
                              levelId={level.id}
                              id={practice.id}
                              direction="up"
                              disabled={i === 0}
                            />
                            <ReorderButton
                              levelId={level.id}
                              id={practice.id}
                              direction="down"
                              disabled={i === level.practices.length - 1}
                            />
                            <form action={setPracticeStatus}>
                              <input
                                type="hidden"
                                name="id"
                                value={practice.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value={
                                  practice.status === "published"
                                    ? "draft"
                                    : "published"
                                }
                              />
                              <Button type="submit" variant="ghost">
                                {practice.status === "published"
                                  ? "В черновик"
                                  : "Опубликовать"}
                              </Button>
                            </form>
                            <form action={deletePractice}>
                              <input
                                type="hidden"
                                name="id"
                                value={practice.id}
                              />
                              <Button type="submit" variant="danger">
                                ✕
                              </Button>
                            </form>
                          </div>
                        </div>

                        {/* Критерии практики */}
                        <ul className="mt-3 space-y-1 pl-4">
                          {(criteriaByPractice.get(practice.id) ?? [])
                            .slice()
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((c) => (
                              <li
                                key={c.id}
                                className="flex items-center gap-2 text-sm text-neutral-400"
                              >
                                <span>• {t(c.title)}</span>
                                <span className="text-xs text-neutral-600">
                                  (вес {c.weight})
                                </span>
                                <form
                                  action={deleteCriterion}
                                  className="ml-auto"
                                >
                                  <input type="hidden" name="id" value={c.id} />
                                  <button
                                    type="submit"
                                    className="text-xs text-red-400/70 hover:text-red-300"
                                  >
                                    удалить
                                  </button>
                                </form>
                              </li>
                            ))}
                        </ul>

                        <form
                          action={createCriterion}
                          className="mt-2 flex flex-wrap items-center gap-2 pl-4"
                        >
                          <input
                            type="hidden"
                            name="practice_id"
                            value={practice.id}
                          />
                          <Input
                            name="title_ru"
                            placeholder="Критерий аттестации"
                            className="min-w-64 flex-1"
                            required
                          />
                          <Input
                            name="weight"
                            type="number"
                            min={1}
                            defaultValue={1}
                            className="w-20"
                          />
                          <Button type="submit" variant="ghost">
                            + Критерий
                          </Button>
                        </form>
                      </li>
                    ))}
                  </ul>

                  {/* Добавить практику */}
                  <form
                    action={createPractice}
                    className="mt-4 flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="level_id" value={level.id} />
                    <Input name="code" placeholder="код" className="w-32" required />
                    <Input
                      name="title_ru"
                      placeholder="Название практики"
                      className="min-w-64 flex-1"
                      required
                    />
                    <Button type="submit" variant="ghost">
                      + Практика
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function ReorderButton({
  levelId,
  id,
  direction,
  disabled,
}: {
  levelId: string;
  id: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={movePractice}>
      <input type="hidden" name="level_id" value={levelId} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <Button type="submit" variant="ghost" disabled={disabled}>
        {direction === "up" ? "↑" : "↓"}
      </Button>
    </form>
  );
}
