import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PageHeader } from "@/components/public/page-header";

export const dynamic = "force-dynamic";

interface CourseRow {
  slug: string;
  title: Localized;
  description: Localized;
  cover_url: string | null;
}

// Публичный каталог курсов (RLS отдаёт только опубликованные).
export default async function CoursesIndex() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data }, locale] = await Promise.all([
    supabase
      .from("courses")
      .select("slug, title, description, cover_url")
      .eq("status", "published"),
    getLocale(),
  ]);
  const courses = (data ?? []) as CourseRow[];

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <PageHeader
        title="Онлайн-курсы"
        subtitle="Видеокурсы школы: смотри в удобном темпе и отслеживай прогресс."
        aside={<LocaleSwitcher current={locale} />}
      />

      {courses.length === 0 ? (
        <p className="mt-10 text-[16px] text-paper-muted">
          Курсы скоро появятся.
        </p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.slug}
              href={`/courses/${c.slug}`}
              className="border border-gold-dim bg-ink p-6 transition-colors hover:border-gold hover:bg-ink-lacquer"
            >
              <h2 className="font-serif text-[21px] font-bold text-paper">
                {t(c.title, locale)}
              </h2>
              <p className="mt-2 text-[15px] leading-[1.55] text-paper-muted">
                {t(c.description, locale)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
