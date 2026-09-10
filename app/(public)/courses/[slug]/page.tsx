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
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-neutral-400">Курс не найден.</p>
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
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <Link href="/courses" className="text-sm text-gold hover:underline">
        ← Все курсы
      </Link>
      <h1 className="mt-3 text-4xl font-semibold text-gold">{t(course.title, locale)}</h1>
      <p className="mt-3 text-neutral-300">{t(course.description, locale)}</p>

      {/* Превью */}
      {firstPreview && (
        <div className="mt-8">
          <div className="mb-2 text-sm text-neutral-400">
            Бесплатный урок: {t(firstPreview.title, locale)}
          </div>
          <PreviewPlayer lessonId={firstPreview.id} />
        </div>
      )}

      {/* Цена и CTA */}
      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-lg border border-gold/40 bg-ink-soft p-6">
        <div className="text-2xl font-semibold text-gold">
          {course.price
            ? formatMoney(course.price.amount_minor, course.price.currency)
            : "Скоро в продаже"}
        </div>
        <Link
          href="/trial"
          className="ml-auto rounded-md bg-gold px-5 py-2.5 font-medium text-ink hover:bg-gold-soft"
        >
          Оставить заявку
        </Link>
      </div>

      {/* Программа */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-neutral-100">
          Программа курса
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{lessonCount} уроков</p>
        <div className="mt-4 space-y-5">
          {course.modules.map((m) => (
            <div key={m.id}>
              <div className="text-sm font-semibold text-gold">{t(m.title, locale)}</div>
              <ul className="mt-2 space-y-1">
                {m.lessons.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 text-sm text-neutral-300"
                  >
                    <span className={l.is_preview ? "text-gold" : "text-neutral-600"}>
                      {l.is_preview ? "▶" : "🔒"}
                    </span>
                    {t(l.title, locale)}
                    {l.duration_min && (
                      <span className="text-xs text-neutral-600">
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
