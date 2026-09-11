import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Post {
  slug: string;
  title: Localized;
  body: Localized;
  cover_url: string | null;
  published_at: string | null;
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data }, locale] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, title, body, cover_url, published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle(),
    getLocale(),
  ]);

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-neutral-400">Статья не найдена.</p>
        <Link href="/blog" className="mt-4 inline-block text-gold hover:underline">
          ← Блог
        </Link>
      </main>
    );
  }
  const post = data as Post;
  const paragraphs = t(post.body, locale)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/blog" className="text-sm text-gold hover:underline">
        ← Блог
      </Link>
      {post.published_at && (
        <div className="mt-4 text-xs text-neutral-500">
          {formatDateTime(post.published_at)}
        </div>
      )}
      <h1 className="mt-1 text-4xl font-semibold text-gold">
        {t(post.title, locale)}
      </h1>
      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_url}
          alt=""
          className="mt-6 w-full rounded-lg border border-ink-muted"
        />
      )}
      <div className="mt-8 space-y-4 text-neutral-200 leading-relaxed">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p className="text-neutral-500">Текст статьи пока пуст.</p>
        )}
      </div>
    </article>
  );
}
