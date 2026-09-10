import { getPublicProgram } from "@/lib/queries/curriculum";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/locale-switcher";

// Публичная страница программы школы Худжанд — читается без регистрации.
// Данные тянутся на сервере при каждом запросе.
export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const [program, locale] = await Promise.all([
    getPublicProgram("khujand"),
    getLocale(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <span className="text-sm uppercase tracking-[0.3em] text-gold">
        Худжанд
      </span>
      <h1 className="mt-3 text-4xl font-semibold text-gold">Программа</h1>
      <p className="mt-4 max-w-2xl text-neutral-300">
        Семиуровневая методика: дисциплина → уровень → практика. Прогрессия и
        аттестация на каждом уровне.
      </p>

      {program.length === 0 ? (
        <p className="mt-12 rounded-lg border border-ink-muted bg-ink-soft p-6 text-neutral-400">
          Программа скоро появится здесь.
        </p>
      ) : (
        <div className="mt-12 space-y-12">
          {program.map((discipline) => (
            <section key={discipline.id}>
              <h2 className="text-2xl font-semibold text-neutral-100">
                {t(discipline.title, locale)}
              </h2>
              <ol className="mt-6 space-y-4">
                {discipline.levels.map((level) => (
                  <li
                    key={level.id}
                    className="rounded-lg border border-ink-muted bg-ink-soft p-5"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-semibold text-gold">
                        Уровень {level.number}
                      </span>
                      <span className="text-neutral-200">{t(level.title, locale)}</span>
                    </div>
                    {level.practices.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {level.practices.map((practice) => (
                          <li
                            key={practice.id}
                            className="rounded-full border border-gold/30 px-3 py-1 text-sm text-neutral-300"
                          >
                            {t(practice.title, locale)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
