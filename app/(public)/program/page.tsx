import { getPublicProgram } from "@/lib/queries/curriculum";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PageHeader } from "@/components/public/page-header";

// Публичная страница программы школы Худжанд — читается без регистрации.
// Данные тянутся на сервере при каждом запросе.
export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const [program, locale] = await Promise.all([
    getPublicProgram("khujand"),
    getLocale(),
  ]);

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <PageHeader
        title="Программа"
        subtitle="Семиуровневая методика школы: дисциплина → уровень → практика. Плавная прогрессия и аттестация на каждом уровне — как ступени мастерства, а не спортивные разряды."
        aside={<LocaleSwitcher current={locale} />}
      />

      {program.length === 0 ? (
        <p className="mt-12 border border-gold-dim bg-ink p-6 text-[16px] text-paper-muted">
          Программа скоро появится здесь.
        </p>
      ) : (
        <div className="mt-12 space-y-12">
          {program.map((discipline) => (
            <section key={discipline.id} className="border-t border-ink-muted pt-8">
              <h2 className="font-serif text-[26px] font-bold text-gold">
                {t(discipline.title, locale)}
              </h2>
              <ol className="mt-6 space-y-3">
                {discipline.levels.map((level) => (
                  <li
                    key={level.id}
                    className="border border-gold-dim bg-ink p-5"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-[15px] font-bold text-gold">
                        Уровень {level.number}
                      </span>
                      <span className="text-[17px] text-paper">
                        {t(level.title, locale)}
                      </span>
                    </div>
                    {level.practices.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {level.practices.map((practice) => (
                          <li
                            key={practice.id}
                            className="border border-gold-dim px-3 py-1 text-[14px] text-paper-muted"
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
