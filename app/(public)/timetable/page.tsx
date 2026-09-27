import Link from "next/link";

import { getPublicSchedule } from "@/lib/queries/schedule";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { dowLabel } from "@/lib/format";
import { PageHeader } from "@/components/public/page-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Расписание · Академия Kungfuman",
  description:
    "Утренние и вечерние занятия на открытом воздухе: Нэйгун на набережной Сырдарьи, Тайцзицюань и Вин Чун в парке Камоли Худжанди.",
};

// Дни недели по возрастанию, но с понедельника (Вс=0 уводим в конец).
function sortDows(dows: number[]): number[] {
  return [...new Set(dows)].sort((a, b) => (a || 7) - (b || 7));
}

export default async function SchedulePage() {
  const [groups, locale] = await Promise.all([
    getPublicSchedule("khujand"),
    getLocale(),
  ]);

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <PageHeader
        title="Расписание"
        subtitle="Занятия проходят на открытом воздухе: утро — у воды, вечер — в парке. Малые группы, живая передача практики от мастера."
      />

      {groups.length === 0 ? (
        <p className="mt-10 text-[16px] text-paper-muted">
          Расписание скоро появится здесь.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {groups.map((g) => {
            const time = g.slots[0]?.start;
            const dur = g.slots[0]?.dur;
            const days = sortDows(g.slots.map((s) => s.dow)).map(dowLabel);
            return (
              <div
                key={g.id}
                className="border border-gold-dim bg-ink p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="font-serif text-[21px] font-bold text-paper">
                    {t(g.title, locale)}
                  </h2>
                  {time && (
                    <span className="font-serif text-[22px] font-bold text-gold">
                      {time}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[14px] text-paper-muted">
                  {t(g.discipline, locale)}
                  {t(g.venue, locale) ? ` · ${t(g.venue, locale)}` : ""}
                </p>
                {days.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {days.map((d) => (
                      <span
                        key={d}
                        className="border border-gold-dim px-3 py-1 text-[14px] text-paper"
                      >
                        {d}
                      </span>
                    ))}
                    {dur && (
                      <span className="text-[13px] text-paper-muted">
                        · {dur} мин
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 border-t border-ink-muted pt-9">
        <Link
          href="/trial"
          className="inline-block rounded-sm bg-gold px-6 py-4 font-bold text-ink hover:bg-gold-soft"
        >
          Записаться на пробное
        </Link>
        <p className="mt-4 text-[14px] leading-[1.6] text-paper-muted">
          Время и дни могут меняться по погоде и сезону — уточняйте перед первым
          визитом. Форматы и цены —{" "}
          <Link href="/prices" className="text-gold hover:underline">
            на странице «Форматы»
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
