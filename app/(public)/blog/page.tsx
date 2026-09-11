import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";
import { LocaleSwitcher } from "@/components/locale-switcher";

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
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-4 flex justify-end">
        <LocaleSwitcher current={locale} />
      </div>
      <span className="text-sm uppercase tracking-[0.3em] text-gold">Худжанд</span>
      <h1 className="mt-3 text-4xl font-semibold text-gold">Блог</h1>

      {posts.length === 0 ? (
        <p className="mt-10 text-neutral-400">Статьи скоро появятся.</p>
      ) : (
        <div className="mt-10 space-y-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-lg border border-ink-muted bg-ink-soft p-6 hover:border-gold/40"
            >
              {p.published_at && (
                <div className="text-xs text-neutral-500">
                  {formatDateTime(p.published_at)}
                </div>
              )}
              <h2 className="mt-1 text-xl font-semibold text-neutral-100">
                {t(p.title, locale)}
              </h2>
              {t(p.excerpt, locale) && (
                <p className="mt-2 text-sm text-neutral-400">
                  {t(p.excerpt, locale)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
