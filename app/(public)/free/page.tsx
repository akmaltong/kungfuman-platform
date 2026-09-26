import Link from "next/link";

import { getFreeLessons } from "@/lib/queries/courses";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { PreviewPlayer } from "@/components/preview-player";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PageHeader } from "@/components/public/page-header";

export const dynamic = "force-dynamic";

// Публичная страница «Бесплатные уроки» — превью-уроки всех опубликованных курсов.
export default async function FreeLessonsPage() {
  const [lessons, locale] = await Promise.all([getFreeLessons(), getLocale()]);

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <PageHeader
        title="Бесплатные уроки"
        subtitle="Попробуй методику до покупки: открытые уроки из курсов академии."
        aside={<LocaleSwitcher current={locale} />}
      />

      {lessons.length === 0 ? (
        <p className="mt-10 text-[16px] text-paper-muted">
          Скоро здесь появятся уроки.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {lessons.map((l) => (
            <section key={l.lessonId} className="border-t border-ink-muted pt-8">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-[22px] font-bold text-paper">
                  {t(l.title, locale)}
                </h2>
                {l.duration_min && (
                  <span className="shrink-0 text-[13px] text-paper-muted">
                    {l.duration_min} мин
                  </span>
                )}
              </div>
              <PreviewPlayer lessonId={l.lessonId} />
              <Link
                href={`/courses/${l.courseSlug}`}
                className="mt-3 inline-block text-[15px] text-gold hover:underline"
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
