import Link from "next/link";

import { getFreeLessons } from "@/lib/queries/courses";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { PreviewPlayer } from "@/components/preview-player";
import { LocaleSwitcher } from "@/components/locale-switcher";

export const dynamic = "force-dynamic";

// Публичная страница «Бесплатные уроки» — превью-уроки всех опубликованных курсов.
export default async function FreeLessonsPage() {
  const [lessons, locale] = await Promise.all([getFreeLessons(), getLocale()]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <span className="text-sm uppercase tracking-[0.3em] text-gold">Худжанд</span>
      <h1 className="mt-3 text-4xl font-semibold text-gold">Бесплатные уроки</h1>
      <p className="mt-3 max-w-xl text-neutral-300">
        Попробуй методику до покупки: открытые уроки из курсов академии.
      </p>

      {lessons.length === 0 ? (
        <p className="mt-10 text-neutral-400">Скоро здесь появятся уроки.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {lessons.map((l) => (
            <section key={l.lessonId}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold text-neutral-100">
                  {t(l.title, locale)}
                </h2>
                {l.duration_min && (
                  <span className="text-xs text-neutral-500">
                    {l.duration_min} мин
                  </span>
                )}
              </div>
              <PreviewPlayer lessonId={l.lessonId} />
              <Link
                href={`/courses/${l.courseSlug}`}
                className="mt-2 inline-block text-sm text-gold hover:underline"
              >
                Курс «{t(l.courseTitle, locale)}» →
              </Link>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
