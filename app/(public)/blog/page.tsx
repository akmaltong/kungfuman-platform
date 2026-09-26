import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PageHeader } from "@/components/public/page-header";

export const dynamic = "force-dynamic";

interface PostRow {
  slug: string;
  title: Localized;
  excerpt: Localized;
  cover_url: string | null;
  published_at: string | null;
}

// Публичный блог — RLS отдаёт только опубликованные статьи.
export default async function BlogIndex() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data }, locale] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, title, excerpt, cover_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    getLocale(),
  ]);
  const posts = (data ?? []) as PostRow[];

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <PageHeader
        title="Блог"
        subtitle="Статьи и заметки школы: о практике, внутренних искусствах и восточной терапии."
        aside={<LocaleSwitcher current={locale} />}
      />

      {posts.length === 0 ? (
        <p className="mt-10 text-[16px] text-paper-muted">
          Статьи скоро появятся.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block overflow-hidden border border-gold-dim bg-ink transition-colors hover:border-gold hover:bg-ink-lacquer"
            >
              {p.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover_url}
                  alt=""
                  className="h-44 w-full border-b border-ink-muted object-cover"
                />
              )}
              <div className="p-6">
                {p.published_at && (
                  <div className="text-[13px] text-paper-muted">
                    {formatDateTime(p.published_at)}
                  </div>
                )}
                <h2 className="mt-1 font-serif text-[22px] font-bold text-paper">
                  {t(p.title, locale)}
                </h2>
                {t(p.excerpt, locale) && (
                  <p className="mt-2 text-[15px] leading-[1.55] text-paper-muted">
                    {t(p.excerpt, locale)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
