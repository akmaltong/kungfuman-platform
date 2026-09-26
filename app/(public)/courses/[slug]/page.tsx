import Link from "next/link";

import { getPublicCourse } from "@/lib/queries/courses";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/domain/billing";
import { PreviewPlayer } from "@/components/preview-player";
import { LocaleSwitcher } from "@/components/locale-switcher";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [course, locale] = await Promise.all([
    getPublicCourse(slug),
    getLocale(),
  ]);

  if (!course) {
    return (
      <main className="mx-auto max-w-[680px] px-6 py-16 text-center">
        <p className="text-paper-muted">Курс не найден.</p>
        <Link href="/courses" className="mt-4 inline-block text-gold hover:underline">
          ← Все курсы
        </Link>
      </main>
    );
  }

  const firstPreview = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.is_preview);
  const lessonCount = course.modules.reduce(
    (n, m) => n + m.lessons.length,
    0,
  );

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20 pt-10">
      <div className="mb-5 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <Link href="/courses" className="text-sm text-gold hover:underline">
        ← Все курсы
      </Link>
      <h1 className="mt-3 font-serif text-[36px] font-bold leading-[1.1] text-paper sm:text-[42px]">
        {t(course.title, locale)}
      </h1>
      <p className="mt-3 text-[17px] leading-[1.6] text-paper-muted">
        {t(course.description, locale)}
      </p>

      {/* Превью */}
      {firstPreview && (
        <div className="mt-8">
          <div className="mb-2 text-[14px] text-paper-muted">
            Бесплатный урок: {t(firstPreview.title, locale)}
          </div>
          <PreviewPlayer lessonId={firstPreview.id} />
        </div>
      )}

      {/* Цена и CTA */}
      <div className="mt-8 flex flex-wrap items-center gap-4 border-2 border-gold bg-ink-lacquer p-6">
        <div className="font-serif text-[26px] font-bold text-gold">
          {course.price
            ? formatMoney(course.price.amount_minor, course.price.currency)
            : "Скоро в продаже"}
        </div>
        <Link
          href="/trial"
          className="ml-auto rounded-sm bg-gold px-5 py-2.5 font-bold text-ink hover:bg-gold-soft"
        >
          Оставить заявку
        </Link>
      </div>

      {/* Программа */}
      <section className="mt-10 border-t border-ink-muted pt-8">
        <h2 className="font-serif text-[24px] font-bold text-paper">
          Программа курса
        </h2>
        <p className="mt-1 text-[14px] text-paper-muted">{lessonCount} уроков</p>
        <div className="mt-5 space-y-5">
          {course.modules.map((m) => (
            <div key={m.id}>
              <div className="font-serif text-[16px] font-bold text-gold">
                {t(m.title, locale)}
              </div>
              <ul className="mt-2 space-y-1.5">
                {m.lessons.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 text-[15px] text-paper"
                  >
                    <span className={l.is_preview ? "text-gold" : "text-paper-muted"}>
                      {l.is_preview ? "▶" : "🔒"}
                    </span>
                    {t(l.title, locale)}
                    {l.duration_min && (
                      <span className="text-[13px] text-paper-muted">
                        · {l.duration_min} мин
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
