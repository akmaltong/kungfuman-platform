import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/locale-switcher";

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
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <span className="text-sm uppercase tracking-[0.3em] text-gold">Худжанд</span>
      <h1 className="mt-3 text-4xl font-semibold text-gold">Онлайн-курсы</h1>

      {courses.length === 0 ? (
        <p className="mt-10 text-neutral-400">Курсы скоро появятся.</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.slug}
              href={`/courses/${c.slug}`}
              className="rounded-lg border border-ink-muted bg-ink-soft p-6 hover:border-gold/40"
            >
              <h2 className="text-xl font-semibold text-neutral-100">
                {t(c.title, locale)}
              </h2>
              <p className="mt-2 text-sm text-neutral-400">{t(c.description, locale)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
